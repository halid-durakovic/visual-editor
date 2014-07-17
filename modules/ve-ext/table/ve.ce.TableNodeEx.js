/**
 * ContentEditable table node.
 *
 * @class
 * @extends ve.ce.TableNode
 * @constructor
 * @param {ve.dm.TableNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableNodeEx = function VeCeTableNodeEx( model, config ) {
  // Parent constructor
  ve.ce.TableNode.call( this, model, config );

  this.connect( this, {
    'setup': 'onTableNodeSetup',
    'teardown': 'onTableNodeTeardown',
  } );

  this.focussed = false;
};

/* Inheritance */

OO.inheritClass( ve.ce.TableNodeEx, ve.ce.TableNode );

/* Prototype */

ve.ce.TableNodeEx.prototype.onTableNodeSetup = function() {
  // Exit if already setup or not attached
  if ( this.isSetup || !this.root ) {
    return;
  }

  var surface = this.getRoot().getSurface();
  this.surfaceModel = surface.getModel();

  // DOM changes
  this.$element
    .addClass( 've-ce-tableNodeEx' );

  // Events

  this.surfaceModel.connect( this,
    { 'select': 'onSurfaceModelSelect' }
  );

};

ve.ce.TableNodeEx.prototype.onTableNodeTeardown = function() {
  this.surfaceModel.disconnect( this );
};

ve.ce.TableNodeEx.prototype.onSurfaceModelSelect = function(selection) {
  // console.log('TableNodeEx.onSurfaceModelSelect...', selection, this.model.getRange());
  var range = this.model.getRange();
  if (range.containsOffset(selection.from) && range.containsOffset(selection.to)) {
    if (!this.focussed) {
      this.$element.addClass('focussed');
      this.focussed = true;
      this.surfaceModel.emit( 'table-focus-changed', this);
    }
  } else {
    if (this.focussed) {
      this.$element.removeClass('focussed');
      this.focussed = false;
      this.surfaceModel.emit( 'table-focus-changed', this);
    }
  }
};

ve.ce.TableNodeEx.prototype.isFocussed = function() {
  return this.focussed;
};

/* Static Properties */

ve.ce.TableNodeEx.static.name = 'table';

ve.ce.TableNodeEx.static.tagName = 'table';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNodeEx );
