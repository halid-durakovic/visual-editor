
ve.ui.CitationInspector = function VeUiCitationInspector( config ) {
  // Parent constructor
  ve.ui.NodeInspector.call( this, config );
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
  {
    action: 'open',
    label: OO.ui.deferMsg( 'visualeditor-linkinspector-open' )
  },
  {
    action: 'done',
    label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
    flags: 'primary',
    modes: 'edit'
  },
  {
    action: 'insert',
    label: OO.ui.deferMsg( 'visualeditor-dialog-action-insert' ),
    flags: [ 'constructive', 'primary' ],
    modes: 'insert'
  },
  {
    action: 'remove',
    label: OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
    flags: 'destructive',
    modes: 'edit'
  }
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
      if ( this.citationNode ) {
      } else {
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
      var surfaceModel = this.getFragment().getSurface();

      if ( this.commentNode ) {
        if ( data.action === 'remove' || innerText === '' ) {
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
