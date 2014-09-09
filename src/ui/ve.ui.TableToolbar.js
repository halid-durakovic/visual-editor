/**
 * An experimental toolbar for table editing.
 * In the demo we dock the toolbar into the target toolbar and show it only
 * when a table is focussed.
 *
 * OO.ui.Toolbar is hacked to insert separators and labels.
 * TODO: maybe there could be a concept for such toolbars?
 *  - Contextual sub-toolbar
 *  - title, labels, separators
 *
 */
ve.ui.TableToolbar = function VeUiTableToolbar( surface, config ) {
	OO.ui.Toolbar.call(this, ve.ui.toolFactory, ve.ui.toolGroupFactory, config);

	this.surface = surface;

	// DOM changes

	this.setup([
		{
			classes: ['tableToolbar-insertGroup'],
			include: [ 'insertRowBefore', 'insertRowAfter', 'insertColumnBefore', 'insertColumnAfter' ]
		},
		{
			classes: ['tableToolbar-deleteGroup'],
			include: [ 'deleteRow', 'deleteColumn', 'deleteTable' ]
		}
	]);

	this.$element.addClass('ve-ui-tableToolbar');
	// title for the toolbar
	$('<div>').addClass('toolbarTitle')
		.append($('<span>').text('Table'))
		.insertBefore(this.$element.find('.tableToolbar-insertGroup'));
	// separator before the insert group
	$('<div>').addClass('toolbarSeparator')
		.insertBefore(this.$element.find('.tableToolbar-insertGroup'));
	// label for the insert group
	this.$element.find('.tableToolbar-insertGroup .oo-ui-toolGroup-tools')
		.prepend( $('<div>').addClass('toolGroupTitle')
			.append( $('<span>')
			.text( OO.ui.deferMsg( 'visualeditor-toolbar-table-insert' ) ) ) );
	// separator before the delete group
	$('<div>').addClass('toolbarSeparator')
		.insertBefore(this.$element.find('.tableToolbar-deleteGroup'));
	// label for the delete group
	this.$element.find('.tableToolbar-deleteGroup .oo-ui-toolGroup-tools')
		.prepend( $('<div>').addClass('toolGroupTitle')
			.append( $('<span>')
			.text( OO.ui.deferMsg( 'visualeditor-toolbar-table-delete' ) ) ) );

	this.setVisible(false);

	// Events

	this.surface.getModel().connect( this, { contextChange: 'onContextChange' } );
};

OO.inheritClass( ve.ui.TableToolbar, OO.ui.Toolbar );

ve.ui.TableToolbar.prototype.getSurface = function() {
	return this.surface;
};

/**
 * Handle context changes on the surface.
 *
 * @fires updateState
 */
ve.ui.TableToolbar.prototype.onContextChange = function () {
	this.updateToolState();
};

/**
 * Update the state of the tools
 */
ve.ui.TableToolbar.prototype.updateToolState = function () {
	var surface, selection, tableSelection;
	surface = this.surface.getModel();
	selection = surface.selection;
	tableSelection = ve.dm.TableNode.lookupSelection(surface.documentModel, selection);
	if (tableSelection) {
		this.setVisible(true);
	} else {
		this.setVisible(false);
	}
};

ve.ui.TableToolbar.prototype.setVisible = function ( visible ) {
	if (visible) {
		this.$element.css({ 'visibility': '' });
	} else {
		this.$element.css({ 'visibility': 'hidden' });
	}
};
