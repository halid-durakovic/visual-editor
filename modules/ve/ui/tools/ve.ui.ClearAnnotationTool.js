/*!
 * VisualEditor UserInterface ClearAnnotationTool class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface clear tool.
 *
 * @class
 * @extends ve.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.ClearAnnotationTool = function VeUiClearAnnotationTool( toolGroup, config ) {
	// Parent constructor
	ve.ui.Tool.call( this, toolGroup, config );

	// Initialization
	this.setDisabled( true );
};

/* Inheritance */

OO.inheritClass( ve.ui.ClearAnnotationTool, ve.ui.Tool );

/* Static Properties */

ve.ui.ClearAnnotationTool.static.name = 'clear';

ve.ui.ClearAnnotationTool.static.group = 'utility';

ve.ui.ClearAnnotationTool.static.icon = 'clear';

ve.ui.ClearAnnotationTool.static.title =
	OO.ui.deferMsg( 'visualeditor-clearbutton-tooltip' );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.ClearAnnotationTool.prototype.onSelect = function () {
	this.toolbar.getSurface().execute( 'annotation', 'clearAll' );
};

/**
 * @inheritdoc
 */
ve.ui.ClearAnnotationTool.prototype.onUpdateState = function ( nodes, full, partial ) {
	this.setDisabled( partial.isEmpty() );
};

/* Registration */

ve.ui.toolFactory.register( ve.ui.ClearAnnotationTool );
