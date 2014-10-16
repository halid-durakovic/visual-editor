/* global CSL: true */

ve.dm.CiteprocCompiler = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.style = config.style;
  this.clear();
};

OO.initClass( ve.dm.CiteprocCompiler );

ve.dm.CiteprocCompiler.prototype.clear = function() {
  this.engine = new CSL.Engine(this, this.style);
  this.data = {};
  this.citationLabels = {};
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


ve.dm.CiteprocCompiler.prototype.isCited = function(referenceId) {
  return this.engine.registry.myhash[referenceId];
};

ve.dm.CiteprocCompiler.prototype.getCitationCount = function(referenceId) {
  var citations = this.engine.registry.citationreg.citationsByItemId[referenceId];
  if (citations) {
    return citations.length;
  } else {
    return 0;
  }
};

/**
 * Compiles bibliography data used to render a bibliography.
 * In contrast to the original citeproc implementation, all references are
 * considered, and marked as uncited if no citations exist.
 * For each reference, its rank, the number of citations, a label as it occurs in the text, and
 * the rendered reference as HTML is provided
 */
ve.dm.CiteprocCompiler.prototype.makeBibliography = function() {
  var bib = {}, bibList = [],
    citationByIndex = this.engine.registry.citationreg.citationByIndex,
    citationsPre = [],
    sortedIds, i, rank, citation, label, content, id;

  // prepare a citationsPre list as it is used with processCitationCluster
  for (i = 0; i < citationByIndex.length; i += 1) {
    citation = citationByIndex[i];
    citationsPre.push(["" + citation.citationID, citation.properties.noteIndex]);
  }

  // process cited references first
  sortedIds = this.engine.registry.getSortedIds();
  for (rank = 0; rank < sortedIds.length; rank++) {
    id = sortedIds[rank];
    label = this.engine.previewCitationCluster({
      citationItems: [ { id: id } ],
      properties: {}
    }, citationsPre, [], 'html');
    content = this.renderReference(id);
    bib[id] = {
      id: id,
      rank: rank,
      citeCount: this.getCitationCount(id),
      label: label,
      content: content
    };
    bibList.push(bib[id]);
  }

  for(id in this.data) {
    // skip cited references
    if (bib[id]) continue;
    rank += 1;
    content = this.renderReference(id);
    bib[id] = {
      id: id,
      rank: rank,
      citeCount: 0,
      label: null,
      content: content
    };
    bibList.push(bib[id]);
  }
  bib.asList = function() {
    return bibList;
  };
  return bib;
};


ve.dm.CiteprocCompiler.prototype.renderReference = function(id) {
  var refHtml = ve.dm.CiteprocCompiler.getBibliographyEntry.call(this.engine, id);
  // Note: we only want the rendered reference, without the surrounding layout stuff
  //   AFAIK there are only two cases, with label or without. In case that the style
  //   renderes labels in the bibliography there is an element .csl-right-line containing
  //   the content we are interested in.
  if (refHtml.search('csl-right-inline') >= 0) {
    var $el = $(refHtml);
    return $el.html();
  } else {
    return refHtml;
  }
};

// Note: this has been derived from CSL.
ve.dm.CiteprocCompiler.getBibliographyEntry = function (id) {
  var item, topblobs, refHtml;

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
  this.tmp.just_looking = true;

  CSL.getCite.call(this, item);

  topblobs = [];
  if (this.output.queue[0].blobs.length) {
    topblobs = this.output.queue[0].blobs;
  }

  // adds prefix and suffix
  addPrefixAndSuffix.call(this, topblobs);

  CSL.Output.Queue.purgeEmptyBlobs(this.output.queue);
  CSL.Output.Queue.adjustPunctuation(this, this.output.queue);

  refHtml = this.output.string(this, this.output.queue)[0];

  if (!refHtml) {
    refHtml = "\n[CSL STYLE ERROR: reference with no printed form.]\n";
  }

  this.tmp.disambig_override = false;
  this.tmp.just_looking = false;

  return refHtml;
};

/* CSL.Sys interface */

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

