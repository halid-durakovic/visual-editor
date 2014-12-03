(function() {

function boot() {

  var documentFactory = new tahi.DocumentFactory();

  var inputText = $('#sample').text();
  var dmDoc = documentFactory.createDocumentFromHtml(inputText, window.document);

  var $container = $('#content-panel')
  var embeddedSurface = new tahi.EmbeddedSurface(dmDoc, $container);

  // just for the purpose of debugging within this demo
  window.tahi.the_doc = dmDoc;
}

$(function() {
  boot();
});

})();
