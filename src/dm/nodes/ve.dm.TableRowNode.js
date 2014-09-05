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

ve.dm.TableRowNode.prototype.canBeMergedWith = function() {
  return false;
};

ve.dm.TableRowNode.prototype.onAttach = function(to) {
  if (to.onStructureChange) to.onStructureChange({ row: this });
};

ve.dm.TableRowNode.prototype.onDetach = function(from) {
  from.onStructureChange({ row: this });
};

ve.dm.TableRowNode.prototype.onStructureChange = function(context) {
  if ( this.parent ) {
    context.row = this;
    this.parent.onStructureChange(context);
  }
};

ve.dm.TableRowNode.createData = function(options) {
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
