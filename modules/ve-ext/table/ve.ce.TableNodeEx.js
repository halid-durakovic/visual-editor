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

ve.ce.TableNodeEx.prototype.deleteRow = function() {
console.log('ve.ce.TableNodeEx.deleteRow');
};

ve.ce.TableNodeEx.prototype.getRowForOffset = function ( offset ) {
  var node = this.model.getNodeFromOffset(offset);
  // find the according table row
  // FIXME: this assumes, that there is only one table nesting level
  while (node && node.type !== 'tableRow') {
    node = node.parent;
  }
  if (node) {
    return node;
  } else {
    return null;
  }
};

ve.ce.TableNodeEx.prototype.getColumnForOffset = function ( offset ) {
  var node = this.model.getNodeFromOffset(offset),
      rowNode, cellNode,
      col = 0,
      cell,
      columnCells = [];

  // TODO: this must be done in a more robust way... e.g. the
  cellNode = node.parent;
  rowNode = cellNode.parent;

  for (var i = 0; i < rowNode.children.length; i++) {
    cell = rowNode.children[i];
    if (cell === cellNode) break;
    col += cell.getSpan();
  }

  if (col > 0) {
    columnCells = this.getColumnCells(col);
  }

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
ve.ce.TableNodeEx.prototype.getSelectedCells = function(selection) {
  var cells = [],
      section, rows, row, cell;
  for (var i = 0; i < this.children.length; i++) {
    section = this.children[i];
    // The ranges of the traversed nodes are increasing linear
    // and we can stop searching, as soon a range match fails after the first found cell
    var stopOnNextFail = false;

    if (section.type === 'tableSection') {
      var range = section.model.getRange();
      if (range.start > selection.to || range.end < selection.from) {
        if (stopOnNextFail) return cells;
        continue;
      }
      rows = section.children;
      for (var j = 0; j < rows.length; j++) {
        row = rows[j];
        range = row.model.getRange();
        if (range.start > selection.to || range.end < selection.from) {
          if (stopOnNextFail) return cells;
          continue;
        }
        for (var k = 0; k < row.children.length; k++) {
          cell = row.children[k];
          range = cell.model.getRange();
          if (range.start > selection.to || range.end < selection.from) {
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

/* Static Properties */

ve.ce.TableNodeEx.static.name = 'table';

ve.ce.TableNodeEx.static.tagName = 'table';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNodeEx );
