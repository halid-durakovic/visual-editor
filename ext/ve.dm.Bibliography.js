
ve.dm.Bibliography = function VeDmBibliography() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );

  this._data = {};
  this._data.isCompiled = false;
  this._data.referenceIndex = {};
  this._data.referenceCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig({ style: ve.dm.CiteprocDefaultConfig.defaultStyle }));

  this.connect(this, { 'attach': 'onAttach', 'detach': 'onDetach' });
};

/* Inheritance */

OO.inheritClass( ve.dm.Bibliography, ve.dm.BranchNode );

/* Static Properties */

ve.dm.Bibliography.static.name = 'bibliography';

ve.dm.Bibliography.static.matchTagNames = [ 'div' ];

ve.dm.Bibliography.static.matchFunction = function ( domElement ) {
  return domElement.dataset.type === 'internalBibliography';
};

// ve.dm.Bibliography.static.childNodeTypes = [ 'reference' ];

// ve.dm.Bibliography.static.parentNodeTypes = [ 'document' ];

ve.dm.Bibliography.static.defaultAttributes = {
  "title": "References"
};

ve.dm.Bibliography.static.isWrapped = true;

ve.dm.Bibliography.static.toDataElement = function ( domElements ) {
  var el = domElements[0],
    titleEl = el.querySelector('div[data-type=title]'),
    title = titleEl ? titleEl.textContent : undefined;
  return {
    type: 'bibliography',
    attributes: {
      title: title
    }
  };
};

ve.dm.Bibliography.static.toDomElements = function ( dataElement, doc ) {
  var el = doc.createElement('div'),
    title, titleEl;
  title = dataElement.attributes.title;
  if (title) {
    titleEl = doc.createElement('div');
    titleEl.classList.add('title');
    titleEl.innerHTML = title;
    el.appendChild(titleEl);
  }
  el.classList.add('bibliography');
  return [ el ];
};

ve.dm.Bibliography.getBibliography = function(doc) {
  var bibliography = null, store, index, i;

  // Look in the document store first
  store = doc.getStore();
  index = store.indexOfHash('bibliography');
  if (index !== null) {
    bibliography = store.value(index);
  }

  // Then try to find it in the internal list
  if (!bibliography) {
    // The bibliography can be found at the following path: ['document', 'internalList', 'internalItem', 'bibliography']
    var toplevelNodes = doc.getDocumentNode().getChildren();
    var internalList;
    for (i = toplevelNodes.length - 1; i >= 0; i--) {
      var toplevelNode = toplevelNodes[i];
      if (toplevelNode.type === 'internalList') {
        internalList = toplevelNode;
        break;
      }
    }
    var internalItems = internalList.getChildren();
    for (i = 0; i < internalItems.length; i++) {
      var internalItem = internalItems[i];
      if (internalItem.length === 1 && internalItem.children[0].type === 'internalList') {
        bibliography = internalItem.children[0].type;
        break;
      }
    }

    // create if there is no bibliography ()
    if (!bibliography) {
      var tx = ve.dm.Transaction.newFromInsertion( doc, internalList.getRange().end , [
        { type: "internalItem" },
          { type: "bibliography" },
          { type: "/bibliography" },
        { type: "/internalItem" },
      ]);
      doc.commit(tx);
      tx = ve.dm.Transaction.newFromInsertion( doc, doc.getDocumentNode().getRange().end , [
        { type: "bibliographyWrapper" },
        { type: "/bibliographyWrapper" },
      ]);
      doc.commit(tx);
      return ve.dm.Bibliography.getBibliography(doc);
    }
  }

  if (!bibliography._data.isCompiled) {
    bibliography.compile();
  }

  return bibliography;
};

ve.dm.Bibliography.prototype.onAttach = function() {
  window.console.log("Bibliography is now listening for csl-style-change events");
  var doc = this.getDocument();
  doc.connect( this, {
    'csl-style-change': 'onChangeCSLStyle'
  });
  // register this bibliography in the document's store (document-wide singleton)
  doc.getStore().index(this, "bibliography");
};

ve.dm.Bibliography.prototype.onDetach = function(documentNode) {
  documentNode.getDocument().getStore().index(null, "bibliography");
  this.disconnect();
};

ve.dm.Bibliography.prototype.onChangeCSLStyle = function(cslXML) {
  this._data.referenceCompiler.setStyle(cslXML);
  // recompile to regenerate labels and bibliography
  this.compile();
  this.emit('csl-style-changed');
};

ve.dm.Bibliography.prototype.getCompiler = function() {
  return this._data.referenceCompiler;
};

ve.dm.Bibliography.prototype.compile = function() {
  var documentModel = this.getDocument();
  // TODO: it would be necessary to retrieve a configuration here
  this.getCompiler().clear();
  this.registerReferences();
  var leafNodes = documentModel.selectNodes( documentModel.getDocumentNode().getRange(), 'leaves');
  for (var i = 0; i < leafNodes.length; i++) {
    if (leafNodes[i].node.type === 'citation') {
      var citationNode = leafNodes[i].node;
      this.addCitation(citationNode, 'silent');
    }
  }
  // Note: this needs to be invalidated whenever a citation is changed
  this._data.isCompiled = true;
  this.emit('citation-changed');
};

ve.dm.Bibliography.prototype.addCitation = function(citationNode, silent) {
  var references = citationNode.getAttribute('references');
  var citation = this.getCompiler().addCitation(references);
  // HACK storing information into the node directly
  citationNode.element.attributes.id = citation.id;
  citationNode.element.attributes.label = citation.label;
  if (!silent) this.emit('citation-changed');
};

ve.dm.Bibliography.prototype.updateCitation = function(citationNode) {
  var result = this.getCompiler().updateCitation(citationNode.getAttribute('id'), citationNode.getAttribute('references'));
  citationNode.element.attributes.label = result.label;
  this.emit('citation-changed');
};

ve.dm.Bibliography.prototype.registerReferences = function() {
  var referenceCompiler = this.getCompiler();
  referenceCompiler.clear();
  this.getChildren().forEach( function(refModel) {
    var refData = refModel.element.attributes;
    var refId = referenceCompiler.addReference(refData);
    this._data.referenceIndex[refId] = refModel;
  }, this);
};

ve.dm.Bibliography.prototype.getReferenceForId = function(id) {
  return this._data.referenceIndex[id];
};

ve.dm.Bibliography.prototype.makeBibliography = function() {
  if (!this._data.isCompiled) this.compile();
  return this.getCompiler().engine.makeBibliography();
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.Bibliography );
