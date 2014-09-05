/*!
 * VisualEditor DataModel TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel table node.
 *
 * @class
 * @extends ve.dm.BranchNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.TableNode = function VeDmTableNode() {
	// Parent constructor
	ve.dm.BranchNode.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.TableNode, ve.dm.BranchNode );

ve.dm.TableNode.prototype.getIterator = function() {
  return new ve.dm.TableNode.CellIterator(this);
};

/* Static Properties */

ve.dm.TableNode.static.name = 'table';

ve.dm.TableNode.static.childNodeTypes = [ 'tableSection', 'tableCaption' ];

ve.dm.TableNode.static.matchTagNames = [ 'table' ];

ve.dm.TableNode.prototype.canBeMergedWith = function() {
  return false;
};

ve.dm.TableNode.prototype.onStructureChange = function(context) {
  this.emit('tableStructureChange', context);
};

/**
 * A helper class to iterate over the cells of a table node.
 *
 * It provides a unified interface to iterate cells in presence of table sections,
 * e.g., providing consecutive row indexes.
 */
ve.dm.TableNode.CellIterator = function VeCeTableNodeCellIterator(tableNode) {
  this.table = tableNode;

  this.__it = {
    sectionIndex: -1,
    rowIndex: -1,
    rowNode: null,
    cellIndex: -1,
    cellNode: null,
    sectionNode: null,
    finished: false
  };

  // hooks
  this.onNewSection = function() {};
  this.onNewRow = function() {};
};

ve.dm.TableNode.CellIterator.prototype.next = function() {
  if (this.__it.finished) throw new Error("TableCellIterator has no more cells left.");
  this.nextCell(this.__it);
  if (this.__it.finished) return null;
  else return this.__it.cellNode;
};

ve.dm.TableNode.CellIterator.prototype.nextSection = function(it) {
  it.sectionIndex++;
  it.sectionNode = this.table.children[it.sectionIndex];
  if (!it.sectionNode) {
    it.finished = true;
  } else {
    it.rowIndex = 0;
    it.rowNode = it.sectionNode.children[0];
    this.onNewSection(it.sectionNode);
  }
};

ve.dm.TableNode.CellIterator.prototype.nextRow = function(it) {
  it.rowIndex++;
  if (it.sectionNode) {
    it.rowNode = it.sectionNode.children[it.rowIndex];
  }
  while (!it.rowNode && !it.finished) {
    this.nextSection(it);
  }
  if (it.rowNode) {
    it.cellIndex = 0;
    it.cellNode = it.rowNode.children[0];
    this.onNewRow(it.rowNode);
  }
};

ve.dm.TableNode.CellIterator.prototype.nextCell = function(it) {
  if (it.cellNode) {
    it.cellIndex++;
    it.cellNode = it.rowNode.children[it.cellIndex];
  }
  // step into the next row if there is no next cell or if the column is
  // beyond the rectangle boundaries
  while (!it.cellNode && !it.finished) {
    this.nextRow(it);
  }
};


/* Registration */

ve.dm.modelRegistry.register( ve.dm.TableNode );
