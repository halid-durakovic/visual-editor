
/* global tahi: true */

// Experimental: we will change the architecture in future, making nodes and view configurable at application level
tahi.EmbeddedSurface = function tahiEmbeddedSurface( dmDoc, $element, toolbar ) {

  this.toolbar = toolbar;

  this.surface = new ve.ui.DesktopSurface( dmDoc );

  // Very important: first attach the surface to the DOM, then call initialize
  $element.append(this.surface.$element);
  // does some global element injection plus activates tracking of changes
  this.surface.initialize();

  // Events

  this.surfaceModel = this.surface.getModel();
  dmDoc.connect(this, {
    'transact': 'onDocumentTransact'
  });
  this.surfaceModel.connect(this, {
    'select': 'onSurfaceSelect',
    'contextChange': 'onSurfaceContextChange'
  });
  this.toolbar.connect(this, {
    'select': 'onToolbarSelect',
  });
};

// Experimental: we would like to create kind of an VE agnostic abstraction layer
tahi.EmbeddedSurface.prototype.onDocumentTransact = function() {
  window.console.log('received "transact" from dm.Document', arguments);
};

// Experimental: we would like to create kind of an VE agnostic abstraction layer
tahi.EmbeddedSurface.prototype.onSurfaceSelect = function() {
  window.console.log('received "select" from dm.Surface', arguments);
  var fragment = this.surfaceModel.getFragment();
  this.toolbar.updateTools(fragment);
};

// Experimental: we would like to create kind of an VE agnostic abstraction layer
tahi.EmbeddedSurface.prototype.onSurfaceContextChange = function() {
  window.console.log('received "contextChange" from dm.Surface', arguments);
  var fragment = this.surfaceModel.getFragment();
  this.toolbar.updateTools(fragment);
};

tahi.EmbeddedSurface.prototype.onToolbarSelect = function(command) {
  command.execute( this.surface );
};
