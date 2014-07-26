/**
 * Tool that triggers creation of a TableNode.
 *
 * @class
 * @extends ve.ui.InspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.TableTool = function VeUiTableTool( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.TableTool, ve.ui.Tool );
ve.ui.TableTool.static.name = 'table';
ve.ui.TableTool.static.group = 'insert';
ve.ui.TableTool.static.icon = 'table';
// TODO: use i18n
ve.ui.TableTool.static.title = 'Table';
// ve.ui.TableTool.static.modelClasses = [ ve.dm.TableNode ];
ve.ui.TableTool.static.commandName = 'table';
ve.ui.toolFactory.register( ve.ui.TableTool );

ve.ui.commandRegistry.register(
  new ve.ui.Command( 'table', 'table', 'create', {
    'rows': 5,
    'cols': 5
  } )
);
