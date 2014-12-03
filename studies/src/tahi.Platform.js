/*!
 * VisualEditor Standalone Initialization Platform class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Initialization Standalone platform.
 *
 * @class
 * @extends ve.init.Platform
 *
 * @constructor
 */
tahi.Platform = function VeInitSaPlatform() {
  // Parent constructor
  ve.init.Platform.call( this );

  // Properties
  this.externalLinkUrlProtocolsRegExp = /^https?\:\/\//;
  this.messagePaths = [];
  this.parsedMessages = {};
  this.userLanguages = ['en'];
};

/* Inheritance */

OO.inheritClass( tahi.Platform, ve.init.Platform );

/* Methods */

/** @inheritdoc */
tahi.Platform.prototype.getExternalLinkUrlProtocolsRegExp = function () {
  return this.externalLinkUrlProtocolsRegExp;
};

/**
 * Add an i18n message folder path
 *
 * @param {string} path Message folder path
 */
tahi.Platform.prototype.addMessagePath = function ( path ) {
  this.messagePaths.push( path );
};

/**
 * Get message folder paths
 *
 * @returns {string[]} Message folder paths
 */
tahi.Platform.prototype.getMessagePaths = function () {
  return this.messagePaths;
};

/** @inheritdoc */
tahi.Platform.prototype.addMessages = function ( messages ) {
  $.i18n().load( messages, $.i18n().locale );
};

/**
 * @method
 * @inheritdoc
 */
tahi.Platform.prototype.getMessage = function() {
  // TODO: retrieve i18n message here
};

/** @inheritdoc */
tahi.Platform.prototype.addParsedMessages = function ( messages ) {
  for ( var key in messages ) {
    this.parsedMessages[key] = messages[key];
  }
};

/** @inheritdoc */
tahi.Platform.prototype.getParsedMessage = function ( key ) {
  if ( Object.prototype.hasOwnProperty.call( this.parsedMessages, key ) ) {
    return this.parsedMessages[key];
  }
  // Fallback to regular messages, html escaping applied.
  return this.getMessage( key ).replace( /['"<>&]/g, function escapeCallback( s ) {
    switch ( s ) {
      case '\'':
        return '&#039;';
      case '"':
        return '&quot;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
    }
  } );
};

/** @inheritdoc */
tahi.Platform.prototype.getLanguageCodes = function () {
  return Object.keys( $.uls.data.getAutonyms() );
};

/**
 * @method
 * @inheritdoc
 */
tahi.Platform.prototype.getLanguageName = $.uls.data.getAutonym;

/**
 * @method
 * @inheritdoc
 */
tahi.Platform.prototype.getLanguageAutonym = $.uls.data.getAutonym;

/**
 * @method
 * @inheritdoc
 */
tahi.Platform.prototype.getLanguageDirection = $.uls.data.getDir;

/** @inheritdoc */
tahi.Platform.prototype.getUserLanguages = function () {
  return this.userLanguages;
};

/** @inheritdoc */
tahi.Platform.prototype.initialize = function () {
  var promises = [];
  return $.when.apply( $, promises );
};

/* Initialization */

ve.init.platform = new tahi.Platform();

/* Extension */

OO.ui.getUserLanguages = ve.init.platform.getUserLanguages.bind( ve.init.platform );

OO.ui.msg = ve.init.platform.getMessage.bind( ve.init.platform );
