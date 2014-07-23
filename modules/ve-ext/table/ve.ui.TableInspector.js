/**
 * Math inspector.
 *
 * @class
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.TableInspector = function VeUiTableInspector( config, tableContext ) {
  // Parent constructor
  ve.ui.Inspector.call( this, config );

  this.tableContext = tableContext;
};

/* Inheritance */

OO.inheritClass( ve.ui.TableInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.TableInspector.static.name = 'table';

ve.ui.TableInspector.static.icon = 'table';

// TODO: this should come from i18n configuration
ve.ui.TableInspector.static.title = 'Table';

ve.ui.TableInspector.static.modelClasses = [ ve.dm.TableNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.initialize = function () {
  // Parent method
  ve.ui.TableInspector.super.prototype.initialize.call( this );

  var insertRowAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-row-after',
    'label': 'Below'
  });
  var insertRowBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-row-before',
    'label': 'Above'
  });
  var insertColumnAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-column-after',
    'label': 'Right'
  });
  var insertColumnBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-column-before',
    'label': 'Left'
  });
  var deleteRow = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-delete-row',
    'label': 'Delete'
  });
  var deleteColumn = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-delete-column',
    'label': 'Delete'
  });

  var rowButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableInspector-buttons'), {} );
  rowButtons.addItems([
      insertRowBefore,
      insertRowAfter,
      deleteRow
    ] );
  var columnButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableInspector-buttons'), {} );
  columnButtons.addItems([
      insertColumnBefore,
      insertColumnAfter,
      deleteColumn
    ] );

  this.$body.append( [
      rowButtons.$group,
      columnButtons.$group
    ] );

  insertColumnBefore.connect( this, {'click': 'onInsertColumnBefore'} );
  insertColumnAfter.connect( this, {'click': 'onInsertColumnAfter'} );
  deleteColumn.connect( this, {'click': 'onDeleteColumn'} );

  insertRowBefore.connect( this, {'click': 'onInsertRowBefore'} );
  insertRowAfter.connect( this, {'click': 'onInsertRowAfter'} );
  deleteRow.connect( this, {'click': 'onDeleteRow'} );

};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getSetupProcess = function ( data ) {
  var tableCe;
  return ve.ui.TableInspector.super.prototype.getSetupProcess.call( this, data )
    .next( function () {
      if (!this.tableContext || !this.tableContext.getCurrentTableNode()) {
        this.createTable();
      }
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getReadyProcess = function (/*data*/) {
  return ve.ui.TableInspector.super.prototype.getReadyProcess.call( this )
    .next( function () {
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getTeardownProcess = function ( data ) {
  return ve.ui.TableInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      data = data || {};
      if (data.action === 'remove') {
        this.deleteTable();
      }
    }, this);
};

ve.ui.TableInspector.prototype.insertColumn = function (mode) {
  var surface, selection, fragment, tableCe,
      selectedOffset, cells, offset, cell, data, txs, i;

  surface = this.fragment.getSurface();
  selection = surface.getSelection();
  fragment = surface.getFragment(selection);

  if (!selection.isCollapsed()) {
    window.console.error("FIXME: this should only be active when the selection is collapsed.");
    return;
  }

  tableCe = this.tableContext.getCurrentTableNode();
  selectedOffset = fragment.getRange().start - tableCe.model.getRange().start;
  cells = tableCe.getColumnForOffset(selectedOffset);

  txs = [];
  for (i = cells.length - 1; i >= 0; i--) {
    cell = cells[i];
    data = [];
    data.push({type: 'tableCell', 'attributes': { 'style': 'data' } });
    data.push({type: 'paragraph'});
    data.push('');
    data.push({type: '/paragraph'});
    data.push({type: '/tableCell'});
    offset = mode === 'before' ? cell.getOuterRange().start : cell.getOuterRange().end;
    txs.push(
      ve.dm.Transaction.newFromInsertion( fragment.document, offset, data )
    );
  }
  fragment.change(txs);
};

ve.ui.TableInspector.prototype.onInsertColumnBefore = function () {
  this.insertColumn('before');
};

ve.ui.TableInspector.prototype.onInsertColumnAfter = function () {
  this.insertColumn('after');
};

ve.ui.TableInspector.prototype.onDeleteColumn = function () {
  var surface, selection, fragment, tableCe,
      selectedOffset, cells, txs, i, cell;

  surface = this.fragment.getSurface();
  selection = surface.getSelection();
  fragment = surface.getFragment(selection);

  if (!selection.isCollapsed()) {
    window.console.error("FIXME: this should only be active when the selection is collapsed.");
    return;
  }

  tableCe = this.tableContext.getCurrentTableNode();
  selectedOffset = fragment.getRange().start - tableCe.model.getRange().start;
  cells = tableCe.getColumnForOffset(selectedOffset);

  txs = [];
  for (i = cells.length - 1; i >= 0; i--) {
    cell = cells[i];
    txs.push(
      ve.dm.Transaction.newFromRemoval( fragment.document, cell.getOuterRange() )
    );
  }
  fragment.change(txs);
};

ve.ui.TableInspector.prototype.insertRow = function ( fragment, tableCe, offset ) {
  var numberOfCols, data, i;

  numberOfCols = tableCe.getNumberOfColumns();
  data = [];
  data.push({ type: 'tableRow'});
  for (i = 0; i < numberOfCols; i++) {
    data.push({type: 'tableCell', 'attributes': { 'style': 'data' } });
    data.push({type: 'paragraph'});
    data.push('');
    data.push({type: '/paragraph'});
    data.push({type: '/tableCell'});
  }
  data.push({ type: '/tableRow'});
  fragment.change( ve.dm.Transaction.newFromInsertion( fragment.document, offset, data ) );
};

ve.ui.TableInspector.prototype.onInsertRowBefore = function () {
  var tableCe, selectedOffset, selectedRow, offset,
      surface, selection, fragment;

  surface = this.fragment.getSurface();
  selection = surface.getSelection();
  fragment = surface.getFragment(selection);

  if (!selection.isCollapsed()) {
    window.console.error("FIXME: this should only be active when the selection is collapsed.");
    return;
  }

  tableCe = this.tableContext.getCurrentTableNode();
  // using the left boundary of the selection to determine the previous row index
  selectedOffset = fragment.getRange().start - tableCe.model.getRange().start;
  selectedRow = tableCe.getRowForOffset(selectedOffset);
  offset = selectedRow.getOuterRange().start;
  this.insertRow(fragment, tableCe, offset);
};

ve.ui.TableInspector.prototype.onInsertRowAfter = function () {
  var tableCe, selectedOffset, selectedRow, offset,
      surface, fragment, selection;

  surface = this.fragment.getSurface();
  selection = surface.getSelection();
  fragment = surface.getFragment(selection);

  if (!selection.isCollapsed()) {
    window.console.error("FIXME: this should only be active when the selection is collapsed.");
    return;
  }

  tableCe = this.tableContext.getCurrentTableNode();
  // using the right boundary of the selection to determine the next row index
  selectedOffset = fragment.getRange().start - tableCe.model.getRange().start;
  selectedOffset = fragment.getRange().end - tableCe.model.getRange().start;
  selectedRow = tableCe.getRowForOffset(selectedOffset);
  offset = selectedRow.getOuterRange().end;

  this.insertRow(fragment, tableCe, offset);
};

ve.ui.TableInspector.prototype.onDeleteRow = function () {
  var tableCe, row, range, offset,
      surface, fragment, selection;

  surface = this.fragment.getSurface();
  selection = surface.getSelection();
  fragment = surface.getFragment(selection);

  if (!selection.isCollapsed()) {
    window.console.error("FIXME: this should only be active when the selection is collapsed.");
    return;
  }

  tableCe = this.tableContext.getCurrentTableNode();
  offset = fragment.getRange().start - tableCe.model.getRange().start;
  row = tableCe.getRowForOffset(offset);

  range = row.getOuterRange();
  fragment.change( ve.dm.Transaction.newFromRemoval( fragment.document, range ) );
};

ve.ui.TableInspector.prototype.deleteTable = function() {
  var tableCe, fragment;
  tableCe = this.tableContext.getCurrentTableNode();

  if (!tableCe) return;

  fragment = this.getFragment();
  fragment.change( ve.dm.Transaction.newFromRemoval( fragment.document, tableCe.model.getOuterRange() ) );
};

ve.ui.TableInspector.prototype.createTable = function() {
  var numberOfCols = 5,
      numberOfRows = 5,
      data;

  data = [];

  function _addRow(style) {
    data.push({ type: 'tableRow'});
    for (var i = 0; i < numberOfCols; i++) {
      data.push({type: 'tableCell', 'attributes': { 'style': style } });
      data.push({type: 'paragraph'});
      if (style === 'header') {
        data.push('Column ' + (i+1) );
      }
      data.push({type: '/paragraph'});
      data.push({type: '/tableCell'});
    }
    data.push({ type: '/tableRow'});
  }

  data.push({type: 'table'})
  data.push({type: 'tableSection', 'attributes': {'style': 'header'} });
  _addRow('header');
  data.push({type: '/tableSection'});
  data.push({type: 'tableSection', 'attributes': {'style': 'body'} });
  for (var i = 0; i < numberOfRows; i++) {
    _addRow('data');
  }
  data.push({type: '/tableSection'});
  data.push({type: '/table'})

  this.fragment.insertContent(data, false ).collapseRangeToStart().select();
}

/* Registration */

ve.ui.windowFactory.register( ve.ui.TableInspector );
