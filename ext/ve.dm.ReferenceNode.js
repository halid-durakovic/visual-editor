
ve.dm.ReferenceNode = function VeDmReferenceNode() {
  // Parent constructor
  ve.dm.LeafNode.apply( this, arguments );

  // Mixin constructors
  ve.dm.FocusableNode.call( this );
};


OO.inheritClass( ve.dm.ReferenceNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.ReferenceNode, ve.dm.FocusableNode );

/* Static Properties */

ve.dm.ReferenceNode.static.name = 'reference';

ve.dm.ReferenceNode.static.matchTagNames = [ 'div' ];

ve.dm.ReferenceNode.static.matchFunction = function ( domElement ) {
  var classes = domElement.classList;
  return ( classes.contains('reference') );
};

ve.dm.ReferenceNode.static.isContent = true;

ve.dm.ReferenceNode.static.toDataElement = function ( domElements ) {
  var el = domElements[0];
  var label = el.querySelector('.label');
  var content = el.querySelector('.content');
  return {
    type: 'reference',
    attributes: {
      label: label.textContent,
      content: content.textContent
    }
  };
};

ve.dm.ReferenceNode.static.toDomElements = function ( dataElement, doc ) {
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

ve.dm.modelRegistry.register( ve.dm.ReferenceNode );
