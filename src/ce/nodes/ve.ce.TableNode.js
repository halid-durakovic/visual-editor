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

  this.startCell = null;
  this.endCell = null;

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

  this.surfaceModel.emit( 'table-node-created', this );
};

ve.ce.TableNode.prototype.onTableNodeTeardown = function() {
  this.surfaceModel.disconnect( this );
  this.tableMatrix.destroy();
  this.surfaceModel.emit( 'table-node-removed', this );
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
  var startCellContext, endCellContext;
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
    this.startCell  = null;
    this.endCell = null;
    this.unfocus();
  } else {
    // TODO: this could also be solved in DM world
    this.startCell = this.tableMatrix.lookupCell(startCellContext.rowNode.model, startCellContext.cellNode.model);
    if (startCellContext === endCellContext) {
      this.endCell = this.startCell;
    } else {
      this.endCell = this.tableMatrix.lookupCell(endCellContext.rowNode.model, endCellContext.cellNode.model);
    }
  }
};

ve.ce.TableNode.prototype.isFocussed = function() {
  return this.focussed;
};

ve.ce.TableNode.prototype.focus = function() {
  this.$element.addClass('focussed');
  this.focussed = true;
  this.surfaceModel.emit('table-focus-changed', this);
};

ve.ce.TableNode.prototype.unfocus = function() {
  this.$element.removeClass('focussed');
  this.focussed = false;
  this.surfaceModel.emit('table-focus-changed', this);
};

/**
 * Determines a cell node's context, in terms of table row and table section.
 *
 * To be able to deal with nested tables we identify a cell node's
 * context by examining the parent nodes.
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

ve.ce.TableNode.prototype.getSelectedRectangle = function() {
  if (!this.startCell || !this.endCell) return null;
  return {
    start: { row: Math.min(this.startCell.row, this.endCell.row), col: Math.min(this.startCell.col, this.endCell.col)},
    end: { row: Math.max(this.startCell.row, this.endCell.row), col: Math.max(this.startCell.col, this.endCell.col) }
  };
};

// NOTE: this is only used in CE world for visual stuff
ve.ce.TableNode.prototype.getCellsForSelectedRectangle = function() {
  var cells, i, j, rect, cell, ceCellNode, offset;
  cells = [];
  rect = this.getSelectedRectangle();
  if (rect) {
    for (i = rect.start.row; i <= rect.end.row; i++) {
      for (j = rect.start.col; j <= rect.end.col; j++) {
        cell = this.tableMatrix.matrix[i][j];
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

ve.ce.TableNode.BEFORE = -1;
ve.ce.TableNode.AFTER = 1;

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
ve.ce.TableNode.prototype.insertRowOrCol = function ( mode, position ) {
  var tableMatrix, pos, rect, index, refIndex, cells, refCells, rowNode,
    offset, range, i, txs, updated, inserts, cell, refCell, data;

  tableMatrix = this.tableMatrix;
  rect = this.getSelectedRectangle();
  pos = (position === ve.ce.TableNode.BEFORE) ? rect.start: rect.end;
  // the index of the selected row or column
  index = pos[mode];
  // the index of the reference row or column
  refIndex = index + position;
  // cells of the selected row or column
  if (mode === 'row') {
    cells = tableMatrix.matrix[index];
    refCells = tableMatrix.matrix[refIndex];
    rowNode = tableMatrix.getRowNode(index);
  } else {
    cells = tableMatrix.getColumn(index);
    refCells = tableMatrix.getColumn(refIndex);
    rowNode = tableMatrix.getRowNode(pos.row);
  }

  txs = [];
  updated = {};
  inserts = [];

  for (i = 0; i < cells.length; i++) {
    cell = cells[i];
    refCell = refCells[i];

    // detect if span update is necessary
    if (cell.type === 'placeholder' || refCell.type === 'placeholder') {
      if (cell.node === refCell.node) {
        if (!updated[cell.key]) {
          txs.push(this.incrementSpan(cell));
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
    offset = (position === ve.ce.TableNode.BEFORE) ? range.start: range.end;
    txs.push(ve.dm.Transaction.newFromInsertion( this.surfaceModel.documentModel, offset, data ));
  } else {
    // making sure that the inserts are in descending order
    inserts.sort(ve.dm.TableMatrix.Cell.sortDescending);
    for (i = 0; i < inserts.length; i++) {
      cell = inserts[i];
      refCell = tableMatrix.findNextCell(cell);
      range = refCell.getOuterRange();
      if ( refCell.col < cell.col  || ( refCell.col === cell.col && position === ve.ce.TableNode.AFTER ) ) {
        offset = range.end;
      } else {
        offset = range.start;
      }
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

// ve.ce.TableNode.prototype.insertRow = function ( mode ) {
//   var surface = this.surfaceModel,
//     table = this,
//     offset, offsetAfterInsertion,
//     refRow, refRowNode, refCells, refCell, newRowIndex, key,
//     i, rowSpan, newRowSpan,
//     txs, data, adapted,
//     cellMatrix = table.getCellMatrix();

//   // retrieve the reference row which is used to determine whether
//   // new cells need to be or the rowspan of an existing one needs to be updated
//   refRow = (mode === 'before') ? table.startCell.row : table.endCell.row;
//   refRowNode = table.getRowNodeAt(refRow);
//   refCells = cellMatrix[refRow];
//   newRowIndex = (mode === 'before') ? refRow - 1 : refRow + 1;
//   offset = (mode === 'before') ? refRowNode.getOuterRange().start : refRowNode.getOuterRange().end;

//   txs = [];
//   data = [];
//   adapted = {};

//   // There are two different cases:
//   // 1. The new row is within the spanning range of the node (or the owner node for placeholders).
//   //    The rowspan attribute of the node must be adapted (only once).
//   // 2. The new row is outside the spanning range of the node.
//   //    A new node must be inserted.

//   data.push({ type: 'tableRow'});
//   for (i = 0; i < refCells.length; i++) {
//     refCell = (refCells[i].type === 'placeholder') ? refCells[i].owner : refCells[i];
//     key = refCell.row + "_" + refCell.col;
//     rowSpan = refCell.getModel().getSpan('row');
//     newRowSpan = null;
//     // skip nodes that have been adapted already
//     if (adapted[key]) {
//       continue;
//     }
//     // check if the node spans over the inserted row and needs to be adapted
//     if (newRowIndex > refCell.row && newRowIndex < refCell.row + rowSpan) {
//       newRowSpan = rowSpan + 1;
//     }
//     if (newRowSpan) {
//       txs.push( ve.dm.Transaction.newFromAttributeChanges(
//           surface.documentModel, refCell.getModel().getOuterRange().start,
//           {
//             'rowspan': newRowSpan
//           }
//         )
//       );
//       adapted[key] = true;
//     } else {
//       this.createTableCellData({ data: data, style: refCell.getModel().getAttribute('style') });
//     }
//   }
//   data.push({ type: '/tableRow'});

//   txs.push(ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data ));

//   // HACK: don't know how to compute valid cursor positions in advance. Thus doing this manually.
//   offsetAfterInsertion = offset + 3;
//   surface.change( txs, new ve.Range(offsetAfterInsertion));
// };

/**
 * Deletes all selected rows of the currently focussed table.
 *
 * There are two use-cases:
 * 1. A deleted row contains a placeholder, not the actual cell.
 *    In this case, the rowspan of the cell has to be adapted.
 * 2. A deleted row contains a row-spanning cell, which results in an orphaned
 *    placeholder. To keep a proper shape of the spanned row, a new cell must
 *    be inserted.
 */
ve.ce.TableNode.prototype.deleteRow = function () {
  var surface, table, startCell, endCell,
      minRow, maxRow, row, col,
      cellMatrix, cells, cell,
      i, data, rowNode, key,
      txs, reduced, orphans;

  surface = this.surfaceModel;
  table = this;
  cellMatrix = table.getCellMatrix();
  startCell = table.startCell;
  endCell = table.endCell;
  minRow = Math.min(startCell.row, endCell.row);
  maxRow = Math.max(startCell.row, endCell.row);

  // Collect all transactions
  txs = [];
  reduced = {};
  orphans = [];

  // Creates a transaction to decrease the row span of a cell by one
  function decreaseRowSpan(cell) {
    var newRowSpan,
        rowSpan = cell.getModel().getSpan('row');
    // Note: asserting cell.row < minRow
    newRowSpan = (minRow - cell.row) + Math.max(0, cell.row + rowSpan - 1 - maxRow);
    txs.push( ve.dm.Transaction.newFromAttributeChanges(
        surface.documentModel, cell.getOuterRange().start,
        {
          'rowspan': newRowSpan
        }
      )
    );
  }

  // Adds specifications for new nodes that will be inserted replacing orphaned placeholders.
  // Note: this has to be done in two passes, to have transactions in correct order (larger offsets first).
  function recordOrphans(cell) {
    var row, col, maxSpanRow, maxSpanCol, cellSpec, node;
    maxSpanRow = cell.row + cell.getModel().getSpan('row') - 1;
    maxSpanCol = cell.col + cell.getModel().getSpan('col') - 1;
    // For every orphan we determine an insert position by looking for
    // the next real cell node in the same row
    for (row = maxRow + 1; row <= maxSpanRow; row++) {
      for (col = cell.col; col <= maxSpanCol; col++) {
        cellSpec = null;
        // look for the closest predecessor not being a placeholder
        for (i=col-1; i >= 0; i--) {
          node = cellMatrix[row][i];
          if (node.type !== 'placeholder') {
            cellSpec = {
              // insert after
              offset: node.getOuterRange().end,
              style: node.getModel().getAttribute('style')
            };
            break;
          }
        }
        // ... then for for the closest successor
        if (!cellSpec) {
          for (i=col+1; i < cellMatrix[row].length; i++) {
            node = cellMatrix[row][i];
            if (node.type !== 'placeholder') {
              cellSpec = {
                // insert before
                offset: node.getOuterRange().start,
                style: node.getModel().getAttribute('style')
              };
              break;
            }
          }
        }
        // if there is no real cell nodes at all use the row node to get an insert position
        if (!cellSpec) {
          var rowNode = table.getRowNodeAt(row);
          cellSpec = {
            offset: rowNode.getRange().start,
            style: 'data' // TODO where to take this from?
          };
        }
        orphans.push(cellSpec);
      }
    }
  }

  // Adapt the model considering existing rowspan attributes.
  //
  // There are essentially two cases:
  // 1. A placeholder is removed for a cell with rowspan,
  // 2. A cell with rowspan is removed. In this case, a new elements have to replace orphaned
  //    placeholders.
  for (row = maxRow; row >= minRow; row--) {
    // reduce rowspan for owner of placeholder cells
    cells = cellMatrix[row];
    for (col = 0; col < cells.length; col++) {
      cell = cells[col];
      if (cell.type === 'placeholder' && cell.owner.row < minRow) {
        cell = cell.owner;
        key = cell.row + '_' + cell.col;
        if (!reduced[key]) {
          decreaseRowSpan(cell, minRow);
          reduced[key] = true;
        }
      } else if (cell.type === 'tableCell' && cell.row + cell.getModel().getSpan('row') - 1  > maxRow) {
        recordOrphans(cell);
      }
    }
  }

  // Sort the orphan specs so that they are in proper order (descending offsets)
  function sortByOffsetDescending(a, b) {
    return b.offset - a.offset;
  }
  orphans.sort(sortByOffsetDescending);

  // Create transactions for inserting cells for orphaned placeholders
  for (i = 0; i < orphans.length; i++) {
    data = this.createTableCellData({ style: orphans[i].style });
    txs.push(
      ve.dm.Transaction.newFromInsertion( surface.documentModel, orphans[i].offset, data )
    );
  }
  // Delete row nodes in reverse order
  for (row = maxRow; row >= minRow; row--) {
    rowNode = this.getRowNodeAt(row);
    txs.push( ve.dm.Transaction.newFromRemoval( surface.documentModel, rowNode.getOuterRange() ) );
  }
  surface.change(txs);
};

// TODO: not yet working.
//  - left insert with span not yet working: example1, J, insert left
//  - example1, AE, insert right
//  - delet col: example1, J, del col
// ve.ce.TableNode.prototype.insertColumn = function (mode) {
//   var surface = this.surfaceModel,
//     table = this,
//     offset,
//     refCol, refCells, refCell, newColIndex, key,
//     txs, data, adapted,
//     i, colSpan, newColSpan;

//   // retrieve the reference row which is used to determine whether
//   // new cells need to be or the rowspan of an existing one needs to be updated
//   if (mode === 'before') {
//     refCol = Math.min(table.startCell.col, table.endCell.col);
//   } else {
//     refCol = Math.max(table.startCell.col, table.endCell.col);
//   }
//   refCells = table.getColumnCells(refCol);
//   newColIndex = (mode === 'before') ? refCol - 1 : refCol + 1;

//   txs = [];
//   adapted = {};

//   // There are two different cases:
//   // 1. The new col is within the spanning range of the node (or the owner node for placeholders).
//   //    The colwspan attribute of the node must be adapted (only once).
//   // 2. The new col is outside the spanning range of the node.
//   //    A new node must be inserted.

//   for (i = refCells.length - 1; i >= 0; i--) {
//     refCell = (refCells[i].type === 'placeholder') ? refCells[i].owner : refCells[i];
//     key = refCell.row + "_" + refCell.col;
//     colSpan = refCell.getModel().getSpan('col');
//     newColSpan = null;
//     // skip nodes that have been adapted already
//     if (adapted[key]) {
//       continue;
//     }
//     // check if the node spans over the inserted row and needs to be adapted
//     if (newColIndex > refCell.col && newColIndex < refCell.col + colSpan) {
//       newColSpan = colSpan + 1;
//     }
//     if (newColSpan) {
//       txs.push( ve.dm.Transaction.newFromAttributeChanges(
//           surface.documentModel, refCell.getModel().getOuterRange().start,
//           {
//             'colspan': newColSpan
//           }
//         )
//       );
//       adapted[key] = true;
//     } else {
//       offset = (mode === 'before') ? refCell.getModel().getOuterRange().start : refCell.getModel().getOuterRange().end;
//       data = this.createTableCellData({ style: refCell.getModel().getAttribute('style') });
//       txs.push(
//         ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data )
//       );
//     }
//   }

//   surface.change( txs);
// };

ve.ce.TableNode.prototype.deleteColumn = function () {
  var surface, table, startCell, endCell,
      minCol, maxCol, maxRow, row, col,
      cellMatrix, cell,
      i, data, key,
      txs, reduced, orphans, removals;

  surface = this.surfaceModel;
  table = this;
  cellMatrix = table.getCellMatrix();
  startCell = table.startCell;
  endCell = table.endCell;
  minCol = Math.min(startCell.col, endCell.col);
  maxCol = Math.max(startCell.col, endCell.col);
  maxRow = cellMatrix.length - 1;

  // Collect all transactions
  txs = [];
  reduced = {};
  orphans = [];
  removals = [];

  // Creates a transaction to decrease the row span of a cell by one
  function decreaseColSpan(cell) {
    var newColSpan,
        colSpan = cell.getModel().getSpan('col');
    // Note: asserting cell.row < minRow
    newColSpan = (minCol - cell.col) + Math.max(0, cell.col + colSpan - 1 - maxCol);
    txs.push( ve.dm.Transaction.newFromAttributeChanges(
        surface.documentModel, cell.getOuterRange().start,
        {
          'colspan': newColSpan
        }
      )
    );
  }

  // Adds specifications for new nodes that will be inserted replacing orphaned placeholders.
  // Note: this has to be done in two passes, to have transactions in correct order (larger offsets first).
  function recordOrphans(cell) {
    var row, col, maxSpanRow, maxSpanCol, cellSpec, node;
    maxSpanRow = cell.row + cell.getModel().getSpan('row') - 1;
    maxSpanCol = cell.col + cell.getModel().getSpan('col') - 1;
    // For every orphan we determine an insert position by looking for
    // the next real cell node in the same row
    for (row = cell.row; row <= maxSpanRow; row++) {
      for (col = maxCol + 1; col <= maxSpanCol; col++) {
        cellSpec = null;
        // look for the closest predecessor not being a placeholder
        for (i=col-1; i >= 0; i--) {
          node = cellMatrix[row][i];
          if (node.type !== 'placeholder') {
            cellSpec = {
              // insert after
              offset: node.getOuterRange().end,
              style: node.getModel().getAttribute('style')
            };
            break;
          }
        }
        // ... then for for the closest successor
        if (!cellSpec) {
          for (i=col+1; i < cellMatrix[row].length; i++) {
            node = cellMatrix[row][i];
            if (node.type !== 'placeholder') {
              cellSpec = {
                // insert before
                offset: node.getOuterRange().start,
                style: node.getModel().getAttribute('style')
              };
              break;
            }
          }
        }
        // if there is no real cell nodes at all use the row node to get an insert position
        if (!cellSpec) {
          var rowNode = table.getRowNodeAt(row);
          cellSpec = {
            offset: rowNode.getRange().start,
            style: 'data' // TODO where to take this from?
          };
        }
        orphans.push(cellSpec);
      }
    }
  }

  // Adapt the model considering existing rowspan attributes.
  //
  // There are essentially two cases:
  // 1. A placeholder is removed for a cell with rowspan,
  // 2. A cell with rowspan is removed. In this case, a new elements have to replace orphaned
  //    placeholders.
  for (col = maxCol; col >= minCol; col--) {
    // reduce rowspan for owner of placeholder cells
    for (row = maxRow; row >= 0; row--) {
      cell = cellMatrix[row][col];
      if (cell.type === 'placeholder' && cell.owner.col < minCol) {
        cell = cell.owner;
        key = cell.row + '_' + cell.col;
        if (!reduced[key]) {
          decreaseColSpan(cell, minCol);
          reduced[key] = true;
        }
      } else if (cell.type === 'tableCell') {
        if (cell.col + cell.getModel().getSpan('col') - 1  > maxCol) {
          recordOrphans(cell);
        }
        removals.push(cell);
      }
    }
  }

  // Sort the orphan specs so that they are in proper order (descending offsets)
  function sortByOffsetDescending(a, b) {
    return b.offset - a.offset;
  }
  orphans.sort(sortByOffsetDescending);

  // Create transactions for inserting cells for orphaned placeholders
  for (i = 0; i < orphans.length; i++) {
    data = this.createTableCellData({ style: orphans[i].style });
    txs.push(
      ve.dm.Transaction.newFromInsertion( surface.documentModel, orphans[i].offset, data )
    );
  }
  // Delete col nodes in reverse order
  for (i = 0; i < removals.length; i++) {
    txs.push( ve.dm.Transaction.newFromRemoval( surface.documentModel, removals[i].getOuterRange() ) );
  }
  surface.change(txs);
};

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
