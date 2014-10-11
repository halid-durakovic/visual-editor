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

// var updateReferences = function($el){
//   var citeproc = new ve.dm.CiteprocCompiler(new ve.dm.CiteprocDefaultConfig());

//   var ids = [];
//   data.forEach(function(reference) {
//     var id = citeproc.addReference(reference);
//     ids.push(id);
//   });
//   ids.forEach(function(id) {
//       var $reference = $('<div>').addClass('reference');
//       var $label = $('<div>').addClass('label').html(citeproc.getLabel(id));
//       var $content = $('<div>').addClass('content').html(citeproc.getContent(id));
//       $reference.append([$label, $content]);
//       $el.append($reference);
//     }
//   );
// };

var cslStyles = {
  "APA": "csl/apa.csl",
  "Cell": "csl/cell.csl",
  "Chicago": "csl/chicago-author-date.csl",
  "Elsevier": "csl/elsevier-harvard.csl",
  "IEEE": "csl/ieee.csl",
  "ISO690": "csl/iso690-author-date-en.csl",
  "Nature": "csl/nature.csl",
  "PeerJ": "csl/peerj.csl",
  "PLOS": "csl/plos.csl",
  "PNAS": "csl/pnas.csl"
};


var updateReferences = function(){
  var style = "Cell";
  var url = "../../demos/ve/" + cslStyles[style];
  $.ajax( {
    url: url,
    dataType: 'text'
  } ).always( function ( result, status ) {
    if ( status === 'error' ) {
      window.console.error("Error", result, status);
    } else {
      var cslXML = result;
      var config = new ve.dm.CiteprocDefaultConfig();
      config.style = cslXML;
      var citeproc = new ve.dm.CiteprocCompiler(config);
      var ids = [];
      data.forEach(function(reference) {
        var id = citeproc.addReference(reference);
        ids.push(id);
      });

      var $referenceList = $('.reference-list');
      var $citeprocOut = $('.reference-list-citeproc');

      var citeProcResult = citeproc.engine.makeBibliography();
      $citeprocOut.html(citeProcResult[1].join('\n'));

      ids.forEach(function(id) {
          var $reference = $('<div>').addClass('reference');
          var $label = $('<div>').addClass('label').html(citeproc.getLabel(id));
          var $content = $('<div>').addClass('content').html(citeproc.getContent(id));
          $reference.append([$label, $content]);
          $referenceList.append($reference);
        }
      );

      var engine = new CSL.Engine(citeproc, cslXML);
      var citation = {
        "citationItems": [ { id: 'ITEM-1' }, { id: 'ITEM-2' } ],
        "properties": {}
      };
      var result = engine.appendCitationCluster(citation);
      console.log("####", result);
    }
  } );
};


$( function() {
  updateReferences();
} );

} )(window);
