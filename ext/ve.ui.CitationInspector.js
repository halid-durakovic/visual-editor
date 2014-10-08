
ve.ui.CitationInspector = function VeUiCitationInspector( config ) {
  // Parent constructor
  ve.ui.NodeInspector.call( this, config );

  this.$frame.addClass('ve-ui-citationManager');

  this.newRefRenderer = new ve.ui.CiteprocRenderer(new ve.ui.CiteprocDefaultConfig());
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
  this.cursorIdx = -1;
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
  window.console.log('vi.ui.CitationInspector: action', action);
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

      this.bibliography = null;
      var toplevelNodes = documentModel.selectNodes( documentModel.getDocumentNode().getRange(), 'branches');
      for (var i = 0; i < toplevelNodes.length; i++) {
        var toplevelNode = toplevelNodes[i].node;
        if (toplevelNode.type === 'bibliography') {
          this.bibliography = toplevelNode;
          break;
        }
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
      // TODO: pre-select the reference associated to the currently selected citation
      //this.searchField.$input.on('keydown', this.keyDownHandler);
      $(this.$iframe[0].contentDocument).on('keydown', this.keyDownHandler);
      this.searchField.$input.val('');
      this.searchField.$input.focus(ve.bind( function() {
        $(this.referenceElements).removeClass('cursor');
        this.setInputMethod("search");
        // this.cursorIdx = -1;
      }, this ));
      this.searchField.$input.focus();

      this.openExistingReferences();
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

ve.ui.CitationInspector.prototype.openExistingReferences = function () {
  var references, reference, $reference, $label, $content, i;

  this.referenceElements = [];
  this.refIndex = {};
  var $selectedRef;

  if (this.bibliography) {
    references = this.bibliography.getAttribute( 'entries' );
    for (i = 0; i < references.length; i++) {
      reference = references[i];
      if (reference.type !== 'reference') continue;

      $reference = $('<div>').addClass('reference');
      $label = $('<div>').addClass('label')
        .text(reference.getAttribute('label'));
      $content = $('<div>').addClass('content')
        .text(reference.getAttribute('content'));
      $reference.append([$label, $content]);
      this.refIndex[reference.getAttribute('label')] = reference;

      var $buttons = $('<div>').addClass('buttons');
      var selectButton = new OO.ui.ActionWidget({
        action: 'select',
        label: 'Select'
      });
      selectButton.connect(this, { click: [ 'executeAction', { action: 'select', reference: reference } ] });
      $buttons.append([ selectButton.$element ]);
      $reference.append($buttons);

      if (this.citationNode && reference.getAttribute('label') === this.citationNode.getAttribute('label') ) {
        $reference.addClass('selected')
          .append(this.$selectedFlag);
        $selectedRef = $reference;
      }

      this.referenceElements.push($reference[0]);
    }

    this.showLocalReferences();

  } else {
    this.$referenceList.text('No References available. You should use the "New References Tab" to add new ones');
  }

  this.newReferencesTab.$element.removeClass('active');
  this.referencesTab.$element.addClass('active');
  this.currentTabName = "references";
};

ve.ui.CitationInspector.prototype.openNewReferences = function () {
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
  var oldRef, newRef, referenceEls;

  if (e.keyCode !== OO.ui.Keys.UP && e.keyCode !== OO.ui.Keys.DOWN && e.keyCode !== OO.ui.Keys.ENTER) {
    // TODO: we should make sure that we react only to keyboard events that indeed change the search field
    this.setInputMethod("search");

    // Apply the search/filter while typing when showing local references
    if (this.currentTabName === "references") {
      window.setTimeout(ve.bind( function() {
        // filter is only in for local references where it is ok to do that on every change of the pattern
        var pattern = this.searchField.$input.val();
        if (this.filterPattern !== pattern) {
          this.showLocalReferences();
        }
        this.filterPattern = pattern;
      }, this), 0);
    }
  }
  // UP || DOWN || ENTER
  else {
    referenceEls = this.$referenceList[0].children;

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
        newRef = referenceEls[this.cursorIdx];
      } else if (e.keyCode === OO.ui.Keys.UP && this.cursorIdx >= 0) {
        oldRef = referenceEls[this.cursorIdx];
        this.cursorIdx--;
        newRef = referenceEls[this.cursorIdx];
      } else if (e.keyCode === OO.ui.Keys.DOWN && this.cursorIdx < referenceEls.length-1 ) {
        oldRef = referenceEls[this.cursorIdx];
        this.cursorIdx++;
        newRef = referenceEls[this.cursorIdx];
      }
      if (oldRef) {
        $(oldRef).removeClass('cursor');
      }
      if (newRef) {
        $(newRef).addClass('cursor');
        OO.ui.Element.scrollIntoView(newRef);
      }
      if ( this.cursorIdx < 0 ) {
        this.searchField.$input.focus();
      }
      this.setInputMethod("select");
      e.preventDefault();
    }
  }
};

ve.ui.CitationInspector.prototype.selectReference = function( reference ) {
  window.console.log("CitationInspector will insert a label into the article... soon", reference);
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
  var referenceEls, refEl, labelEl, reference;

  referenceEls = this.$referenceList[0].children;
  refEl = referenceEls[this.cursorIdx];

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
  var refEls, patterns, i, ranking;

  window.console.log("CitationInspector.showLocalReferences()", Date.now());

  patterns = this.searchField.$input.val().trim().toLowerCase().split(/\s+/);
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
  service.find(searchStr, this).progress(function(data) {
    var id = this.newRefRenderer.addReference(data);
    var $reference = $('<div>').addClass('reference');
    var $content = $('<div>').addClass('content').html(this.newRefRenderer.getContent(id));
    $reference.append($content);
    this.$referenceList.append($reference);
  }).done(function() {
    window.console.log('YAY');
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


/* Registration */

ve.ui.windowFactory.register( ve.ui.CitationInspector );
