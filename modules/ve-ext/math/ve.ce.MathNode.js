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
  // ve.ce.GeneratedContentNode.call( this );
  ve.ce.FocusableNode.call( this );

  // DOM changes
  this.$element.addClass( 've-ce-mathNode' );

  this.$element.on( 'click', ve.bind( this.onClick, this ) );

  this.mathEl = null;
  this.scriptEl = null;

  this.model.connect( this, { 'update': 'onUpdate' } );

  this.render();
};

/* Inheritance */

OO.inheritClass( ve.ce.MathNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.MathNode, ve.ce.FocusableNode );
// OO.mixinClass( ve.ce.MathNode, ve.ce.GeneratedContentNode );

/* Static Properties */

ve.ce.MathNode.static.name = 'math';

ve.ce.MathNode.isFocusable = true;

/* Methods */

ve.ce.MathNode.prototype.render = function () {
  window.console.log("ce.MathNode.render", Date.now());

  var self = this;
  var formula = this.model.getFormula();
  var mathEl = window.document.createElement('span');
  this.mathEl = mathEl;

  mathEl.classList.add('math-container');
  mathEl.setAttribute("contenteditable", "false");
  if (this.model.getType() === "mathInline") {
    mathEl.innerHTML = "\\( " + formula + " \\)";
  } else {
    mathEl.innerHTML = "\\[ " + formula + " \\]";
  }

  this.$element.empty().append( mathEl );

  window.setTimeout(function() {
    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, mathEl],
      function() {
        self.scriptEl = self.$element.find('script')[0];
      }
    );
  }, 0);
};

ve.ce.MathNode.prototype.onUpdate = function () {
  window.console.log("ce.MathNode.onUpdate", Date.now());
  if (this.scriptEl) {
    var formula = this.model.getFormula();
    this.scriptEl.textContent = formula;
    window.MathJax.Hub.Queue(["Update", window.MathJax.Hub, this.mathEl]);
  }
};

ve.ce.MathNode.prototype.onClick = function ( e ) {
  // window.console.log("MathNode.onClick", e);
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

/**
 * Creates highlight.
 * Note: this is overridden, as the FocusableNode computes a bounding box from all children nodes,
 *       which is not optimal as MathJax generates some elements with bounding boxes that are only
 *       relevant for layout.
 *
 * @method
 */
ve.ce.MathNode.prototype.createHighlight = function () {
  var node = this;
  this.$focusable.find( '.math' ).add( this.$focusable ).each(
    ve.bind( function ( i, el ) {
      var offset, $el = this.$( el );
      if ( !$el.is( ':visible' ) ) {
        return true;
      }
      offset = OO.ui.Element.getRelativePosition(
        $el, this.getRoot().getSurface().getSurface().$element
      );
      this.$highlights = this.$highlights.add(
        this.$( '<div>' )
          .css( {
            height: $el.height(),
            width: $el.width(),
            top: offset.top,
            left: offset.left
          } )
          .addClass( 've-ce-focusableNode-highlight' )
          .on( 'dblclick', function () {
            node.emit( 'dblclick' );
          } )
      );
    }, this )
  );
  this.surface.replaceHighlight( this.$highlights );
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
