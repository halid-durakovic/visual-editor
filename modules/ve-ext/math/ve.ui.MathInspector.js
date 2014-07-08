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

	// Register a message hook to show parse errors
	window.MathJax.Hub.Register.MessageHook("TeX Jax - parse error", ve.bind(this.onParseError, this));
};

/* Inheritance */

OO.inheritClass( ve.ui.MathInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.MathInspector.static.name = 'math';

ve.ui.MathInspector.static.icon = 'math';

// TODO: this should come from i18n configuration
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

	this.$errorEl = $('<div>').addClass('ve-ui-mathInspector-parseError');

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
		.addClass('ve-ui-mathInspector-format-buttons')
		.append(this.formatSelect.$element);

	this.$head.append( [
			$formatButtonGroup
		] );

	this.$form.append( [
			this.mathInput.$element
		] );
	this.$body.append( [
			this.$errorEl
		] );
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
				var node = this.insertMathNode();
				if (!node) {
					window.console.error("Could not create MathNode.");
					return;
				}
				this.node = node;
			}

			var format = this.node.getFormat();
			this.formatSelect.selectItem(
				this.formatSelect.getItemFromData( format )
			);

			this.mathInput.$input.val(this.node.getFormula());

			// HACK: as we have a want the popup to be positioned in
			// a non-floating way, we have to position the popup-tail now manually
			// Unfortunately, we have not found a way to access the ce.MathNode
			// from within this class.
			// Thus we are doing a search on the DOM instead.
			var $surface = $('.ve-ce-surface');
			var $mathCe = $('.ve-ce-surface .ve-ce-documentNode .ve-ce-mathNode .ve-ce-node-focused');
			var $tail = this.$contextOverlay.find('.oo-ui-popupWidget-tail');
			if ($mathCe.length && $tail.length) {
				var surfaceOffset = $surface.offset();
				var popupOffset = this.$contextOverlay.offset();
				var nodeOffset = $mathCe.offset();
				var width = $mathCe.width();
				var left = nodeOffset.left - popupOffset.left + width/2;
				console.log('####', surfaceOffset, popupOffset, nodeOffset);
				// ATTENTION: we have to clear this style when this inspector is
				// teared down
				$tail.css( { 'left': left, 'top': nodeOffset.top } );
			}

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

	// HACK: I could find a convenient way to immediately retrieve the inserted node
	// ATM, fragment.getSelectedNode() -- which worked earlier -- does not return
	// the node when type is 'mathBlock'.
	// As a workaround we get all covered nodes and look for the correct one ourselves
	var nodes = fragment.getCoveredNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i].node;
		if (node.type === type) {
			return node;
		}
	}

	throw new Error('Could not retrieve node!');
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
				fragment.change( ve.dm.Transaction.newFromRemoval( fragment.document, this.node.getOuterRange() ) );
			}

			var $tail = this.$contextOverlay.find('.oo-ui-popupWidget-tail');
			$tail.css( { 'left': '', 'top': '' } );

		}, this);
};

ve.ui.MathInspector.prototype.onFormulaChange = function() {
	var newFormula = this.mathInput.getValue();
	var fragment = this.getFragment();
	if (fragment) {
		this.$errorEl.text('');
		// Note: the API provided by ve.dm.SurfaceFragment has been changed
		// breaking this implementation
		// The low-level API seems to be more stable
		var doc = fragment.document;
		var txs = [
			ve.dm.Transaction.newFromAttributeChanges(
					doc, this.node.getOuterRange().start,
					{
						'formula': newFormula
					}
				)
		];
		fragment.change(txs);
		// WORKAROUND: ATM the edit field for the inline element
		// looses focus after each keystroke.
		this.mathInput.focus();
	}
};

ve.ui.MathInspector.prototype.onFormatChange = function() {
	var selectedItem = this.formatSelect.getSelectedItem();
	var formatType = selectedItem.data;

	var fragment = this.getFragment();
	if (fragment && this.node) {
		this.$errorEl.text('');
		fragment.changeAttributes(
			{
				'format': formatType
			},
			this.node.getType()
		);
	}
};

ve.ui.MathInspector.prototype.onParseError = function(message) {
	console.error("MathInspector.onParseError", message);
	this.$errorEl.text(message[1]);
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.isEmbeddable = function() {
	return false;
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MathInspector );
