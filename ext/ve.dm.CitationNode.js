
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

ve.dm.CitationNode.static.matchTagNames = [ 'cite' ];

ve.dm.CitationNode.static.matchFunction = function ( domElement ) {
  return (domElement.dataset.type === 'bibliography');
};

// CitationNodes are always inline in the text
ve.dm.CitationNode.static.isContent = true;

ve.dm.CitationNode.static.toDataElement = function ( domElements ) {
  var references = [];
  var $citeEl = $(domElements[0]);
  var $labels = $citeEl.find('label');
  for (var i = 0; i < $labels.length; i++) {
    references.push($($labels[i]).attr('for'));
  }
  return {
    type: 'citation',
    attributes: {
      references: references
    }
  };
};

ve.dm.CitationNode.static.toDomElements = function ( dataElement ) {
  var $el = $('<cite>');
  var references = dataElement.attributes.references || [];
  for (var i = 0; i < references.length; i++) {
    $el.append($('<label>').attr('for', references[i]));
  }
  return $el;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.CitationNode );
