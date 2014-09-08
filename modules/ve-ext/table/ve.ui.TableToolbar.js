ve.ui.TableToolbar = function VeUiTableToolbar( surface, config ) {
  OO.ui.Toolbar.call(this, ve.ui.toolFactory, ve.ui.toolGroupFactory, config);

  this.surface = surface;

  // DOM changes

  this.setup([
    {
      header: 'Table',
      label: 'Table',
    },
    {
      header: 'Rows',
      label: 'Row',
      include: [ 'insertRowBefore', 'insertRowAfter', 'deleteRow' ]
    },
    {
      header: 'Columns',
      label: 'Column',
      include: [ 'insertColumnBefore', 'insertColumnAfter', 'deleteColumn' ]
    },
    {
      include: [ 'deleteTable' ]
    }
  ]);

  this.$element.addClass('ve-ui-tableToolbar');
  this.setVisible(false);

  // Events

  this.surface.getModel().connect( this, { contextChange: 'onContextChange' } );
};

OO.inheritClass( ve.ui.TableToolbar, OO.ui.Toolbar );

ve.ui.TableToolbar.prototype.getSurface = function() {
  return this.surface;
};

/**
 * Handle context changes on the surface.
 *
 * @fires updateState
 */
ve.ui.TableToolbar.prototype.onContextChange = function () {
  this.updateToolState();
};

/**
 * Update the state of the tools
 */
ve.ui.TableToolbar.prototype.updateToolState = function () {
  var surface, selection, tableSelection;
  surface = this.surface.getModel();
  selection = surface.selection;
  tableSelection = ve.dm.TableNode.lookupSelection(surface.documentModel, selection);
  if (tableSelection) {
    this.setVisible(true);
  } else {
    this.setVisible(false);
  }
};

ve.ui.TableToolbar.prototype.setVisible = function ( visible ) {
  if (visible) {
    this.$element.css({ 'visibility': '' });
  } else {
    this.$element.css({ 'visibility': 'hidden' });
  }
};
