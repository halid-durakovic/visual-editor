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

var citationLables = [];

var updateReferences = function($el){
  var citeproc, output;
  var sys = new Sys(abbreviations);
  // Chicago Author-Date
  citeproc = new CSL.Engine(sys, chicago_author_date);
  for (var i = 0; i < citations.length; i++) {
    citationLabels.push(citeproc.appendCitationCluster(citations[i]));
  }
  $el.empty();
  $el.html(citeproc.makeBibliography());
};

$( function() {
  $referenceList = $('.reference-list');
  updateReferences($referenceList);
} );

} )(window);
