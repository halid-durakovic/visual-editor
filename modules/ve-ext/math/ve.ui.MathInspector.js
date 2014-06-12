/*!
 * VisualEditor UserInterface MathInspector class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Link inspector.
 *
 * @class
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MathInspector = function VeUiMathInspector( config ) {
  // Parent constructor
  ve.ui.Inspector.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.MathInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.MathInspector.static.name = 'math';

ve.ui.MathInspector.static.icon = 'math';

ve.ui.MathInspector.static.title = 'Math';

ve.ui.MathInspector.static.mathInputWidget = ve.ui.MathInputWidget;

ve.ui.MathInspector.static.modelClasses = [ ve.dm.MathNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getInsertionText = function () {
  console.log("ve.ui.MathInspector.getInsertionText()");
  return this.mathInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.initialize = function () {
  console.log("ve.ui.MathInspector.initialize()");

  // Parent method
  ve.ui.MathInspector.super.prototype.initialize.call( this );

  // Properties
  this.mathInput = new this.constructor.static.mathInputWidget(this.node, {
    '$': this.$, '$overlay': this.$contextOverlay || this.$overlay
  } );

  this.mathInput.connect( this, {'change': 'onFormulaChange'} );


  // Initialization
  this.$form.append( this.mathInput.$element );
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getSetupProcess = function ( data ) {
  return ve.ui.MathInspector.super.prototype.getSetupProcess.call( this, data )
    .next( function () {
      this.$contextOverlay.addClass("math-inspector");

      console.log("ve.ui.MathInspector.getReadyProcess()");
      var fragment = this.getFragment();
      if (!fragment) {
        return false;
      }
      this.node = fragment.getSelectedNode();
      if (!this.node) {
        return false;
      }
      this.mathInput.$input.val(this.node.getFormula());
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getReadyProcess = function (data) {
  return ve.ui.MathInspector.super.prototype.getReadyProcess.call( this )
    .next( function () {
      this.mathInput.focus();
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getTeardownProcess = function ( data ) {
  return ve.ui.MathInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      console.log("ve.ui.MathInspector.getTeardownProcess()", data);
      this.$contextOverlay.removeClass("math-inspector");
      // Configuration initialization
      data = data || {};
    }, this);
};

ve.ui.MathInspector.prototype.onFormulaChange = function() {
  var newFormula = this.mathInput.getValue();
  var fragment = this.getFragment();
  if (fragment) {
    fragment.changeAttributes(
      {
        'formula': newFormula
      },
      this.node.getType()
    );
  }
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.isEmbeddable = function() {
  return false;
}


/* Registration */

ve.ui.windowFactory.register( ve.ui.MathInspector );
