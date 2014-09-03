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
  this.cellMatrix = null;
  this.rowNodes = null;
  this.getCellMatrix();
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

  this.surfaceModel.emit( 'table-node-removed', this );
};

/**
 * Invalidates the cached matrix representation of the table.
 * TODO: ATM we invalidate the matrix on every change. It would be better
 *       if that could be done only on *structural* changes.
 *       However, currently there does not seem to be a way to detect only those changes easily.
 */
ve.ce.TableNode.prototype.onModelUpdate = function ( transaction ) {
  ve.ce.TableNode.super.prototype.onModelUpdate.call(this, transaction);
  this.cellMatrix = null;
  this.rowNodes = null;
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
    this.startCell = startCellContext.cellNode;
    this.endCell = endCellContext.cellNode;
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

ve.ce.TableNode.prototype.getColumnCells = function(columnIdx) {
  var cells = [],
      cellMatrix = this.getCellMatrix();
  for (var i = 0; i < cellMatrix.length; i++) {
    cells.push(cellMatrix[i][columnIdx]);
  }
  return cells;
};

ve.ce.TableNode.prototype.getCellsForSelectedRectangle = function() {
  var cells = [],
      minCol, maxCol, minRow, maxRow, i, j;

  // HACK: depending on variables computed by getCellMatrix().
  if (!this.cellMatrix) this.getCellMatrix();

  minCol = Math.min(this.startCell.col, this.endCell.col);
  maxCol = Math.max(this.startCell.col, this.endCell.col);
  minRow = Math.min(this.startCell.row, this.endCell.row);
  maxRow = Math.max(this.startCell.row, this.endCell.row);
  for (i = minRow; i <= maxRow; i++) {
    for (j = minCol; j <= maxCol; j++) {
      cells.push(this.cellMatrix[i][j]);
    }
  }
  return cells;
};

/**
 * Inserts stub cells for merged cells.
 * This is an optimization better to be able to deal with merged cells.
 */
ve.ce.TableNode.prototype.getCellMatrix = function() {
  var iterator, rowNode, cellNode, row, col, rowSpan, colSpan, i, j;
  // use the cached matrix if available
  if (this.cellMatrix) {
    return this.cellMatrix;
  }
  this.cellMatrix = [];
  this.rowNodes = [];
  rowNode = null;
  row = -1;
  col = -1;
  iterator = new ve.ce.TableNode.CellIterator(this);
  // react on row transitions
  iterator.onNewRow = function(rowNode) {
    row++;
    col = -1;
    // initialize a matrix row
    this.cellMatrix[row] = this.cellMatrix[row] || [];
    // store the row node
    this.rowNodes.push(rowNode);
  }.bind(this);

  while ((cellNode = iterator.next()) !== null)  {
    col++;
    // skip present placeholders
    while (this.cellMatrix[row][col]) {
      col++;
    }
    // store the computed row and column for later use
    cellNode.row = row;
    cellNode.col = col;
    // store the cellNode in the matrix
    this.cellMatrix[row][col] = cellNode;

    // add place holders for spanned cells
    rowSpan = cellNode.getModel().getSpan('row');
    colSpan = cellNode.getModel().getSpan('col');
    if (rowSpan === 1 && colSpan === 1) continue;
    for (i = 0; i < rowSpan; i++) {
      for (j = 0; j < colSpan; j++) {
        if (i===0 && j===0) continue;
        // initialize the cell matrix row if not yet present
        this.cellMatrix[row + i] = this.cellMatrix[row + i] || [];
        this.cellMatrix[row + i][col + j] = new ve.ce.TableNode.PlaceHolder(cellNode);
      }
    }
  }
};

ve.ce.TableNode.prototype.getRowNodeAt = function(row) {
  if (!this.rowNodes) this.getCellMatrix();
  return this.rowNodes[row];
};

/* Table manipulation */

ve.ce.TableNode.prototype.getTableCellData = function(options) {
  options = options || {};
  var data = options.data || [];
  data.push({type: 'tableCell', 'attributes': { 'style': options.style || 'data' } });
  data.push({type: 'paragraph'});
  data.push({type: '/paragraph'});
  data.push({type: '/tableCell'});
  return data;
};

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

  this.hide();
};

ve.ce.TableNode.prototype.insertRow = function ( mode ) {
  var surface = this.surfaceModel,
    table = this,
    offset, offsetAfterInsertion,
    refRow, refRowNode, refCells, refCell, newRowIndex,
    i, rowSpan, newRowSpan,
    txs, data, adapted,
    cellMatrix = table.getCellMatrix();

  // retrieve the reference row which is used to determine whether
  // new cells need to be or the rowspan of an existing one needs to be updated
  refRow = (mode === 'before') ? table.startCell.row : table.endCell.row;
  refRowNode = table.getRowNodeAt(refRow);
  refCells = cellMatrix[refRow];
  newRowIndex = (mode === 'before') ? refRow - 1 : refRow + 1;
  offset = (mode === 'before') ? refRowNode.getOuterRange().start : refRowNode.getOuterRange().end;

  txs = [];
  data = [];
  adapted = {};

  // There are three different cases:
  // 1. A cell is a real cell node (no placeholder).
  //    A new cell node must be inserted.
  // 2. A cell is a placeholder and the new row is not within the spanning range of the actual node.
  //    A new node must be inserted.
  // 3. A cell is a placeholder and and the new row is within the spanning range of the actual node.
  //    The rowspan attribute of the owner must be adapted (only once).

  data.push({ type: 'tableRow'});
  for (i = 0; i < refCells.length; i++) {
    refCell = (refCells[i].type === 'placeholder') ? refCells[i].owner : refCells[i];
    rowSpan = refCell.getModel().getSpan('row');
    newRowSpan = null;

    if (!adapted[refCell] && newRowIndex > refCell.row && newRowIndex < refCell.row + rowSpan) {
      newRowSpan = rowSpan + 1;
    }

    if (newRowSpan) {
      txs.push( ve.dm.Transaction.newFromAttributeChanges(
          surface.documentModel, refCell.getModel().getOuterRange().start,
          {
            'rowspan': newRowSpan
          }
        )
      );
      adapted[refCell] = true;
    } else {
      this.getTableCellData({ data: data, style: refCell.getModel().getAttribute('style') });
    }
  }
  data.push({ type: '/tableRow'});

  txs.push(ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data ));

  // HACK: don't know how to compute valid cursor positions in advance. Thus doing this manually.
  offsetAfterInsertion = offset + 3;
  surface.change( txs, new ve.Range(offsetAfterInsertion));
};

/**
 * Deletes all selected rows of the currently focussed table.
 *
 * The presence of spanning cells makes this task rather involved.
 * We have identified two principal use-cases:
 * 1. A deleted row contains a placeholder, not the actual cell.
 *    In this case, the rowspan of the cell has to be adapted.
 * 2. A deleted row contains a row-spanning cell, which results in an orphaned
 *    placeholder. To keep a proper number of cells in the spanned row, a new cell must
 *    be inserted.
 */
ve.ce.TableNode.prototype.deleteRow = function () {
  var surface, table, startCell, endCell,
      minRow, maxRow, row, col,
      cellMatrix, cells, cell,
      i, data, rowNode,
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

  // Adds specifications for all orphans that will be used to insert new nodes
  // Note: this has to be done in two steps, as it is necessary to apply these transactions
  // in correct order (larger offsets first).
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
      if (cell.type === 'placeholder' && !reduced[cell.owner] && cell.owner.row < minRow) {
        decreaseRowSpan(cell.owner, minRow);
        reduced[cell.owner] = true;
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
    data = this.getTableCellData({ style: orphans[i].style });
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

ve.ce.TableNode.prototype.insertColumn = function (mode) {
  var surface, selection, table, startCell, endCell,
      selectedOffset, cells, offset, cell, data, txs, i,
      offsetAfterInsertion;

  surface = this.surfaceModel;
  selection = surface.getSelection();
  table = this;
  startCell = this.startCell;
  endCell = this.endCell;

  selectedOffset = selection.start - table.model.getRange().start;

  var location;
  if (mode === 'before') {
    location = (startCell.col < endCell.col) ? startCell : endCell;
  } else {
    location = (startCell.col > endCell.col) ? startCell : endCell;
  }
  cells = table.getColumnCells(location.col);

  if (cells.length === 0) {
    window.console.error("FIXME: could not lookup cells for given offset.");
    return;
  }

  offsetAfterInsertion = selectedOffset;

  txs = [];
  for (i = cells.length - 1; i >= 0; i--) {
    cell = cells[i];
    data = [];
    data.push({type: 'tableCell', 'attributes': { 'style': cell.getAttribute('style') } });
    data.push({type: 'paragraph'});
    data.push({type: '/paragraph'});
    data.push({type: '/tableCell'});
    offset = mode === 'before' ? cell.getOuterRange().start : cell.getOuterRange().end;
    txs.push(
      ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data )
    );

    if (i === 0) {
      // Note: We want to place the cursor into the first new cell.
      // In any case, before or after, the insertion offset is the start of a
      // new cell node -- and the paragraph inside the cell has an relative offset of 2.
      offsetAfterInsertion = offset + 2;
    }
  }

  surface.change(txs, new ve.Range(offsetAfterInsertion));
};

ve.ce.TableNode.prototype.deleteColumn = function () {
  var surface, table, startCell, endCell,
      cells, txs, i, minCol, maxCol;

  surface = this.surfaceModel;
  table = this;
  startCell = this.startCell;
  endCell = this.endCell;
  cells = [];

  minCol = Math.min(startCell.col, endCell.col);
  maxCol = Math.max(startCell.col, endCell.col);

  for (i = minCol; i <= maxCol; i++) {
    cells = cells.concat(table.getColumnCells(i));
  }

  cells = cells.sort( function(a,b) {
    return a.getRange().start - b.getRange().start;
  });

  txs = [];
  for (i = cells.length - 1; i >= 0; i--) {
    txs.push(
      ve.dm.Transaction.newFromRemoval( surface.documentModel, cells[i].getOuterRange() )
    );
  }

  // TODO: set an appropriate selection after deleting the column
  surface.change(txs);
};


/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/**
 * A helper class to iterate over the cells of a table node.
 *
 * It provides a unified interface to iterate cells in presence of table sections,
 * e.g., providing consecutive row indexes.
 */
ve.ce.TableNode.CellIterator = function VeCeTableNodeCellIterator(tableNode) {
  this.table = tableNode;

  this.__it = {
    sectionIndex: -1,
    rowIndex: -1,
    rowNode: null,
    cellIndex: -1,
    cellNode: null,
    sectionNode: null,
    finished: false
  };

  // hooks
  this.onNewSection = function() {};
  this.onNewRow = function() {};
};

ve.ce.TableNode.CellIterator.prototype.next = function() {
  if (this.__it.finished) throw new Error("TableCellIterator has no more cells left.");
  this.nextCell(this.__it);
  if (this.__it.finished) return null;
  else return this.__it.cellNode;
};

ve.ce.TableNode.CellIterator.prototype.nextSection = function(it) {
  it.sectionIndex++;
  it.sectionNode = this.table.children[it.sectionIndex];
  if (!it.sectionNode) {
    it.finished = true;
  } else {
    it.rowIndex = 0;
    it.rowNode = it.sectionNode.children[0];
    this.onNewSection(it.sectionNode);
  }
};

ve.ce.TableNode.CellIterator.prototype.nextRow = function(it) {
  it.rowIndex++;
  if (it.sectionNode) {
    it.rowNode = it.sectionNode.children[it.rowIndex];
  }
  while (!it.rowNode && !it.finished) {
    this.nextSection(it);
  }
  if (it.rowNode) {
    it.cellIndex = 0;
    it.cellNode = it.rowNode.children[0];
    this.onNewRow(it.rowNode);
  }
};

ve.ce.TableNode.CellIterator.prototype.nextCell = function(it) {
  if (it.cellNode) {
    it.cellIndex++;
    it.cellNode = it.rowNode.children[it.cellIndex];
  }
  // step into the next row if there is no next cell or if the column is
  // beyond the rectangle boundaries
  while (!it.cellNode && !it.finished) {
    this.nextRow(it);
  }
};

ve.ce.TableNode.PlaceHolder = function PlaceHolder(owner) {
  this.type = 'placeholder';
  this.owner = owner;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
