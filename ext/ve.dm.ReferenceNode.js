
ve.dm.ReferenceNode = function VeDmReferenceNode() {
  // Parent constructor
  ve.dm.LeafNode.apply( this, arguments );

  // Mixin constructors
  ve.dm.FocusableNode.call( this );
};

OO.inheritClass( ve.dm.ReferenceNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.ReferenceNode, ve.dm.FocusableNode );

/* Static Properties */

ve.dm.ReferenceNode.static.name = 'reference';

ve.dm.ReferenceNode.static.matchTagNames = [ 'div' ];

ve.dm.ReferenceNode.static.matchFunction = function ( domElement ) {
  return ( domElement.dataset.type === 'reference' );
};

ve.dm.ReferenceNode.static.isContent = true;

ve.dm.ReferenceNode.static.NAME_VARIABLES = [
  "author", "editor", "translator", "contributor", "collection-editor", "composer", "container-author", "editorial-director", "interviewer", "original-author", "recipient"
];

ve.dm.ReferenceNode.static.NUMERIC_VARIABLES = [
  "chapter-number", "collection-number", "edition", "issue", "locator", "number", "number-of-pages", "number-of-volumes", "volume", "citation-number"
];

ve.dm.ReferenceNode.static.DATE_VARIABLES = [
  "locator-date", "issued", "event-date", "accessed", "container", "original-date", "deposited", "indexed"
];

ve.dm.ReferenceNode.static.FIELD_TYPES = {};
ve.dm.ReferenceNode.static.NAME_VARIABLES.forEach(function(varName) {
  ve.dm.ReferenceNode.static.FIELD_TYPES[varName] = "name";
});
ve.dm.ReferenceNode.static.NUMERIC_VARIABLES.forEach(function(varName) {
  ve.dm.ReferenceNode.static.FIELD_TYPES[varName] = "number";
});
ve.dm.ReferenceNode.static.DATE_VARIABLES.forEach(function(varName) {
  ve.dm.ReferenceNode.static.FIELD_TYPES[varName] = "date";
});
ve.dm.ReferenceNode.static.FIELD_TYPES.subtitle = "array";
ve.dm.ReferenceNode.static.FIELD_TYPES.subject = "array";
ve.dm.ReferenceNode.static.FIELD_TYPES.ISSN = "array";

ve.dm.ReferenceNode.static.IGNORED_FIELDS = [
  "score", "prefix", "deposited", "indexed", "member", "source", "reference-count",
];

ve.dm.ReferenceNode.htmlNameToNameElement = function(el) {
  var nameData = {};
  for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
    var fieldName = child.dataset.type;
    nameData[fieldName] = child.textContent;
  }
  return nameData;
};

ve.dm.ReferenceNode.nameElementToHtmlName = function(nameData) {
  var $el = $('<span>'), $field;
  for (var field in nameData) {
    $field = $('<span>').attr('data-type', field).text(nameData[field]);
    $el.append($field);
  }
  return $el[0];
};

ve.dm.ReferenceNode.htmlDateToDateElement = function(el) {
  var date = { "date-parts": [] }, start, end;

  function _extractDate(el) {
    var date = [], year, month, day;
    year = el.querySelector('span[data-type=year');
    if (year) {
      date.push(parseInt(year.textContent, 10));
      month = el.querySelector('span[data-type=month');
      if (month) {
        date.push(parseInt(month.textContent, 10));
        day = el.querySelector('span[data-type=day');
        if (day) {
          date.push(parseInt(day.textContent, 10));
        }
      }
    } else {
      throw new Error("Unsupported date format.");
    }
    return date;
  }

  // The HTML date representation supports
  // 1. a start and end date (as supported by CSL) each with year, month, and day
  // 2. or just year, month, and day
  start = el.querySelector('span[data-type=start]');
  if (start) {
    end = el.querySelector('span[data-type=end]');
    date['date-parts'].push(_extractDate(start));
    date['date-parts'].push(_extractDate(end));
  } else {
    date['date-parts'].push(_extractDate(el));
  }

  return date;
};

ve.dm.ReferenceNode.dateElementToHtmlDate = function(date) {
  var $el, $start, $end, dateParts;

  function _convertDate($el, date) {
    var $year, $month, $day;
    $year = $('<span>').attr('data-type', 'year').text(date[0]);
    $el.append($year);
    if (date.length > 1) {
      $month = $('<span>').attr('data-type', 'month').text(date[1]);
      $el.append($month);
      if (date.length > 2) {
        $day = $('<span>').attr('data-type', 'day').text(date[2]);
        $el.append($day);
      }
    }
  }

  $el = $('<span>');
  dateParts = date['date-parts'];

  // if the date specifies a range there are two elements in 'date-parts'
  if (dateParts.length > 1) {
    $start = $('<span>').attr('data-type', 'start');
    _convertDate($start, dateParts[0]);
    $end = $('<span>').attr('data-type', 'end');
    _convertDate($end, dateParts[1]);
  }
  // otherwise there is only one element in date-parts
  else {
    _convertDate($el, dateParts[0]);
  }
  return $el[0];
};

// Note: the data model corresponds to the CSL specification for csl entries
ve.dm.ReferenceNode.static.toDataElement = function ( domElements ) {
  var data, el;
  el = domElements[0];
  data = {
    type: 'reference',
    attributes: {}
  };
  data.attributes.type = el.dataset.refType;
  data.attributes.id = el.dataset.refId;
  for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
    var type = child.dataset.type;
    var text = child.textContent;
    var fieldType = ve.dm.ReferenceNode.static.FIELD_TYPES[type];

    // skip ignored fields
    if (ve.dm.ReferenceNode.static.IGNORED_FIELDS.indexOf(type) >= 0) continue;

    // authors and such are so called name fields. In CSL they are collected into
    // an array, in HTML we prefer to have them flat.
    switch(fieldType) {
    case "name":
      data.attributes[type] = data.attributes[type] || [];
      data.attributes[type].push(ve.dm.ReferenceNode.htmlNameToNameElement(child));
      break;
    case "array":
      data.attributes[type] = data.attributes[type] || [];
      data.attributes[type].push(text);
      break;
    case "date":
      data.attributes[type] = ve.dm.ReferenceNode.htmlDateToDateElement(child);
      break;
    case "number":
      data.attributes[type] = parseInt(text, 10);
      break;
    default:
      data.attributes[type] = text;
    }
  }
  return data;
};

ve.dm.ReferenceNode.static.toDomElements = function ( dataElement, doc ) {
  var refEl, $refEl, el, key, fieldType, i, val;

  refEl = doc.createElement('div');
  refEl.dataset.type = 'reference';
  $refEl = $(refEl);

  refEl.dataset.refId = dataElement.attributes.id;
  refEl.dataset.refType = dataElement.attributes.type;

  for (key in dataElement.attributes) {
    // we have written these fields into data attributes already
    if (key === 'id' || key === 'type') continue;

    val = dataElement.attributes[key];
    fieldType = ve.dm.ReferenceNode.static.FIELD_TYPES[key];

    // skip ignored fields
    if (ve.dm.ReferenceNode.static.IGNORED_FIELDS.indexOf(key) >= 0) continue;

    switch (fieldType) {
    case 'name':
      // name elements, such as 'author' are flattened in HTML
      for (i = 0; i < val.length; i++) {
        el = ve.dm.ReferenceNode.nameElementToHtmlName(val[i]);
        el.dataset.type = key;
        refEl.appendChild(el);
      }
      break;
    case 'array':
      // name elements, such as 'author' are flattened in HTML
      for (i = 0; i < val.length; i++) {
        el = doc.createElement('span');
        el.dataset.type = key;
        el.textContent = '' + val[i];
        refEl.appendChild(el);
      }
      break;
    case 'date':
      el = ve.dm.ReferenceNode.dateElementToHtmlDate(val);
      el.dataset.type = key;
      refEl.appendChild(el);
      break;
    default:
      el = doc.createElement('span');
      el.dataset.type = key;
      el.textContent = '' + val;
      refEl.appendChild(el);
    }
  }

  return [ refEl ];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.ReferenceNode );
