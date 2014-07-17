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

  this.focussedNode = null;

  this.$menu = this.$( '<div>' );
  this.popup = new OO.ui.PopupWidget( {
    '$': this.$,
    '$container': this.surface.$element
  } );
  this.$element.css({
    'position': 'absolute'
  });

  this.inspector = new ve.ui.TableInspector({
    '$': this.$,
    '$contextOverlay': this.context.$element
  });
  this.showInspector = false;
  this.inspector.connect( this, {
    'setup': 'onInspectorSetup',
    'teardown': 'onInspectorTeardown'
  } );

  surface.connect(this, {'destroy': 'destroy'} );

  var surfaceModel = this.surface.getModel();
  surfaceModel.connect(this, { 'table-focus-changed': 'onTableFocusChange' });

  this.$element.addClass('ve-ui-tableContext')
    .append( this.popup.$element )
    .css( 'visibility', 'hidden' );
  this.$menu.append( this.context.$element );
  this.popup.$body.append(
    this.$menu.addClass( 've-ui-tableContext-menu' ),
    this.inspector.$element
      .addClass( 've-ui-tableInspector' )
      .hide()
  );
  // don't use the tail
  this.popup.useTail( false );
};

OO.inheritClass( ve.ui.TableContext, ve.ui.Context );

ve.ui.TableContext.prototype.afterModelChange = function() {};

/**
 * This gets called whenever the selection changes and lies within a table node (focus)
 * or if the selection leaves a table node (blur).
 */
ve.ui.TableContext.prototype.onTableFocusChange = function(veCeTableNode) {
  if (this.focussedNode === veCeTableNode) {
    if (!veCeTableNode.isFocussed()) {
      this.hide();
      this.focussedNode = null;
    }
  } else {
    if (veCeTableNode.isFocussed()) {
      this.focussedNode = veCeTableNode;
      this.show();
    }
  }
};

ve.ui.TableContext.prototype.show = function() {
  // console.log("ve.ui.TableContext.show()");
  this.$element.css({ 'visibility': 'hidden' });

  this.update();

  if ( this.showInspector ) {
    this.$menu.hide();
  } else {
    this.$menu.show();
  }

  var self = this;
  function updateDimensions() {
    var surfaceOffset = self.surface.$element.offset();
    var offset = self.focussedNode.$element.offset();
    var width = self.focussedNode.$element.width();
    var height = self.focussedNode.$element.height();
    var position = {
      'top': offset.top - surfaceOffset.top,
      'left': offset.left + width + 10 - surfaceOffset.left
    };
    self.$element.css(position);
    self.$element.css( 'visibility', '' );
    self.popup.$element.css( 'visibility', '' );
    self.popup.show();
  }
  window.setTimeout(updateDimensions, 0);
  window.setTimeout(function() {
    if (self.showInspector) {
      self.inspector.fitHeightToContents();
      self.inspector.fitWidthToContents();
    }
  }, 200);
};

ve.ui.TableContext.prototype.update = function() {
  this.context.clearItems();
  if (!this.showInspector) {
    var tool = ve.ui.TableInspectorTool;
    var model = this.focussedNode.getModel();
    var item =  new ve.ui.ContextItemWidget('table', tool, model, { '$': this.$ });
    this.context.addItems([ item ]);
  }
};

ve.ui.TableContext.prototype.hide = function() {
  if (this.showInspector) {
    this.showInspector = false;
    this.inspector.close();
  }
  this.popup.hide();
  this.popup.$element.show().css( 'visibility', 'hidden' );
  this.$element.css( 'visibility', 'hidden' );
};

ve.ui.TableContext.prototype.onContextItemChoose = function ( item ) {
  if ( item ) {
    var fragment = this.surface.getModel().getFragment( null, true );
    // TODO: get the correct configuration for opening the inspector
    this.inspector.open(fragment, {dir: 'ltr'});
    this.showInspector = true;
    this.show();
  }
};

ve.ui.TableContext.prototype.onInspectorSetup = function () {
  // console.log('ve.ui.TableContext.prototype.onInspectorSetup');
};

ve.ui.TableContext.prototype.onInspectorTeardown = function () {
  // console.log('ve.ui.TableContext.prototype.onInspectorTeardown');
  this.showInspector = false;
  var self = this;
  window.setTimeout(function() {
    if (self.focussedNode) {
      self.show();
    }
  }, 0);
};

/**
 * We monkey-patch the surface setup here.
 * TODO: we need support in from the core for that. E.g., this doesn't work for multiple surfaces or
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
