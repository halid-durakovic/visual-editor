
ve.dm.CitationNode = function VeDmCitationNode() {
  // Parent constructor
  ve.dm.LeafNode.apply( this, arguments );

  // Mixin constructors
  ve.dm.FocusableNode.call( this );
};

OO.inheritClass( ve.dm.CitationNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.CitationNode, ve.dm.FocusableNode );


/* Static Properties */

ve.dm.CitationNode.static.name = 'citation';

ve.dm.CitationNode.static.matchTagNames = [ 'span' ];

ve.dm.CitationNode.static.matchFunction = function ( domElement ) {
  return domElement.dataset.type === 'citation';
};

ve.dm.CitationNode.static.isContent = true;

ve.dm.CitationNode.static.toDataElement = function ( domElements ) {
  return {
    type: 'citation',
    attributes: {
      referenceId: domElements[0].dataset.refId
    }
  };
};

ve.dm.CitationNode.static.toDomElements = function ( dataElement ) {
  var $el = $('<span>')
    .attr('data-type', 'citation')
    .attr('data-ref-id', dataElement.getAttribute('referenceId'));
  return $el;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.CitationNode );
