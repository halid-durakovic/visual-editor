
ve.ui.CitationInspector = function VeUiCitationInspector( config ) {
  // Parent constructor
  ve.ui.NodeInspector.call( this, config );

  this.$frame.addClass('ve-ui-citationManager');

  // TODO: use a global configuration here
  this.newReferencesCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());
  this.lookupServices = ve.ui.CitationLookupService.getServices();
  this._runningLookups = {};

  // created in initialize
  this.removeButton = new OO.ui.ActionWidget({
    action: 'remove',
    icon: 'remove',
    label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
    modes: 'edit'
  });
  this.closeButton = new OO.ui.ActionWidget({
    action: 'done',
    icon: 'back',
    label: OO.ui.deferMsg( 'visualeditor-inspector-close-tooltip' ),
    modes: 'edit'
  });

  this.$searchBar = $('<div>').addClass('searchbar');
  var $searchBarContainer = $('<div>').addClass('container');
  var $searchFieldLabel = $('<span>').addClass('label').text('Find Reference');
  this.searchField = new OO.ui.TextInputWidget( {
    $: this.$,
    autosize: true,
    classes: ['search-field']
  } );
  this.searchButton = new OO.ui.ActionWidget( {
    action: 'search',
    label: 'Search',
    modes: 'edit',
    classes: ['search-button']
  } );
  this.searchSpinner = $('<div>').addClass('spinner').append( $('<div>').addClass('throbber') );
  this.referencesTab = new OO.ui.ActionWidget({
    action: 'references',
    label: 'References',
    classes: ['tab', 'referencesTab']
  });
  $searchBarContainer.append([ $searchFieldLabel, this.searchField.$element, this.searchSpinner, this.searchButton.$element ] );
  this.$searchBar.append( $searchBarContainer );

  this.newReferencesTab = new OO.ui.ActionWidget({
    action: 'newReferences',
    label: 'New References',
    classes: ['tab', 'newReferencesTab']
  });

  // set when opening a tab
  this.currentTabName = "";
  this.tabStates = {
    "local": {
      searchStr: ""
    },
    "new": {
      searchStr: ""
    }
  };

  this.$info =  $('<div>').addClass('description');

  // either "search" or "select", set when typing into search field or when navigating cursor
  this.inputMethod = "";

  this.panels = null;
  this.$panels = $('<div>').addClass('referencePanels');

  // created when adding the first reference or extracted from document
  this.bibliography = null;
  this.referenceElements = null;
  this.refIndex = {};

  // extracted from fragment on setup when the inspector is opened for an existing citation
  this.citationNode = null;

  // to support keyboard driven selection
  this.filterPattern = "";

  this.removeButton.connect(this, { click: ['executeAction', 'remove' ] });
  this.closeButton.connect(this, { click: ['executeAction', 'done' ] });
  this.searchButton.connect(this, { click: ['executeAction', 'search' ] });
  this.referencesTab.connect(this, { click: ['executeAction', { action: 'tab', name: 'local' } ] });
  this.newReferencesTab.connect(this, { click: ['executeAction', { action: 'tab', name: 'new' } ] });

  this.keyDownHandler = ve.bind( this.onKeyDown, this );
};

/* Inheritance */

OO.inheritClass( ve.ui.CitationInspector, ve.ui.NodeInspector );

/* Static properties */

ve.ui.CitationInspector.static.name = 'citation';

ve.ui.CitationInspector.static.icon = 'citation';

ve.ui.CitationInspector.static.title =
  OO.ui.deferMsg( 'visualeditor-citationinspector-title' );

ve.ui.CitationInspector.static.modelClasses = [ ve.dm.CitationNode ];

ve.ui.CitationInspector.static.size = 'large';

ve.ui.CitationInspector.static.actions = [];

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.CitationInspector.prototype.initialize = function () {
  // Parent method
  ve.ui.CitationInspector.super.prototype.initialize.call( this );

  this.$content.addClass( 've-ui-citationInspector-content' );

  this.$primaryActions.append( [
    this.removeButton.$element,
    this.closeButton.$element
    ] );

  var $toolbar = $('<div>').addClass('toolbar');

  var $tabs = $('<div>').addClass('tabs')
    .append([ this.referencesTab.$element, this.newReferencesTab.$element ]);

  $toolbar.append([ $tabs, this.$searchBar ]);

  this.$body.append($toolbar);
  this.$body.append(this.$panels);

  this.$foot.append(this.$info);
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getActionProcess = function ( action ) {
  if ( action === 'done' ) {
    this.close( { action: 'done' });
  } else if ( action === 'remove' ) {
    return new OO.ui.Process( function () {
      this.getFragment().removeContent();
      this.close( { action: action } );
    }, this );
  } else if ( action.action === 'select' ) {
    return new OO.ui.Process( function () {
      this.acceptSelection(action.refId);
    }, this );
  } else if ( action.action === 'tab' ) {
    return new OO.ui.Process( function () {
      this.openTab(action.name);
    }, this );
  } else if ( action === 'search' ) {
    return new OO.ui.Process( function () {
      this.acceptSearch();
    }, this );
  }
  return ve.ui.CitationInspector.super.prototype.getActionProcess.call( this, action );
};

/**
 * Handle the inspector being setup.
 *
 * @method
 * @param {Object} [data] Inspector opening data
 */
ve.ui.CitationInspector.prototype.getSetupProcess = function ( data ) {
  return ve.ui.CitationInspector.super.prototype.getSetupProcess.call( this, data )
    .first( function() {
      this.$element.parents('.oo-ui-popupWidget-popup').css({ visibility: 'hidden' });
    }, this )
    .next( function () {
      var surface = this.getFragment().getSurface();
      surface.breakpoint();
      surface.enable();
      // only once
      // TODO: is there a better place? This gets called whenever the inspector gets opened.
      // In initialize() however the fragment is not yet set, so no access to the document.
      if (!this.panels) {
        this.bibliography = ve.dm.Bibliography.getBibliography(this.getFragment().getDocument());
        this.panels = {
          'local': new ve.ui.ReferencesPanel(this.bibliography, {
            classes: 'local',
            placeholder: 'No references available in this article. Start a search and add new references.'
          }),
          'new': new ve.ui.ReferencesPanel(this.bibliography, {
            removeSelectedReferences: true,
            classes: 'new',
            placeholder: 'Start a search and find new references.'
          })
        };
        this.tabs = {
          'local': this.referencesTab,
          'new': this.newReferencesTab
        };
        this.$panels.empty();
        for (var name in this.panels) {
          var panel = this.panels[name];
          panel.connect(this, {
            'onSelectReference': 'selectReference'
          });
          this.$panels.append(panel.hide().$element);
        }
      }

      this.citationNode = this.getSelectedNode();

      if (!this.citationNode) {
        var data = [ {
          type: 'citation',
          attributes: {
            references: []
          }
        } ];
        var range = this.getFragment().getRange( true );
        if (range.getLength()) {
          surface.change( ve.dm.Transaction.newFromRemoval( surface.documentModel, range ) );
        }
        surface.change( ve.dm.Transaction.newFromInsertion( surface.documentModel, range.start, data ));
        this.citationNode = this.getSelectedNode();
        this.isNewCitation = true;
      } else {
        this.isNewCitation = false;
      }

      this.removeButton.toggle(true);
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getReadyProcess = function ( data ) {
  return ve.ui.CitationInspector.super.prototype.getReadyProcess.call( this, data )
    .next( function () {
      var surface = this.getFragment().getSurface();
      surface.stopHistoryTracking();
      $(this.$iframe[0].contentDocument).on('keydown', this.keyDownHandler);
      this.searchField.$input.focus(ve.bind( function() {
        this.inputMethod ="search";
        if (this.currentPanel) this.currentPanel.deactivateCursor();
      }, this ));
      this.searchField.$input.focus();
      var tabName = 'local';
      this.openTab(tabName);
    }, this )
    .next( function() {
      this.$element.parents('.oo-ui-popupWidget-popup').css({ visibility: '' });
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getTeardownProcess = function ( data ) {
  data = data || {};
  return ve.ui.CitationInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      window.console.log("Tearing down CitationInspector");
      var surface = this.getFragment().getSurface();
      // unregister the keyboard handler
      $(this.$iframe[0].contentDocument).off('keydown', this.keyDownHandler);
      var refs = this.citationNode.getAttribute('references');
      if (refs.length === 0) {
        var tx = ve.dm.Transaction.newFromRemoval( surface.documentModel, this.citationNode.getOuterRange() );
        surface.change(tx);
      }
      surface.breakpoint();
      surface.startHistoryTracking();
    }, this );
};

/**
 * Retrieves the current tab's state.
 */
ve.ui.CitationInspector.prototype.getTabState = function() {
  return this.tabStates[this.currentTabName];
};

/**
 * Opens the tab with given name;
 */
ve.ui.CitationInspector.prototype.openTab = function(newTab) {
  var state, oldTab, infos;
  if (!this.tabs[newTab]) throw new Error('Unknown tab ' + newTab);
  state = this.getTabState();
  oldTab = this.currentTabName;
  // TODO: these should come from i18n
  infos = {
    'local': 'These References are available in this Article. Enter text to filter or start a search to find new references.',
    'new': 'References can be added to the Article by adding a citation. Start a search to find new references.'
  };
  // disable old tab
  if (oldTab) {
    this.panels[oldTab].hide();
    this.tabs[oldTab].$element.removeClass('active');
    this.$body.removeClass(oldTab);
  }

  if (newTab === 'local') {
    // always reset the filter for local references when opening th dialog
    this.tabStates.local.searchStr = '';
    // always recreate the local reference list when opening this tab
    var refs = this.bibliography.getSortedReferences();
    var localRefs = this.panels.local;
    localRefs.clear();
    refs.forEach(function(ref) {
      localRefs.addReference(ref.element.attributes);
    }, this);
    localRefs.setFilter('');
  }

  // enabel new tab
  this.currentTabName = newTab;
  this.currentPanel = this.panels[newTab];
  state = this.getTabState();
  this.searchField.$input.val(state.searchStr);
  this.panels[newTab].show();
  this.tabs[newTab].$element.addClass('active');
  this.$body.addClass(newTab);
  this.searchField.$input.attr("placeholder", "Type to search...");
  this.$info.text(infos[newTab]);

  this.currentPanel.setSelectedReferences( this.citationNode.getAttribute('references') );
  this.currentPanel.update();
  this.currentPanel.scrollToFirstSelected();
};

ve.ui.CitationInspector.prototype.toggleReference = function( refId ) {
  var tx, fragment, surface;
  fragment = this.getFragment();
  surface = fragment.getSurface();
  var newRefIds = [];
  var refIds = this.citationNode.getAttribute('references');
  var removed = false;
  for (var i = 0; i < refIds.length; i++) {
    if (refIds[i] !== refId) {
      newRefIds.push(refIds[i]);
    } else {
      removed = true;
    }
  }
  if (!removed) {
    newRefIds.push(refId);
  }
  tx = ve.dm.Transaction.newFromAttributeChanges( surface.documentModel, this.citationNode.getOuterRange().start, {
   references: newRefIds
  } );
  surface.change( tx );
  this.bibliography._compile();
  this.currentPanel.setSelectedReferences(this.citationNode.getAttribute('references'));
  this.currentPanel.update();
};

ve.ui.CitationInspector.prototype.acceptSearch = function() {
  var searchStr = this.searchField.$input.val().trim();
  if (this.currentTabName === "local" && searchStr.length > 0) {
    this.tabStates['new'].searchStr = searchStr;
    this.openTab('new');
  }
  this.lookupExternalReferences();
};

ve.ui.CitationInspector.prototype.showLocalReferences = function( ) {
  var state, searchStr;
  searchStr = this.searchField.$input.val().trim();
  state = this.getTabState();
  if (state.searchStr !== searchStr) {
    window.console.error("FIXME: search field is not in sync with tab state.", state, searchStr);
  }
  this.currentPanel.setFilter(searchStr);
  this.currentPanel.applyFilter(searchStr);
};

ve.ui.CitationInspector.prototype._lookupExternalReferences = function(name, searchStr, panel) {
  // TODO: as soon we have multiple look-up services we need to use a $.Promise to toggle the 'searching' state
  // after all searches are completed.
  this.$body.addClass('searching');
  var promise = this.lookupServices[name].find(searchStr, this);
  this._runningLookups[name] = promise;
  promise.progress(function(data) {
    var id = data.DOI || data.ISSN[0];
    if (!this.bibliography.hasReference(id)) {
      data.id = id;
      panel.addReference(data);
    }
  }).done(function() {
    this.$body.removeClass('searching');
    delete this._runningLookups[name];
  });
};

ve.ui.CitationInspector.prototype.lookupExternalReferences = function() {
  var panel, serviceName;
  // stop running lookups
  for (serviceName in this._runningLookups) {
    this._runningLookups[serviceName].reject();
  }
  // clear the new references panel
  panel = this.panels['new'];
  panel.clear();
  // start search on all available lookup services
  var searchStr = this.searchField.$input.val().trim();
  if (searchStr.length > 0) {
    for (serviceName in this.lookupServices) {
      this._lookupExternalReferences(serviceName, searchStr, panel);
    }
  }
};

ve.ui.CitationInspector.prototype.onKeyDown = function( e ) {
  var state, searchStr;

  if (e.keyCode !== OO.ui.Keys.UP && e.keyCode !== OO.ui.Keys.DOWN && e.keyCode !== OO.ui.Keys.ENTER) {
    // TODO: we should make sure that we react only to keyboard events that indeed change the search field
    this.inputMethod = "search";
    this.currentPanel.$element.removeClass('select').addClass('search');
    state = this.getTabState();

    // Apply the search/filter while typing (only for local references)
    if (this.currentTabName === "local") {
      window.setTimeout(ve.bind( function() {
        // filter is only in for local references where it is ok to do that on every change of the pattern
        searchStr = this.searchField.$input.val().trim();
        if (state.searchStr !== searchStr) {
          state.searchStr = searchStr;
          this.currentPanel.setFilter(searchStr);
          this.currentPanel.applyFilter(searchStr);
        }
      }, this), 0);
    }
  }
  // UP || DOWN || ENTER
  else {
    state = this.getTabState();
    if (e.keyCode === OO.ui.Keys.ENTER) {
      if (this.inputMethod === "search") {
        this.acceptSearch();
      } else {
        this.acceptSelection();
      }
      e.preventDefault();
      return;
    } else {
      // When using the cursor the first time, just switch to select mode
      // without actually changing the cursor position
      if ( this.inputMethod === "search") {
        this.currentPanel.activateCursor();
      } else if (e.keyCode === OO.ui.Keys.UP) {
        this.currentPanel.moveCursorUp();
      } else if (e.keyCode === OO.ui.Keys.DOWN) {
        this.currentPanel.moveCursorDown();
      }
      if ( this.currentPanel.cursorIdx < 0 ) {
        this.currentPanel.deactivateCursor();
        this.searchField.$input.focus();
      }
      this.inputMethod = "select";
      this.currentPanel.$element.removeClass('search').addClass('select');
      e.preventDefault();
    }
  }
};

ve.ui.CitationInspector.prototype.selectReference = function(refData) {
  var isNew;
  isNew = !this.bibliography.getReferenceForId(refData.id);
  if (isNew) {
    this.bibliography.addNewReference(refData);
  }
  this.toggleReference(refData.id);
};

ve.ui.CitationInspector.prototype.acceptSelection = function() {
  var ref;
  ref = this.currentPanel.getSelectedReference();
  if (ref) {
    this.selectReference(ref);
  } else {
    window.console.error('No reference selected.');
  }
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CitationInspector );
