
ve.dm.BibliographyNode = function VeDmBibliographyNode() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );

  this.referenceIndex = {};

  this.getAttribute('entries').forEach(function(ref) {
    this.referenceIndex[ref.getAttribute('referenceId')] = ref;
  }, this);

  // TODO: it would be necessary to retrieve a configuration here
  this.referenceCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());

  this.connect(this, { 'attach': 'onAttach', 'detach': 'onDetach' });

  this.registerReferences();

  // Note: citation labels need to be generated depending on the order in the whole document
  this.isCompiled = false;
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
  // Note:
  if (!bibliography.isCompiled) {
    bibliography.compile();
  }
  return bibliography;
};

ve.dm.BibliographyNode.prototype.compile = function() {
  if (this.isCompiled) return;

  var citations = [];
  var documentModel = this.getRoot().getDocument();
  var leafNodes = documentModel.selectNodes( documentModel.getDocumentNode().getRange(), 'leaves');
  for (var i = 0; i < leafNodes.length; i++) {
    if (leafNodes[i].node.type === 'citation') {
      var citationNode = leafNodes[i].node;
      var references = leafNodes[i].node.getAttribute('references');
      var citation = this.referenceCompiler.addCitation(references);
      // HACK storing information into the node
      citationNode.element.attributes.id = citation.id;
      citationNode.element.attributes.label = citation.label;
      citationNode.emit('label-changed');
    }
  }
  // Note: this needs to be invalidated whenever a citation is changed
  this.isCompiled = true;
};

ve.dm.BibliographyNode.prototype.registerReferences = function() {
  this.referenceCompiler.clear();
  this.getAttribute('entries').forEach( function(refModel) {
    var refData = refModel.element.attributes;
    this.referenceCompiler.addReference(refData);
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
  // TODO: use a global configuration and clone from that
  var config = new ve.dm.CiteprocDefaultConfig({ style: cslXML });
  this.referenceCompiler = new ve.dm.CiteprocCompiler(config);
  this.isCompiled = false;
  this.registerReferences();
  this.compile();
  this.emit('csl-style-changed');
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.BibliographyNode );
