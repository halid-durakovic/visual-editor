/*global ve, OO */

/**
 * MediaWiki UserInterface table tool.
 *
 * @class
 * @extends ve.ui.InspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.TableInspectorTool = function VeUiTableInspectorTool( toolGroup, config ) {
  ve.ui.InspectorTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.TableInspectorTool, ve.ui.InspectorTool );
ve.ui.TableInspectorTool.static.name = 'table';
ve.ui.TableInspectorTool.static.group = 'insert';
ve.ui.TableInspectorTool.static.icon = 'table';
ve.ui.TableInspectorTool.static.title = 'Table';
ve.ui.TableInspectorTool.static.modelClasses = [ ve.dm.TableNode ];
ve.ui.TableInspectorTool.static.commandName = 'table';
ve.ui.toolFactory.register( ve.ui.TableInspectorTool );

ve.ui.commandRegistry.register(
  new ve.ui.Command( 'table', 'table', 'create', {
    'rows': 5,
    'cols': 5
  } )
);
