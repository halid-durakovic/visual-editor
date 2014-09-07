ve.ui.TableToolbar = function VeUiTableToolbar( surface, config ) {
  ve.ui.TableControls.call(this, surface, config);

  this.$element.addClass('ve-ui-tableToolbar');

  var $header = $('<div>').addClass('ve-ui-tableToolbar-header')
    .append( [
      this.label.$element
    ] );

  var rowButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableToolbar-buttons'), {} );
  rowButtons.addItems([
      this.insertRowBefore,
      this.insertRowAfter,
      this.deleteRow
    ] );

  var columnButtons = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableToolbar-buttons'), {} );
  columnButtons.addItems([
      this.insertColumnBefore,
      this.insertColumnAfter,
      this.deleteColumn
    ] );

  var others = new OO.ui.GroupElement($('<div>').addClass('ve-ui-tableToolbar-buttons'), {} );
  others.addItems([
    this.removeButton
    ] );


  this.$element.append([
    $header,
    rowButtons.$group,
    columnButtons.$group,
    others.$group
  ]);

};

OO.inheritClass( ve.ui.TableToolbar, ve.ui.TableControls );
