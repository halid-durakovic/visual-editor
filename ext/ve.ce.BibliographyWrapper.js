
/**
 * A helper that appends an element after the document node and
 * creates the ve.ce.Bibliography to render into it.
 * This was the only way ATM to render the bibliography without getting in the way of the editor itself.
 */
ve.ce.BibliographyWrapper = function VeCeBibliographyWrapper(model, config) {
  // Parent constructor
  ve.ce.BranchNode.apply( this, arguments );

  // delay so that this is connected to the surface
  window.setTimeout(function() {
    var documentView = this.getRoot();
    var surfaceView = documentView.getSurface();
    ve.ce.Bibliography.renderBibliographyContainer(surfaceView, config);
  }.bind(this), 0);

};

OO.inheritClass( ve.ce.BibliographyWrapper, ve.ce.BranchNode );

ve.ce.BibliographyWrapper.static.name = 'bibliographyWrapper';

ve.ce.nodeFactory.register( ve.ce.BibliographyWrapper );
