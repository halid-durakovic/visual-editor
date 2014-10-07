
ve.ce.CitationNode = function VeCeCitationNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  // DOM changes
  this.$element
    .addClass( 'citation ve-ce-citationNode' )
    // Add em space for selection highlighting
    .text( model.getAttribute('label') );

  // Mixin constructors
  ve.ce.FocusableNode.call( this, this.$element, config );

  this.model.connect( this, { 'update': 'onUpdate' } );

};

/* Inheritance */

OO.inheritClass( ve.ce.CitationNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.CitationNode, ve.ce.FocusableNode );

ve.ce.CitationNode.static.name = 'citation';

ve.ce.CitationNode.static.primaryCommandName = 'citation';

/**
 * @inheritdoc
 */
ve.ce.CitationNode.prototype.createHighlight = function () {
  // Mixin method
  return ve.ce.FocusableNode.prototype.createHighlight.call( this )
    .addClass( 've-ce-citation-highlight' )
    .attr( 'title', ve.msg( 'visualeditor-citationnode-tooltip' ) );
};

ve.ce.CitationNode.prototype.onUpdate = function () {
  var label = this.model.getAttribute('label');
  this.$element.text(label);
};


/* Registration */

ve.ce.nodeFactory.register( ve.ce.CitationNode );
