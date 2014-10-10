ve.dm.CiteprocConverter = function VeDmCiteprocConverter() {
};

OO.initClass( ve.dm.CiteprocConverter );

ve.dm.CiteprocConverter.static.ignoredFields = [
  'id', 'indexed', 'deposited', 'source', 'subject', 'score', 'prefix', 'reference-count',
  'ISSN', 'URL'
];

ve.dm.CiteprocConverter.prototype.ignoreField = function(fieldName) {
  return this.constructor.static.ignoredFields.indexOf(fieldName) >= 0;
};


ve.dm.CiteprocConverter.getIdFromDoi = function(doi) {
  return doi.replace(/[^A-Za-z0-9_\-:]/g, ':');
};

ve.dm.CiteprocConverter.getIdFromJson = function(json) {
  if (json.DOI) return json.DOI;
  if (json.ISSN && json.ISSN.length > 0) return json.ISSN[0];
  throw new Error("This entry does not have a unique id.");
};

ve.dm.CiteprocConverter.prototype.getDataFromJson = function(json) {
  var data, key, dataParts;
  data = {
    type: 'reference',
    attributes: {}
  };
  data.attributes.referenceType = json.type;
  data.attributes.referenceId = ve.dm.CiteprocConverter.getIdFromJson(json);
  for (key in json) {
    if (this.ignoreField(key)) continue;
    switch(key) {
      case 'type':
        break;
      case 'DOI':
        data.attributes.doi = json[key];
        break;
      case 'author':
        data.attributes.authors = json.author.slice(0);
        break;
      case 'issued':
        dataParts = json.issued['json-parts'];
        if (dataParts[0]) {
          data.attributes['publication-year'] = dataParts[0];
          if (dataParts[1]) {
            data.attributes['publication-month'] = dataParts[1];
            if (dataParts[2]) {
              data.attributes['publication-day'] = dataParts[2];
            }
          }
        }
        break;
      case 'container-title':
        data.attributes['source-title'] = json[key];
        break;
      case 'subtitle':
        data.attributes.subtitles = json.subtitle.slice(0);
        break;
      case 'title':
      case 'publisher':
      case 'volume':
      case 'issue':
        data.attributes[key] = json[key];
        break;
      case 'page':
        data.attributes.pages = json[key];
        break;
      default:
        window.console.error("FIXME: unhandled field", key);
    }
  }
  return data;
};

ve.dm.CiteprocConverter.prototype.getJsonFromData = function(data) {
  var json = {}, key, val;
  json.type = data.attributes.referenceType;
  for (key in data.attributes) {
    val = data.attributes[key];
    switch(key) {
    case 'label':
    case 'referenceId':
    case 'referenceType':
      break;
    case 'doi':
      json.DOI = val;
      break;
    case 'authors':
      json.author = val.slice(0);
      break;
    case 'publication-year':
    case 'publication-month':
    case 'publication-day':
      json.issued = json.issued || { dateParts: [] };
      json.issued.dateParts[this.getDatePartIndexForType(key)] = parseInt(val, 10);
      break;
    case 'subtitles':
      json.subtitle = val.slice(0);
      break;
    case 'source-title':
      json['container-title'] = val;
      break;
    case 'title':
    case 'publisher':
    case 'volume':
    case 'issue':
      json[key] = val;
      break;
    case 'pages':
      json.page = val;
      break;
    default:
      window.console.error("FIXME: unhandled field", key);
    }
  }
  return json;
};

ve.dm.CiteprocConverter.prototype.getDatePartIndexForType = function(type) {
  if (type.slice(-4) === "year") return 0;
  if (type.slice(-5) === "month") return 1;
  if (type.slice(-3) === "day") return 2;
};
