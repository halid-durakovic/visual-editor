

ve.ce.BibliographyNode = function VeCeBibliographyNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  var els = ve.dm.BibliographyNode.static.toDomElements( model.element, window.document );
  this.$element = $(els[0]);

  this.$element.attr('contentEditable', 'false');
};

/* Inheritance */

OO.inheritClass( ve.ce.BibliographyNode, ve.ce.LeafNode );

/* Static Properties */

ve.ce.BibliographyNode.static.name = 'bibliography';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.BibliographyNode );