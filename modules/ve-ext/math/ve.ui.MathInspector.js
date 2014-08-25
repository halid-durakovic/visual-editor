/**
 * Math inspector.
 *
 * @class
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MathInspector = function VeUiMathInspector( manager, config ) {
	// Parent constructor
	ve.ui.NodeInspector.call( this, manager, config );

	// Register a message hook to show parse errors
	window.MathJax.Hub.Register.MessageHook("TeX Jax - parse error", ve.bind(this.onParseError, this));
};

/* Inheritance */

OO.inheritClass( ve.ui.MathInspector, ve.ui.NodeInspector );

/* Static properties */

ve.ui.MathInspector.static.name = 'math';

ve.ui.MathInspector.static.icon = 'math';

// TODO: this should come from i18n configuration
ve.ui.MathInspector.static.title = 'Math';

ve.ui.MathInspector.static.modelClasses = [ ve.dm.MathNode ];

ve.ui.MathInspector.static.size = 'large';

ve.ui.MathInspector.static.actions = [
	{
		action: 'done',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
		flags: 'primary',
		modes: 'edit'
	},
	{
		action: 'remove',
		label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
		flags: 'destructive',
		modes: 'edit'
	}
];

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
		'$overlay': this.$overlay,
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

	var $toolbar = $('<div>').addClass('ve-ui-mathInspector-tools');

	var $formatButtonGroup = $('<div>')
		.addClass('ve-ui-mathInspector-format-buttons')
		.append(this.formatSelect.$element);

	$toolbar.append( [
		$formatButtonGroup
	]);
	this.form.$element.append( [
			$toolbar,
			this.mathInput.$element,
			this.$errorEl
		] );

};

ve.ui.MathInspector.prototype.getActionProcess = function ( action ) {
	if ( action === 'remove' ) {
		return new OO.ui.Process( function () {
			this.close( { action: action } );
		}, this );
	}
	return ve.ui.MathInspector.super.prototype.getActionProcess.call( this, action );
};

/**
 * @inheritdoc
 */
ve.ui.MathInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.MathInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			// put the surface into staging mode. Otherwise there context changes
			// which get emitted on every transaction and finally
			// lead to the inspector getting closed.
			this.getFragment().getSurface().pushStaging();

			this.node = this.getSelectedNode();

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
			attributes: JSON.parse( JSON.stringify( ve.dm.MathNode.static.defaultAttributes ) )
		}
	], false ).collapseRangeToEnd().select();

	// HACK: I could find a convenient way to immediately retrieve the inserted node.
	// fragment.getSelectedNode() returns null.
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
			// delete the node if the user has clicked the remove button
			// or if the formula is empty
			data = data || {};
			var shouldDelete = (
				this.node &&
				(data.action === "remove" || this.node.getFormula().match(/^\s*$/))
			);
			if ( shouldDelete ) {
				var fragment = this.getFragment();
				var type = this.node.type;
				var range = this.node.getRange();
				fragment.change( ve.dm.Transaction.newFromRemoval( fragment.document, this.node.getOuterRange() ) );

				// HACK: there is a glitch with the selection after removal for MathBlocks:
				// the selection wraps around the previous line break
				// Expected is, that the cursor returns to the initial position, i.e., to the begin of line
				// This served as a workaround
				if (type === 'mathBlock') {
					fragment.surface.setSelection( new ve.Range(range.start, range.start) );
				}
			}

			// leave staging mode
			this.getFragment().getSurface().applyStaging();

		}, this);
};

ve.ui.MathInspector.prototype.onFormulaChange = function() {
	var newFormula = this.mathInput.getValue();
	var fragment = this.getFragment();
	if (fragment) {
		// remove a previously displayed error message
		this.$errorEl.text('');

		var surface = fragment.getSurface();
		var doc = fragment.document;
		var txs = [
			ve.dm.Transaction.newFromAttributeChanges(
					doc, this.node.getOuterRange().start,
					{
						'formula': newFormula
					}
				)
		];
		surface.change(txs);
	}
};

ve.ui.MathInspector.prototype.onFormatChange = function() {
	var selectedItem = this.formatSelect.getSelectedItem();
	var formatType = selectedItem.data;

	var fragment = this.getFragment();
	if (fragment && this.node) {
		// remove a previously displayed error message
		this.$errorEl.text('');

		var surface = fragment.getSurface();
		var doc = fragment.document;
		var txs = [
			ve.dm.Transaction.newFromAttributeChanges(
					doc, this.node.getOuterRange().start,
					{
						'format': formatType
					}
				)
		];
		surface.change(txs);
	}
};

ve.ui.MathInspector.prototype.onParseError = function(message) {
	window.console.error("MathInspector.onParseError", message);
	this.$errorEl.text(message[1]);
};


/* Registration */

ve.ui.windowFactory.register( ve.ui.MathInspector );

