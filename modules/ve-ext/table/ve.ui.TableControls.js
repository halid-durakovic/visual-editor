
ve.ui.TableControls = function VeUiTableControls( tableContext, config ) {
  // Parent constructor
  OO.ui.Element.call( this, config );

  this.tableContext = tableContext;

  this.icon = new OO.ui.IconWidget({
    '$': this.$,
    'icon': 'table'
  });

  this.label = new OO.ui.LabelWidget({
    'label': 'Table'
  });

  this.removeButton = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'remove',
    'label': 'Remove'
  });

  this.insertRowAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-insert-row-after',
    'label': 'Below'
  });
  this.insertRowBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-insert-row-before',
    'label': 'Above'
  });
  this.insertColumnAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-insert-column-after',
    'label': 'Right'
  });
  this.insertColumnBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-insert-column-before',
    'label': 'Left'
  });
  this.deleteRow = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-delete-row',
    'label': 'Delete'
  });
  this.deleteColumn = new OO.ui.ButtonWidget({
    '$': this.$,
    'framed': false,
    'icon': 'table-delete-column',
    'label': 'Delete'
  });

  this.removeButton.connect( this, {'click': 'onRemove'});

  this.insertColumnBefore.connect( this, {'click': 'onInsertColumnBefore'} );
  this.insertColumnAfter.connect( this, {'click': 'onInsertColumnAfter'} );
  this.deleteColumn.connect( this, {'click': 'onDeleteColumn'} );

  this.insertRowBefore.connect( this, {'click': 'onInsertRowBefore'} );
  this.insertRowAfter.connect( this, {'click': 'onInsertRowAfter'} );
  this.deleteRow.connect( this, {'click': 'onDeleteRow'} );
};

OO.inheritClass( ve.ui.TableControls, OO.ui.Element );

/* Methods */

ve.ui.TableControls.prototype.onInsertColumnBefore = function () {
  this.tableContext.insertColumn('before');
};

ve.ui.TableControls.prototype.onInsertColumnAfter = function () {
  this.tableContext.insertColumn('after');
};

ve.ui.TableControls.prototype.onDeleteColumn = function () {
  this.tableContext.deleteColumn();
};

ve.ui.TableControls.prototype.onInsertRowBefore = function () {
  this.tableContext.insertRow('before');
};

ve.ui.TableControls.prototype.onInsertRowAfter = function () {
  this.tableContext.insertRow('after');
};

ve.ui.TableControls.prototype.onDeleteRow = function () {
  this.tableContext.deleteRow();
};

ve.ui.TableControls.prototype.onRemove = function() {
  this.tableContext.deleteTable();
};

ve.ui.TableControls.prototype.onClose = function() {
  this.tableContext.closeInspector();
};
