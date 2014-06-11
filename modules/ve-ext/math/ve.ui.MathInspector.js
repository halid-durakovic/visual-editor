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
      console.log("ve.ui.MathInspector.getSetupProcess()");
      // if ( !this.node ) {
      //   // Note: collapseRangeToEnd returns a new fragment
      //   this.fragment = this.getFragment().collapseRangeToEnd().insertContent( [
      //     {
      //       'type': 'mathInline',
      //       'attributes': { 'formula': 'f(x)' }
      //     }
      //   ] );
      //   this.getFragment().select();
      //   this.node = this.getFragment().getSelectedNode();
      // }
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getReadyProcess = function () {
  return ve.ui.MathInspector.super.prototype.getReadyProcess.call( this )
    .next( function () {
      console.log("ve.ui.MathInspector.getReadyProcess()");
      this.node = this.getFragment().getSelectedNode();
      this.mathInput.$input.val(this.node.getFormula());
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
      // Configuration initialization
      data = data || {};
    } );
};

ve.ui.MathInspector.prototype.onFormulaChange = function() {
  var newFormula = this.mathInput.getValue();

  this.getFragment().changeAttributes(
    {
      'formula': newFormula
    },
    this.node.getType()
  );
};


/* Registration */

ve.ui.windowFactory.register( ve.ui.MathInspector );
