(function() {

var registerModels = function(modelRegistry) {
  modelRegistry.register( ve.dm.DocumentNode );
  modelRegistry.register( ve.dm.HeadingNode );
  modelRegistry.register( ve.dm.InternalListNode );
  modelRegistry.register( ve.dm.ParagraphNode );
  modelRegistry.register( ve.dm.TextNode );
};

var registerNodeViews = function(nodeViewFactory) {
  nodeViewFactory.register( ve.ce.DocumentNode );
  nodeViewFactory.register( ve.ce.HeadingNode );
  nodeViewFactory.register( ve.ce.InternalListNode );
  nodeViewFactory.register( ve.ce.ParagraphNode );
  nodeViewFactory.register( ve.ce.TextNode );
};

function boot() {

  // model factories
  var nodeFactory = new ve.dm.NodeFactory();
  var annotationFactory = new ve.dm.AnnotationFactory();
  var metaItemFactory = new ve.dm.MetaItemFactory();
  var modelRegistry = new ve.dm.ModelRegistry(nodeFactory, annotationFactory, metaItemFactory);
  // view factories
  var nodeViewFactory = new ve.ce.NodeFactory();

  // HACK: overriding the singletons with custom instances
  ve.dm.nodeFactory = nodeFactory;
  ve.dm.annotationFactory = annotationFactory;
  ve.dm.metaItemFactory = metaItemFactory;
  ve.dm.modelRegistry = modelRegistry;
  ve.ce.nodeFactory = nodeViewFactory;

  registerModels(modelRegistry);
  registerNodeViews(nodeViewFactory);

  var inputText = $('#sample').text();
  var parser = new DOMParser();
  var doc = parser.parseFromString(inputText, 'text/html');

  // Create a dm.Document instance from the input html in the #sample element
  // Note: from the interface we would expect that dm.Converter does not use singletons -- but unfortunately it still does
  var converter = new ve.dm.Converter(modelRegistry, nodeFactory, annotationFactory, metaItemFactory);
  var dmDoc = converter.getModelFromDom(doc, window.document);

  // Create a ui.Surface and insert it into our sample panel
  var $content = $('#content-panel');
  var surface = new ve.ui.DesktopSurface( dmDoc );
  // Very important: first attach the surface to the DOM, then call initialize
  $content.append(surface.$element);
  // does some global element injection plus activates tracking of changes
  surface.initialize();

  // Demos for event handling
  var surfaceModel = surface.getModel();

  // this is one of the most low-level events, triggered whenever an operation is applied to the document.
  dmDoc.on('transact', function() {
    console.log('received "transact" from dm.Document', arguments);
  });

  // this is one of the most low-level events, triggered whenever an operation is applied to the document.
  surfaceModel.on('select', function() {
    console.log('received "select" from dm.Surface', arguments);
  });

  // just for the purpose of debugging within this demo
  window.tahi.the_doc = dmDoc;
}

$(function() {
  boot();
});

})();
