/* global CSL: true */

ve.dm.CiteprocCompiler = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.clear();
};

OO.initClass( ve.dm.CiteprocCompiler );

ve.dm.CiteprocCompiler.prototype.clear = function() {
  this.engine = new CSL.Engine(this, this.config.style);
  this.data = {};
  this.citationLabels = {};
  this.labels = {};
  this.contents = {};
  this.count = 0;
};

ve.dm.CiteprocCompiler.prototype.addReference = function( reference ) {
  var id = reference.id || "ITEM_"+this.count++;
  reference.id = id;
  this.data[id] = reference;
  return id;
};

ve.dm.CiteprocCompiler.prototype.addCitation = function( referenceIds ) {
  if (!$.isArray(referenceIds)) referenceIds = [ referenceIds ];
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
  var citationIndex = result[0][0];
  citation = this.engine.registry.citationreg.citationByIndex[citationIndex];
  var citationId = citation.citationID;
  var citationLabel = result[0][1];

  this.citationLabels[citationId] = citationLabel;
  // Update citation labels which may happen due to disambiguation
  for (i = 1; i < result.length; i++) {
    this.citationLabels[result[i][0]] = result[i][1];
  }

  return {
    id: citationId,
    label: citationLabel
  };
};

ve.dm.CiteprocCompiler.prototype.updateCitation = function( citationId, referenceIds ) {
  var citationsPre = [], citationsPost = [], idx, len, pre = true, citation, c, item, info, result;
  len = this.engine.registry.citationreg.citationByIndex.length;
  for (idx = 0; idx < len; idx++) {
    c = this.engine.registry.citationreg.citationByIndex[idx];
    if (c.citationID === citationId) {
      citation = c;
      pre = false;
    } else {
      item = ["" + c.citationID, c.properties.noteIndex];
      if (pre) {
        citationsPre.push(item);
      } else {
        citationsPost.push(item);
      }
    }
  }
  if (!citation) throw new Error("Could not find citation with id " + citationId);

  // update reference ids
  citation.citationItems = [];
  for (idx = 0; idx < referenceIds.length; idx++) {
    citation.citationItems.push( { id: referenceIds[idx] } );
  }

  result = this.engine.processCitationCluster(citation, citationsPre, citationsPost);
  info = result[0];
  result = result[1];

  var citationLabel = result[0][1];
  this.citationLabels[citationId] = citationLabel;

  // Update citation labels which may happen due to disambiguation
  for (idx = 0; idx < result.length; idx++) {
    var updatedCitation = this.engine.registry.citationreg.citationByIndex[result[idx][0]];
    this.citationLabels[updatedCitation.citationID] = result[idx][1];
  }

  return {
    id: citationId,
    label: this.citationLabels[citationId]
  };
};

ve.dm.CiteprocCompiler.prototype.getLabelForCitation = function(citationId) {
  return this.citationLabels[citationId];
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
