/**
 * ContentEditable table node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.TableNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableNode = function VeCeTableNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );

	// Initialization
	this.$element.addClass( 've-ce-tableNode' );

  this.connect( this, {
    'setup': 'onTableNodeSetup',
    'teardown': 'onTableNodeTeardown',
  } );

  this.focussed = false;

  // selected rectangle:
  // {
  //   start: { row: minRowIndex, col: minColIndex},
  //   end:   { row: maxRowIndex, col: maxColIndex}
  // }
  // or null, if no valid selection
  this.selectedRect = null;

  // A cached matrix representation of the table's cells.
  // It is created initially and gets invalidated on each model update.
  this.tableMatrix = new ve.dm.TableMatrix(this.model);
};

/* Inheritance */

OO.inheritClass( ve.ce.TableNode, ve.ce.BranchNode );

/* Prototype */

ve.ce.TableNode.prototype.onTableNodeSetup = function() {
  // Exit if already setup or not attached
  if ( this.isSetup || !this.root ) {
    return;
  }

  var surface = this.getRoot().getSurface();
  this.surfaceModel = surface.getModel();

  // DOM changes

  this.$element.addClass( 've-ce-tableNode' );

  // Events

  this.surfaceModel.connect( this, { 'select': 'onSurfaceModelSelect' });

  this.surfaceModel.emit( 'tableNodeCreated', this );
};

ve.ce.TableNode.prototype.onTableNodeTeardown = function() {
  this.surfaceModel.disconnect( this );
  this.tableMatrix.destroy();
  this.surfaceModel.emit( 'tableNodeRemoved', this );
};

/**
 * Reacts on selection changes and detectes when the selection is fully within
 * the table.
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function(selection) {
  var range = this.model.getRange();
  var focus;

  // consider this table focussed when the selection is fully within the range
  focus = (selection && range.containsOffset(selection.from) && range.containsOffset(selection.to));

  if (focus && !this.focussed) {
    this.focus();
  } else if (!focus && this.focussed) {
    this.unfocus();
  }

  this.updateSelectedRectangle(selection);
};

/**
 * Stores anchor nodes which define a selection rectangle.
 * This is called upon every selection change.
 */
ve.ce.TableNode.prototype.updateSelectedRectangle = function( selection ) {
  var startCellContext, endCellContext, startCell, endCell, minRow, maxRow, minCol, maxCol;

  if (!selection) {
    this.rect = null;
    this.unfocus();
  }

  if (selection.isBackwards()) {
    selection = selection.flip();
  }
  startCellContext = this.getCellContextForOffset( selection.start );
  if (!startCellContext) {
    endCellContext = null;
  } else if (selection.isCollapsed()) {
    endCellContext = startCellContext;
  } else {
    endCellContext = this.getCellContextForOffset( selection.end );
  }
  if (!startCellContext || !endCellContext) {
    this.selectedRect  = null;
  } else {
    startCell = this.tableMatrix.lookupCell(startCellContext.rowNode.model, startCellContext.cellNode.model);
    if (startCellContext === endCellContext) {
      endCell = startCell;
    } else {
      endCell = this.tableMatrix.lookupCell(endCellContext.rowNode.model, endCellContext.cellNode.model);
    }
    // derive the rectangle from the selection anchors (spans considered)
    minRow = Math.min(startCell.row, endCell.row);
    maxRow = Math.max(startCell.row + startCell.node.getSpan('row') - 1,
      endCell.row  + endCell.node.getSpan('row') - 1);
    minCol = Math.min(startCell.col, endCell.col);
    maxCol = Math.max(startCell.col + startCell.node.getSpan('col') - 1,
      endCell.col  + endCell.node.getSpan('col') - 1);
    this.selectedRect = {
      start: { row: minRow , col: minCol },
      end: { row: maxRow, col: maxCol }
    };
  }
};

ve.ce.TableNode.prototype.isFocussed = function() {
  return this.focussed;
};

ve.ce.TableNode.prototype.focus = function() {
  this.$element.addClass('focussed');
  this.focussed = true;
  this.surfaceModel.emit('tableFocusChange', this);
};

ve.ce.TableNode.prototype.unfocus = function() {
  this.$element.removeClass('focussed');
  this.focussed = false;
  this.surfaceModel.emit('tableFocusChange', this);
};

/**
 * Determines a cell node's context, in terms of table row and table section.
 *
 * To be able to deal with nested tables a cell node's
 * context is identified by examining the parent nodes.
 * If the inspected node is within a nested table, this method iterates up
 * and provides the cell containing the child table.
 *
 * This method is used internally only.
 *
 * @param node a ve.ce.Node instance
 * @returns null of the given node is not within this table, or an object with following properties:
 *    - 'sectionNode': ve.dm.TableSectionNode
 *    - 'rowNode': ve.dm.TableRowNode
 *    - 'cellNode': ve.dm.TableCellNode
 *    - 'sectionIndex': Number
 *    - 'rowNodeIndex': Number
 *    - 'cellNodeIndex': Number
 */
ve.ce.TableNode.prototype.getCellContext = function (node) {
  var cellContext, sectionNode, rowNode, cellNode;
  if (!node) return null;
  while (true) {
    switch (node.type) {
      case 'tableCell':
        cellNode = node;
        break;
      case 'tableRow':
        rowNode = node;
        break;
      case 'tableSection':
        sectionNode = node;
        break;
    }
    node = node.parent;
    // stop when we reach the right the level of this node
    // in that case, the last section and row should be the correct ones.
    if (node === this) break;
    if (!node) return null;
  }
  // fallback if this is called with a top-level node
  if (!rowNode || !cellNode) {
    return null;
  }
  cellContext = {
    sectionNode: sectionNode,
    rowNode: rowNode,
    cellNode: cellNode,
    sectionNodeIndex: this.children.indexOf(sectionNode),
    rowNodeIndex: sectionNode.children.indexOf(rowNode),
    cellNodeIndex: rowNode.children.indexOf(cellNode)
  };
  return cellContext;
};

/**
 * A convenience wrapper for 'TableNode.prototype.getCellContext(cell)' which allows
 * to retrieve the cell context for a given global document offset.
 *
 * @param offset: the global offset of a cell
 */
ve.ce.TableNode.prototype.getCellContextForOffset = function ( offset ) {
  var node, cellContext;
  // treat the offset as global offset
  offset -= this.model.getRange().start;
  node = this.getNodeFromOffset(offset);
  cellContext = this.getCellContext(node);
  return cellContext;
};

// NOTE: this is only used in CE world for visual stuff
ve.ce.TableNode.prototype.getCellsForSelectedRectangle = function() {
  var cells, i, j, rect, cell, ceCellNode, offset, matrix;
  cells = [];
  rect = this.selectedRect;
  matrix = this.tableMatrix.getMatrix();
  if (rect) {
    for (i = rect.start.row; i <= rect.end.row; i++) {
      for (j = rect.start.col; j <= rect.end.col; j++) {
        cell = matrix[i][j];
        if (cell.type === 'cell') {
          offset = cell.node.getRange().start - this.model.getRange().start;
          ceCellNode = this.getNodeFromOffset(offset);
          cells.push(ceCellNode);
        }
      }
    }
  }
  return cells;
};

/* Table manipulation */

ve.ce.TableNode.prototype.deleteTable = function() {
  var txs = [],
    surface = this.surfaceModel;
  txs.push(
    ve.dm.Transaction.newFromRemoval(
      surface.documentModel,
      this.model.getOuterRange()
    )
  );
  // TODO: set a proper selection after deletion
  surface.change( txs );
};

ve.ce.TableNode.INSERT_POSITIONS = {
  'before': -1,
  'after': 1
};

/**
 *
 * Case 1: 'update span'
 * ---------------------
 * The span property needs to be updated when the cell and the reference cell have the same owner
 * or one of the is owner of the other.
 *
 * Examples:
 *
 * | C* | P** |,  | C | P* | P** |
 */
ve.ce.TableNode.prototype.insertRowOrCol = function ( mode, insertPosition ) {
  var matrix, pos, rect, index, refIndex, cells, refCells, rowNode, before,
    offset, range, i, txs, updated, inserts, cell, refCell, data, style;

  rect = this.selectedRect;
  before = (insertPosition === 'before');
  matrix = this.tableMatrix.getMatrix();

  pos = (before) ? rect.start: rect.end;
  // the index of the selected row or column
  index = pos[mode];
  // the index of the reference row or column
  refIndex = index + (before ? -1 : 1);
  // cells of the selected row or column
  if (mode === 'row') {
    cells = matrix[index];
    refCells = matrix[refIndex] || [];
    rowNode = this.tableMatrix.getRowNode(index);
  } else {
    cells = this.tableMatrix.getColumn(index);
    refCells = this.tableMatrix.getColumn(refIndex);
    rowNode = this.tableMatrix.getRowNode(pos.row);
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
          txs.push(this.incrementSpan(cell, mode));
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
    range = rowNode.getOuterRange();
    offset = before ? range.start: range.end;
    txs.push(ve.dm.Transaction.newFromInsertion( this.surfaceModel.documentModel, offset, data ));
  } else {
    // making sure that the inserts are in descending order
    inserts.sort(ve.dm.TableMatrix.Cell.sortDescending);
    for (i = 0; i < inserts.length; i++) {
      cell = inserts[i];
      refCell = this.tableMatrix.findClosestCell(cell);
      if (refCell) {
        range = refCell.node.getOuterRange();
        if ( refCell.col < cell.col  || ( refCell.col === cell.col && !before ) ) {
          offset = range.end;
        } else {
          offset = range.start;
        }
        style = refCell.node.getStyle();
      } else {
        range = rowNode.getRange();
        offset = before ? range.start: range.end;
        style = cells[0].node.getStyle();
      }
      data = ve.dm.TableCellNode.createData({ style: style });
      txs.push(ve.dm.Transaction.newFromInsertion( this.surfaceModel.documentModel, offset, data ));
    }
  }
  this.surfaceModel.change(txs);
};

ve.ce.TableNode.prototype.incrementSpan = function(cell, mode) {
  var attr = (mode === 'row') ? 'rowspan' : 'colspan',
      data = {};
  data[attr] = cell.node.getSpan(mode) + 1;
  return ve.dm.Transaction.newFromAttributeChanges( this.surfaceModel.documentModel, cell.node.getOuterRange().start, data);
};

ve.ce.TableNode.prototype.insertRow = function ( position ) {
  this.insertRowOrCol('row', position);
};

ve.ce.TableNode.prototype.insertColumn = function ( position ) {
  this.insertRowOrCol('col', position);
};

ve.ce.TableNode.prototype.deleteRowsOrColumns = function ( mode ) {
  var rect, cells, row, col, i, cell, key, minIndex, maxIndex, matrix,
    span, startRow, startCol, endRow, endCol, rowNode,
    txs, adapted, actions;

  rect = this.selectedRect;
  cells = [];
  txs = [];
  adapted = {};
  actions = [];
  minIndex = rect.start[mode];
  maxIndex = rect.end[mode];
  matrix = this.tableMatrix.getMatrix();

  if (mode === 'row') {
    for (row = minIndex; row <= maxIndex; row++) {
      cells = cells.concat(this.tableMatrix.getRow(row));
    }
  } else {
    for (col = minIndex; col <= maxIndex; col++) {
      cells = cells.concat(this.tableMatrix.getColumn(col));
    }
  }

  for (i = 0; i < cells.length; i++) {
    cell = cells[i];

    if (cell.type === 'placeholder') {
      key = cell.owner.key;
      if (!adapted[key]) {
        txs.push(this.decreaseSpan(cell.owner, mode, rect));
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
          actions.push({ action: 'insert', cell: matrix[row][col] });
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
      txs.push(this.replaceOrphanedPlaceholder(actions[i].cell));
    }
    for (row = rect.end.row; row >= rect.start.row; row--) {
      rowNode = this.tableMatrix.getRowNode(row);
      txs.push( ve.dm.Transaction.newFromRemoval( this.surfaceModel.documentModel, rowNode.getOuterRange() ) );
    }
  } else {
    for (i = 0; i < actions.length; i++) {
      if (actions[i].action === 'insert') {
        txs.push(this.replaceOrphanedPlaceholder(actions[i].cell));
      } else {
        txs.push( ve.dm.Transaction.newFromRemoval( this.surfaceModel.documentModel, actions[i].cell.node.getOuterRange() ) );
      }
    }
  }
  this.surfaceModel.change(txs);
};

ve.ce.TableNode.prototype.decreaseSpan = function ( cell, mode, rect ) {
  var newSpan, span, data, attr;
  attr = (mode === 'row') ? 'rowspan' : 'colspan';
  span = cell.node.getSpan(mode);
  data = {};
  newSpan = (rect.start[mode] - cell[mode]) + Math.max(0, cell[mode] + span - 1 - rect.end[mode]);
  data[attr] = newSpan;
  return ve.dm.Transaction.newFromAttributeChanges( this.surfaceModel.documentModel, cell.node.getOuterRange().start, data );
};


ve.ce.TableNode.prototype.replaceOrphanedPlaceholder = function ( cell ) {
  var refCell, range, offset, data, style;
  refCell = this.tableMatrix.findClosestCell(cell);
  if (refCell) {
    range = refCell.node.getOuterRange();
    offset = (cell.col < refCell.col) ? range.start : range.end;
    style = refCell.node.getStyle();
  } else {
    range = this.tableMatrix.getRowNode(cell.row).getRange();
    offset = range.start;
    style = cell.node.getStyle();
  }
  data = ve.dm.TableCellNode.createData({ style: style });
  return ve.dm.Transaction.newFromInsertion( this.surfaceModel.documentModel, offset, data );
};

ve.ce.TableNode.prototype.deleteRow = function () {
  this.deleteRowsOrColumns('row');
};

ve.ce.TableNode.prototype.deleteColumn = function () {
  this.deleteRowsOrColumns('col');
};

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
