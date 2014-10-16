
ve.ce.Bibliography = function VeCeBibliography( model, config ) {
  // Parent constructor
  ve.ce.BranchNode.call( this, model, config );

  var title = model.getAttribute('title');
  if (title) {
    var $titleEl = $('<div>').addClass('title').text(title);
    this.$element.append($titleEl);
  }
  this.$element
    .addClass('bibliography')
    .attr('contentEditable', 'false');

  this.model.connect(this, {
    'citation-changed': 'renderBibliography',
    'csl-style-changed': 'renderBibliography'
  } );

  this.renderBibliography();
};

/* Inheritance */

OO.inheritClass( ve.ce.Bibliography, ve.ce.BranchNode );

/* Static Properties */

ve.ce.Bibliography.static.name = 'bibliography';

ve.ce.Bibliography.static.tagName = 'div';

ve.ce.Bibliography.renderBibliographyContainer = function(surfaceView, config) {
  var $bibliographyContainer = $('<div id="bibliographyContainer">').addClass('bibliographyContainer');
  var doc = surfaceView.getModel().getDocument();
  var bibliography = ve.dm.Bibliography.getBibliography(doc);
  var bibliographyView = new ve.ce.Bibliography(bibliography, config);
  $bibliographyContainer.append(bibliographyView.$element);
  surfaceView.$element.append($bibliographyContainer);
};

ve.ce.Bibliography.prototype.renderBibliography = function() {
  var model = this.model;
  this.$element.empty();
  var $title = $('<div>').addClass('title').text('References');
  var $references = $('<div>').addClass('references');
  var result = model.makeBibliography();
  $references.html(result[1].join('\n'));
  this.$element.append($title, $references);
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.Bibliography );
