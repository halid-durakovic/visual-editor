
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
  return $(domElement).hasClass('citation');
};

ve.dm.CitationNode.static.isContent = true;

ve.dm.CitationNode.static.toDataElement = function ( domElements, converter ) {
  return {
    type: 'citation',
    attributes: {
      label: $(domElements[0]).text()
    }
  };
};

ve.dm.CitationNode.static.toDomElements = function ( dataElement, doc ) {
  var $el = $('<span>')
    .addClass('citation')
    .text( dataElement.getAttribute('label') );
  return $el;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.CitationNode );
