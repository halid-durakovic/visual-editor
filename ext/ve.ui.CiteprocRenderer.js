/* global CSL: true */

ve.ui.CiteprocRenderer = function VeUiCiteprocRenderer( config ) {
  this.config = config;
  this.engine = new CSL.Engine(this, config.style);
  this.data = {};
  this.labels = {};
  this.contents = {};
  this.count = 0;
};

OO.initClass( ve.ui.CiteprocRenderer );

ve.ui.CiteprocRenderer.prototype.addReference = function( reference ) {
  var id = "ITEM_"+this.count++;
  reference.id = id;
  this.data[id] = reference;
  var citation = {
    "citationItems": [ { id: id } ],
    "properties": {}
  };
  this.engine.appendCitationCluster(citation);
  var result = this.renderReference(id);
  this.labels[id] = result.labelHtml;
  this.contents[id] = result.contentHtml;
  return id;
};

ve.ui.CiteprocRenderer.prototype.getLabel = function(id) {
  return this.labels[id];
};

ve.ui.CiteprocRenderer.prototype.getContent = function(id) {
  return this.contents[id];
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

ve.ui.CiteprocRenderer.prototype.renderReference = function(id) {
  var result = ve.ui.CiteprocRenderer.getBibliographyEntry.call(this.engine, id);
  // HACK: see below about handling labelBlobciteproc... discarding the wrapping element here
  var $labelElementWithWrapper = $(result.labelHtml);
  result.labelHtml = $labelElementWithWrapper.html();
  return result;
};

ve.ui.CiteprocRenderer.getBibliographyEntry = function (id) {
  var item, topblobs, labelBlob, refBlob, labelHtml, contentHtml;

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

  labelBlob = topblobs[0];
  refBlob = topblobs[1];

  // HACK: citeproc doesn't render the the label whe using labelBlob.blobs... FIXME
  // Instead we will let citeproc wrap it with a div.csl-block which we will discard afterwards
  labelBlob.decorations = [["@display", "block"]];
  labelHtml = this.output.string(this, [labelBlob]);
  contentHtml = this.output.string(this, refBlob.blobs);

  if (!labelHtml || !contentHtml) {
    throw new Error("\n[CSL STYLE ERROR: reference with no printed form.]\n");
  }
  this.tmp.disambig_override = false;

  return {
    labelHtml: labelHtml.join(''),
    contentHtml: contentHtml.join('')
  };
};
