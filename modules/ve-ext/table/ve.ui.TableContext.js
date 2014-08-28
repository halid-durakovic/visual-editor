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

  this.tableNodes = [];
  this.focussedTable = null;

  // update the overlay when the window is resized
  var self = this;
  $( window ).resize(function() {
    window.setTimeout(function() {
      self.update();
      self.computeSelectedArea();
    }, 0);
  } );

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

  surfaceModel.connect(this, { 'table-node-created': 'onTableNodeCreated' });
  surfaceModel.connect(this, { 'table-node-removed': 'onTableNodeRemoved' });

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

  cells = this.focussedTable.getCellsForSelectedRectangle();

  top = 10000;
  bottom = 0;
  left = 10000;
  right = 0;

  // compute a bounding box for the given cell elements
  for (var i = 0; i < cells.length; i++) {
    cell = cells[i].cellNode;
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
    var width = this.focussedTable.$element.width();
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


// Table manipulation

ve.ui.TableContext.prototype.deleteTable = function() {
  var txs = [],
    surface = this.surface.model;

  if (!this.focussedTable) return;

  txs.push(
    ve.dm.Transaction.newFromRemoval(
      surface.documentModel,
      this.focussedTable.model.getOuterRange()
    )
  );
  // TODO: set a proper selection after deletion
  surface.change( txs );

  this.hide();
};

ve.ui.TableContext.prototype.insertRow = function ( mode ) {
  var surface = this.surface.model,
    offset, row,
    numberOfCols, data, i,
    offsetAfterInsertion;

  // using the left boundary of the selection to determine the previous row index
  if (mode === 'before') {
    row = this.focussedTable.startCell.rowNode;
    offset = row.getOuterRange().start;
  } else {
    row = this.focussedTable.endCell.rowNode;
    offset = row.getOuterRange().end;
  }

  numberOfCols = this.focussedTable.getNumberOfColumns();
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
  var tableCe, cells, range,
      surface, deletedRows;

  surface = this.surface.model;
  tableCe = this.focussedTable;

  cells = this.focussedTable.getCellsForSelectedRectangle();
  deletedRows = {};
  // remove in inverse order
  var txs = [];
  for (var i = cells.length - 1; i >= 0; i--) {
    var loc = cells[i];
    range = loc.rowNode.getOuterRange();
    if (!deletedRows[range.start]) {
      txs.push( ve.dm.Transaction.newFromRemoval( surface.documentModel, range ) );
      deletedRows[range.start] = true;
    }
  }
  // TODO: set an appropriate selection after deleting the row
  surface.change(txs);
};

ve.ui.TableContext.prototype.insertColumn = function (mode) {
  var surface, selection, tableCe,
      selectedOffset, cells, offset, cell, data, txs, i,
      offsetAfterInsertion, startCell, endCell;

  surface = this.surface.model;
  selection = surface.getSelection();
  tableCe = this.focussedTable;
  startCell = this.focussedTable.startCell;
  endCell = this.focussedTable.endCell;

  selectedOffset = selection.start - tableCe.model.getRange().start;

  var location;
  if (mode === 'before') {
    location = (startCell.col < endCell.col) ? startCell : endCell;
  } else {
    location = (startCell.col > endCell.col) ? startCell : endCell;
  }
  cells = tableCe.getColumnCells(location.col);

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

ve.ui.TableContext.prototype.deleteColumn = function () {
  var surface, tableCe,
      cells, txs, i, minCol, maxCol, startCell, endCell;

  surface = this.surface.model;
  tableCe = this.focussedTable;
  startCell = this.focussedTable.startCell;
  endCell = this.focussedTable.endCell;
  cells = [];

  minCol = Math.min(startCell.col, endCell.col);
  maxCol = Math.max(startCell.col, endCell.col);

  for (i = minCol; i <= maxCol; i++) {
    cells = cells.concat(tableCe.getColumnCells(i));
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

