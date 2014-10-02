
ve.ui.CitationInspector = function VeUiCitationInspector( config ) {
  // Parent constructor
  ve.ui.NodeInspector.call( this, config );

  this.$frame.addClass('ve-ui-citationManager');
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

ve.ui.CitationInspector.static.actions = [
  // {
  //   action: 'remove',
  //   icon: 'remove',
  //   label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
  //   flags: 'primary',
  //   modes: 'edit'
  // },
  // {
  //   action: 'done',
  //   icon: 'back',
  //   label: OO.ui.deferMsg( 'visualeditor-inspector-close-tooltip' ),
  //   flags: 'destructive',
  //   modes: 'edit'
  // },
];

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.CitationInspector.prototype.initialize = function () {
  // Parent method
  ve.ui.CitationInspector.super.prototype.initialize.call( this );

  this.$content.addClass( 've-ui-citationInspector-content' );

  var removeButton = new OO.ui.ActionWidget({
    action: 'remove',
    icon: 'remove',
    label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
    modes: 'edit'
  });

  var closeButton = new OO.ui.ActionWidget({
    action: 'done',
    icon: 'back',
    label: OO.ui.deferMsg( 'visualeditor-inspector-close-tooltip' ),
    modes: 'edit'
  });

  this.$primaryActions.append( [
    removeButton.$element,
    closeButton.$element
    ] );

  removeButton.connect(this, { click: ['executeAction', 'remove' ] });
  closeButton.connect(this, { click: ['executeAction', 'done' ] });

  this.removeButton = removeButton;
  this.closeButton = closeButton;

  var $toolbar = $('<div>').addClass('toolbar');

  var $searchbar = $('<div>').addClass('searchbar');
  var $searchFieldLabel = $('<span>').addClass('label').text('Find Reference');
  var $searchField = $('<input type="text">');
  $searchbar.append([ $searchFieldLabel, $searchField] );

  var $tabs = $('<div>').addClass('tabs');
  var $referencesTab = $('<div>').addClass('tab referencesTab').text('References');
  var $newReferencesTab = $('<div>').addClass('tab newReferencesTab').text('New References');
  $tabs.append([ $referencesTab, $newReferencesTab ]);

  $toolbar.append([ $searchbar, $tabs ]);
  this.$body.append($toolbar);

  var $referenceList = $('<div>').addClass('referenceList');
  for (var i = 0; i < 5; i++) {
    $referenceList.append($('<div>').addClass('reference').text('Hallo ' + i));
  }
  this.$body.append($referenceList);

  var $description = $('<div>').addClass('description').text('Enter a search text to filter available references. Press ‘Enter’ or click on a reference to add a citation to your article.')
  this.$foot.append($description);
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getActionProcess = function ( action ) {
  if ( action === 'remove' || action === 'insert' ) {
    return new OO.ui.Process( function () {
      this.close( { action: action } );
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
    }, this );
};

/**
 * @inheritdoc
 */
ve.ui.CitationInspector.prototype.getTeardownProcess = function ( data ) {
  data = data || {};
  return ve.ui.CitationInspector.super.prototype.getTeardownProcess.call( this, data )
    .first( function () {
      // var surfaceModel = this.getFragment().getSurface();

      if ( this.commentNode ) {
        if ( data.action === 'remove' ) {
          // Remove citation node
          this.fragment = this.getFragment().clone( this.citationNode.getOuterRange() );
          this.fragment.removeContent();
        } else {
          // Update the label?
        }
      } else if ( false /* TODO when? */ ) {
        // Insert new comment node
        this.getFragment().insertContent( [
          {
            type: 'citation',
            attributes: { label: 'TODO' }
          },
          { type: '/citation' }
        ] );
      }
    }, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CitationInspector );
