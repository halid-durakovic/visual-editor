/**
 * Math inspector.
 *
 * @class
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.TableInspector = function VeUiTableInspector( config ) {
  // Parent constructor
  ve.ui.Inspector.call( this, config );


};

/* Inheritance */

OO.inheritClass( ve.ui.TableInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.TableInspector.static.name = 'table';

ve.ui.TableInspector.static.icon = 'table';

// TODO: this should come from i18n configuration
ve.ui.TableInspector.static.title = 'Table';

ve.ui.TableInspector.static.modelClasses = [ ve.dm.TableNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.initialize = function () {
  // console.log("ve.ui.TableInspector.initialize()");

  // Parent method
  ve.ui.TableInspector.super.prototype.initialize.call( this );

  var insertRowAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-row-after',
    'label': 'Below'
  });
  var insertRowBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-row-before',
    'label': 'Above'
  });
  var insertColumnAfter = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-column-after',
    'label': 'Right'
  });
  var insertColumnBefore = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-insert-column-before',
    'label': 'Left'
  });
  var deleteRow = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-delete-row',
    'label': 'Delete'
  });
  var deleteColumn = new OO.ui.ButtonWidget({
    '$': this.$,
    'frameless': true,
    'icon': 'table-delete-column',
    'label': 'Delete'
  });

  var rowButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableInspector-buttons'), {} );
  rowButtons.addItems([
      insertRowBefore,
      insertRowAfter,
      deleteRow
    ] );
  var columnButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableInspector-buttons'), {} );
  columnButtons.addItems([
      insertColumnBefore,
      insertColumnAfter,
      deleteColumn
    ] );

  this.$body.append( [
      rowButtons.$group,
      columnButtons.$group
    ] );
};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getSetupProcess = function ( data ) {
  return ve.ui.TableInspector.super.prototype.getSetupProcess.call( this, data )
    .next( function () {
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getReadyProcess = function (/*data*/) {
  return ve.ui.TableInspector.super.prototype.getReadyProcess.call( this )
    .next( function () {
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableInspector.prototype.getTeardownProcess = function ( data ) {
  return ve.ui.TableInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
    }, this);
};


/* Registration */

ve.ui.windowFactory.register( ve.ui.TableInspector );
