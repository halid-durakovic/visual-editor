/**
 * Creates an ve.ui.MathInputWidget object.
 *
 * @class
 * @extends OO.ui.TextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MathInputWidget = function VeUiMathInputWidget( mathNode, config ) {
  console.log("ve.ui.MathInputWidget()", mathNode, config);

  // Parent constructor
  OO.ui.TextInputWidget.call( this, config );

  // Properties
  this.node = mathNode;

  // Initialization
  this.$element.addClass( 've-ui-mathInputWidget' );

  // Default RTL/LTR check
  // Has to use global $() instead of this.$() because only the main document's <body> has
  // the 'rtl' class; inspectors and dialogs have oo-ui-rtl instead.
  if ( $( 'body' ).hasClass( 'rtl' ) ) {
    this.$input.addClass( 'oo-ui-rtl' );
  }
};

/* Inheritance */

OO.inheritClass( ve.ui.MathInputWidget, OO.ui.TextInputWidget );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MathInputWidget.prototype.setValue = function ( value ) {
  // Parent method
  OO.ui.TextInputWidget.prototype.setValue.call( this, value );
};
