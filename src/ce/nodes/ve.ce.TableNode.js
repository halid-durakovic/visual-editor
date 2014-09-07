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
    startCell = this.model.matrix.lookupCell(startCellContext.cellNode.model);
    if (startCellContext === endCellContext) {
      endCell = startCell;
    } else {
      endCell = this.model.matrix.lookupCell(endCellContext.cellNode.model);
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
  matrix = this.model.matrix.getMatrix();
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

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
