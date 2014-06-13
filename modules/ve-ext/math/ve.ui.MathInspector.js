/**
 * Math inspector.
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

ve.ui.MathInspector.static.modelClasses = [ ve.dm.MathNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getInsertionText = function () {
	return this.mathInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.initialize = function () {
	// console.log("ve.ui.MathInspector.initialize()");

	// Parent method
	ve.ui.MathInspector.super.prototype.initialize.call( this );

	// Properties

	this.mathInput = new OO.ui.TextInputWidget({
		'$': this.$,
		'$overlay': this.$contextOverlay || this.$overlay,
		'classes': ['ve-ui-mathInputWidget']
	} );

	this.formatSelect = new OO.ui.ButtonSelectWidget( {
		'$': this.$,
		'classes': [ 've-ui-mathInspector-formatSelect' ]
	} ).addItems( [
		new OO.ui.ButtonOptionWidget( 'tex', { '$': this.$, 'label': 'Latex' } ),
		new OO.ui.ButtonOptionWidget( 'asciimath', { '$': this.$, 'label': 'ASCII' } ),
	] );


	// Initialization

	this.formatSelect.connect( this, {'select': 'onFormatChange'} );
	this.mathInput.connect( this, {'change': 'onFormulaChange'} );

	var $formatButtonGroup = $('<div>')
		.addClass('ve-ui-mathinspector-format-buttons')
		.append(this.formatSelect.$element);

	this.$head.append($formatButtonGroup);

	this.$form.append([
		this.mathInput.$element
		]);
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.MathInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			this.$contextOverlay.addClass("math-inspector");

			// console.log("ve.ui.MathInspector.getReadyProcess()");
			var fragment = this.getFragment();
			if (!fragment) {
				return false;
			}
			this.node = fragment.getSelectedNode();

			// Create a new node if it does not exist
			// this is the case when inserting a new math node via toolbar
			if (!this.node) {
				this.node = this.insertMathNode();
				fragment.select(this.node.getOuterRange());
			}

			var format = this.node.getFormat();
			this.formatSelect.selectItem(
				this.formatSelect.getItemFromData( format )
			);

			this.mathInput.$input.val(this.node.getFormula());
		}, this );
};

ve.ui.MathInspector.prototype.insertMathNode = function() {
	var type;
	var fragment = this.getFragment();
	var leafNodes = fragment.getLeafNodes();
	if (!leafNodes.length) {
		return false;
	}
	if (leafNodes[0].node.parent === leafNodes[0].node.root) {
		type = "mathBlock";
	} else {
		type = "mathInline";
	}
	fragment.insertContent([
		{
			type: type,
			attributes: ve.dm.MathNode.static.defaultAttributes
		}
	], false ).collapseRangeToEnd().select();

	return fragment.getSelectedNode();
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getReadyProcess = function (/*data*/) {
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
			// console.log("ve.ui.MathInspector.getTeardownProcess()", data);
			this.$contextOverlay.removeClass("math-inspector");
			// Configuration initialization
			data = data || {};

			// delete the node if the user has clicked the remove button
			// or if the formula is empty
			var shouldDelete = (
				this.node &&
				(data.action === "remove" || this.node.getFormula().match(/^\s*$/))
			);

			if ( shouldDelete ) {
				var fragment = this.getFragment();
				fragment.removeContent([this.node]);
			}

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

ve.ui.MathInspector.prototype.onFormatChange = function() {
	var selectedItem = this.formatSelect.getSelectedItem();
	var formatType = selectedItem.data;

	var fragment = this.getFragment();
	if (fragment && this.node) {
		fragment.changeAttributes(
			{
				'format': formatType
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
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MathInspector );
