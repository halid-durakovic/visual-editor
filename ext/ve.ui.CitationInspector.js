
ve.ui.CitationInspector = function VeUiCitationInspector( config ) {
  // Parent constructor
  ve.ui.NodeInspector.call( this, config );

  this.$frame.addClass('ve-ui-citationManager');

  // TODO: use a global configuration here
  this.newReferencesCompiler = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());
  this.lookupServices = ve.ui.CitationLookupService.getServices();

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
  var $searchFieldLabel = $('<span>').addClass('label').text('Find Reference');
  this.searchField = new OO.ui.TextInputWidget( {
    $: this.$,
    autosize: true,
    classes: ['citation-search-field']
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
  this.$searchBar.append([ $searchFieldLabel, this.searchField.$element, this.searchButton.$element, this.searchSpinner ] );

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
    // HACK: strange - we need to add the elements in reverse order
    .append([ this.newReferencesTab.$element, this.referencesTab.$element ]);

  $toolbar.append([ this.$searchBar, $tabs ]);

  this.$body.append($toolbar);
  this.$body.append(this.$panels);

  this.$foot.append(this.$info);
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getActionProcess = function ( action ) {
  if ( action === 'done' ) {
    if (this.citationNode) {
      var refIds = this.citationNode.getAttribute('references');
      if (refIds.length === 0) {
        this.getFragment().removeContent();
      }
    }
    this.close( { action: 'done' });
  } else if ( action === 'remove' ) {
    return new OO.ui.Process( function () {
      if (this.citationNode) {
        this.getFragment().removeContent();
      }
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
    .next( function () {
      // Disable surface until animation is complete; will be reenabled in ready()
      this.getFragment().getSurface().disable();

      // only once
      // TODO: is there a better place? This gets called whenever the inspector gets opened.
      // In initialize() however the fragment is not yet set, so no access to the document.
      if (!this.panels) {
        this.bibliography = ve.dm.Bibliography.getBibliography(this.getFragment().getDocument());
        this.panels = {
          'local': new ve.ui.ReferencesPanel(this.bibliography),
          'new': new ve.ui.ReferencesPanel(this.bibliography)
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
      // TODO: just disable the delete button instead of toggling (=show/hide)
      if ( this.citationNode ) {
        this.removeButton.toggle(true);
      } else {
        this.removeButton.toggle(false);
      }
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getReadyProcess = function ( data ) {
  return ve.ui.CitationInspector.super.prototype.getReadyProcess.call( this, data )
    .next( function () {
      this.getFragment().getSurface().enable();
      $(this.$iframe[0].contentDocument).on('keydown', this.keyDownHandler);
      this.searchField.$input.focus(ve.bind( function() {
        this.inputMethod ="search";
        if (this.currentPanel) this.currentPanel.deactivateCursor();
      }, this ));
      this.searchField.$input.focus();
      var tabName = 'local';
      // when adding a new citation we open the tab which was opened last time.
      if (!this.citationNode) {
        tabName = this.currentTabName || tabName;
      }
      // always recreate the 'references' panel when opening the inspector
      // This way, we can present
      var refs = this.bibliography.getSortedReferences();
      var localRefs = this.panels.local;
      refs.forEach(function(ref) {
        localRefs.addReference(ref.element.attributes);
      }, this);

      this.openTab(tabName);
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getTeardownProcess = function ( data ) {
  data = data || {};
  return ve.ui.CitationInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      // unregister the keyboard handler
      $(this.$iframe[0].contentDocument).off('keydown', this.keyDownHandler);
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
  var state, oldTab, placeholders, infos;
  if (!this.tabs[newTab]) throw new Error('Unknown tab ' + newTab);
  state = this.getTabState();
  oldTab = this.currentTabName;
  // TODO: these should come from i18n
  placeholders = {
    'local': "Type to search...",
    'new': 'Enter a DOI or a full-text query...'
  };
  infos = {
    'local': 'Enter a search text to filter available references. Use the link buttons or press ‘Enter’ to add a citation to your article.',
    'new': 'Start a search to find new references. Use the link buttons or press ‘Enter’ to add a citation to your article.'
  };
  // disable old tab
  if (oldTab) {
    this.panels[oldTab].hide();
    this.tabs[oldTab].$element.removeClass('active');
    this.$body.removeClass(oldTab);
  }
  // enabel new tab
  this.currentTabName = newTab;
  this.currentPanel = this.panels[newTab];
  state = this.getTabState();
  this.searchField.$input.val(state.searchStr);
  this.panels[newTab].show();
  this.tabs[newTab].$element.addClass('active');
  this.$body.addClass(newTab);
  this.searchField.$input.attr("placeholder", placeholders[newTab]);
  this.$info.text(infos[newTab]);

  if (this.citationNode) {
    this.currentPanel.setSelectedReferences(this.citationNode.getAttribute('references'));
  }
};

ve.ui.CitationInspector.prototype.toggleReference = function( refId ) {
  var tx, fragment, surface, data;
  fragment = this.getFragment();
  surface = fragment.getSurface();
  if (this.citationNode) {
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
  } else {
    data = [ {
      type: 'citation',
      attributes: {
        references: [refId]
      }
    } ];
    fragment.insertContent(data);
  }
  this.bibliography.compile();
  this.currentPanel.rerender();
};

ve.ui.CitationInspector.prototype.acceptSearch = function() {
  if (this.currentTabName === "local") {
    this.showLocalReferences();
  } else {
    this.lookupExternalReferences();
  }
};

ve.ui.CitationInspector.prototype.showLocalReferences = function( ) {
  var state, searchStr;
  searchStr = this.searchField.$input.val().trim();
  state = this.getTabState();
  if (state.searchStr !== searchStr) {
    window.console.error("FIXME: search field is not in sync with tab state.", state, searchStr);
  }
  this.currentPanel.applyFilter(searchStr);
  // if (this.citationNode) {
  //   this.$referenceList.addClass('has-citation');
  // } else {
  //   this.$referenceList.removeClass('has-citation');
  // }
};

ve.ui.CitationInspector.prototype._lookupExternalReferences = function(service, searchStr) {
  // TODO: as soon we have multiple look-up services we need to use a $.Promise to toggle the 'searching' state
  // after all searches are completed.
  this.$searchBar.addClass('searching');
  var referenceCompiler = this.newReferencesCompiler;

  // HACK: need to have a better design for the state... e.g., when is the rendered bibliography available, when gets updated etc...
  var bib = this.bibliography.getCompiler().makeBibliography();

  service.find(searchStr, this).progress(function(data) {
    var id = data.DOI || data.ISSN[0];
    data.id = id;

    var existingEntry = bib[id];
    var $reference;
    if (existingEntry) {
      $reference = this.renderReference(existingEntry);
    } else {
      id = referenceCompiler.addReference(data);
      $reference = this.renderReference({
        id: id,
        label: '',
        content: referenceCompiler.renderReference(id)
      });
    }

  }).done(function() {
    this.$searchBar.removeClass('searching');
  });
};

ve.ui.CitationInspector.prototype.lookupExternalReferences = function() {
  var searchStr = this.searchField.$input.val().trim();
  if (searchStr.length > 0) {
    for (var name in this.lookupServices) {
      this._lookupExternalReferences(this.lookupServices[name], searchStr);
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
          this.showLocalReferences();
        }
      }, this), 0);
    }
  }
  // UP || DOWN || ENTER
  else {
    state = this.getTabState();
    if (e.keyCode === OO.ui.Keys.ENTER) {
      if (this.inputMethod === "search") {
        searchStr = this.searchField.$input.val().trim();
        if (state.searchStr !== searchStr) {
          state.searchStr = searchStr;
          this.acceptSearch();
        }
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
