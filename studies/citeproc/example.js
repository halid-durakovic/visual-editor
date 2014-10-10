( function() {

var data = [
  {
    "id": "ITEM-1",
    "title":"Boundaries of Dissent: Protest and State Power in the Media Age",
    "author": [
      {
        "family": "D'Arcus",
        "given": "Bruce",
        "static-ordering": false
      }
    ],
        "note":"The apostrophe in Bruce's name appears in proper typeset form.",
    "publisher": "Routledge",
        "publisher-place": "New York",
    "issued": {
      "date-parts":[
        [2006]
      ]
    },
    "type": "book"
  },
  {
    "id": "ITEM-2",
    "author": [
      {
        "family": "Bennett",
        "given": "Frank G.",
        "suffix": "Jr.",
        "comma-suffix": true,
        "static-ordering": false
      }
    ],
    "title":"Getting Property Right: \"Informal\" Mortgages in the Japanese Courts",
    "container-title":"Pacific Rim Law & Policy Journal",
    "volume": "18",
    "page": "463-509",
    "issued": {
      "date-parts":[
        [2009, 8]
      ]
    },
    "type": "article-journal",
        "note": "Note the flip-flop behavior of the quotations marks around \"informal\" in the title of this citation.  This works for quotation marks in any style locale.  Oh, and, uh, these notes illustrate the formatting of annotated bibliographies (!)."
  }
];

var updateReferences = function($el){
  var citeproc = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());

  var ids = [];
  data.forEach(function(reference) {
    var id = citeproc.addReference(reference);
    ids.push(id);
  });
  ids.forEach(function(id) {
      var $reference = $('<div>').addClass('reference');
      var $label = $('<div>').addClass('label').html(citeproc.getLabel(id));
      var $content = $('<div>').addClass('content').html(citeproc.getContent(id));
      $reference.append([$label, $content]);
      $el.append($reference);
    }
  );
};

$( function() {
  var $referenceList = $('.reference-list');
  updateReferences($referenceList);
} );

} )(window);
