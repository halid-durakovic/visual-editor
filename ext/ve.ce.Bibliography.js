
ve.ce.Bibliography = function VeCeBibliography( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  this.model.connect(this, {
    'citation-changed': 'renderBibliography',
    'csl-style-changed': 'renderBibliography'
  } );

  this.$bibliography = $('<div>').addClass('bibliography');
  this.$bibliographyContainer = $('<div>').addClass('ve-ce-documentNode').append(this.$bibliography);

  // delay so that this is connected to the surface
  window.setTimeout(function() {
    var documentView = this.getRoot();
    var surfaceView = documentView.getSurface();
    this.renderBibliography();
    surfaceView.$element.append(this.$bibliographyContainer);
  }.bind(this), 0);
};

/* Inheritance */

OO.inheritClass( ve.ce.Bibliography, ve.ce.LeafNode );

/* Static Properties */

ve.ce.Bibliography.static.name = 'bibliography';

ve.ce.Bibliography.static.tagName = 'div';

ve.ce.Bibliography.prototype.renderBibliography = function() {
  var model = this.model;

  var children = model.getChildren();
  if (children.length === 0) {
    this.$bibliographyContainer.hide();
  } else {
    this.$bibliography.empty();
    var $title = $('<div>').addClass('title').text('References');
    var $references = $('<div>').addClass('references');
    var result = model.makeBibliography();
    $references.html(result[1].join('\n'));
    this.$bibliography.append($title, $references);
    this.$bibliographyContainer.show();
  }
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.Bibliography );
