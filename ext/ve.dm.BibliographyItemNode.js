
ve.dm.BibliographyItemNode = function VeDmBibliographyItemNode() {
  // Parent constructor
  ve.dm.LeafNode.apply( this, arguments );

  // Mixin constructors
  ve.dm.FocusableNode.call( this );
};


OO.inheritClass( ve.dm.BibliographyItemNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.BibliographyItemNode, ve.dm.FocusableNode );

/* Static Properties */

ve.dm.BibliographyItemNode.static.name = 'bibItem';

ve.dm.BibliographyItemNode.static.matchTagNames = [ 'div' ];

ve.dm.BibliographyItemNode.static.matchFunction = function ( domElement ) {
  var classes = domElement.classList;
  return ( classes.contains('reference') );
};

ve.dm.BibliographyItemNode.static.isContent = true;

ve.dm.BibliographyItemNode.static.toDataElement = function ( domElements ) {
  var el = domElements[0];
  var label = el.querySelector('.label');
  var content = el.querySelector('.content');
  return {
    type: 'bibItem',
    attributes: {
      label: label.textContent,
      content: content.textContent
    }
  };
};

ve.dm.BibliographyItemNode.static.toDomElements = function ( dataElement, doc ) {
  var el, labelEl, contentEl;

  el = doc.createElement('div');
  el.classList.add('reference');

  labelEl = doc.createElement('div');
  labelEl.classList.add('label');
  labelEl.textContent = dataElement.attributes.label;
  el.appendChild(labelEl);

  contentEl = doc.createElement('div');
  contentEl.classList.add('content');
  contentEl.innerHTML = dataElement.attributes.content;
  el.appendChild(contentEl);

  return [ el ];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.BibliographyItemNode );
