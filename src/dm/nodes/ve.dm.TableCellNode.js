/*!
 * VisualEditor DataModel TableCellNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel table cell node.
 *
 * @class
 * @extends ve.dm.BranchNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.TableCellNode = function VeDmTableCellNode() {
	// Parent constructor
	ve.dm.BranchNode.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.TableCellNode, ve.dm.BranchNode );

/* Static Properties */

ve.dm.TableCellNode.static.name = 'tableCell';

ve.dm.TableCellNode.static.parentNodeTypes = [ 'tableRow' ];

ve.dm.TableCellNode.static.defaultAttributes = {
	style: 'data'
};

ve.dm.TableCellNode.static.matchTagNames = [ 'td', 'th' ];

ve.dm.TableCellNode.static.toDataElement = function ( domElements ) {
  var attributes = {
    style: domElements[0].nodeName.toLowerCase() === 'th' ? 'header' : 'data',
    colspan: parseInt(domElements[0].getAttribute('colspan'), 10) || undefined,
    rowspan: parseInt(domElements[0].getAttribute('rowspan'), 10) || undefined
  };
	return { type: this.name, attributes:  attributes};
};

ve.dm.TableCellNode.static.toDomElements = function ( dataElement, doc ) {
	var tag = dataElement.attributes && dataElement.attributes.style === 'header' ? 'th' : 'td';
  var el = doc.createElement( tag );
  el.setAttribute('colspan', dataElement.attributes.colspan);
  el.setAttribute('rowspan', dataElement.attributes.rowspan);
	return [ el ];
};

ve.dm.TableCellNode.prototype.getSpan = function (rowOrCol) {
  var key = (rowOrCol || 'col') + 'span';
  return this.element.attributes[key] || 1;
};

ve.dm.TableCellNode.prototype.canBeMergedWith = function() {
  return false;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.TableCellNode );
