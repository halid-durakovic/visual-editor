
ve.dm.Bibliography = function VeDmBibliography() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );

  // a map to retrieve ve.dm.ReferenceNode instances by reference id.
  this.referenceIndex = {};
  this.referenceCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig({ style: ve.dm.CiteprocDefaultConfig.defaultStyle }));

  this.connect(this, {
    'attach': 'onAttach',
    'detach': 'onDetach'
  } );

  // debounce the compile step as it may be triggered repeatedly when changeing multiple citations at once
  this.compile = ve.debounce( function() { this._compile(); }.bind(this), 10);
};

/* Inheritance */

OO.inheritClass( ve.dm.Bibliography, ve.dm.BranchNode );

/* Static Properties */

ve.dm.Bibliography.static.name = 'bibliography';

ve.dm.Bibliography.static.matchTagNames = [ 'div' ];

ve.dm.Bibliography.static.matchFunction = function ( domElement ) {
  return domElement.dataset.type === 'bibliography';
};

ve.dm.Bibliography.static.childNodeTypes = [ 'reference' ];

ve.dm.Bibliography.static.parentNodeTypes = [ 'document' ];

ve.dm.Bibliography.static.toDataElement = function () {
  return { type: this.name };
};

ve.dm.Bibliography.static.toDomElements = function ( dataElement, doc ) {
  var el = doc.createElement('div');
  el.classList.add('bibliography');
  return [ el ];
};

ve.dm.Bibliography.getBibliography = function(doc) {
  var bibliography = null, store, index, i;

  // Look in the document store first
  // store = doc.getStore();
  // index = store.indexOfHash('bibliography');
  // if (index !== null) {
  //   bibliography = store.value(index);
  // }

  if (!bibliography) {
    // The bibliography can be found at the following path: ['document', 'bibliography']
    var toplevelNodes = doc.getDocumentNode().getChildren();
    var toplevelNode;
    for (i = toplevelNodes.length - 1; i >= 0; i--) {
      toplevelNode = toplevelNodes[i];
      if (toplevelNode.type === 'bibliography') {
        bibliography = toplevelNode;
        break;
      }
    }
    // create an empty bibliography if there is none
    // and insert it right before the internalList node
    if (!bibliography) {
      var internalList;
      for (i = toplevelNodes.length - 1; i >= 0; i--) {
        toplevelNode = toplevelNodes[i];
        if (toplevelNode.type === 'internalList') {
          internalList = toplevelNode;
          break;
        }
      }
      var tx = ve.dm.Transaction.newFromInsertion( doc, internalList.getOuterRange().start , [
        { type: "bibliography" },
        { type: "/bibliography" },
      ]);
      doc.commit(tx);
      return ve.dm.Bibliography.getBibliography(doc);
    }
  }

  return bibliography;
};

/**
 * Connects to style change events and registers this bibliography with the document store.
 */
ve.dm.Bibliography.prototype.onAttach = function() {
  var doc = this.getDocument();
  doc.connect( this, {
    'csl-style-change': 'onChangeCSLStyle'
  });
  // register this bibliography in the document's store (document-wide singleton)
  // doc.getStore().index(this, "bibliography");
  this._compile();
};

/**
 * Stops listening and unregisters the bibliography.
 */
ve.dm.Bibliography.prototype.onDetach = function(documentNode) {
  var doc = documentNode.getDocument();
  doc.disconnect(this);
  // doc.getStore().index(null, "bibliography");
};

/**
 * Updates the CSL style and recompiles the bibliography.
 */
ve.dm.Bibliography.prototype.onChangeCSLStyle = function(cslXML) {
  this.referenceCompiler.setStyle(cslXML);
  // recompile to regenerate labels and bibliography
  this.compile();
  this.emit('csl-style-changed');
};

ve.dm.Bibliography.prototype._compile = function() {
  var documentModel = this.getDocument();
  this.getCompiler().clear();
  this.registerReferences();
  var leafNodes = documentModel.selectNodes( documentModel.getDocumentNode().getRange(), 'leaves');
  for (var i = 0; i < leafNodes.length; i++) {
    if (leafNodes[i].node.type === 'citation') {
      var citationNode = leafNodes[i].node;
      var references = citationNode.getAttribute('references');
      var citation = this.getCompiler().addCitation(references);
      // HACK storing information into the node directly
      citationNode.element.attributes.id = citation.id;
      citationNode.element.attributes.label = citation.label;
    }
  }
  this.emit('citation-changed');
};

ve.dm.Bibliography.prototype.addNewReference = function(refData) {
  var doc, tx;
  doc = this.getDocument();
  tx = ve.dm.Transaction.newFromInsertion( doc, this.getRange().end , [
    { type: "reference", attributes: refData },
    { type: "/reference" },
  ]);
  doc.commit(tx);
};

ve.dm.Bibliography.prototype.registerReferences = function() {
  var referenceCompiler = this.getCompiler();
  referenceCompiler.clear();
  this.getChildren().forEach( function(refModel) {
    var refData = refModel.element.attributes;
    var refId = referenceCompiler.addReference(refData);
    this.referenceIndex[refId] = refModel;
  }, this);
};

ve.dm.Bibliography.prototype.hasReference = function(id) {
  return !!this.referenceIndex[id];
};

ve.dm.Bibliography.prototype.getReferenceForId = function(id) {
  return this.referenceIndex[id];
};

ve.dm.Bibliography.prototype.makeBibliography = function() {
  return this.getCompiler().engine.makeBibliography();
};

ve.dm.Bibliography.prototype.getCompiler = function() {
  return this.referenceCompiler;
};

ve.dm.Bibliography.prototype.getSortedReferences = function() {
  var result = [];
  var ids = this.getCompiler().getSortedIds();
  for (var i = 0; i < ids.length; i++) {
    result.push(this.getReferenceForId(ids[i]));
  }
  return result;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.Bibliography );
