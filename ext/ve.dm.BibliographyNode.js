
ve.dm.BibliographyNode = function VeDmBibliographyNode() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.BibliographyNode, ve.dm.BranchNode );

/* Static Properties */

ve.dm.BibliographyNode.static.name = 'bibliography';

ve.dm.BibliographyNode.static.matchTagNames = [ 'div' ];

ve.dm.BibliographyNode.static.matchFunction = function ( domElement ) {
  return domElement.classList.contains('bibliography');
};

ve.dm.BibliographyNode.static.childNodeTypes = [ 'reference' ];

ve.dm.BibliographyNode.static.handlesOwnChildren = true;

ve.dm.BibliographyNode.static.toDataElement = function ( domElements, converter ) {
  var el = domElements[0],
    titleEl = el.querySelector('div.title'),
    title = titleEl ? titleEl.textContent : undefined,
    entryEls = el.querySelectorAll('div.reference'),
    entries = [], i,
    node, modelData;
  for (i = 0; i < entryEls.length; i++) {
    modelData = ve.dm.ReferenceNode.static.toDataElement( [ entryEls[i] ], converter );
    node = ve.dm.nodeFactory.create(modelData.type, modelData);
    node.setDocument( converter.doc );
    entries.push( node );
  }
  return {
    type: this.name,
    attributes: {
      title: title,
      entries: entries
    }
  };
};

ve.dm.BibliographyNode.static.toDomElements = function ( dataElement, doc ) {
  var el = doc.createElement('div'),
    title, titleEl, i,
    entries, entriesEl, entryEl;

  title = dataElement.attributes.title;
  entries = dataElement.attributes.entries;

  if (title) {
    titleEl = doc.createElement('div');
    titleEl.classList.add('title');
    titleEl.innerHTML = title;
    el.appendChild(titleEl);
  }

  entriesEl = doc.createElement('div');
  entriesEl.classList.add('references');
  for (i = 0; i < entries.length; i++) {
    entryEl = ve.dm.ReferenceNode.static.toDomElements( entries[i].element, doc )[0];
    entriesEl.appendChild(entryEl);
  }
  el.appendChild(entriesEl);

  el.classList.add('bibliography');
  return [ el ];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.BibliographyNode );
