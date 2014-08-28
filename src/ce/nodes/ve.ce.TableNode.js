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

  this.surfaceModel.connect( this,
    { 'select': 'onSurfaceModelSelect' }
  );
};

ve.ce.TableNode.prototype.onTableNodeTeardown = function() {
  this.surfaceModel.disconnect( this );
};

/**
 * Reacts on selection changes and detectes when the selection is fully within
 * the table.
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function(selection) {
  var range = this.model.getRange();
  var focus;

  // first check if the selection is within this table's range
  focus = (selection && range.containsOffset(selection.from) && range.containsOffset(selection.to));
  // tables may be nested, so it is important to check that the selection is not within a sub-table
  if (focus) {
    var node = this.getNodeFromOffset(selection.start - range.start);
    while (true) {
      if (node.type === 'table' || !node) {
        focus = (node === this);
        break;
      }
      node = node.parent;
    }
  }

  if (focus) {
    if (!this.focussed) {
      this.$element.addClass('focussed');
      this.focussed = true;
      this.surfaceModel.emit('table-focus-changed', this);
    }
  } else {
    if (this.focussed) {
      this.$element.removeClass('focussed');
      this.focussed = false;
      this.surfaceModel.emit('table-focus-changed', this);
    }
  }
};

ve.ce.TableNode.prototype.isFocussed = function() {
  return this.focussed;
};

/**
 * Determines a cell node's context, in terms of table row and table section.
 *
 * To be able to deal with nested tables we identify a cell node's
 * context by examining the parent node types.
 *
 * options:
 *   - 'indexes': determine child element indexes for section, row, and cell
 */
ve.ce.TableNode.prototype.getCellContext = function (node, options) {
  var cellContext, section, row, cell;
  options = options || {};

  if (!node) return null;

  while (true) {
    switch (node.type) {
      case 'tableCell':
        cell = node;
        break;
      case 'tableRow':
        row = node;
        break;
      case 'tableSection':
        section = node;
        break;
    }
    node = node.parent;
    if (node === this) break;
    if (!node) return null;
  }

  // fallback if this is called with a top-level node
  if (!row || !cell) {
    return null;
  }

  cellContext = {
    sectionNode: section,
    rowNode: row,
    cellNode: cell
  };

  // Determines the section, row and cell indexes and the column index for a given cell.
  // Note: column and cell index are not necessarily equal in presence of merged cells.
  if (options.indexes) {
    cellContext.sectionIndex = this.children.indexOf(cellContext.sectionNode);
    cellContext.rowIndex = cellContext.sectionNode.children.indexOf(cellContext.rowNode);
    cellContext.col = -1;
    cellContext.cellIndex = -1;
    for (var i = 0; i < cellContext.rowNode.children.length; i++) {
      cell = cellContext.rowNode.children[i];
      cellContext.col += cell.model.getSpan();
      cellContext.cellIndex = i;
      if (cell === cellContext.cellNode) break;
    }
  }

  return cellContext;
};

/**
 *
 * options:
 *   - 'indexes': determine child element indexes for section, row, and cell
 *   - 'globalOffset': the given offset is global
 * returns {
 *   'sectionNode': ve.dm.TableSectionNode
 *   'rowNode': ve.dm.TableRowNode
 *   'cellNode': ve.dm.TableCellNode
 *   'sectionIndex': optional
 *   'rowIndex': optional
 *   'cellIndex': optional
 *   'col': optional
 * }
 */
ve.ce.TableNode.prototype.getCellContextForOffset = function ( offset, options ) {
  var node, cellContext;

  options = options || {};

  if (options.globalOffset) {
    offset -= this.model.getRange().start;
  }

  node = this.getNodeFromOffset(offset);
  cellContext = this.getCellContext(node, options);

  return cellContext;
};

// TODO: this should be in ve.dm.TableNode
ve.ce.TableNode.prototype.getNumberOfColumns = function() {
  var cols = 0,
      rows, row, child;

  for (var i = 0; i < this.children.length; i++) {
    child = this.children[i];
    if (child.type === 'tableSection') {
      rows = child.children;
      for (var j = 0; j < rows.length; j++) {
        row = rows[j].getModel();
        cols = Math.max(cols, row.getNumberOfColumns());
      }
    }
  }

  return cols;
};

ve.ce.TableNode.prototype.getColumnCells = function(columnIdx) {
  var cells = [],
      rows, row, child, cell;
  for (var i = 0; i < this.children.length; i++) {
    child = this.children[i];
    if (child.type === 'tableSection') {
      rows = child.children;
      for (var j = 0; j < rows.length; j++) {
        row = rows[j].getModel();
        cell = row.getCellAt(columnIdx);
        if (cell) cells.push(cell);
      }
    }
  }
  return cells;
};

ve.ce.TableNode.prototype.getCellsForRectangle = function( startLocation, endLocation ) {
  var table, cells, iterator, minCol, maxCol;

  table = this;
  cells = [];

  minCol = Math.min(startLocation.col, endLocation.col);
  maxCol = Math.max(startLocation.col, endLocation.col);

  iterator = OO.cloneObject(startLocation);
  iterator.col = 0;
  iterator.cellIndex = 0;
  iterator.cellNode = iterator.rowNode.children[0];

  function nextSection() {
    iterator.sectionIndex++;
    iterator.sectionNode = table.children[iterator.sectionIndex];

    if (!iterator.sectionNode) {
      throw new Error("End of iteration.");
    }

    iterator.rowIndex = 0;
    iterator.rowNode = iterator.sectionNode.children[0];
  }

  function nextRow() {
    iterator.row++;
    iterator.rowIndex++;
    iterator.rowNode = iterator.sectionNode.children[iterator.rowIndex];

    while (!iterator.rowNode) {
      nextSection();
    }

    iterator.col = 0;
    iterator.cellIndex = 0;
    iterator.cellNode = iterator.rowNode.children[0];
  }

  function nextCell() {
    iterator.col += iterator.cellNode.model.getSpan();
    iterator.cellIndex++;
    iterator.cellNode = iterator.rowNode.children[iterator.cellIndex];

    // step into the next row if there is no next cell or if the column is
    // beyond the rectangle boundaries
    while (!iterator.cellNode || iterator.col > maxCol) {
      nextRow();
    }
  }

  while (true) {
    if (iterator.col >= minCol && iterator.col <= maxCol) {
      cells.push(OO.cloneObject(iterator));
    }

    if (iterator.cellNode === endLocation.cellNode) break;

    try {
      nextCell();
    } catch (err) {
      window.console.error("ve.ce.TableNode: could not extract cells.");
      return [];
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
