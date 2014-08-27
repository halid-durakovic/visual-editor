ve.ui.TableInspectorContext = function VeUiTableInspectorContext(surface, config) {
  // Parent constructor
  ve.ui.TableContext.call( this, surface, config );

  // DOM elements
  // ------------

  // a div containing the context tool
  this.$menu = this.$( '<div>' )
    .addClass( 've-ui-tableContext-menu' );

  // A widget containing controls for editing a table node.
  // Note:This corresponds to the concept of an Inspector.
  // However, as the Inspector mechanism turned out to be more in the way than helpful
  // in this case, we decided to use a stream-lined custom widget instead.
  this.inspector = new ve.ui.TableWidget({
    '$': this.$,
    '$contextOverlay': this.$element
  }, this);

  // A popup that contains both, the tool menu and the inspector widget
  // where only one will be visible at a moment in time.
  this.popup = new OO.ui.PopupWidget( {
    '$': this.$,
    '$container': this.surface.$element,
    'tail': false
  } );
  this.popup.$body.append(
    this.inspector.$element
  );

  this.$element.append( [ this.popup.$element ]);
};

OO.inheritClass( ve.ui.TableInspectorContext, ve.ui.TableContext );

ve.ui.TableInspectorContext.prototype.reposition = function() {
  ve.ui.TableContext.prototype.reposition.call(this);

  var width = this.focussedTable.$element.width();
  this.popup.$element.css({
    'position': 'absolute',
    'left': width + 10
  });
};

ve.ui.TableInspectorContext.prototype.update = function() {
  this.$menu.hide();
  this.inspector.$element.show();
  this.$element.addClass('show-controls');
  // compute the current position
  this.reposition();
  // show the popup
  this.popup.toggle(true);
  this.$element.css( 'visibility', '' );
};

ve.ui.TableInspectorContext.prototype.closeInspector = function() {
  this.update();
};
