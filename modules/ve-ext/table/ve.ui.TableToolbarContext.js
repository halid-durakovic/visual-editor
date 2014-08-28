ve.ui.TableToolbarContext = function VeUiTableToolbarContext(surface, config) {
  // Parent constructor
  ve.ui.TableContext.call( this, surface, config );

  // DOM elements
  // ------------

  var $toolbar = config.$toolbar;
  this.tableToolbar = new ve.ui.TableToolbar(this, config);
  $toolbar.append(this.tableToolbar.$element.css({ visibility: 'hidden' }));

};

OO.inheritClass( ve.ui.TableToolbarContext, ve.ui.TableContext );

ve.ui.TableToolbarContext.prototype.update = function() {
  ve.ui.TableContext.prototype.update.call(this);

  if (this.focussedTable) {
    this.show();
  } else {
    this.hide();
  }
};

ve.ui.TableToolbarContext.prototype.show = function() {
  this.tableToolbar.$element.css({ visibility: '' })
}

ve.ui.TableToolbarContext.prototype.hide = function() {
  ve.ui.TableContext.prototype.hide.call(this);
  this.tableToolbar.$element.css({ visibility: 'hidden' })
};
