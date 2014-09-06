/**
 * A custom context for tables.
 *
 * Note: it is not possible to use the global context instance for that, as it is used for
 * annotations and focussable nodes, which can of course be part of the table's content.
 * Instead, this context is displayed while the selection is fully whithin a table.
 * Beyond that, we try to resemble the behavior of the global context.
 */
ve.ui.TableContext = function VeUiTableContext(surface, config) {
  // Parent constructor
  OO.ui.Element.call( this, config );

  this.surface = surface;

  // the currently focussed ve.ce.TableNode instance
  this.focussedTable = null;

  // Registry for all table nodes wihtin this surface
  // Table nodes are added and removed by listening to custom events 'tableNodeCreated'
  // and 'tableNodeRemoved' emitted by ve.ce.TableNode.
  this.tableNodes = [];

  // Collect all existing table nodes
  surface.view.documentView.getDocumentNode().traversePreOrder(function(n) {
    if (n.type === 'table') {
      this.tableNodes.push(n);
    }
  }, this);
  this.tableNodes.sort(ve.ui.TableContext.static.sortTableNodesByRangeSizeAscending);

  // DOM elements
  // ------------

  this.$rulerTop = $('<div>').addClass('ruler horizontal top');
  this.$rulerBottom = $('<div>').addClass('ruler horizontal bottom');
  this.$rulerLeft = $('<div>').addClass('ruler vertical left');
  this.$rulerRight = $('<div>').addClass('ruler vertical right');
  this.$bbox = $('<div>').addClass('selection-box');
  this.$rowBracket = $('<div>').addClass('row-bracket');
  this.$colBracket = $('<div>').addClass('column-bracket');

  this.$overlay = $('<div>')
    .addClass('ve-ui-tableContext-overlay')
    .append([
      this.$rulerTop, this.$rulerBottom,
      this.$rulerLeft, this.$rulerRight,
      this.$bbox,
      this.$rowBracket,
      this.$colBracket
    ] );

  this.$element.addClass('ve-ui-tableContext')
    .append( [ this.$overlay ])
    .css( {
      'visibility': 'hidden',
      'position': 'absolute'
    } );

  // Event listeners
  // ---------------
  var surfaceModel = surface.getModel();

  surface.connect(this, {'destroy': 'destroy'} );
  // surfaceModel.connect(this, { 'table-focus-changed': 'onTableFocusChange' });
  surfaceModel.connect(this, { 'documentUpdate': 'onDocumentUpdate' });
  surfaceModel.connect( this, { 'select': 'onSurfaceModelSelect' });

  surfaceModel.connect(this, { 'tableNodeCreated': 'onTableNodeCreated' });
  surfaceModel.connect(this, { 'tableNodeRemoved': 'onTableNodeRemoved' });

  // update the overlay when the window is resized
  $( window ).resize( ve.bind( function() {
      // TODO: why delayed?
      window.setTimeout(function() {
        this.update();
        this.computeSelectedArea();
      }, 0);
    }, this) );
};

OO.inheritClass( ve.ui.TableContext, OO.ui.Element );

ve.ui.TableContext.prototype.destroy = function () {
  this.surface.getModel().disconnect( this );
  this.$element.remove();
  return this;
};

ve.ui.TableContext.prototype.onDocumentUpdate = function() {
  // Note: we need to reposition as document changes might change the bounding box
  // of a tableNode
  if (this.focussedTable) {
    this.reposition();
  }
};

ve.ui.TableContext.prototype.onSurfaceModelSelect = function() {
  // Note: the execution is postponed so that all table nodes can update their
  // focus state first
  window.setTimeout( ve.bind( function() {
    this.focussedTable = null;
    for (var i = 0; i < this.tableNodes.length; i++) {
      var node = this.tableNodes[i];
      if (node.isFocussed()) {
        this.focussedTable = node;
        break;
      }
    }
    this.update();
    this.computeSelectedArea();
  }, this), 0);
};

ve.ui.TableContext.static.sortTableNodesByRangeSizeAscending = function(n1, n2) {
  var r1 = n1.getOuterRange();
  var r2 = n2.getOuterRange();
  var l1 = Math.abs(r1.end - r1.start);
  var l2 = Math.abs(r2.end - r2.start);
  return l1 - l2;
};

ve.ui.TableContext.prototype.onTableNodeCreated = function(tableNode) {
  if (this.tableNodes.indexOf(tableNode) < 0) {
    this.tableNodes.push(tableNode);
    this.tableNodes.sort(ve.ui.TableContext.static.sortTableNodesByRangeSizeAscending);
  }
};

ve.ui.TableContext.prototype.onTableNodeRemoved = function(tableNode) {
  var index = this.tableNodes.indexOf(tableNode);
  if ( index >= 0) {
    this.tableNodes.splice(index, 1);
  }
};

ve.ui.TableContext.prototype.computeSelectedArea = function() {
  var cells, cell, offset, width, height,
    top, left, bottom, right,
    tableOffset, tableHeight, tableWidth;

  if (!this.focussedTable) {
    return;
  }

  cells = this.focussedTable.getCellsForSelectedRectangle();

  top = 10000;
  bottom = 0;
  left = 10000;
  right = 0;

  // compute a bounding box for the given cell elements
  for (var i = 0; i < cells.length; i++) {
    cell = cells[i];
    if (cell.type === 'placeholder') continue;
    offset = cell.$element.offset();
    width = cell.$element.outerWidth();
    height = cell.$element.outerHeight();

    top = Math.min(top, offset.top);
    bottom = Math.max(bottom, offset.top + height);
    left = Math.min(left, offset.left);
    right = Math.max(right, offset.left + width);
  }

  // var surfaceOffset = this.surface.$element.offset();
  var elOffset = this.$element.offset();
  tableOffset = this.focussedTable.$element.offset();
  tableHeight = this.focussedTable.$element.height();
  tableWidth = this.focussedTable.$element.width();

  this.$rulerTop.css({
    'top': top - elOffset.top,
    'width': tableWidth
  } );
  this.$rulerBottom.css({
    'top': bottom - elOffset.top,
    'width': tableWidth
  } );
  this.$rulerLeft.css({
    'left': left - elOffset.left,
    'height': tableHeight
  } );
  this.$rulerRight.css({
    'left': right - elOffset.left,
    'height': tableHeight
  } );
  this.$bbox.css({
    'left': left - elOffset.left,
    'top': top - elOffset.top,
    // Note: can we get the border strength (last subtractor) from the element?
    'height': bottom - top - 2,
    'width': right - left - 2,
  } );
  this.$rowBracket.css({
    'top': top - elOffset.top - 2,
    // Note: can we get the border strength (last subtractor) from the element?
    'height': bottom - top,
  } );
  this.$colBracket.css({
    'left': left - elOffset.left - 2,
    'width': right - left,
  } );

};

ve.ui.TableContext.prototype.reposition = function() {
  if (this.focussedTable) {
    var surfaceOffset = this.surface.$element.offset();
    var offset = this.focussedTable.$element.offset();
    // var width = this.focussedTable.$element.width();
    // var height = this.focussedTable.$element.height();
    this.$element.css({
      'position': 'absolute',
      'top': offset.top - surfaceOffset.top,
      'left': offset.left - surfaceOffset.left,
      'width': 0,
      'height': 0,
      // 'border': 'solid 2px green'
    });
  }
};

ve.ui.TableContext.prototype.update = function() {
  if (this.focussedTable) {
    this.$overlay.css({visibility: 'visible'});
    this.computeSelectedArea();

    this.$element.addClass('show-controls');
    // compute the current position
    this.reposition();
    // show the popup
    this.$element.css( 'visibility', '' );
  } else {
    this.hide();
  }
};

ve.ui.TableContext.prototype.hide = function() {
  this.$element.css( 'visibility', 'hidden' );
  this.$element.removeClass('show-controls');
};

ve.ui.TableContext.prototype.getTable = function() {
  return this.focussedTable;
};
