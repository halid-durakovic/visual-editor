

ve.ce.BibliographyNode = function VeCeBibliographyNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  var title = model.getAttribute('title');
  var entries = model.getAttribute('entries');

  if (title) {
    var $titleEl = $('<div>').addClass('title').text(title);
    this.$element.append($titleEl);
  }

  var $references = $('<div>').addClass('references');

  entries.forEach(function(ref) {
    var $refEl = $('<div>').addClass('reference');
    var refId = ref.getAttribute('referenceId');
    var $labelEl = $('<div>').addClass('label').html(model.getLabelForReference(refId));
    var $contentEl = $('<div>').addClass('content').html(model.getContentForReference(refId));
    $refEl.append([$labelEl, $contentEl]);
    $references.append($refEl);
  }, this);

  this.$element
    .addClass('bibliography')
    .attr('contentEditable', 'false')
    .append($references);
};

/* Inheritance */

OO.inheritClass( ve.ce.BibliographyNode, ve.ce.LeafNode );

/* Static Properties */

ve.ce.BibliographyNode.static.name = 'bibliography';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.BibliographyNode );