/*!
 * VisualEditor UserInterface LanguageInputWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Creates an ve.ui.LanguageInputWidget object.
 *
 * @class
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.LanguageInputWidget = function VeUiLanguageInputWidget( config ) {
	// Configuration initialization
	config = config || {};

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Properties
	this.annotation = null;
	this.overlay = new ve.ui.Overlay( { classes: ['ve-ui-overlay-global'] } );
	this.dialogs = new OO.ui.WindowManager( { factory: ve.ui.windowFactory } );
	this.findLanguageButton = new OO.ui.ButtonWidget( {
		$: this.$,
		classes: [ 've-ui-languageInputWidget-findLanguageButton' ],
		label: ve.msg( 'visualeditor-languageinspector-widget-changelang' ),
		indicator: 'next'
	} );
	this.languageCodeTextInput = new OO.ui.TextInputWidget( {
		$: this.$,
		classes: [ 've-ui-languageInputWidget-languageCodeTextInput' ]
	} );
	this.directionSelect = new OO.ui.ButtonSelectWidget( {
		$: this.$,
		classes: [ 've-ui-languageInputWidget-directionSelect' ]
	} );
	this.findLanguageField = new OO.ui.FieldLayout( this.findLanguageButton, {
		$: this.$,
		align: 'left',
		label: ve.msg( 'visualeditor-languageinspector-widget-label-language' )
	} );
	this.languageCodeField = new OO.ui.FieldLayout( this.languageCodeTextInput, {
		$: this.$,
		align: 'left',
		label: ve.msg( 'visualeditor-languageinspector-widget-label-langcode' )
	} );
	this.directionField = new OO.ui.FieldLayout( this.directionSelect, {
		$: this.$,
		align: 'left',
		label: ve.msg( 'visualeditor-languageinspector-widget-label-direction' )
	} );

	// Events
	this.findLanguageButton.connect( this, { click: 'onFindLanguageButtonClick' } );
	this.languageCodeTextInput.connect( this, { change: 'onChange' } );
	this.directionSelect.connect( this, { select: 'onChange' } );

	// Initialization
	this.directionSelect.addItems( [
		new OO.ui.ButtonOptionWidget( 'rtl', {
			$: this.$,
			icon: 'text-dir-rtl'
		} ),
		new OO.ui.ButtonOptionWidget( null, {
			$: this.$,
			label: ve.msg( 'visualeditor-dialog-language-auto-direction' )
		} ),
		new OO.ui.ButtonOptionWidget( 'ltr', {
			$: this.$,
			icon: 'text-dir-ltr'
		} )
	] );
	this.overlay.$element.append( this.dialogs.$element );
	$( 'body' ).append( this.overlay.$element );

	this.$element
		.addClass( 've-ui-langInputWidget' )
		.append(
			this.findLanguageField.$element,
			this.languageCodeField.$element,
			this.directionField.$element
		);
};

/* Inheritance */

OO.inheritClass( ve.ui.LanguageInputWidget, OO.ui.Widget );

/* Events */

/**
 * @event change
 * @param {ve.dm.LanguageAnnotation|null} Language annotation
 */

/* Methods */

/**
 * Handle find language button click events.
 */
ve.ui.LanguageInputWidget.prototype.onFindLanguageButtonClick = function () {
	this.dialogs.openWindow( 'languageSearch' )
		.then( ve.bind( function ( opened ) {
			opened.then( ve.bind( function ( closing ) {
				closing.then( ve.bind( function ( data ) {
					data = data || {};
					if ( data.action === 'apply' ) {
						this.setAnnotationFromValues( data.lang, data.dir );
					}
				}, this ) );
			}, this ) );
		}, this ) );
};

/**
 * Handle input widget change events.
 */
ve.ui.LanguageInputWidget.prototype.onChange = function () {
	if ( this.updating ) {
		return;
	}

	var selectedItem = this.directionSelect.getSelectedItem();
	this.setAnnotationFromValues(
		this.languageCodeTextInput.getValue(),
		selectedItem ? selectedItem.getData() : null
	);
};

/**
 * Set the annotation.
 *
 * The inputs value will automatically be updated.
 *
 * @param {ve.dm.LanguageAnnotation|null} annotation Language annotation or null to clear
 * @fires change
 */
ve.ui.LanguageInputWidget.prototype.setAnnotation = function ( annotation ) {
	if ( annotation && this.annotation && this.annotation.compareTo( annotation ) ) {
		// No change
		return;
	}

	// Set state flag while programmatically changing input widget values
	this.updating = true;
	if ( annotation ) {
		this.languageCodeTextInput.setValue( annotation.getAttribute( 'lang' ) );
		this.findLanguageButton.setLabel(
			ve.init.platform.getLanguageName( annotation.getAttribute( 'lang' ).toLowerCase() ) ||
			ve.msg( 'visualeditor-languageinspector-widget-changelang' )
		);
		this.directionSelect.selectItem(
			this.directionSelect.getItemFromData( annotation.getAttribute( 'dir' ) || null )
		);
	} else {
		this.languageCodeTextInput.setValue( '' );
		this.findLanguageButton.setLabel(
			ve.msg( 'visualeditor-languageinspector-widget-changelang' )
		);
		this.directionSelect.selectItem( this.directionSelect.getItemFromData( null ) );
	}
	this.updating = false;

	this.emit( 'change', annotation );
	this.annotation = annotation;
};

/**
 * Set language and/or direction values.
 *
 * @param {string} [lang] Language code
 * @param {string} [dir] Direction
 */
ve.ui.LanguageInputWidget.prototype.setAnnotationFromValues = function ( lang, dir ) {
	this.setAnnotation( lang || dir ?
		new ve.dm.LanguageAnnotation( {
			type: 'meta/language',
			attributes: {
				lang: lang,
				dir: dir
			}
		} ) :
		null
	);
};

/**
 * Get the annotation value.
 *
 * @returns {ve.dm.LanguageAnnotation|null} Language annotation
 */
ve.ui.LanguageInputWidget.prototype.getAnnotation = function () {
	return this.annotation;
};
