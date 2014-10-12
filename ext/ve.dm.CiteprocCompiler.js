/* global CSL: true */

ve.dm.CiteprocCompiler = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.engine = new CSL.Engine(this, config.style);
  this.data = {};
  this.labels = {};
  this.index = {};
  this.contents = {};
  this.count = 0;
};

OO.initClass( ve.dm.CiteprocCompiler );

ve.dm.CiteprocCompiler.prototype.clear = function() {
  this.engine = new CSL.Engine(this, this.config.style);
  this.data = {};
  this.labels = {};
  this.contents = {};
  this.count = 0;
};

ve.dm.CiteprocCompiler.prototype._addReference = function( reference ) {
  var id = reference.id || "ITEM_"+this.count++;
  reference.id = id;
  this.data[id] = reference;
  var citation = {
    "citationItems": [ { id: id } ],
    "properties": {}
  };
  //Note: this returns an array of tuples where each entry contains
  //   0: the internally assigned index for the citation
  //   1: the citation label as it should be inserted into the text
  // In case of ambiguities, updates for disambiguation are given
  var result = this.engine.appendCitationCluster(citation);
  var refIndex = result[0][0];
  var refLabel = result[0][1];

  this.index[refIndex] = id;
  this.labels[id] = refLabel;

  for (var i = 1; i < result.length; i++) {
    var updated = result[i];
    var updatedId = this.index[updated[0]];
    this.labels[updatedId] = updated[1];
  }
};

ve.dm.CiteprocCompiler.prototype.addReference = function( reference ) {
  var id = reference.id || "ITEM_"+this.count++;
  reference.id = id;
  this.data[id] = reference;
  return id;
};

ve.dm.CiteprocCompiler.prototype.addCitation = function() {
  var referenceIds = arguments;
  if (referenceIds.length === 0) {
    window.console.error("No reference ids given");
    return;
  }
  var citation = {
    "citationItems": [],
    "properties": {}
  };
  for (var i = 0; i < referenceIds.length; i++) {
    citation.citationItems.push( { id: referenceIds[i] } );
  }
  var result = this.engine.appendCitationCluster(citation);
  var citationId = result[0][0];
  var citationLabel = result[0][1];
  return {
    id: citationId,
    label: citationLabel
  };
};

ve.dm.CiteprocCompiler.prototype.getLabel = function(id) {
  return this.labels[id];
};

ve.dm.CiteprocCompiler.prototype.getContent = function(id) {
  return this.contents[id];
};

ve.dm.CiteprocCompiler.prototype.retrieveItem = function(id){
  return this.data[id];
};

ve.dm.CiteprocCompiler.prototype.retrieveLocale = function(lang){
  return this.config.locale[lang];
};

ve.dm.CiteprocCompiler.prototype.getAbbreviation = function(obj, vartype, key){
  obj[vartype][key] = "";
};

ve.dm.CiteprocCompiler.prototype.setAbbreviations = function () {
};

ve.dm.CiteprocCompiler.prototype.renderReference = function(id) {
  return ve.dm.CiteprocCompiler.getBibliographyEntry.call(this.engine, id);
};

ve.dm.CiteprocCompiler.getBibliographyEntry = function (id) {
  var item, topblobs, refBlob, refHtml;

  this.tmp.area = "bibliography";
  this.tmp.last_rendered_name = false;
  this.tmp.bibliography_errors = [];
  this.tmp.bibliography_pos = 0;
  this.tmp.disambig_override = true;
  item = this.retrieveItem(id);

  function addPrefixAndSuffix(topblobs) {
    var len = topblobs.length - 1;
    for (var pos = len; pos > -1; pos += -1) {
      if (topblobs[pos].blobs && topblobs[pos].blobs.length !== 0) {
        var chr = this.bibliography.opt.layout_suffix.slice(0, 1);
        if (chr && topblobs[pos].strings.suffix.slice(-1) === chr) {
          topblobs[pos].strings.suffix = topblobs[pos].strings.suffix.slice(0, -1);
        }
        topblobs[pos].strings.suffix += this.bibliography.opt.layout_suffix;
        break;
      }
    }
    topblobs[0].strings.prefix = this.bibliography.opt.layout_prefix + topblobs[0].strings.prefix;
  }

  this.tmp.term_predecessor = false;
  CSL.getCite.call(this, item);

  topblobs = [];
  if (this.output.queue[0].blobs.length) {
    topblobs = this.output.queue[0].blobs;
  }

  // adds prefix and suffix
  addPrefixAndSuffix.call(this, topblobs);

  CSL.Output.Queue.purgeEmptyBlobs(this.output.queue);
  CSL.Output.Queue.adjustPunctuation(this, this.output.queue);

  // HACK: assuming that the reference is always the last top-blob
  refBlob = topblobs[topblobs.length-1];
  refHtml = this.output.string(this, refBlob.blobs);
  if (!refHtml) {
    throw new Error("\n[CSL STYLE ERROR: reference with no printed form.]\n");
  }

  this.tmp.disambig_override = false;

  return refHtml;
};
