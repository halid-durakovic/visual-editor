
// Experimental: we will change the architecture in future, making nodes and view configurable at application level
tahi.EmbeddedSurface = function tahiEmbeddedSurface( dmDoc, $element, config ) {

  var surface = new ve.ui.DesktopSurface( dmDoc );
  // Very important: first attach the surface to the DOM, then call initialize
  $element.append(surface.$element);
  // does some global element injection plus activates tracking of changes
  surface.initialize();

  // Events

  var surfaceModel = surface.getModel();
  dmDoc.connect(this, {
    'transact': 'onDocumentTransact'
  });
  surfaceModel.connect(this, {
    'select': 'onSurfaceSelect'
  });
};

// Experimental: we would like to create kind of an VE agnostic abstraction layer
tahi.EmbeddedSurface.prototype.onDocumentTransact = function() {
  console.log('received "transact" from dm.Document', arguments);
};

// Experimental: we would like to create kind of an VE agnostic abstraction layer
tahi.EmbeddedSurface.prototype.onSurfaceSelect = function() {
  console.log('received "select" from dm.Surface', arguments);
};
