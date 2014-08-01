/**
 * ContentEditable table node.
 *
 * @class
 * @extends ve.ce.TableNode
 * @constructor
 * @param {ve.dm.TableNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableNodeEx = function VeCeTableNodeEx( model, config ) {
  // Parent constructor
  ve.ce.TableNode.call( this, model, config );

  this.connect( this, {
    'setup': 'onTableNodeSetup',
    'teardown': 'onTableNodeTeardown',
  } );

  this.focussed = false;
};

/* Inheritance */

OO.inheritClass( ve.ce.TableNodeEx, ve.ce.TableNode );

/* Prototype */

ve.ce.TableNodeEx.prototype.onTableNodeSetup = function() {
  // Exit if already setup or not attached
  if ( this.isSetup || !this.root ) {
    return;
  }

  var surface = this.getRoot().getSurface();
  this.surfaceModel = surface.getModel();

  // DOM changes
  this.$element
    .addClass( 've-ce-tableNodeEx' );

  // Events

  this.surfaceModel.connect( this,
    { 'select': 'onSurfaceModelSelect' }
  );
};

ve.ce.TableNodeEx.prototype.onTableNodeTeardown = function() {
  this.surfaceModel.disconnect( this );
};

ve.ce.TableNodeEx.prototype.onSurfaceModelSelect = function(selection) {
  // console.log('TableNodeEx.onSurfaceModelSelect...', selection, this.model.getRange());
  var range = this.model.getRange();
  if (range.containsOffset(selection.from) && range.containsOffset(selection.to)) {
    if (!this.focussed) {
      this.$element.addClass('focussed');
      this.focussed = true;
      this.surfaceModel.emit( 'table-focus-changed', this);
    }
  } else {
    if (this.focussed) {
      this.$element.removeClass('focussed');
      this.focussed = false;
      this.surfaceModel.emit( 'table-focus-changed', this);
    }
  }
};

ve.ce.TableNodeEx.prototype.isFocussed = function() {
  return this.focussed;
};

ve.ce.TableNodeEx.prototype.locateNode = function (node) {
  var result, section, row, cell;

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

  // HACK: fallback if this is called with a top-level node
  if (!row || !cell) {
    return null;
  }

  result = {
    sectionNode: section,
    rowNode: row,
    cellNode: cell
  };

  return result;
};

/**
 *
 * returns {
 *   'sectionNode': ve.dm.TableSectionNode
 *   'rowNode': ve.dm.TableRowNode
 *   'cellNode': ve.dm.TableCellNode
 *   'sectionIndex': optional
 *   'rowIndex': optional
 *   'cellIndex': optional
 *   'col': optional
 * }
 * options:
 *   - 'indexes': determine child element indexes for section, row, and cell
 *   - 'globalOffset': the given offset is global
 */
ve.ce.TableNodeEx.prototype.getLocationForOffset = function ( offset, options ) {
  var node, location;

  options = options || {};

  if (options.globalOffset) {
    offset -= this.model.getRange().start;
  }

  node = this.getNodeFromOffset(offset);
  location = this.locateNode(node);

  if (!location) return null;

  if (options.indexes) {
    this.computeNodeIndexes(location);
  }

  return location;
};

ve.ce.TableNodeEx.prototype.computeNodeIndexes = function( location ) {
  var cell;

  location.sectionIndex = this.children.indexOf(location.sectionNode);
  location.rowIndex = location.sectionNode.children.indexOf(location.rowNode);

  location.col = -1;
  location.cellIndex = -1;

  for (var i = 0; i < location.rowNode.children.length; i++) {
    cell = location.rowNode.children[i];
    location.col += cell.model.getSpan();
    location.cellIndex = i;
    if (cell === location.cellNode) break;
  }
};

ve.ce.TableNodeEx.prototype.getColumn = function ( location ) {
  var node, location, columnCells;
  columnCells = this.getColumnCells(location.col);
  return columnCells;
};

ve.ce.TableNodeEx.prototype.getNumberOfColumns = function() {
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

ve.ce.TableNodeEx.prototype.getRowForOffset = function ( offset ) {
  var node, location;

  node = this.model.getNodeFromOffset(offset);
  location = this.locateNode(node);

  if (location) {
    return location.rowNode;
  } else {
    return null;
  }
};

ve.ce.TableNodeEx.prototype.getColumnCells = function(colIdx) {
  var cells = [],
      rows, row, child, cell;
  for (var i = 0; i < this.children.length; i++) {
    child = this.children[i];
    if (child.type === 'tableSection') {
      rows = child.children;
      for (var j = 0; j < rows.length; j++) {
        row = rows[j].getModel();
        cell = row.getCellAt(colIdx);
        if (cell) cells.push(cell);
      }
    }
  }
  return cells;
};

/**
 * Finds all cells that are covered by a given selection
 *
 * This is gets called by the context, whenever the selection changes within a focussed table node.
 */
ve.ce.TableNodeEx.prototype.getCellsForRange = function(range) {
  var cells = [],
      section, rows, row, cell;
  if (range.isBackwards()) {
    range = range.flip();
  }
  for (var i = 0; i < this.children.length; i++) {
    section = this.children[i];
    // The modelRanges of the traversed nodes are increasing linear
    // and we can stop searching, as soon a modelRange match fails after the first found cell
    var stopOnNextFail = false;

    if (section.type === 'tableSection') {
      var modelRange = section.model.getRange();
      if (modelRange.start > range.to || modelRange.end < range.from) {
        if (stopOnNextFail) return cells;
        continue;
      }
      rows = section.children;
      for (var j = 0; j < rows.length; j++) {
        row = rows[j];
        modelRange = row.model.getRange();
        if (modelRange.start > range.to || modelRange.end < range.from) {
          if (stopOnNextFail) return cells;
          continue;
        }
        for (var k = 0; k < row.children.length; k++) {
          cell = row.children[k];
          modelRange = cell.model.getRange();
          if (modelRange.start > range.to || modelRange.end < range.from) {
            if (stopOnNextFail) return cells;
            continue;
          }
          cells.push(cell);
          stopOnNextFail = true;
        }
      }
    }
  }
  return cells;
};

ve.ce.TableNodeEx.prototype.getSelectedCells = function(ranges) {
  var cells = [];
  if (ve.isArray(ranges)) {
    for (var i = 0; i < ranges.length; i++) {
      cells = Array.concat(cells, this.getCellsForRange(ranges[i]));
    }
  } else {
    cells = this.getCellsForRange(ranges);
  }

  return cells;
};

ve.ce.TableNodeEx.prototype.getCellsForRectangle = function( startLocation, endLocation ) {
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

ve.ce.TableNodeEx.static.name = 'table';

ve.ce.TableNodeEx.static.tagName = 'table';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNodeEx );
