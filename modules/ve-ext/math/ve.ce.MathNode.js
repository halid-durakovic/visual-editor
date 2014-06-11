/*!
 * VisualEditor ContentEditable MathNode, MathBlockNode and MathInlineNode classes.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable math node.
 *
 * @class
 * @abstract
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.ProtectedNode
 * @mixins ve.ce.GeneratedContentNode
 *
 * @constructor
 * @param {ve.dm.MathNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.MathNode = function VeCeMathNode( model, config ) {
  // Parent constructor
  ve.ce.LeafNode.call( this, model, config );

  // Mixin constructors
  ve.ce.FocusableNode.call( this );
  ve.ce.ClickableNode.call( this );

  // DOM changes
  this.$element.addClass( 've-ce-mathNode' );

  var self = this;
  this.$element.on( 'click', ve.bind( this.onClick, this ) );

  // TODO: this does not work properly yet. Sometimes the SurfaceObserver gets into
  // an invalid state.
  // this.$element.on( 'dblclick', ve.bind( function() {
  //   console.log("EMIT");
  //   window.setTimeout(function() {
  //     self.emit( 'dblclick' );
  //   }, 50)
  // }) );

  this.$mathEl = null;
  this.scriptEl = null;

  this.model.connect( this, { 'update': 'onUpdate' } );

  this.render();
};

/* Inheritance */

OO.inheritClass( ve.ce.MathNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.MathNode, ve.ce.FocusableNode );
OO.mixinClass( ve.ce.MathNode, ve.ce.ClickableNode );

/* Static Properties */

ve.ce.MathNode.static.name = 'math';

ve.ce.MathNode.static.primaryCommandName = 'math';

ve.ce.MathNode.isFocusable = true;

/* Methods */

ve.ce.MathNode.prototype.render = function () {
  window.console.log("ce.MathNode.render", Date.now());

  var self = this;
  var formula = this.model.getFormula();

  var wrappedFormula;
  var elType = 'span';
  if (this.model.getType() === "mathInline") {
    wrappedFormula = "\\( " + formula + " \\)";
  } else {
    wrappedFormula = "\\( " + formula + " \\)";
  }

  var $mathEl = $(window.document.createElement(elType))
    .addClass('math-container')
    .attr('contenteditable', 'false')
    .html(wrappedFormula);

  this.$focusable = $mathEl;

  this.$mathEl = $mathEl;

  this.$element.empty().append( $mathEl );

  window.setTimeout(function() {
    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, $mathEl[0]],
      function() {
        self.scriptEl = self.$mathEl.find('script')[0];
      }
    );
  }, 0);
};

ve.ce.MathNode.prototype.onUpdate = function () {
  // window.console.log("ce.MathNode.onUpdate", Date.now());
  if (this.scriptEl) {
    var formula = this.model.getFormula();
    this.scriptEl.textContent = formula;
    var self = this;
    window.MathJax.Hub.Queue(["Update", window.MathJax.Hub, this.mathEl],
      function() {
      }
    );
  }
};

ve.ce.MathNode.prototype.onClick = function ( e ) {
  var surfaceModel = this.getRoot().getSurface().getModel(),
    selectionRange = surfaceModel.getSelection(),
    nodeRange = this.model.getOuterRange();

    surfaceModel.getFragment(
      e.shiftKey ?
        ve.Range.newCoveringRange(
          [ selectionRange, nodeRange ], selectionRange.from > nodeRange.from
        ) :
        nodeRange
    ).select();
};

/* Concrete subclasses */

/**
 * ContentEditable math block node.
 *
 * @class
 * @extends ve.ce.MathNode
 * @constructor
 * @param {ve.dm.MathBlockNode} model Model to observe
 */
ve.ce.MathBlockNode = function VeCeMathBlockNode( model ) {
  // Parent constructor
  ve.ce.MathNode.call( this, model );

  // DOM changes
  this.$element.addClass( 've-ce-mathBlockNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.MathBlockNode, ve.ce.MathNode );

/* Static Properties */

ve.ce.MathBlockNode.static.name = 'mathBlock';
ve.ce.MathBlockNode.static.tagName = 'div';

/**
 * ContentEditable math inline node.
 *
 * @class
 * @extends ve.ce.MathNode
 * @constructor
 * @param {ve.dm.MathInlineNode} model Model to observe
 */
ve.ce.MathInlineNode = function VeCeMathInlineNode( model ) {
  // Parent constructor
  ve.ce.MathNode.call( this, model );

  // DOM changes
  this.$element.addClass( 've-ce-mathInlineNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.MathInlineNode, ve.ce.MathNode );

/* Static Properties */

ve.ce.MathInlineNode.static.name = 'mathInline';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.MathNode );
ve.ce.nodeFactory.register( ve.ce.MathBlockNode );
ve.ce.nodeFactory.register( ve.ce.MathInlineNode );
