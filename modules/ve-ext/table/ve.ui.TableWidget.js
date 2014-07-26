/**
 * A widget providing controls to edit a TableNode.
 *
 * @class
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @param {ve.ui.TableContext} [tableContext] a TableContext instance
 */
ve.ui.TableWidget = function VeUiTableWidget( config, tableContext ) {
  // Parent constructor
  OO.ui.Widget.call( this, config );

  this.tableContext = tableContext;

  this.$element.addClass( 've-ui-tableInspector' );

  this.$header = $('<div>').addClass('header');
  this.$body = $('<div>').addClass('body');

  var back = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'previous'
  });
  var icon = $('<div>').addClass('oo-ui-window-icon oo-ui-icon-table');
  var label = $('<div>Table</div>').addClass('oo-ui-window-title');
  var remove = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'remove'
  });

  this.$header.append([
    back.$element, icon, label, remove.$element
  ]);

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

  back.connect( this, {'click': 'onClose'});
  remove.connect( this, {'click': 'onRemove'});

  insertColumnBefore.connect( this, {'click': 'onInsertColumnBefore'} );
  insertColumnAfter.connect( this, {'click': 'onInsertColumnAfter'} );
  deleteColumn.connect( this, {'click': 'onDeleteColumn'} );

  insertRowBefore.connect( this, {'click': 'onInsertRowBefore'} );
  insertRowAfter.connect( this, {'click': 'onInsertRowAfter'} );
  deleteRow.connect( this, {'click': 'onDeleteRow'} );

  this.$element.append( [ this.$header, this.$body ]);
};

/* Inheritance */

OO.inheritClass( ve.ui.TableWidget, OO.ui.Widget );

/* Methods */

ve.ui.TableWidget.prototype.onInsertColumnBefore = function () {
  this.tableContext.insertColumn('before');
};

ve.ui.TableWidget.prototype.onInsertColumnAfter = function () {
  this.tableContext.insertColumn('after');
};

ve.ui.TableWidget.prototype.onDeleteColumn = function () {
  this.tableContext.deleteColumn();
};

ve.ui.TableWidget.prototype.onInsertRowBefore = function () {
  this.tableContext.insertRow('before');
};

ve.ui.TableWidget.prototype.onInsertRowAfter = function () {
  this.tableContext.insertRow('after');
};

ve.ui.TableWidget.prototype.onDeleteRow = function () {
  this.tableContext.deleteRow();
};

ve.ui.TableWidget.prototype.onRemove = function() {
  this.tableContext.deleteTable();
};

ve.ui.TableWidget.prototype.onClose = function() {
  this.tableContext.closeInspector();
};
