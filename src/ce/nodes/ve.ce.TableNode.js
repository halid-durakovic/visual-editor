/*!
 * VisualEditor ContentEditable TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable table node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.TableNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableNode = function VeCeTableNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );

	this.focussed = false;
	// a ve.dm.TableMatrix.Rectange instance or null if no valid selection
	this.selectedRectangle = null;

	/* Events */

	this.connect( this, {
		'setup': 'onTableNodeSetup',
		'teardown': 'onTableNodeTeardown',
	} );
};

/* Inheritance */

OO.inheritClass( ve.ce.TableNode, ve.ce.BranchNode );

/* Prototype */

ve.ce.TableNode.prototype.onTableNodeSetup = function() {
	// Exit if already setup or not attached
	if ( this.isSetup || !this.root ) {
		return;
	}
	var surface = this.getRoot().getSurface();
	this.surfaceModel = surface.getModel();

	// DOM changes

	this.$element.addClass( 've-ce-tableNode' );

	// Overlay

	this.$rulerTop = $('<div>').addClass('ruler horizontal top');
	this.$rulerBottom = $('<div>').addClass('ruler horizontal bottom');
	this.$rulerLeft = $('<div>').addClass('ruler vertical left');
	this.$rulerRight = $('<div>').addClass('ruler vertical right');
	this.$bbox = $('<div>').addClass('selection-box');
	this.$rowBracket = $('<div>').addClass('row-bracket');
	this.$colBracket = $('<div>').addClass('column-bracket');

	this.$overlay = $('<div contenteditable="false">')
		.addClass('ve-ce-tableNodeOverlay')
		.append([
			this.$rulerTop, this.$rulerBottom,
			this.$rulerLeft, this.$rulerRight,
			this.$bbox,
			this.$rowBracket,
			this.$colBracket
		] );
	this.$element.append(this.$overlay);

	// Events

	this.surfaceModel.connect( this, { 'select': 'onSurfaceModelSelect' });
};

ve.ce.TableNode.prototype.onTableNodeTeardown = function() {
	this.surfaceModel.disconnect( this );
};

/**
 * Reacts on selection changes and detects when the selection is fully within
 * the table.
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function( selection ) {
	var range = this.model.getRange();
	var isSelected, tableSelection;

	// consider this table focussed when the selection is fully within the range
	isSelected = (selection && range.containsOffset(selection.from) && range.containsOffset(selection.to));

	// make sure that the selection does really belong to this table not to a nested one
	if (isSelected) {
		tableSelection = ve.dm.TableNode.lookupSelection(this.surfaceModel.documentModel, selection);
		isSelected = (tableSelection && tableSelection.node === this.model);
	}

	if (isSelected) {
		if (!this.focussed) {
			this.focussed = true;
			this.$element.addClass('focussed');
		}
		this.selectedRectangle = this.model.getRectangle(tableSelection.startCell, tableSelection.endCell);
		this.updateOverlay();
	} else if (!isSelected && this.focussed) {
		this.focussed = false;
		this.selectedRectangle = null;
		this.$element.removeClass('focussed');
		this.$element.find('.selected').removeClass('selected');
	}
};

/**
 * Recomputes the overlay positions according to the current selection.
 *
 * @method
 */
ve.ce.TableNode.prototype.updateOverlay = function() {
	var $cells, $cell, offset, width, height,
		top, left, bottom, right,
		tableOffset, tableHeight, tableWidth;

	this.$overlay.css({'visibility': 'hidden'});

	$cells = this.getElementsForSelectedRectangle();
	this.$element.find('.selected').removeClass('selected');

	top = Number.MAX_VALUE;
	bottom = 0;
	left = Number.MAX_VALUE;
	right = 0;

	// compute a bounding box for the given cell elements
	for (var i = 0; i < $cells.length; i++) {
		$cell = $cells[i];
		$cell.addClass('selected');
		offset = $cell.offset();
		width = $cell.outerWidth();
		height = $cell.outerHeight();

		top = Math.min(top, offset.top);
		bottom = Math.max(bottom, offset.top + height);
		left = Math.min(left, offset.left);
		right = Math.max(right, offset.left + width);
	}

	tableOffset = this.$element.offset();
	tableHeight = this.$element.height();
	tableWidth = this.$element.width();

	this.$rulerTop.css({
		'top': top - tableOffset.top,
		'width': tableWidth
	} );
	this.$rulerBottom.css({
		'top': bottom - tableOffset.top,
		'width': tableWidth
	} );
	this.$rulerLeft.css({
		'left': left - tableOffset.left,
		'height': tableHeight
	} );
	this.$rulerRight.css({
		'left': right - tableOffset.left,
		'height': tableHeight
	} );
	this.$bbox.css({
		'left': left - tableOffset.left,
		'top': top - tableOffset.top,
		// Note: can we get the border strength (last subtractor) from the element?
		'height': bottom - top - 2,
		'width': right - left - 2,
	} );
	this.$rowBracket.css({
		'top': top - tableOffset.top - 2,
		// Note: can we get the border strength (last subtractor) from the element?
		'height': bottom - top,
	} );
	this.$colBracket.css({
		'left': left - tableOffset.left - 2,
		'width': right - left,
	} );

	this.$overlay.css({'visibility': ''});
};

/**
 * Retrieves DOM elements corresponding to the the cells for the current selection.
 */
ve.ce.TableNode.prototype.getElementsForSelectedRectangle = function() {
	var cellModels, cells, rect, cell, cellNode, offset, matrix, i;
	cells = [];
	matrix = this.model.matrix;
	rect = this.selectedRectangle;
	rect = matrix.getBoundingRectangle(rect);
	cellModels = matrix.getCellsForRectangle(rect);
	for (i = 0; i < cellModels.length; i++) {
		cell = cellModels[i];
		offset = cell.node.getRange().start - this.model.getRange().start;
		cellNode = this.getNodeFromOffset(offset);
		cells.push(cellNode.$element);
	}
	return $(cells);
};

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
