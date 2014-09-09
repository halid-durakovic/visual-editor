/*!
 * VisualEditor DataModel TableRowNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel table row node.
 *
 * @class
 * @extends ve.dm.BranchNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.TableRowNode = function VeDmTableRowNode() {
	// Parent constructor
	ve.dm.BranchNode.apply( this, arguments );

	/* Events */

	this.connect( this, {
		'attach': 'onAttach',
		'detach': 'onDetach'
	} );
};

/* Inheritance */

OO.inheritClass( ve.dm.TableRowNode, ve.dm.BranchNode );

/* Static Properties */

ve.dm.TableRowNode.static.name = 'tableRow';

ve.dm.TableRowNode.static.childNodeTypes = [ 'tableCell' ];

ve.dm.TableRowNode.static.parentNodeTypes = [ 'tableSection' ];

ve.dm.TableRowNode.static.matchTagNames = [ 'tr' ];

/* Prototype functions */

ve.dm.TableRowNode.prototype.onAttach = function( to ) {
	if (to.onStructureChange) to.onStructureChange( { row: this } );
};

ve.dm.TableRowNode.prototype.onDetach = function( from ) {
	if (from.onStructureChange) from.onStructureChange( { row: this } );
};

ve.dm.TableRowNode.prototype.onStructureChange = function( context ) {
	if ( this.parent ) {
		context.row = this;
		this.parent.onStructureChange(context);
	}
};

ve.dm.TableRowNode.prototype.canBeMergedWith = function() {
	return false;
};

/**
 * Creates data that can be inserted into the model to create a new table row.
 *
 * @param {Object} [options] An object with properties 'style' which can be either 'header' or 'data',
 *   'cellCount' the number of cells in the row
 * @return {Array} Model data for a new table row
 */
ve.dm.TableRowNode.createData = function( options ) {
	options = options || {};
	var data = [];
	var cellCount = options.cellCount || 1;
	data.push({ type: 'tableRow'});
	for (var i = 0; i < cellCount; i++) {
		data = data.concat(ve.dm.TableCellNode.createData(options));
	}
	data.push({ type: '/tableRow'});
	return data;
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.TableRowNode );
