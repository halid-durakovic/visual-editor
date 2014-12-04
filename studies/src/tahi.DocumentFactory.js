
/* global tahi:true */

tahi.DocumentFactory = function( config ) {
  config = config || {};

  var nodeModels = config.nodeModels || tahi.defaultNodeModels;
  var nodeViews = config.nodeViews || tahi.defaultNodeViews;

  // factories
  // TODO: this should be pa
  this.nodeFactory = new ve.dm.NodeFactory();
  this.annotationFactory = new ve.dm.AnnotationFactory();
  this.metaItemFactory = new ve.dm.MetaItemFactory();
  this.modelRegistry = new ve.dm.ModelRegistry(this.nodeFactory, this.annotationFactory, this.metaItemFactory);
  this.nodeViewFactory = new ve.ce.NodeFactory();

  // HACK: overriding the singletons with custom instances
  ve.dm.nodeFactory = this.nodeFactory;
  ve.dm.annotationFactory = this.annotationFactory;
  ve.dm.metaItemFactory = this.metaItemFactory;
  ve.dm.modelRegistry = this.modelRegistry;
  ve.ce.nodeFactory = this.nodeViewFactory;

  // register nodes and views

  nodeModels.forEach(function(model) {
    this.modelRegistry.register(model);
  }, this);

  nodeViews.forEach(function(view) {
    this.nodeViewFactory.register(view);
  }, this);
};

OO.initClass(tahi.DocumentFactory);

tahi.DocumentFactory.prototype.createDocumentFromHtml = function(input, targetDoc) {
  targetDoc = targetDoc || window.document;
  var parser = new DOMParser();
  var doc = parser.parseFromString(input, 'text/html');
  // Create a dm.Document instance from the input html in the #sample element
  // Note: from the interface we would expect that dm.Converter does not use singletons -- but unfortunately it still does
  var converter = new ve.dm.Converter(this.modelRegistry, this.nodeFactory, this.annotationFactory, this.metaItemFactory);
  return converter.getModelFromDom(doc, targetDoc);
};

tahi.defaultNodeViews = [
  ve.ce.DocumentNode,
  ve.ce.HeadingNode,
  ve.ce.InternalListNode,
  ve.ce.ParagraphNode,
  ve.ce.TextNode,
  ve.ce.BoldAnnotation,
  ve.ce.ItalicAnnotation
];

tahi.defaultNodeModels = [
  ve.dm.DocumentNode,
  ve.dm.HeadingNode,
  ve.dm.InternalListNode,
  ve.dm.ParagraphNode,
  ve.dm.TextNode,
  ve.dm.BoldAnnotation,
  ve.dm.ItalicAnnotation
];
