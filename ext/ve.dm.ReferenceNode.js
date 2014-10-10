
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

ve.dm.ReferenceNode.static.toDataElement = function ( domElements ) {
  var data, el;
  el = domElements[0];
  data = {
    type: 'reference',
    attributes: {}
  };
  data.attributes.referenceType = el.dataset.refType;
  data.attributes.referenceId = el.dataset.refId;
  for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
    var type = child.dataset.type;
    var text = child.textContent;
    switch(type) {
    case 'author':
      data.attributes.authors = data.attributes.authors || [];
      var familyEl = child.querySelector('span[data-type=family]');
      var givenEl = child.querySelector('span[data-type=given]');
      data.attributes.authors.push({
        family: familyEl.textContent,
        given: givenEl.textContent
      });
      break;
    case 'subtitle':
      data.attributes.subtitles = data.attributes.subtitles || [];
      data.attributes.subtitles.push(text);
      break;
    default:
      data.attributes[type] = text;
    }
  }
  return data;
};

ve.dm.ReferenceNode.static.toDomElements = function ( dataElement, doc ) {
  var refEl, $refEl, el, key, authors, author, i, val;

  refEl = doc.createElement('div');
  refEl.dataset.type = 'reference';
  $refEl = $(refEl);

  for (key in dataElement.attributes) {
    val = dataElement.attributes[key];
    switch (key) {
    case 'referenceType':
      refEl.dataset.refType = val;
      break;
    case 'referenceId':
      refEl.dataset.refId = val;
      break;
    case 'authors':
      authors = val;
      for (i = 0; i < authors.length; i++) {
        author = authors[i];
        $refEl.append(
          $('<span>').attr('data-type', 'author')
            .append($('<span>').attr('data-type', 'family').text(author.family))
            .append($('<span>').attr('data-type', 'given').text(author.given))
        );
      }
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
