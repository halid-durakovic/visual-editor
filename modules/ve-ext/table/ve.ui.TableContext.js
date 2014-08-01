/**
 * A custom context for tables.
 *
 * Note: it is not possible to use the global context instance for that, as it is used for
 * annotations and focussable nodes, which can of course be part of the table's content.
 * Instead, this context is displayed while the selection is fully whithin a table.
 * Beyond that, we try to resemble the behavior of the global context.
 */
ve.ui.TableContext = function VeUiTableContext(surface, config) {
  ve.ui.Context.call( this, surface, config );

  this.currentTable = null;
  this.startLoc = null;
  this.endLoc = null;

  this.context.addItems([ new ve.ui.ContextItemWidget('table', ve.ui.TableTool, null, { '$': this.$ }) ]);

  var self = this;
  $( window ).resize(function() {
    window.setTimeout(function() {
      self.update();
      self.computeSelectedArea();
    }, 0);
  } );

  // DOM elements
  // ------------

  // a div containing the context tool
  this.$menu = this.$( '<div>' )
    .addClass( 've-ui-tableContext-menu' )
    .append(this.context.$element);

  // A widget containing controls for editing a table node.
  // Note:This corresponds to the concept of an Inspector.
  // However, as the Inspector mechanism turned out to be more in the way than helpful
  // in this case, we decided to use a stream-lined custom widget instead.
  this.inspector = new ve.ui.TableWidget({
    '$': this.$,
    '$contextOverlay': this.context.$element
  }, this);
  this.showInspector = false;

  // A popup that contains both, the tool menu and the inspector widget
  // where only one will be visible at a moment in time.
  this.popup = new OO.ui.PopupWidget( {
    '$': this.$,
    '$container': this.surface.$element,
    'tail': false
  } );
  this.popup.$body.append(
    this.$menu,
    this.inspector.$element.hide()
  );

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
    .append( [ this.popup.$element, this.$overlay ])
    .css( {
      'visibility': 'hidden',
      'position': 'absolute'
    } );

  // Event listeners
  // ---------------
  var surfaceModel = surface.getModel();

  surface.connect(this, {'destroy': 'destroy'} );
  surfaceModel.connect(this, { 'table-focus-changed': 'onTableFocusChange' });
  surfaceModel.connect(this, { 'documentUpdate': 'onDocumentUpdate' });
  surfaceModel.connect( this, { 'select': 'onSurfaceModelSelect' });

};

OO.inheritClass( ve.ui.TableContext, ve.ui.Context );

ve.ui.TableContext.prototype.afterModelChange = function() {
  // this is obligatory, but not needed here
};

/**
 * This gets called whenever the selection changes and lies within a table node (focus)
 * or if the selection leaves a table node (blur).
 */
ve.ui.TableContext.prototype.onTableFocusChange = function(veCeTableNode) {
  if (this.currentTable === veCeTableNode) {
    // dectivate the popup when the active table node is un-focussed
    if (!veCeTableNode.isFocussed()) {
      this.hide();
      this.currentTable = null;
    }
  } else {
    // deactivate the inspector when switching between tables
    // we want to enable the controls only when explicitly desired by the user
    if (veCeTableNode.isFocussed()) {
      this.currentTable = veCeTableNode;
      this.showInspector = false;
      this.update();
    }
  }
};

ve.ui.TableContext.prototype.onDocumentUpdate = function() {
  // Note: we need to reposition as document changes might change the bounding box
  // of a tableNode
  if (this.currentTable) {
    this.reposition();
  }
};

ve.ui.TableContext.prototype.onSurfaceModelSelect = function() {
  if (this.currentTable) {

    // TODO: Firefox has a nice table selection which results
    // in multi-range selection which is not yet supported by ve.
    var selection = this.surface.getSelection();
    if (selection.isBackwards()) {
      selection = selection.flip();
    }

    this.startLoc = this.currentTable.getLocationForOffset( selection.start, { globalOffset: true, rowIndex: true, columnIndex: true } )
    this.endLoc = this.currentTable.getLocationForOffset( selection.start, { globalOffset: true, rowIndex: true, columnIndex: true } )

    // Note: the execution is postponed so that the table node can register
    // with this context first
    window.setTimeout( ve.bind( function() {
      this.computeSelectedArea();
    }, this), 0);
  }
};

ve.ui.TableContext.prototype.computeSelectedArea = function() {
  var surfaceModel = this.surface.model,
    cells, cell, offset, width, height,
    top, left, bottom, right,
    tableOffset, tableHeight, tableWidth;

  cells = this.currentTable.getSelectedCells(surfaceModel.getSelection());

  top = 10000;
  bottom = 0;
  left = 10000;
  right = 0;

  // compute a bounding box for the given cell elements
  for (var i = 0; i < cells.length; i++) {
    cell = cells[i];
    offset = cell.$element.offset();
    width = cell.$element.outerWidth();
    height = cell.$element.outerHeight();

    top = Math.min(top, offset.top);
    bottom = Math.max(bottom, offset.top + height);
    left = Math.min(left, offset.left);
    right = Math.max(right, offset.left + width);
  }

  var surfaceOffset = this.surface.$element.offset();
  var elOffset = this.$element.offset();
  tableOffset = this.currentTable.$element.offset();
  tableHeight = this.currentTable.$element.height();
  tableWidth = this.currentTable.$element.width();

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
  var surfaceOffset = this.surface.$element.offset();
  var offset = this.currentTable.$element.offset();
  var width = this.currentTable.$element.width();
  var height = this.currentTable.$element.height();
  this.$element.css({
    'position': 'absolute',
    'top': offset.top - surfaceOffset.top,
    'left': offset.left - surfaceOffset.left,
    'width': 0,
    'height': 0,
    // 'border': 'solid 2px green'
  });
  this.popup.$element.css({
    'position': 'absolute',
    'left': width + 10
  });
};

ve.ui.TableContext.prototype.update = function() {
  if ( this.showInspector ) {
    this.$menu.hide();
    this.inspector.$element.show();
    this.$element.addClass('show-controls');
  } else {
    this.$menu.show();
    this.inspector.$element.hide();
    this.$element.removeClass('show-controls');
  }
  // compute the current position
  this.reposition();

  // show the popup
  this.popup.show();
  this.$element.css( 'visibility', '' );
};

ve.ui.TableContext.prototype.hide = function() {
  this.$element.css( 'visibility', 'hidden' );
  this.showInspector = false;
  this.$element.removeClass('show-controls');
};

ve.ui.TableContext.prototype.onContextItemChoose = function () {
  this.showInspector = true;
  this.update();
};

ve.ui.TableContext.prototype.closeInspector = function() {
  this.showInspector = false;
  this.update();
};

// Table manipulation

ve.ui.TableContext.prototype.deleteTable = function() {
  var txs = [],
    surface = this.surface.model;

  if (!this.currentTable) return;

  txs.push(
    ve.dm.Transaction.newFromRemoval(
      surface.documentModel,
      this.currentTable.model.getOuterRange()
    )
  );
  // TODO: set a proper selection after deletion
  surface.change( txs );

  this.hide();
};

ve.ui.TableContext.prototype.insertRow = function ( mode ) {
  var surface = this.surface.model,
    selection = surface.getSelection(),
    offset, row,
    numberOfCols, data, i,
    offsetAfterInsertion;

  // using the left boundary of the selection to determine the previous row index
  if (mode === 'before') {
    row = this.currentTable.getRowForOffset(selection.start - this.currentTable.model.getRange().start);
    offset = row.getOuterRange().start;
  } else {
    row = this.currentTable.getRowForOffset(selection.end - this.currentTable.model.getRange().start);
    offset = row.getOuterRange().end;
  }

  numberOfCols = this.currentTable.getNumberOfColumns();
  data = [];
  data.push({ type: 'tableRow'});
  for (i = 0; i < numberOfCols; i++) {
    data.push({type: 'tableCell', 'attributes': { 'style': 'data' } });
    data.push({type: 'paragraph'});
    data.push({type: '/paragraph'});
    data.push({type: '/tableCell'});
  }
  data.push({ type: '/tableRow'});

  var tx = [];
  tx.push(ve.dm.Transaction.newFromInsertion( surface.documentModel, offset, data ));

  offsetAfterInsertion = offset + 3;
  surface.change( tx, new ve.Range(offsetAfterInsertion));
};

ve.ui.TableContext.prototype.deleteRow = function () {
  var tableCe, row, range, offset,
      surface, selection, caret;

  surface = this.surface.model;
  selection = surface.getSelection();
  tableCe = this.currentTable;

  offset = selection.start - tableCe.model.getRange().start;

  var start = tableCe.getLocationForOffset( selection.start, { 'rowIndex': true, 'columnIndex': true , 'globalOffset': true} );
  var end = tableCe.getLocationForOffset( selection.end, { 'rowIndex': true, 'columnIndex': true , 'globalOffset': true} );

  // remove in inverse order
  var txs = [];
  for (var i = end.rowIndex; i >= start.rowIndex; i--) {

    ve.dm.Transaction.newFromRemoval( surface.documentModel, range );
  }

  range = row.getOuterRange();
  // TODO: set an appropriate selection after deleting the row
  surface.change(
  );


  if (range.containsOffset(caret)) {
    var node = ;
    surface.setSelection(new ve.Range(node.getRange().start));
  }

};

ve.ui.TableContext.prototype.insertColumn = function (mode) {
  var surface, selection, tableCe,
      selectedOffset, cells, offset, cell, data, txs, i,
      offsetAfterInsertion;

  surface = this.surface.model;
  selection = surface.getSelection();
  tableCe = this.currentTable;

  selectedOffset = selection.start - tableCe.model.getRange().start;
  cells = tableCe.getColumnForOffset(selectedOffset);

  if (cells.length === 0) {
    console.error("FIXME: could not lookup cells for given offset.")
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

ve.ui.TableContext.prototype.deleteColumn = function () {
  var surface, selection, tableCe,
      selectedOffset, cells, txs, i, cell;

  surface = this.surface.model;
  selection = surface.getSelection();
  tableCe = this.currentTable;

  selectedOffset = selection.start - tableCe.model.getRange().start;
  cells = tableCe.getColumnForOffset(selectedOffset);

  txs = [];
  for (i = cells.length - 1; i >= 0; i--) {
    cell = cells[i];
    txs.push(
      ve.dm.Transaction.newFromRemoval( surface.documentModel, cell.getOuterRange() )
    );
  }

  // TODO: set an appropriate selection after deleting the column
  surface.change(txs);
};



/**
 * We monkey-patch the surface setup here.
 * TODO: we need support in the core for that. E.g., this doesn't work for multiple surfaces or
 * if a surface is re-created.
 */
$(function() {
  function init() {
    if(!ve.init.target) {
      window.setTimeout(init, 0);
    } else {
      ve.init.target.on( 'surfaceReady', function() {
        var surface = ve.init.target.getSurface();
        var tableContext = new ve.ui.TableContext(surface, {});
        surface.$localOverlay.append(tableContext.$element);
      });
    }
  }
  init();
});
