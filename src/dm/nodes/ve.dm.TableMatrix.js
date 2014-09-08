
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
  this.tableNode = tableNode;
  // Do not access these directly as they get invalidated on structural changes
  // Use the accessor methods instead.
  this._matrix = null;
  this._rowNodes = null;
};

ve.dm.TableMatrix.prototype.invalidate = function( /* context */ ) {
  this._matrix = null;
  this._rowNodes = null;
};

ve.dm.TableMatrix.prototype.update = function() {
  var cellNode, cell,
    rowSpan, colSpan, i, j, _row, _col,
    matrix = [],
    rowNodes = [],
    iterator = this.tableNode.getIterator(),
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

  this._matrix = matrix;
  this._rowNodes = rowNodes;
};

ve.dm.TableMatrix.prototype.getCell = function(row, col) {
  var matrix = this.getMatrix();
  return matrix[row][col];
};

ve.dm.TableMatrix.prototype.getColumn = function(col) {
  var cells, row,
    matrix = this.getMatrix();
  cells = [];
  for (row = 0; row < matrix.length; row++) {
    cells.push(matrix[row][col]);
  }
  return cells;
};

ve.dm.TableMatrix.prototype.getRow = function(row) {
  var matrix = this.getMatrix();
  return matrix[row];
};

ve.dm.TableMatrix.prototype.getRowNode = function(row) {
  var rowNodes = this.getRowNodes();
  return rowNodes[row];
};

ve.dm.TableMatrix.prototype.getMatrix = function() {
  if (!this._matrix) this.update();
  return this._matrix;
};

ve.dm.TableMatrix.prototype.getRowNodes = function() {
  if (!this._rowNodes) this.update();
  return this._rowNodes;
};

ve.dm.TableMatrix.prototype.getRectangle = function (startCellNode, endCellNode) {
  var startCell, endCell, minRow, maxRow, minCol, maxCol;
  startCell = this.lookupCell(startCellNode);
  if (!startCell) return null;
  if (startCellNode === endCellNode) {
    endCell = startCell;
  } else {
    endCell = this.lookupCell(endCellNode);
  }
  minRow = Math.min(startCell.row, endCell.row);
  maxRow = Math.max(startCell.row, endCell.row);
  minCol = Math.min(startCell.col, endCell.col);
  maxCol = Math.max(startCell.col, endCell.col);
  return {
    start: { row: minRow, col: minCol },
    end: { row: maxRow, col: maxCol }
  };
};

ve.dm.TableMatrix.prototype.getCellsForRectangle = function (rect) {
  var row, col, cells, visited, cell;
  cells = [];
  visited = {};
  for (row = rect.start.row; row <= rect.end.row; row++) {
    for (col = rect.start.col; col <= rect.end.col; col++) {
      cell = this.getCell(row, col);
      if (cell.type === 'placeholder') cell = cell.owner;
      if (!visited[cell.key]) {
        cells.push(cell);
        visited[cell.key] = true;
      }
    }
  }
  return cells;
};

ve.dm.TableMatrix.prototype.getBoundingRectangle = function (rect) {
  var cells, cell, i;
  cells = this.getCellsForRectangle(rect);
  if (!cells || cells.length === 0) return null;
  for (i = 0; i < cells.length; i++) {
    cell = cells[i];
    rect.start.row = Math.min(rect.start.row, cell.row);
    rect.start.col = Math.min(rect.start.col, cell.col);
    rect.end.row = Math.max(rect.end.row, cell.row + cell.node.getSpan('row') - 1);
    rect.end.col = Math.max(rect.end.col, cell.col + cell.node.getSpan('col') - 1);
  }
  return rect;
};

ve.dm.TableMatrix.prototype.getSize = function () {
  var matrix = this.getMatrix();
  if (matrix.length === 0) {
    return [0, 0];
  } else {
    return [matrix.length, matrix[0].length];
  }
};

ve.dm.TableMatrix.prototype.lookupCell = function(cellNode) {
  var row, col, cell, rowCells,
    matrix = this.getMatrix(),
    rowNodes = this.getRowNodes();
  row = rowNodes.indexOf(cellNode.parent);
  if (row < 0) return null;
  cell = null;
  rowCells = matrix[row];
  for (col = 0; col < rowCells.length; col++) {
    cell = rowCells[col];
    if (cell.node === cellNode) {
      break;
    }
  }
  return cell;
};

ve.dm.TableMatrix.prototype.findClosestCell = function(cell) {
  var col, rowCells,
    matrix = this.getMatrix();
  rowCells = matrix[cell.row];
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
