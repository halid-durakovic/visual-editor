/*!
 * VisualEditor MediaWiki UserInterface math tool class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/*global ve, OO */

/**
 * MediaWiki UserInterface math tool.
 *
 * @class
 * @extends ve.ui.InspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.MathInspectorTool = function VeUiMathInspectorTool( toolGroup, config ) {
	ve.ui.InspectorTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.MathInspectorTool, ve.ui.InspectorTool );
ve.ui.MathInspectorTool.static.name = 'math';
ve.ui.MathInspectorTool.static.group = 'insert';
ve.ui.MathInspectorTool.static.icon = 'math';
ve.ui.MathInspectorTool.static.title = 'Math';
ve.ui.MathInspectorTool.static.modelClasses = [ ve.dm.MathNode ];
ve.ui.MathInspectorTool.static.commandName = 'math';
ve.ui.toolFactory.register( ve.ui.MathInspectorTool );

ve.ui.commandRegistry.register(
	new ve.ui.Command( 'math', 'window', 'open', 'math' )
);
