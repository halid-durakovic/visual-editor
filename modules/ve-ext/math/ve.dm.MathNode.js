/**
 * DataModel math node.
 *
 * @class
 * @abstract
 * @extends ve.dm.LeafNode
 * @mixins ve.dm.GeneratedContentNode
 *
 * @constructor
 * @param {number} [length] Length of content data in document; ignored and overridden to 0
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.MathNode = function VeDmMathNode( length, element ) {
  // Parent constructor
  ve.dm.LeafNode.call( this, 0, element );

  // Mixin constructors
  ve.dm.GeneratedContentNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.MathNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.MathNode, ve.dm.GeneratedContentNode );


/**
 * A getter to retrieve the stored formula conveniently.
 *
 */
ve.dm.MathNode.prototype.getFormula = function () {
  return this.getAttribute('formula');
};

ve.dm.MathNode.prototype.setFormula = function (formula) {
  this.element.attributes['formula'] = formula;
  return this.getAttribute('formula');
};

/* Static members */

ve.dm.MathNode.static.name = 'math';

ve.dm.MathNode.static.storeHtmlAttributes = false;

ve.dm.MathNode.static.enableAboutGrouping = true;

ve.dm.MathNode.static.toDataElement = function ( domElements, converter ) {
  window.console.log("MathNode.toDataElement", domElements, converter);

  var formula = domElements[0].textContent;

  var isInline = this.isHybridInline( domElements, converter ),
    type = isInline ? 'mathInline' : 'mathBlock';

  return {
    'type': type,
    'attributes': {
      'formula': formula
    }
  };
};

ve.dm.MathNode.static.toDomElements = function ( dataElement, doc ) {
  window.console.log("MathNode.toDomElement", dataElement, doc);

  var el;
  if (dataElement.type === "mathInline") {
    el = doc.createElement('span');
  } else {
    el = doc.createElement('div');
  }
  el.setAttribute('rel', 'ext:math');
  el.innerHTML = dataElement.attributes.formula;

  return [ el ];
};

/* Concrete subclasses */

/**
 * DataModel mathBlock node.
 *
 * @class
 * @extends ve.dm.MathNode
 * @constructor
 * @param {number} [length] Length of content data in document; ignored and overridden to 0
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.MathBlockNode = function VeDmMathBlockNode( length, element ) {
  // Parent constructor
  ve.dm.MathNode.call( this, length, element );
};

OO.inheritClass( ve.dm.MathBlockNode, ve.dm.MathNode );

ve.dm.MathBlockNode.static.name = 'mathBlock';

ve.dm.MathBlockNode.static.matchTagNames = ['div'];
ve.dm.MathBlockNode.static.matchRdfaTypes = ['ext:math'];

/**
 * DataModel mathInline node.
 *
 * @class
 * @extends ve.dm.MathNode
 * @constructor
 * @param {number} [length] Length of content data in document; ignored and overridden to 0
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.MathInlineNode = function VeDmMathInlineNode( length, element ) {
  // Parent constructor
  ve.dm.MathNode.call( this, length, element );
};

OO.inheritClass( ve.dm.MathInlineNode, ve.dm.MathNode );

ve.dm.MathInlineNode.static.name = 'mathInline';

ve.dm.MathInlineNode.static.matchTagNames = ['span'];
ve.dm.MathInlineNode.static.matchRdfaTypes = ['ext:math'];

ve.dm.MathInlineNode.static.isContent = true;

/* Registration */

ve.dm.modelRegistry.register( ve.dm.MathNode );
ve.dm.modelRegistry.register( ve.dm.MathBlockNode );
ve.dm.modelRegistry.register( ve.dm.MathInlineNode );
