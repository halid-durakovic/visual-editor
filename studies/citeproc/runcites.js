( function() {

/* global Sys: true, abbreviations: true, CSL: true, CSLStyles: true */

var citations = [
  {
    "citationItems": [ { id: "ITEM-1" } ],
    "properties": { "noteIndex": 1 }
  },
  {
    "citationItems": [ { id: "ITEM-2" } ],
    "properties": { "noteIndex": 2 }
  },
  {
    "citationItems": [ { id: "ITEM-3" } ],
    "properties": { "noteIndex": 3 }
  }
];

var citationLabels = [];

var updateReferences = function($el){
  console.log("Updating references...");
  var citeproc, output;
  var sys = new Sys(abbreviations);
  // Chicago Author-Date
  citeproc = new CSL.Engine(sys, CSLStyles.default);
  for (var i = 0; i < citations.length; i++) {
    citationLabels.push(citeproc.appendCitationCluster(citations[i]));
  }
  $el.empty();
  var htmlStr = citeproc.makeBibliography()[1].join('\n');
  $el.html($(htmlStr));
};

$( function() {
  $referenceList = $('.reference-list');
  updateReferences($referenceList);
} );

} )(window);
