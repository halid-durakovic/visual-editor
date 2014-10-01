
ve.ce.BibliographyItemNode = function VeCeBibliographyItemNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  // DOM changes
  this.$element
    .addClass( 've-ce-bibItemNode' )
    // Add em space for selection highlighting
    .text( model.getAttribute('content') );

  // Mixin constructors
  ve.ce.FocusableNode.call( this, this.$element, config );
};

/* Inheritance */

OO.inheritClass( ve.ce.BibliographyItemNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.BibliographyItemNode, ve.ce.FocusableNode );

ve.ce.BibliographyItemNode.static.name = 'bibItem';

/**
 * @inheritdoc
 */
ve.ce.BibliographyItemNode.prototype.createHighlight = function () {
  // Mixin method
  return ve.ce.FocusableNode.prototype.createHighlight.call( this )
    .addClass( 've-ce-bibItem-highlight' )
    .attr( 'title', ve.msg( 'visualeditor-bibitemnode-tooltip' ) );
};


/* Registration */

ve.ce.nodeFactory.register( ve.ce.BibliographyItemNode );
