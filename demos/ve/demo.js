/*!
 * VisualEditor standalone demo
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

ve.globalEvents = new OO.EventEmitter();

$( function () {

	function getDemoPageItems() {
		var name, items = [];
		for ( name in ve.demoPages ) {
			items.push(
				new OO.ui.MenuItemWidget( ve.demoPages[name],  { label: name } )
			);
		}
		return items;
	}

	var currentTarget,
		initialPage,

		lastMode = null,

		$menu = $( '.ve-demo-menu' ),
		$editor = $( '.ve-demo-editor' ),
		$targetContainer = $( '<div>' ),

		switching = false,

		lang = $.i18n().locale,
		dir = $targetContainer.css( 'direction' ) || 'ltr',

		// Menu widgets
		pageMenu = new OO.ui.InlineMenuWidget( {
			menu: {
				items: getDemoPageItems()
			}
		} ),
		pageLabel = new OO.ui.LabelWidget(
			{ label: 'Page', input: pageMenu }
		),

		modeSelect = new OO.ui.ButtonSelectWidget().addItems( [
			new OO.ui.ButtonOptionWidget( 've', { label: 'VE' } ),
			new OO.ui.ButtonOptionWidget( 'edit', { label: 'Edit HTML' } ),
			new OO.ui.ButtonOptionWidget( 'read', { label: 'Read' } )
		] ),
		languageTextInput = new OO.ui.TextInputWidget( { value: lang } ),
		languageDirectionButton = new OO.ui.ButtonWidget( { label: 'Set language & direction' } ),
		directionSelect = new OO.ui.ButtonSelectWidget().addItems( [
			new OO.ui.ButtonOptionWidget( 'rtl', { icon: 'text-dir-rtl' } ),
			new OO.ui.ButtonOptionWidget( 'ltr', { icon: 'text-dir-ltr' } )
		] ),
		sourceTextInput = new OO.ui.TextInputWidget( {
			$: this.$,
			multiline: true,
			autosize: true,
			maxRows: 999,
			classes: ['ve-demo-source']
		} ),
		$readView = $( '<div>' ).addClass( 've-demo-read' ).hide();

	// Initialization
	pageMenu.getMenu().on( 'select', function ( item ) {
		var page = item.getData();
		if ( window.history.replaceState ) {
			window.history.replaceState( null, document.title, '#!/src/' + page );
		}
		switchPage( 've', page );
	} );

	languageDirectionButton.on( 'click', function () {
		$.i18n().locale = lang = languageTextInput.getValue();
		dir = directionSelect.getSelectedItem().getData();

		// HACK: Override/restore message functions for qqx mode
		if ( lang === 'qqx' ) {
			ve.init.platform.getMessage = function ( key ) { return key; };
		} else {
			ve.init.platform.getMessage = ve.init.sa.Platform.prototype.getMessage;
		}

		// Re-bind as getMessage may have changed
		OO.ui.msg = ve.bind( ve.init.platform.getMessage, ve.init.platform );

		// HACK: Re-initialize page to load message files
		ve.init.platform.initialize().done( function () {
			loadPage( location.hash.slice( 7 ), true );
		} );
	} );

	modeSelect.on( 'select', function ( item ) {
		if ( !switching ) {
			switchPage( item.getData() );
		}
	} );

	function switchPage( mode, page ) {
		var model, doc, html, closePromise,
			dir = 'ltr';

		switching = true;
		modeSelect.selectItem( modeSelect.getItemFromData( mode ) );
		switching = false;

		switch ( lastMode ) {
			case 've':
				closePromise = $targetContainer.slideUp().promise();
				if ( !page ) {
					model = currentTarget.getSurface().getModel().getDocument() ;
					doc = ve.dm.converter.getDomFromModel( model );
					html = ve.properInnerHtml( doc.body );
					dir = model.getDir();
				}
				break;

			case 'edit':
				closePromise = sourceTextInput.$element.slideUp().promise();
				if ( !page ) {
					html = sourceTextInput.getValue();
				}
				break;

			case 'read':
				closePromise = $readView.slideUp().promise();
				if ( !page ) {
					html = ve.properInnerHtml( $readView[0] );
				}
				break;

			default:
				closePromise = $.Deferred().resolve().promise();
				break;
		}

		closePromise.done( function () {
			switch ( mode ) {
				case 've':
					if ( page ) {
						loadPage( page );
					} else if ( html ) {
						loadTarget( html );
					}
					break;

				case 'edit':
					sourceTextInput.$element.show();
					sourceTextInput.setValue( html ).adjustSize();
					sourceTextInput.$element.hide();

					sourceTextInput.$element.slideDown().promise().done( function () {
						sourceTextInput.focus();
					} );
					if ( ve.debug ) {
						currentTarget.debugBar.$element.remove();
					}
					break;

				case 'read':
					$readView.html( html ).css( 'direction', dir ).slideDown();
					break;
			}
			lastMode = mode;
		} );
	}

	directionSelect.selectItem( directionSelect.getItemFromData( dir ) );

	$menu.append(
		$( '<div>' ).addClass( 've-demo-menu-commands' ).append(
			pageLabel.$element,
			pageMenu.$element,
			$( '<span class="ve-demo-menu-divider">&nbsp;</span>' ),
			modeSelect.$element,
			$( '<span class="ve-demo-menu-divider">&nbsp;</span>' ),
			languageTextInput.$element,
			directionSelect.$element,
			languageDirectionButton.$element
		)
	);

	$editor.append( $targetContainer, sourceTextInput.$element.hide(), $readView );

	/**
	 * Load a page into the editor
	 *
	 * @private
	 * @param {string} src Path of html to load
	 * @param {boolean} [forceDir] Force directionality to its current value, otherwise guess from src
	 */
	function loadPage( src, forceDir ) {
		if ( !forceDir ) {
			dir = src.match( /rtl\.html$/ ) ? 'rtl' : 'ltr';
		}

		$targetContainer.slideUp().promise().done( function () {
			$.ajax( {
				url: src,
				dataType: 'text'
			} ).always( function ( result, status ) {
				var pageHtml;

				if ( status === 'error' ) {
					pageHtml = '<p><i>Failed loading page ' + $( '<span>' ).text( src ).html() + '</i></p>';
				} else {
					pageHtml = result;
				}

				loadTarget( pageHtml );
			} );
		} );
	}

	function loadTarget( pageHtml ) {
		if ( currentTarget ) {
			currentTarget.destroy();
		}

		var $container = $( '<div>' ),
			oldDir = dir === 'ltr' ? 'rtl' : 'ltr';

		$( '.stylesheet-' + dir ).prop( 'disabled', false );
		$( '.stylesheet-' + oldDir ).prop( 'disabled', true );

		// Container needs to be visually hidden, but not display:none
		// so that the toolbar can be measured
		$targetContainer.empty().show().css( {
			height: 0,
			overflow: 'hidden'
		} );

		$targetContainer.css( 'direction', dir );

		// The container must be attached to the DOM before
		// the target is initialised
		$targetContainer.append( $container );

		$targetContainer.show();
		currentTarget = new ve.init.sa.Target(
			$container,
			ve.dm.converter.getModelFromDom(
				ve.createDocumentFromHtml( pageHtml ),
				$targetContainer.ownerDocument,
				lang,
				dir
			)
		);

		currentTarget.on( 'surfaceReady', function () {
			var surfaceView = currentTarget.getSurface().getView();

			ve.globalEvents.emit('surfaceReady', surfaceView);

			// Container must be properly hidden before slideDown animation
			$targetContainer.removeAttr( 'style' ).hide()
				// Restore directionality
				.css( 'direction', dir );

			$targetContainer.slideDown().promise().done( function () {
				surfaceView.focus();
			} );
		} );
	}

	// Open initial page
	if ( /^#!\/src\/.+$/.test( location.hash ) ) {
		initialPage = location.hash.slice( 7 );
	} else {
		initialPage = pageMenu.getMenu().getFirstSelectableItem().getData();
		// Per W3 spec, history.replaceState does not fire hashchange
	}
	pageMenu.getMenu().selectItem( pageMenu.getMenu().getItemFromData( initialPage ) );

	window.addEventListener( 'hashchange', function () {
		if ( /^#!\/src\/.+$/.test( location.hash ) ) {
			pageMenu.getMenu().selectItem( pageMenu.getMenu().getItemFromData( location.hash.slice( 7 ) ) );
		}
	} );

} );
