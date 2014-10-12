

ve.ce.BibliographyNode = function VeCeBibliographyNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  var title = model.getAttribute('title');
  if (title) {
    var $titleEl = $('<div>').addClass('title').text(title);
    this.$element.append($titleEl);
  }
  this.$references = $('<div>').addClass('references');
  this.$element
    .addClass('bibliography')
    .attr('contentEditable', 'false')
    .append(this.$references);

  this.model.connect(this, { 'csl-style-changed': 'renderBibliography'} );

  this.renderBibliography();
};

/* Inheritance */

OO.inheritClass( ve.ce.BibliographyNode, ve.ce.LeafNode );

/* Static Properties */

ve.ce.BibliographyNode.static.name = 'bibliography';


ve.ce.BibliographyNode.prototype.renderBibliography = function() {
  var model = this.model;
  var entries = model.getAttribute('entries');
  this.$references.empty();
  var result = model.referenceCompiler.engine.makeBibliography();
  this.$references.html(result[1].join('\n'));
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.BibliographyNode );