ve.ui.commandRegistry.register(
  new ve.ui.Command( 'insertTable', 'table', 'create', {
    'rows': 5,
    'cols': 5
  } )
);

ve.ui.commandRegistry.register(
  new ve.ui.Command( 'deleteTable', 'table', 'delete')
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
