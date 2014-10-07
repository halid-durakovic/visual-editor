
ve.ce.ReferenceNode = function VeCeReferenceNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  // DOM changes
  this.$element
    .addClass( 've-ce-referenceNode' )
    // Add em space for selection highlighting
    .text( model.getAttribute('content') );

  // Mixin constructors
  ve.ce.FocusableNode.call( this, this.$element, config );

  this.model.connect( this, { 'update': 'onUpdate' } );
};

/* Inheritance */

OO.inheritClass( ve.ce.ReferenceNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.ReferenceNode, ve.ce.FocusableNode );

ve.ce.ReferenceNode.static.name = 'reference';

/**
 * @inheritdoc
 */
ve.ce.ReferenceNode.prototype.createHighlight = function () {
  // Mixin method
  return ve.ce.FocusableNode.prototype.createHighlight.call( this )
    .addClass( 've-ce-reference-highlight' )
    .attr( 'title', ve.msg( 'visualeditor-reference-tooltip' ) );
};

ve.ce.ReferenceNode.prototype.onUpdate = function () {
  // TODO: react on updates
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.ReferenceNode );
