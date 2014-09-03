/*!
 * VisualEditor ContentEditable TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

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
  // Gets invalidated on each model update.
  this.cellMatrix = null;
  this.rowNodes = null;
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
 * @param offset: the global offset of a cell
 * @returns an object with following properties:
 *    - 'sectionNode': ve.dm.TableSectionNode
 *    - 'rowNode': ve.dm.TableRowNode
 *    - 'cellNode': ve.dm.TableCellNode
 *    - 'sectionIndex': Number
 *    - 'rowNodeIndex': Number
 *    - 'cellNodeIndex': Number
 */
ve.ce.TableNode.prototype.getCellContextForOffset = function ( offset ) {
  var node, cellContext;
  // treat the offset as global offset
  offset -= this.model.getRange().start;
  node = this.getNodeFromOffset(offset);
  cellContext = this.getCellContext(node);
  return cellContext;
};

ve.ce.TableNode.prototype.getNumberOfColumns = function() {
  var cellMatrix = this.getCellMatrix();
  if (cellMatrix.length > 0) {
    return cellMatrix[0].length;
  } else {
    return 0;
  }
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
        this.cellMatrix[row + i][col + j] = {
          type: 'placeholder',
          owner: cellNode,
          row: row + i,
          col: col + j
        };
      }
    }
  }
};

ve.ce.TableNode.prototype.getRowNodeAt = function(row) {
  if (!this.rowNodes) this.getCellMatrix();
  return this.rowNodes[row];
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


/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
