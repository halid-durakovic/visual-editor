
/**
 * A helper class that allows random access to the table cells
 * and introduces place-holders for fields occupied by spanning cells,
 * making it a non-sparse representation of the sparse HTML model.
 * This is essential for the implementation of table manipulations, such as row insertions or deletions.
 *
 * Example:
 *
 * <table>
 *   <tr><td rowspan=2>1</td><td colspan=2>2</td><td rowspan=2 colspan=2>3</td></tr>
 *   <tr><td>4</td><td>5</td></tr>
 * </table>
 *
 * Visually this table would look like:
 *
 *  -------------------
 * | 1 | 2     | 3     |
 * |   |-------|       |
 * |   | 4 | 5 |       |
 *  -------------------
 *
 * The HTML model is sparse which makes it hard to read but also difficult to work with programmatically.
 * The corresponding TableCellMatrix would look like:
 *
 * | C[1] | C[2] | P[2] | C[3] | P[3] |
 * | P[1] | C[4] | C[5] | P[3] | P[3] |
 *
 * Where C[1] represents a Cell instance wrapping cell 1,
 * and P[1] a PlaceHolder instance owned by that cell.
 */
ve.dm.TableMatrix = function VeDmTableMatrix(tableNode) {
  OO.EventEmitter.call(this);

  this.table = tableNode;
  this.matrix = null;
  this.rowNodes = null;

  tableNode.connect( this, {
    'tableStructureChange': 'onTableStructureChange'
  });

  this.update();
};

OO.mixinClass( ve.dm.TableMatrix, OO.EventEmitter );

ve.dm.TableMatrix.prototype.onTableStructureChange = function( /* context */ ) {
  // TODO: we could try to update the matrix incrementally
  // but for sake of simplicity this is not done yet, instead recreated completely
  console.log('Recreating table matrix.');
  this.update();
};

ve.dm.TableMatrix.prototype.destroy = function() {
  this.tableNode.disconnect( this );
};

ve.dm.TableMatrix.prototype.update = function() {
  var cellNode, cell,
    rowSpan, colSpan, i, j, _row, _col,
    matrix = [],
    rowNodes = [],
    iterator = this.table.getIterator(),
    row = -1, col = -1;

  // hook to react on row transitions
  iterator.onNewRow = function(rowNode) {
    row++; col = -1;
    // initialize a matrix row
    matrix[row] = matrix[row] || [];
    // store the row node
    rowNodes.push(rowNode);
  };

  while ((cellNode = iterator.next()) !== null)  {
    col++;
    // skip placeholders
    while (matrix[row][col]) {
      col++;
    }
    cell = new ve.dm.TableMatrix.Cell(cellNode, row, col);
    // store the cell in the matrix
    matrix[row][col] = cell;
    // add place holders for spanned cells
    rowSpan = cellNode.getSpan('row');
    colSpan = cellNode.getSpan('col');
    if (rowSpan === 1 && colSpan === 1) continue;
    for (i = 0; i < rowSpan; i++) {
      for (j = 0; j < colSpan; j++) {
        if (i===0 && j===0) continue;
        _row = row + i;
        _col = col + j;
        // initialize the cell matrix row if not yet present
        matrix[_row] = matrix[_row] || [];
        matrix[_row][_col] = new ve.dm.TableMatrix.Placeholder(cell, _row, _col);
      }
    }
  }

  this.matrix = matrix;
  this.rowNodes = rowNodes;
};

ve.dm.TableMatrix.prototype.getColumn = function(col) {
  var cells, row;
  cells = [];
  for (row = 0; row < this.matrix.length; row++) {
    cells.push(this.matrix[row][col]);
  }
  return cells;
};

ve.dm.TableMatrix.prototype.getRowNode = function(row) {
  return this.rowNodes[row];
};

ve.dm.TableMatrix.prototype.getRow = function(row) {
  return this.matrix[row];
};

ve.dm.TableMatrix.prototype.lookupCell = function(rowNode, cellNode) {
  var row, col, cell, rowCells;
  row = this.rowNodes.indexOf(rowNode);
  if (row < 0) return null;
  cell = null;
  rowCells = this.matrix[row];
  for (col = 0; col < rowCells.length; col++) {
    cell = rowCells[col];
    if (cell.node === cellNode) {
      break;
    }
  }
  return cell;
};

ve.dm.TableMatrix.prototype.findClosestCell = function(cell) {
  var col,
    rowCells = this.matrix[cell.row];
  for (col = cell.col; col >= 0; col--) {
    if (rowCells[col].type === 'cell') return rowCells[col];
  }
  for (col = cell.col + 1; col < rowCells.length; col++) {
    if (rowCells[col].type === 'cell') return rowCells[col];
  }
  return null;
};


ve.dm.TableMatrix.Cell = function Cell(node, row, col) {
  this.type = 'cell';
  this.node = node;
  this.row = row;
  this.col = col;
  this.key = row + '_' + col;
};

ve.dm.TableMatrix.Cell.sortDescending = function(a, b) {
  if (a.row !== b.row) return b.row - a.row;
  return b.col - a.col;
};

ve.dm.TableMatrix.Placeholder = function PlaceHolder(owner, row, col) {
  this.type = 'placeholder';
  this.owner = owner;
  this.node = owner.node;
  this.row = row;
  this.col = col;
};
