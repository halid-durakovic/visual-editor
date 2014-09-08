
ve.ui.InsertTable = function VeUiInsertTable( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.InsertTable, ve.ui.Tool );
ve.ui.InsertTable.static.name = 'insertTable';
ve.ui.InsertTable.static.group = 'insert';
ve.ui.InsertTable.static.icon = 'table';
ve.ui.InsertTable.static.title = 'Table';
ve.ui.InsertTable.static.commandName = 'insertTable';
ve.ui.toolFactory.register( ve.ui.InsertTable );

ve.ui.DeleteTable = function VeUiDeleteTable( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.DeleteTable, ve.ui.Tool );
ve.ui.DeleteTable.static.name = 'deleteTable';
ve.ui.DeleteTable.static.group = 'table';
ve.ui.DeleteTable.static.autoAddToCatchall = false;
ve.ui.DeleteTable.static.icon = 'remove';
ve.ui.DeleteTable.static.title = OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' );
ve.ui.DeleteTable.static.commandName = 'deleteTable';
ve.ui.toolFactory.register( ve.ui.DeleteTable );

ve.ui.InsertRowBefore = function VeUiInsertRowBefore( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.InsertRowBefore, ve.ui.Tool );
ve.ui.InsertRowBefore.static.name = 'insertRowBefore';
ve.ui.InsertRowBefore.static.group = 'table';
ve.ui.InsertRowBefore.static.autoAddToCatchall = false;
ve.ui.InsertRowBefore.static.icon = 'table-insert-row-before';
ve.ui.InsertRowBefore.static.title = 'Above';
ve.ui.InsertRowBefore.static.commandName = 'insertRowBefore';
ve.ui.toolFactory.register( ve.ui.InsertRowBefore );

ve.ui.InsertRowAfter = function VeUiInsertRowAfter( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.InsertRowAfter, ve.ui.Tool );
ve.ui.InsertRowAfter.static.name = 'insertRowAfter';
ve.ui.InsertRowAfter.static.group = 'table';
ve.ui.InsertRowAfter.static.autoAddToCatchall = false;
ve.ui.InsertRowAfter.static.icon = 'table-insert-row-after';
ve.ui.InsertRowAfter.static.title = 'Below';
ve.ui.InsertRowAfter.static.commandName = 'insertRowAfter';
ve.ui.toolFactory.register( ve.ui.InsertRowAfter );

ve.ui.DeleteRow = function VeUiDeleteRow( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.DeleteRow, ve.ui.Tool );
ve.ui.DeleteRow.static.name = 'deleteRow';
ve.ui.DeleteRow.static.group = 'table';
ve.ui.DeleteRow.static.autoAddToCatchall = false;
ve.ui.DeleteRow.static.icon = 'table-delete-row';
ve.ui.DeleteRow.static.title = OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' );
ve.ui.DeleteRow.static.commandName = 'deleteRow';
ve.ui.toolFactory.register( ve.ui.DeleteRow );

ve.ui.InsertColumnBefore = function VeUiInsertColumnBefore( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.InsertColumnBefore, ve.ui.Tool );
ve.ui.InsertColumnBefore.static.name = 'insertColumnBefore';
ve.ui.InsertColumnBefore.static.group = 'table';
ve.ui.InsertColumnBefore.static.autoAddToCatchall = false;
ve.ui.InsertColumnBefore.static.icon = 'table-insert-column-before';
ve.ui.InsertColumnBefore.static.title = 'Left';
ve.ui.InsertColumnBefore.static.commandName = 'insertColumnBefore';
ve.ui.toolFactory.register( ve.ui.InsertColumnBefore );

ve.ui.InsertColumnAfter = function VeUiInsertColumnAfter( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.InsertColumnAfter, ve.ui.Tool );
ve.ui.InsertColumnAfter.static.name = 'insertColumnAfter';
ve.ui.InsertColumnAfter.static.group = 'table';
ve.ui.InsertColumnAfter.static.autoAddToCatchall = false;
ve.ui.InsertColumnAfter.static.icon = 'table-insert-column-after';
ve.ui.InsertColumnAfter.static.title = 'Right';
ve.ui.InsertColumnAfter.static.commandName = 'insertColumnAfter';
ve.ui.toolFactory.register( ve.ui.InsertColumnAfter );

ve.ui.DeleteColumn = function VeUiDeleteColumn( toolGroup, config ) {
  ve.ui.Tool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.DeleteColumn, ve.ui.Tool );
ve.ui.DeleteColumn.static.name = 'deleteColumn';
ve.ui.DeleteColumn.static.group = 'table';
ve.ui.DeleteColumn.static.autoAddToCatchall = false;
ve.ui.DeleteColumn.static.icon = 'table-delete-column';
ve.ui.DeleteColumn.static.title = OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' );
ve.ui.DeleteColumn.static.commandName = 'deleteColumn';
ve.ui.toolFactory.register( ve.ui.DeleteColumn );

ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertTable', 'table', 'create', {
    'rows': 5,
    'cols': 5
  } )
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'deleteTable', 'table', 'delete', 'table')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertRowBefore', 'table', 'insert', 'row', 'before')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertRowAfter', 'table', 'insert', 'row', 'after')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'deleteRow', 'table', 'delete', 'row')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertColumnBefore', 'table', 'insert', 'col', 'before')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertColumnAfter', 'table', 'insert', 'col', 'after')
);
ve.ui.commandRegistry.register(
  new ve.ui.Command( 'deleteColumn', 'table', 'delete', 'col')
);
