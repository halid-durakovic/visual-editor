(function() {

function createModelRegistry() {
  return modelRegistry;
}

function convertExample() {

  var nodeFactory = new ve.dm.NodeFactory();
  var annotationFactory = new ve.dm.AnnotationFactory();
  var metaItemFactory = new ve.dm.MetaItemFactory();
  var modelRegistry = new ve.dm.ModelRegistry(nodeFactory, annotationFactory, metaItemFactory);

  // overriding the singletons with custom instances
  ve.dm.nodeFactory = nodeFactory;
  ve.dm.annotationFactory = annotationFactory;
  ve.dm.metaItemFactory = metaItemFactory;
  ve.dm.modelRegistry = modelRegistry;

  modelRegistry.register( ve.dm.DocumentNode );
  modelRegistry.register( ve.dm.ParagraphNode );
  modelRegistry.register( ve.dm.HeadingNode );

  // Note: from the interface we would expect that dm.Converter does not use singletons -- but unfortunately it still does
  var converter = new ve.dm.Converter(modelRegistry, nodeFactory, annotationFactory, metaItemFactory);

  $input = $('#sample');
  var inputText = $input.text();
  var parser = new DOMParser()
  var doc = parser.parseFromString(inputText, 'text/html')

  var model = converter.getModelFromDom(doc, window.document);

  console.log("Converted model", model);
}

$(function() {
  convertExample();
});

})()