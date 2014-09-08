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

  // A dense representation of the sparse model to make manipulations
  // in presence of spanning cells doable.
  this.matrix = new ve.dm.TableMatrix(this);
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
  this.matrix.invalidate();
  this.emit('tableStructureChange', context);
};

ve.dm.TableNode.prototype.getSize = function (dimension) {
  var dim = this.matrix.getSize();
  if ( dimension === 'row' ) {
    return dim[0];
  } else if ( dimension === 'col' ) {
    return dim[1];
  } else {
    return dim;
  }
};

ve.dm.TableNode.prototype.getRectangle = function (startCellNode, endCellNode) {
  return this.matrix.getRectangle(startCellNode, endCellNode);
};

/**
 * Find a table in the document which contains a given selection.
 *
 * @param documentNode The document model
 * @param selection A range that must be contained by the table
 * @return An object with properties 'node', 'startCell', 'endCell'
 */
ve.dm.TableNode.lookupSelection = function (documentNode, selection) {
  var start, end;
  if (!selection) {
    return null;
  }
  if (selection.isBackwards()) {
    selection = selection.flip();
  }
  // find the outer-most table which includes both selection anchors
  if (selection.isCollapsed()) {
    start = ve.dm.TableNode.findTableForOffset(documentNode, selection.start);
    end = start;
  } else {
    start = ve.dm.TableNode.findTableForOffset(documentNode, selection.start, selection.end);
    end = ve.dm.TableNode.findTableForOffset(documentNode, selection.end, selection.start);
  }
  if (!start || !end) {
    return null;
  }
  return {
    node: start.tableNode,
    startCell: start.cellNode,
    endCell: end.cellNode
  };
};

/**
 * Find a table starting from a node with given offset that contains another constraint offset.
 *
 * @param documentNode The document model
 * @param offset Offset of the node to start from
 * @param constraint Offset which must be contained
 * @return An object with properties 'tableNode', 'cellNode'
 */
ve.dm.TableNode.findTableForOffset = function (documentNode, offset, constraint) {
  var cellNode, node;
  node = documentNode.getNodeFromOffset(offset);
  while (node) {
    switch (node.type) {
      case 'tableCell':
        cellNode = node;
        break;
      case 'table':
        if (constraint && !node.getRange().containsOffset(constraint)) {
          break;
        } else {
          return {
            tableNode: node,
            cellNode: cellNode
          };
        }
    }
    node = node.parent;
  }
  return null;
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
