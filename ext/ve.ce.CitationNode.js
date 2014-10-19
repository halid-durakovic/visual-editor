
ve.ce.CitationNode = function VeCeCitationNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  this.bibliography = ve.dm.Bibliography.getBibliography(model.getDocument());

  var label = model.getAttribute('label');

  // DOM changes
  this.$element
    .addClass( 'citation ve-ce-citationNode' )
    // Add em space for selection highlighting
    .html( label );

  // Mixin constructors
  ve.ce.FocusableNode.call( this, this.$element, config );
};

/* Inheritance */

OO.inheritClass( ve.ce.CitationNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.CitationNode, ve.ce.FocusableNode );

ve.ce.CitationNode.static.name = 'citation';

ve.ce.CitationNode.static.primaryCommandName = 'citation';

/**
 * @inheritdoc
 */
ve.ce.CitationNode.prototype.createHighlight = function () {
  // Mixin method
  return ve.ce.FocusableNode.prototype.createHighlight.call( this )
    .addClass( 've-ce-citation-highlight' )
    .attr( 'title', ve.msg( 'visualeditor-citationnode-tooltip' ) );
};

ve.ce.CitationNode.prototype.onUpdate = function () {
  // console.log("CitationNode.onUpdate");
  this.bibliography.compile();
};

ve.ce.CitationNode.prototype.updateLabel = function() {
  var label = this.model.getAttribute('label');
  this.$element.html(label);
  if (this.surface) this.redrawHighlights();
};

ve.ce.CitationNode.prototype.onTeardown = function () {
  ve.ce.View.prototype.onTeardown.call(this);
  this.model.disconnect(this);
  this.bibliography.disconnect(this);
  this.bibliography.compile();
};

ve.ce.CitationNode.prototype.onSetup = function () {
  ve.ce.View.prototype.onSetup.call(this);
  this.model.connect( this, { 'update': 'onUpdate' } );
  this.bibliography.connect(this, {
    'csl-style-changed': 'updateLabel',
    'citation-changed': 'updateLabel'
  });
  this.bibliography.compile();
};


/* Registration */

ve.ce.nodeFactory.register( ve.ce.CitationNode );
