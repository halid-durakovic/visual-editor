

/**
 * This node is just used to catch a bibliography node from HTML
 * and insert it into the documents InternalList.
 */
ve.dm.BibliographyWrapper = function VeDmBibliographyWrapper() {
  // Parent constructor
  ve.dm.BranchNode.apply( this, arguments );
};

OO.inheritClass( ve.dm.BibliographyWrapper, ve.dm.BranchNode );

ve.dm.BibliographyWrapper.static.name = 'bibliographyWrapper';

ve.dm.BibliographyWrapper.static.matchTagNames = [ 'div' ];

ve.dm.BibliographyWrapper.static.matchFunction = function ( domElement ) {
  return domElement.dataset.type === 'bibliography';
};

ve.dm.BibliographyWrapper.static.handlesOwnChildren = true;

ve.dm.BibliographyWrapper.static.toDataElement = function ( domElements, converter) {
  var bibElement = domElements[0];
  var html = ['<div data-type="internalBibliography">', bibElement.innerHTML, '</div>'].join('');
  converter.internalList.queueItemHtml('article', 'bibliography', html);
  return { type: this.name };
};

ve.dm.modelRegistry.register( ve.dm.BibliographyWrapper );
