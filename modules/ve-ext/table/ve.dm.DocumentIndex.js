/**
 * A class that maintains a list of nodes fulfilling a given selector in a given order.
 */
ve.dm.DocumentIndex = function( selector, sort ) {
  this.nodes = [];
  this.selector = selector;
  this.sort = sort;
};

ve.dm.DocumentIndex.prototype.initialize = function(document) {
  this.addNodes(document.documentNode);
};

ve.dm.DocumentIndex.prototype.update = function( parent, index, numNodes, nodes ) {
  var i;
  // remove old nodes
  for (i = 0; i < numNodes; i++) {
    this.removeNode(parent.children[index + i]);
  }
  // add new nodes
  this.addNodes(nodes);

  if (this.sort) this.nodes.sort(this.sort);
};

ve.dm.DocumentIndex.prototype.removeNode = function(node) {
  node.traversePreOrder(function(node) {
    if (this.selector(node)) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    }
  }, this);
};

ve.dm.DocumentIndex.prototype.addNodes = function(nodes) {
  function add(node) {
    if (this.selector(node)) {
      this.nodes.push(node);
    }
  }
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].traversePreOrder(add, this);
  }
};

ve.dm.DocumentIndex.byType = function( type ) {
  return new ve.dm.DocumentIndex( function(node) {
    return ( node.type === type );
  } );
};
