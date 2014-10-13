
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
  this.searchField = new OO.ui.TextInputWidget( {
    $: this.$,
    autosize: true,
    classes: ['citation-search-field']
  } );
  this.referencesTab = new OO.ui.ActionWidget({
    action: 'references',
    label: 'References',
    classes: ['tab', 'referencesTab']
  });
  this.newReferencesTab = new OO.ui.ActionWidget({
    action: 'newReferences',
    label: 'New References',
    classes: ['tab', 'newReferencesTab']
  });

  this.$selectedFlag = $('<div>').addClass('selected-flag').text('Selected');

  // set when opening a tab
  this.currentTabName = "";
  this.tabStates = {
    "references": {
      cursorIdx: -1,
      searchStr: ""
    },
    "new": {
      cursorIdx: -1,
      searchStr: ""
    }
  };

  // either "search" or "select", set when typing into search field or when navigating cursor
  this.inputMethod = "";

  this.$referenceList = $('<div>').addClass('reference-list');

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
  this.referencesTab.connect(this, { click: ['executeAction', { action: 'tab', name: 'references' } ] });
  this.newReferencesTab.connect(this, { click: ['executeAction', { action: 'tab', name: 'newReferences' } ] });

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

  var $searchbar = $('<div>').addClass('searchbar');
  var $searchFieldLabel = $('<span>').addClass('label').text('Find Reference');
  $searchbar.append([ $searchFieldLabel, this.searchField.$element ] );

  // Add placeholder
  this.searchField.$input.attr("placeholder", "Type to search...");

  var $tabs = $('<div>').addClass('tabs')
    // HACK: strange - we need to add the elements in reverse order
    .append([ this.newReferencesTab.$element, this.referencesTab.$element ]);

  $toolbar.append([ $searchbar, $tabs ]);

  this.$body.append($toolbar);
  this.$body.append(this.$referenceList);

  var $description = $('<div>').addClass('description').text('Enter a search text to filter available references. Press ‘Enter’ or click on a reference to add a citation to your article.');
  this.$foot.append($description);
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getActionProcess = function ( action ) {
  if ( action === 'remove' ) {
    return new OO.ui.Process( function () {
      if (this.citationNode) {
        this.getFragment().removeContent();
      }
      this.close( { action: action } );
    }, this );
  } else if ( action.action === 'select' ) {
    return new OO.ui.Process( function () {
      this.selectReference(action.reference);
      if (this.citationNode) {
        this.close( { action: 'edit' } );
      }
    }, this );
  } else if ( action.action === 'tab' ) {
    return new OO.ui.Process( function () {
      if (action.name === 'references') {
        this.openExistingReferences();
      } else if (action.name === 'newReferences') {
        this.openNewReferences();
      }
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

      this.citationNode = this.getSelectedNode();
      // TODO: just disable the delete button instead of toggling (=show/hide)
      if ( this.citationNode ) {
        this.removeButton.toggle(true);
      } else {
        this.removeButton.toggle(false);
      }

      var fragment = this.getFragment();
      var documentModel = fragment.getDocument();

      this.bibliography = ve.dm.BibliographyNode.getBibliography(documentModel);
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getReadyProcess = function ( data ) {
  return ve.ui.CitationInspector.super.prototype.getReadyProcess.call( this, data )
    .next( function () {
      this.getFragment().getSurface().enable();
      // TODO: pre-select the reference associated to the currently selected citation
      //this.searchField.$input.on('keydown', this.keyDownHandler);
      $(this.$iframe[0].contentDocument).on('keydown', this.keyDownHandler);
      this.searchField.$input.focus(ve.bind( function() {
        $(this.referenceElements).removeClass('cursor');
        this.setInputMethod("search");
      }, this ));
      this.searchField.$input.focus();

      if (this.citationNode) {
        this.openExistingReferences();
      } else {
        // when creating a new citation open with the same state as last-time
        // This might be useful for the use-case where new references are added in a sequence.
        this.openTab(this.currentTabName || 'references');
      }
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getTeardownProcess = function ( data ) {
  data = data || {};
  return ve.ui.CitationInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      $(this.$iframe[0].contentDocument).off('keydown', this.keyDownHandler);
      this.$referenceList.empty();
    }, this );
};

ve.ui.CitationInspector.prototype.openTab = function(name) {
  switch (name) {
    case 'references':
      this.openExistingReferences();
      break;
    case 'new':
      this.openNewReferences();
      break;
    default:
      window.console.error("Illegal state:", name);
  }
};

ve.ui.CitationInspector.prototype.openExistingReferences = function () {
  this.referenceElements = [];
  this.refIndex = {};
  var $selectedRef;

  var state = this.tabStates.references;
  this.searchField.$input.val(state.searchStr);

  if (this.bibliography) {
    var bib = this.bibliography.referenceCompiler.makeBibliography();
    var entries = bib.asList();

    entries.forEach(function(entry) {
      var reference, $reference, $label, $content;

      reference = this.bibliography.getReferenceForId(entry.id);
      $reference = $('<div>').addClass('reference');
      if (entry.label) {
        $label = $('<div>').addClass('label')
          .html(entry.label);
        $reference.append($label);
      }
      $content = $('<div>').addClass('content')
        .html(entry.content);
      $reference.append($content);

      var $buttons = $('<div>').addClass('buttons');
      var selectButton = new OO.ui.ActionWidget({
        action: 'select',
        // label: 'Select',
        icon: 'citation'
      });
      selectButton.connect(this, { click: [ 'executeAction', { action: 'select', reference: reference } ] });
      $buttons.append([ selectButton.$element ]);
      $reference.append($buttons);

      if (this.citationNode && entry.label === this.citationNode.getAttribute('label') ) {
        $reference.addClass('selected')
          .append(this.$selectedFlag);
        $selectedRef = $reference;
      }

      this.referenceElements.push($reference[0]);
    }, this);

    this.showLocalReferences();

  } else {
    this.$referenceList.text('No References available. You should use the "New References Tab" to add new ones');
  }

  this.newReferencesTab.$element.removeClass('active');
  this.referencesTab.$element.addClass('active');
  this.currentTabName = "references";
};

ve.ui.CitationInspector.prototype.openNewReferences = function () {
  var state = this.tabStates['new'];
  this.searchField.$input.val(state.searchStr);

  this.$referenceList.empty();

  this.lookupExternalReferences();

  this.referencesTab.$element.removeClass('active');
  this.newReferencesTab.$element.addClass('active');
  this.currentTabName = "new";
};

ve.ui.CitationInspector.prototype.setInputMethod = function( method ) {
  this.$referenceList.removeClass('search select').addClass(method);
  this.inputMethod = method;
};

ve.ui.CitationInspector.prototype.onKeyDown = function( e ) {
  var oldRef, newRef, referenceEls, state, searchStr;

  if (e.keyCode !== OO.ui.Keys.UP && e.keyCode !== OO.ui.Keys.DOWN && e.keyCode !== OO.ui.Keys.ENTER) {
    // TODO: we should make sure that we react only to keyboard events that indeed change the search field
    this.setInputMethod("search");
    state = this.getTabState();

    // Apply the search/filter while typing when showing local references
    if (this.currentTabName === "references") {
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
    referenceEls = this.$referenceList[0].children;
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
        newRef = referenceEls[state.cursorIdx];
      } else if (e.keyCode === OO.ui.Keys.UP && state.cursorIdx >= 0) {
        oldRef = referenceEls[state.cursorIdx];
        state.cursorIdx--;
        newRef = referenceEls[state.cursorIdx];
      } else if (e.keyCode === OO.ui.Keys.DOWN && state.cursorIdx < referenceEls.length-1 ) {
        oldRef = referenceEls[state.cursorIdx];
        state.cursorIdx++;
        newRef = referenceEls[state.cursorIdx];
      }
      if (oldRef) {
        $(oldRef).removeClass('cursor');
      }
      if (newRef) {
        $(newRef).addClass('cursor');
        OO.ui.Element.scrollIntoView(newRef);
      }
      if ( state.cursorIdx < 0 ) {
        this.searchField.$input.focus();
      }
      this.setInputMethod("select");
      e.preventDefault();
    }
  }
};

ve.ui.CitationInspector.prototype.selectReference = function( reference ) {
  var tx, fragment, surface, data;

  fragment = this.getFragment();
  surface = fragment.getSurface();

  if (this.citationNode) {
    tx = ve.dm.Transaction.newFromAttributeChanges( surface.documentModel, this.citationNode.getOuterRange().start, { label: reference.getAttribute('label') } );
    surface.change( tx );
  } else {
    data = [ {
      type: 'citation',
      attributes: {
        label: reference.getAttribute('label')
      }
    } ];
    fragment.insertContent(data, false).collapseRangeToEnd().select();
  }
};

ve.ui.CitationInspector.prototype.acceptSelection = function() {
  var referenceEls, refEl, labelEl, reference, state;

  state = this.getTabState();
  referenceEls = this.$referenceList[0].children;
  refEl = referenceEls[state.cursorIdx];

  if (this.currentTabName === "references") {
    labelEl = refEl.querySelector('.label');
    reference = this.refIndex[labelEl.textContent];
    if (!reference) {
      window.console.error('ohoohh, could not find reference model');
    } else {
      this.selectReference(reference);
      this.close( { action: 'edit' } );
    }
  } else {
    window.console.log("TODO: will insert a new bib entry and select the new reference.");
  }

};

ve.ui.CitationInspector.prototype.acceptSearch = function() {
  if (this.currentTabName === "references") {
    this.showLocalReferences();
  } else {
    this.lookupExternalReferences();
  }
};

ve.ui.CitationInspector.prototype.createOrRanking = function( refEls, patterns ) {
  var ranking, j, i, item, content, pattern, re, refEl;

  ranking = [];

  // This implements OR for all words within the search string
  // plus a ranking by the count of matching words
  for (j = 0; j < refEls.length; j++) {
    refEl = refEls[j];
    item = { el: refEl, count: 0 };
    content = refEl.textContent.toLowerCase();
    for (i = 0; i < patterns.length; i++) {
      pattern = patterns[i];
      re = new RegExp(pattern, 'g');
      if (re.test(content)) {
        item.count++;
      }
    }
    ranking.push(item);
  }

  ranking.sort(function(a, b) {
    return -(a.count - b.count);
  });

  return ranking.filter(function(entry) {
    return entry.count > 0;
  });
};

ve.ui.CitationInspector.prototype.showLocalReferences = function( ) {
  var refEls, patterns, i, ranking, state, searchStr;

  searchStr = this.searchField.$input.val().trim();
  state = this.tabStates.references;

  if (state.searchStr !== searchStr) {
    window.console.error("FIXME: search field is not in sync with tab state.", state, searchStr);
  }

  patterns = searchStr.toLowerCase().split(/\s+/);
  refEls = this.referenceElements;
  ranking = this.createOrRanking(refEls, patterns);

  $(refEls).removeClass('cursor');
  this.cursorIdx = -1;

  var frag = window.document.createDocumentFragment();
  var count = 0;
  for (i = 0; i < ranking.length; i++) {
    var el = ranking[i].el;
    if (ranking[i].count > 0) {
      frag.appendChild(ranking[i].el);
      if (el.classList.contains('selected')) {
        this.cursorIdx = count;
      }
      count++;
    }
  }

  this.$referenceList.empty();
  this.$referenceList[0].appendChild(frag);

  if (this.cursorIdx >= 0) OO.ui.Element.scrollIntoView(this.$referenceList[0].children[this.cursorIdx]);

  if (this.citationNode) {
    this.$referenceList.addClass('has-citation');
  } else {
    this.$referenceList.removeClass('has-citation');
  }
};

ve.ui.CitationInspector.prototype._lookupExternalReferences = function(service, searchStr) {
  window.console.log('TODO: start a spinner somewhere to indicate that a query is running.');
  var referenceCompiler = this.newReferencesCompiler;
  service.find(searchStr, this).progress(function(data) {
    var id = referenceCompiler.addReference(data);
    var $reference = $('<div>').addClass('reference');
    var $content = $('<div>').addClass('content').html(referenceCompiler.renderReference(id));
    $reference.append($content);
    this.$referenceList.append($reference);
  }).done(function() {
    window.console.log('TODO: stop query spinner.');
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

ve.ui.CitationInspector.prototype.getTabState = function() {
  return this.tabStates[this.currentTabName];
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CitationInspector );
