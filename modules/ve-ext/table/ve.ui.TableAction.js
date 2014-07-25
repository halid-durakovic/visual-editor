/**
 * Table action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.TableAction = function VeUiTableAction( surface ) {
  // Parent constructor
  ve.ui.Action.call( this, surface );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableAction, ve.ui.Action );

/* Static Properties */

ve.ui.TableAction.static.name = 'table';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.TableAction.static.methods = [ 'create' ];

/* Methods */

/**
 * Create a new table.
 *
 * @method
 */
ve.ui.TableAction.prototype.create = function (options) {
  var numberOfCols = options.cols,
      numberOfRows = options.rows,
      surface, fragment,
      data, node, pos;

  function _addRow(data, style) {
    data.push({ type: 'tableRow'});
    for (var i = 0; i < numberOfCols; i++) {
      data.push({type: 'tableCell', 'attributes': { 'style': style } });
      data.push({type: 'paragraph'});
      if (style === 'header') {
        // TODO: the initial label for the column should come from the i18n dictionary
        data.push('Column ' + (i+1) );
      }
      data.push({type: '/paragraph'});
      data.push({type: '/tableCell'});
    }
    data.push({ type: '/tableRow'});
  }

  data = [];
  data.push({type: 'table'})
  data.push({type: 'tableSection', 'attributes': {'style': 'header'} });
  _addRow(data, 'header');
  data.push({type: '/tableSection'});
  data.push({type: 'tableSection', 'attributes': {'style': 'body'} });
  for (var i = 0; i < numberOfRows; i++) {
    _addRow(data, 'data');
  }
  data.push({type: '/tableSection'});
  data.push({type: '/table'})

  surface = this.surface.getModel();
  fragment = surface.getFragment(surface.getSelection());
  fragment.insertContent(data, false).collapseRangeToEnd().select();

  // set the cursor into the first data cell
  node = fragment.getSelectedNode();
  // HACK: there should be a more generic way to retrieve the first data cell
  pos = node.children[1].children[0].children[0].children[0].getRange().start;
  surface.setSelection(new ve.Range(pos, pos));
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.TableAction );
