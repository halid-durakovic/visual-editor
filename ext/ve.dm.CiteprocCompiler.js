/* global CSL: true */

ve.dm.CiteprocCompiler = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.style = config.style;
  this.clear();
};

OO.initClass( ve.dm.CiteprocCompiler );

ve.dm.CiteprocCompiler.prototype.setStyle = function(style) {
  this.style = style;
  this.clear();
};

ve.dm.CiteprocCompiler.prototype.clear = function() {
  this.engine = new CSL.Engine(this, this.style);
  this.data = {};
  this.citationLabels = {};
  this.count = 0;
};

ve.dm.CiteprocCompiler.prototype.addReference = function( reference ) {
  var id = reference.id || "ITEM_"+this.count++;
  reference.id = id;
  this.sanitizeReference(reference);
  this.data[id] = reference;
  return id;
};

ve.dm.CiteprocCompiler.prototype.addCitation = function( referenceIds ) {
  if (!$.isArray(referenceIds)) referenceIds = [ referenceIds ];
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
    content = this.renderReference(this.data[id]);
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
    content = this.renderReference(this.data[id]);
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

ve.dm.CiteprocCompiler.prototype.getSortedIds = function() {
  var result, done, i, id;
  result = this.engine.registry.getSortedIds();
  done = {};
  for (i = 0; i < result.length; i++) {
    done[result[i]] = true;
  }
  for(id in this.data) {
    if (!done[id]) {
      result.push(id);
      done[id] = true;
    }
  }
  return result;
};


ve.dm.CiteprocCompiler.prototype.renderReference = function(reference) {
  var refHtml;

  function extractContent() {
    // Note: we only want the rendered reference, without the surrounding layout stuff
    //   AFAIK there are only two cases, with label or without. In case that the style
    //   renderes labels in the bibliography there is an element .csl-right-line containing
    //   the content we are interested in.
    if (refHtml.search('csl-right-inline') >= 0) {
      var $el = $('<div>').append($(refHtml)).find('.csl-right-inline');
      return $el.html();
    } else {
      return refHtml;
    }
  }

  var self = this;
  function renderFallback() {
    console.log("Using fallback for rendering reference ", reference.id);
    // HACK: ve.dm.CiteprocCompiler.getBibliographyEntry is much faster than this implementation.
    // However, in certain cases citeproc crashed, so that we use this slower implementation as
    // fallback.
    var engine = new CSL.Engine({
        retrieveItem: function() {
          return reference;
        },
        retrieveLocale: function(lang) {
          return self.config.locale[lang];
        }
      }, self.style );
    // In the case that our custom incremental implementation fails just use citeproc
    var citation = {
      "citationItems": [ { id: reference.id } ],
      "properties": {}
    };
    engine.appendCitationCluster(citation);
    return engine.makeBibliography()[1][0];
  }

  if (this.data[reference.id]) {
    // Note: this method only works for registered references and sometimes failed even then
    try {
      refHtml = ve.dm.CiteprocCompiler.getBibliographyEntry.call(this.engine, reference.id);
    } catch (err) {
      refHtml = renderFallback();
    }
  } else {
    refHtml = renderFallback();
  }
  return extractContent(refHtml);
};

ve.dm.CiteprocCompiler.getBibliographyEntry = function (id) {
  var item, topblobs, refHtml, collapse_parallel, j, jlen, chr;

  this.tmp.area = "bibliography";
  this.tmp.last_rendered_name = false;
  this.tmp.bibliography_errors = [];
  this.tmp.bibliography_pos = 0;
  this.tmp.disambig_override = true;
  this.tmp.just_looking = true;
  item = this.retrieveItem(id);

  // this.output.startTag("bib_entry", bib_entry);
  this.parallel.StartCitation([[{id: "" + item.id}, item]]);
  this.tmp.term_predecessor = false;
  CSL.getCite.call(this, item);
  // this.output.endTag("bib_entry");

  // adds prefix and suffix
  if (this.output.queue[0].blobs.length && this.output.queue[0].blobs[0].blobs.length) {
    if (collapse_parallel || !this.output.queue[0].blobs[0].blobs[0].strings) {
      topblobs = this.output.queue[0].blobs;
      collapse_parallel = false;
    } else {
      topblobs = this.output.queue[0].blobs[0].blobs;
    }
    for (j  = topblobs.length - 1; j > -1; j += -1) {
      if (topblobs[j].blobs && topblobs[j].blobs.length !== 0) {
        var last_locale = this.tmp.cite_locales[this.tmp.cite_locales.length - 1];
        var suffix;
        if (this.tmp.cite_affixes[this.tmp.area][last_locale]) {
          suffix = this.tmp.cite_affixes[this.tmp.area][last_locale].suffix;
        } else {
          suffix = this.bibliography.opt.layout_suffix;
        }
        chr = suffix.slice(0, 1);
        if (chr && topblobs[j].strings.suffix.slice(-1) === chr) {
          topblobs[j].strings.suffix = topblobs[j].strings.suffix.slice(0, -1);
        }
        topblobs[j].strings.suffix += suffix;
        break;
      }
    }
    topblobs[0].strings.prefix = this.bibliography.opt.layout_prefix + topblobs[0].strings.prefix;
  }
  for (j=0,jlen=this.output.queue.length;j<jlen;j+=1) {
    CSL.Output.Queue.purgeEmptyBlobs(this.output.queue[j]);
  }
  for (j=0,jlen=this.output.queue.length;j<jlen;j+=1) {
    this.output.adjust.upward(this.output.queue[j]);
    this.output.adjust.leftward(this.output.queue[j]);
    this.output.adjust.downward(this.output.queue[j],true);
    this.output.adjust.fix(this.output.queue[j]);
  }

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

ve.dm.CiteprocCompiler.prototype.sanitizeReference = function(reference) {
  // TODO: add more of such
  reference['container-title'] = reference['container-title'] || '';
};
