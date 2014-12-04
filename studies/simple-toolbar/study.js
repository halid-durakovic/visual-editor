(function() {

/* global tahi:true */

var Toolbar = function($toolbar) {
  OO.EventEmitter.call(this);

  this.$toolbar = $toolbar;
  this.buttonEls = $toolbar[0].querySelectorAll('.toolbar-button');
  this.$buttons = $(this.buttonEls);
  this.commands = {};
  for (var i = 0; i < this.buttonEls.length; i++) {
    var el = this.buttonEls[i];
    var commandName = el.dataset.command;
    this.commands[commandName] = ve.ui.commandRegistry.lookup(commandName);
    el.dataset.enabled = false;
  }

  var commands = this.commands;
  var self = this;
  this.$buttons.click(function(ev) {
    var el = ev.currentTarget;
    var commandName = el.dataset.command;
    var command = commands[commandName];
    if (command) {
      self.emit('select', command);
    }
    ev.preventDefault();
    ev.stopPropagation();
  });
};

OO.inheritClass(Toolbar, OO.EventEmitter);

Toolbar.prototype.updateTools = function( fragment ) {
  for (var i = 0; i < this.buttonEls.length; i++) {
    var el = this.buttonEls[i];
    var commandName = el.dataset.command;
    var command = this.commands[commandName];
    var enabled = command && command.isExecutable( fragment );
    if (enabled) {
      // for sake of simplicity, here annotationName === commandName
      enabled = fragment.getAnnotations().hasAnnotationWithName( commandName );
    }
    el.dataset.enabled = enabled;
  }
};


function boot() {

  var documentFactory = new tahi.DocumentFactory();

  var inputText = $('#sample').text();
  var dmDoc = documentFactory.createDocumentFromHtml(inputText, window.document);

  var $container = $('#content-panel');

  var $toolbar = $('#toolbar');
  var toolbar = new Toolbar($toolbar);

  var embeddedSurface = new tahi.EmbeddedSurface(dmDoc, $container, toolbar);

  // just for the purpose of debugging within this demo
  window.tahi.the_doc = dmDoc;
}

$(function() {
  boot();
});

})();
