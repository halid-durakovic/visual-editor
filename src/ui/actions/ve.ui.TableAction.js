ve.ui.TableAction = function VeUiTableAction( surface ) {
  // Parent constructor
  ve.ui.Action.call( this, surface );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableAction, ve.ui.Action );

/* Static Properties */

ve.ui.TableAction.static.name = 'table';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.TableAction.static.methods = [ 'create', 'insert', 'delete' ];

/* Methods */

/**
 * Create a new table.
 *
 * @method
 */
ve.ui.TableAction.prototype.create = function ( options ) {
  var numberOfCols = options.cols,
      numberOfRows = options.rows,
      surface, fragment,
      data, node, pos;

  function _addRow(data, style) {
    data.push({ type: 'tableRow'});
    for (var i = 0; i < numberOfCols; i++) {
      data.push({type: 'tableCell', 'attributes': { 'style': style } });
      data.push({type: 'paragraph'});
      if (style === 'header') {
        // TODO: the initial label for the column should come from the i18n dictionary
        data.push('Column ' + (i+1) );
      }
      data.push({type: '/paragraph'});
      data.push({type: '/tableCell'});
    }
    data.push({ type: '/tableRow'});
  }

  data = [];
  data.push({type: 'table'});
  data.push({type: 'tableSection', 'attributes': {'style': 'header'} });
  _addRow(data, 'header');
  data.push({type: '/tableSection'});
  data.push({type: 'tableSection', 'attributes': {'style': 'body'} });
  for (var i = 0; i < numberOfRows; i++) {
    _addRow(data, 'data');
  }
  data.push({type: '/tableSection'});
  data.push({type: '/table'});

  surface = this.surface.getModel();
  fragment = surface.getFragment(surface.getSelection());
  fragment.insertContent(data, false).collapseRangeToEnd().select();

  // set the cursor into the first data cell
  node = fragment.getSelectedNode();
  // HACK: there should be a more generic way to retrieve the first data cell
  pos = node.children[1].children[0].children[0].children[0].getRange().start;
  surface.setSelection(new ve.Range(pos, pos));
};

ve.ui.TableAction.prototype.insert = function ( mode, position ) {
  var surface, table, rect, index;
  surface = this.surface.getModel();
  table = ve.dm.TableNode.lookupTable(surface.documentModel, surface.selection);
  if (table) {
    rect = table.node.getRectangle(table.startCell, table.endCell);
    index = (position === 'before') ? rect.start[mode] : rect.end[mode];
    ve.ui.TableAction.insertRowOrCol( surface, table.node, mode, index, position );
  }
};

ve.ui.TableAction.prototype.delete = function ( mode ) {
  var surface, table, rect, minIndex, maxIndex;
  surface = this.surface.getModel();
  table = ve.dm.TableNode.lookupTable(surface.documentModel, surface.selection);
  if (table) {
    if (mode === 'table') {
      ve.ui.TableAction.deleteTable( surface, table.node );
    } else {
      rect = table.node.getRectangle(table.startCell, table.endCell);
      minIndex = rect.start[mode];
      maxIndex = rect.end[mode];
      if (minIndex === 0 && maxIndex === table.node.getSize(mode) - 1) {
        ve.ui.TableAction.deleteTable( surface, table.node );
      } else {
        ve.ui.TableAction.deleteRowsOrColumns( surface, table.node, mode, minIndex, maxIndex );
      }
    }
  }
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.TableAction );


// Low-level API
// -------------
// Maybe this could be moved into DM world later

ve.ui.TableAction.deleteTable = function( surface, table ) {
  var txs = [], selection;
  tx = ve.dm.Transaction.newFromRemoval(
    surface.documentModel,
    table.getOuterRange()
  );
  // TODO: maybe a better selection
  surface.change( tx, new ve.Range(null) );
};

ve.ui.TableAction.insertRowOrCol = function ( surface, table, mode, index, insertMode ) {
  var matrix, refIndex, cells, refCells, before,
    offset, range, i, txs, updated, inserts, cell, refCell, data, style;

  before = (insertMode === 'before');
  matrix = table.matrix;

  // the index of the reference row or column
  refIndex = index + (before ? -1 : 1);
  // cells of the selected row or column
  if (mode === 'row') {
    cells = matrix.getRow(index) || [];
    refCells = matrix.getRow(refIndex) || [];
  } else {
    cells = matrix.getColumn(index) || [];
    refCells = matrix.getColumn(refIndex) || [];
  }

  txs = [];
  updated = {};
  inserts = [];

  for (i = 0; i < cells.length; i++) {
    cell = cells[i];
    refCell = refCells[i];
    // detect if span update is necessary
    if (refCell && (cell.type === 'placeholder' || refCell.type === 'placeholder') ) {
      if (cell.node === refCell.node) {
        cell = cell.owner || cell;
        if (!updated[cell.key]) {
          txs.push(ve.ui.TableAction.incrementSpan(surface, cell, mode));
          updated[cell.key] = true;
        }
        continue;
      }
    }
    inserts.push(cell);
  }

  if (mode === 'row') {
    data = ve.dm.TableRowNode.createData({
      cellCount: inserts.length,
      // taking the style of the first cell of the selected row
      style: cells[0].node.getStyle()
    });
    range = matrix.getRowNode(index).getOuterRange();
    offset = before ? range.start: range.end;
    txs.push(ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data ));
  } else {
    // making sure that the inserts are in descending order
    inserts.sort(ve.dm.TableMatrix.Cell.sortDescending);
    for (i = 0; i < inserts.length; i++) {
      cell = inserts[i];
      refCell = matrix.findClosestCell(cell);
      if (refCell) {
        range = refCell.node.getOuterRange();
        if ( refCell.col < cell.col  || ( refCell.col === cell.col && !before ) ) {
          offset = range.end;
        } else {
          offset = range.start;
        }
        style = refCell.node.getStyle();
      } else {
        range = matrix.getRowNode(cell.row).getRange();
        offset = before ? range.start: range.end;
        style = cells[0].node.getStyle();
      }
      data = ve.dm.TableCellNode.createData({ style: style });
      txs.push(ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data ));
    }
  }
  surface.change(txs);
};

ve.ui.TableAction.incrementSpan = function( surface, cell, mode ) {
  var attr = (mode === 'row') ? 'rowspan' : 'colspan',
      data = {};
  data[attr] = cell.node.getSpan(mode) + 1;
  return ve.dm.Transaction.newFromAttributeChanges( surface.documentModel, cell.node.getOuterRange().start, data);
};

ve.ui.TableAction.deleteRowsOrColumns = function ( surface, table, mode, minIndex, maxIndex ) {
  var cells, row, col, i, cell, key, matrix,
    span, startRow, startCol, endRow, endCol, rowNode,
    txs, adapted, actions;

  cells = [];
  txs = [];
  adapted = {};
  actions = [];
  matrix = table.matrix;

  if (mode === 'row') {
    for (row = minIndex; row <= maxIndex; row++) {
      cells = cells.concat(matrix.getRow(row));
    }
  } else {
    for (col = minIndex; col <= maxIndex; col++) {
      cells = cells.concat(matrix.getColumn(col));
    }
  }

  for (i = 0; i < cells.length; i++) {
    cell = cells[i];

    if (cell.type === 'placeholder') {
      key = cell.owner.key;
      if (!adapted[key]) {
        txs.push(ve.ui.TableAction.decreaseSpan(surface, cell.owner, mode, minIndex, maxIndex));
        adapted[key] = true;
      }
      continue;
    }

    span = cell.node.getSpan(mode);
    if (cell[mode] + span - 1  > maxIndex) {
      // add inserts for orphaned place holders
      startRow = (mode === 'col') ? cell.row     : maxIndex + 1;
      startCol = (mode === 'col') ? maxIndex + 1 : cell.col;
      endRow = cell.row + cell.node.getSpan('row') - 1;
      endCol = cell.col + cell.node.getSpan('col') - 1;

      for (row = startRow; row <= endRow; row++) {
        for (col = startCol; col <= endCol; col++) {
          actions.push({ action: 'insert', cell: matrix.getCell(row, col) });
        }
      }
    }

    if (mode === 'col') {
      actions.push({action: 'delete', cell: cell });
    }
  }

  actions.sort(function(a, b) {
    return ve.dm.TableMatrix.Cell.sortDescending(a.cell, b.cell);
  });

  if (mode === 'row') {
    // only inserts in this case
    for (i = 0; i < actions.length; i++) {
      txs.push(ve.ui.TableAction.replaceOrphanedPlaceholder(surface, table, actions[i].cell));
    }
    for (row = maxIndex; row >= minIndex; row--) {
      rowNode = matrix.getRowNode(row);
      txs.push( ve.dm.Transaction.newFromRemoval( surface.documentModel, rowNode.getOuterRange() ) );
    }
  } else {
    for (i = 0; i < actions.length; i++) {
      if (actions[i].action === 'insert') {
        txs.push( ve.ui.TableAction.replaceOrphanedPlaceholder( surface, table, actions[i].cell ) );
      } else {
        txs.push( ve.dm.Transaction.newFromRemoval( surface.documentModel, actions[i].cell.node.getOuterRange() ) );
      }
    }
  }
  surface.change( txs, new ve.Range(null) );
};

ve.ui.TableAction.decreaseSpan = function ( surface, cell, mode, minIndex, maxIndex) {
  var newSpan, span, data, attr;
  attr = (mode === 'row') ? 'rowspan' : 'colspan';
  span = cell.node.getSpan(mode);
  data = {};
  newSpan = (minIndex - cell[mode]) + Math.max(0, cell[mode] + span - 1 - maxIndex);
  data[attr] = newSpan;
  return ve.dm.Transaction.newFromAttributeChanges( surface.documentModel, cell.node.getOuterRange().start, data );
};

ve.ui.TableAction.replaceOrphanedPlaceholder = function ( surface, table, cell ) {
  var refCell, range, offset, data, style, matrix;
  matrix = table.matrix;
  refCell = matrix.findClosestCell(cell);
  if (refCell) {
    range = refCell.node.getOuterRange();
    offset = (cell.col < refCell.col) ? range.start : range.end;
    style = refCell.node.getStyle();
  } else {
    range = matrix.getRowNode(cell.row).getRange();
    offset = range.start;
    style = cell.node.getStyle();
  }
  data = ve.dm.TableCellNode.createData({ style: style });
  return ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data );
};
