ve.ui.TableControls = function VeUiTableControls( surface, config ) {
  // Parent constructor
  OO.ui.Element.call( this, config );

  this.surface = surface;

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

  // this.removeButton.connect( this, {'click': 'onRemove'});

  // this.insertColumnBefore.connect( this, {'click': 'onInsertColumnBefore'} );
  // this.insertColumnAfter.connect( this, {'click': 'onInsertColumnAfter'} );
  // this.deleteColumn.connect( this, {'click': 'onDeleteColumn'} );

  // this.insertRowBefore.connect( this, {'click': 'onInsertRowBefore'} );
  // this.insertRowAfter.connect( this, {'click': 'onInsertRowAfter'} );
  // this.deleteRow.connect( this, {'click': 'onDeleteRow'} );
};

OO.inheritClass( ve.ui.TableControls, OO.ui.Element );

/* Methods */

ve.ui.TableControls.prototype.onInsertColumnBefore = function () {
  // this.surface.execute('table', 'insert',  'col', 'before');
};

ve.ui.TableControls.prototype.onInsertColumnAfter = function () {
  // this.surface.execute('table', 'insert',  'col', 'after');
};

ve.ui.TableControls.prototype.onDeleteColumn = function () {
  // this.surface.execute('table', 'delete', 'col');
};

ve.ui.TableControls.prototype.onInsertRowBefore = function () {
  // this.surface.execute('table', 'insert', 'row', 'before');
};

ve.ui.TableControls.prototype.onInsertRowAfter = function () {
  // this.surface.execute('table', 'insert', 'row', 'after');
};

ve.ui.TableControls.prototype.onDeleteRow = function () {
  // this.surface.execute('table', 'delete', 'row');
};

ve.ui.TableControls.prototype.onRemove = function() {
  // this.surface.execute('table', 'delete', 'table');
};
