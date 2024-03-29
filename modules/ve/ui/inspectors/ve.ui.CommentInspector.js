/*!
 * VisualEditor UserInterface CommentInspector class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Special character inspector.
 *
 * @class
 * @extends ve.ui.NodeInspector
 *
 * @constructor
 * @param {OO.ui.WindowManager} manager Manager of window
 * @param {Object} [config] Configuration options
 */
ve.ui.CommentInspector = function VeUiCommentInspector( manager, config ) {
	// Parent constructor
	ve.ui.NodeInspector.call( this, manager, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommentInspector, ve.ui.NodeInspector );

/* Static properties */

ve.ui.CommentInspector.static.name = 'comment';

ve.ui.CommentInspector.static.icon = 'comment';

ve.ui.CommentInspector.static.title =
	OO.ui.deferMsg( 'visualeditor-commentinspector-title' );

ve.ui.CommentInspector.static.modelClasses = [ ve.dm.CommentNode ];

ve.ui.CommentInspector.static.size = 'large';

ve.ui.CommentInspector.static.actions = [
	{
		action: 'done',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
		flags: 'primary',
		modes: 'edit'
	},
	{
		action: 'insert',
		label: OO.ui.deferMsg( 'visualeditor-commentinspector-insert' ),
		flags: [ 'constructive', 'primary' ],
		modes: 'insert'
	},
	{
		action: 'remove',
		label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
		flags: 'destructive',
		modes: 'edit'
	}
];

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.CommentInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.CommentInspector.super.prototype.initialize.call( this );

	this.editWidget = new OO.ui.TextInputWidget( {
		$: this.$,
		multiline: true,
		autosize: true
	} );

	this.frame.$content.addClass( 've-ui-commentInspector-content' );
	this.form.$element.append( this.editWidget.$element );
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getActionProcess = function ( action ) {
	if ( action === 'remove' || action === 'insert' ) {
		return new OO.ui.Process( function () {
			this.close( { action: action } );
		}, this );
	}
	return ve.ui.CommentInspector.super.prototype.getActionProcess.call( this, action );
};

/**
 * Handle the inspector being setup.
 *
 * @method
 * @param {Object} [data] Inspector opening data
 */
ve.ui.CommentInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.CommentInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var text;

			// Disable surface until animation is complete; will be reenabled in ready()
			this.getFragment().getSurface().disable();

			this.commentNode = this.getSelectedNode();
			this.whitespace = [ '', '' ];
			if ( this.commentNode ) {
				// Trim leading/trailing whitespace but restore it on save
				text = this.commentNode.getAttribute( 'text' ) || '';
				this.whitespace[0] = text.match( /^\s*/ )[0];
				text = text.substring( this.whitespace[0].length );
				this.whitespace[1] = text.match( /\s*$/ )[0];
				text = text.substring( 0, text.length - this.whitespace[1].length );

				this.editWidget.setValue( text );
				this.actions.setMode( 'edit' );
			} else {
				this.editWidget.setValue( '' );
				this.actions.setMode( 'insert' );
			}
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getReadyProcess = function ( data ) {
	return ve.ui.CommentInspector.super.prototype.getReadyProcess.call( this, data )
		.next( function () {
			this.getFragment().getSurface().enable();
			this.editWidget.focus();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getTeardownProcess = function ( data ) {
	data = data || {};
	return ve.ui.CommentInspector.super.prototype.getTeardownProcess.call( this, data )
		.first( function () {
			var surfaceModel = this.getFragment().getSurface(),
				newValue = this.editWidget.getValue(),
				rawNewValue = this.whitespace[0] + newValue + this.whitespace[1];

			if ( this.commentNode ) {
				if ( data.action === 'remove' || newValue === '' ) {
					// Remove comment node
					this.fragment = this.getFragment().clone( this.commentNode.getOuterRange() );
					this.fragment.removeContent();
				} else {
					// Edit comment node
					surfaceModel.change(
						ve.dm.Transaction.newFromAttributeChanges(
							surfaceModel.getDocument(),
							this.commentNode.getOffset(),
							{ text: rawNewValue }
						)
					);
				}
			} else if ( newValue !== '' ) {
				// Insert new comment node
				this.getFragment().insertContent( [
					{
						type: 'comment',
						attributes: { text: rawNewValue }
					},
					{ type: '/comment' }
				] );
			}

			this.editWidget.setValue( '' );
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CommentInspector );
