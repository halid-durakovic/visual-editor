
ve.dm.BibliographyNode = function VeDmBibliographyNode() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );

  this.referenceIndex = {};

  this.getAttribute('entries').forEach(function(ref) {
    this.referenceIndex[ref.getAttribute('referenceId')] = ref;
  }, this);

  this.referenceCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());
  this.compileReferences();

  this.connect(this, { 'attach': 'onAttach', 'detach': 'onDetach' });
};

/* Inheritance */

OO.inheritClass( ve.dm.BibliographyNode, ve.dm.BranchNode );

/* Static Properties */

ve.dm.BibliographyNode.static.name = 'bibliography';

ve.dm.BibliographyNode.static.matchTagNames = [ 'div' ];

ve.dm.BibliographyNode.static.matchFunction = function ( domElement ) {
  return domElement.dataset.type === 'bibliography';
};

ve.dm.BibliographyNode.static.childNodeTypes = [ 'reference' ];

ve.dm.BibliographyNode.static.handlesOwnChildren = true;

ve.dm.BibliographyNode.static.toDataElement = function ( domElements, converter ) {
  var el = domElements[0],
    titleEl = el.querySelector('div[data-type=title]'),
    title = titleEl ? titleEl.textContent : undefined,
    entryEls = el.querySelectorAll('div[data-type=reference]'),
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

ve.dm.BibliographyNode.getBibliography = function(documentModel) {
  var bibliography = null;
  var toplevelNodes = documentModel.selectNodes( documentModel.getDocumentNode().getRange(), 'branches');
  for (var i = 0; i < toplevelNodes.length; i++) {
    var toplevelNode = toplevelNodes[i].node;
    if (toplevelNode.type === 'bibliography') {
      bibliography = toplevelNode;
      break;
    }
  }
  return bibliography;
};

ve.dm.BibliographyNode.prototype.compileReferences = function() {
  this.referenceCompiler.clear();
  var citeprocConverter = new ve.dm.CiteprocConverter();
  this.getAttribute('entries').forEach( function(refModel) {
    var json = citeprocConverter.getJsonFromData(refModel.element);
    json.id = refModel.getAttribute('referenceId');
    this.referenceCompiler.addReference(json);
  }, this);
};

ve.dm.BibliographyNode.prototype.getReferenceForId = function(id) {
  return this.referenceIndex[id];
};

ve.dm.BibliographyNode.prototype.getLabelForReference = function(id) {
  return this.referenceCompiler.getLabel(id);
};

ve.dm.BibliographyNode.prototype.getContentForReference = function(id) {
  return this.referenceCompiler.getContent(id);
};

ve.dm.BibliographyNode.prototype.onAttach = function() {
  console.log("BibliographyNode is now listening for csl-style-change events");
  this.getRoot().getDocument().connect( this, {
    'csl-style-change': 'onChangeCSLStyle'
  });
};

ve.dm.BibliographyNode.prototype.onDetach = function() {
  this.disconnect();
};

ve.dm.BibliographyNode.prototype.onChangeCSLStyle = function(cslXML) {
  var config = new ve.dm.CiteprocDefaultConfig();
  config.style = cslXML;
  this.referenceCompiler = new ve.dm.CiteprocCompiler(config);
  this.compileReferences();
  this.emit('csl-style-changed');
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.BibliographyNode );
