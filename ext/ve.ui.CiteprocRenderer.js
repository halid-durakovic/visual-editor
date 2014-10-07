/* global CSL: true */

ve.ui.CiteprocRenderer = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.engine = new CSL.Engine(this, config.style);
  this.data = {};
  this.labels = {};
  this.references = {};
  this.count = 0;
};

OO.initClass( ve.ui.CiteprocRenderer );

ve.ui.CiteprocRenderer.prototype.addReference = function( reference ) {
  var label;
  var id = "ITEM_"+this.count++;
  reference.id = id;
  this.data[id] = reference;
  label = this.engine.appendCitationCluster({
    "citationItems": [ { id: id } ],
    "properties": {}
  });
  this.labels[id] = label;
  // HACK: wipe rendered references on each update as we do not know yet how to use citeproc incrementally
  this.renderReferences();
  return id;
};

ve.ui.CiteprocRenderer.prototype.getLabel = function(id) {
  return this.labels[id];
};

ve.ui.CiteprocRenderer.prototype.getReference = function(id) {
  return this.references[id];
};

ve.ui.CiteprocRenderer.prototype.retrieveItem = function(id){
  return this.data[id];
};

ve.ui.CiteprocRenderer.prototype.retrieveLocale = function(lang){
  return this.config.locale[lang];
};

ve.ui.CiteprocRenderer.prototype.getAbbreviation = function(obj, vartype, key){
  obj[vartype][key] = "";
};

ve.ui.CiteprocRenderer.prototype.setAbbreviations = function () {
};

ve.ui.CiteprocRenderer.prototype.renderReferences = function() {
  var bib = this.engine.makeBibliography();
  for (var i = 0; i < bib[0].entry_ids.length; i++) {
    var id = bib[0].entry_ids[i];
    var refHtml = bib[1][i];
    var $refEl = $(refHtml);
    this.references[id] = $refEl;
  }
};
