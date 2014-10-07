
ve.ui.CitationTool = function VeUiCitationTool( toolGroup, config ) {
  ve.ui.InspectorTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.CitationTool, ve.ui.InspectorTool );
ve.ui.CitationTool.static.name = 'citation';
ve.ui.CitationTool.static.group = 'insert';
ve.ui.CitationTool.static.icon = 'citation';
ve.ui.CitationTool.static.title = 'Citation';
ve.ui.CitationTool.static.modelClasses = [ ve.dm.CitationNode ];
ve.ui.CitationTool.static.commandName = 'citation';
ve.ui.toolFactory.register( ve.ui.CitationTool );

ve.ui.commandRegistry.register(
  new ve.ui.Command( 'citation', 'window', 'open', 'citation' )
);
