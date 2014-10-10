
ve.ui.CrossrefCitationLookup = function VeUiCrossrefCitationLookup() {
  this.lastSearch = "";
  this.lastResult = [];
};

OO.inheritClass( ve.ui.CrossrefCitationLookup, ve.ui.CitationLookupService );

ve.ui.CrossrefCitationLookup.static.name = "crossref";

ve.ui.CrossrefCitationLookup.static.label = "CrossRef";

ve.ui.CrossrefCitationLookup.resolveDOI = function( doi ) {
  var promise = $.Deferred();
  if (!(/^http:/.exec(doi))) {
    doi = "http://dx.doi.org/"+doi;
  }
  $.ajax(doi, {
    headers: {
      Accept: "application/citeproc+json"
    },
    success: function(data) {
      window.console.log("Received citeproc-json:", JSON.stringify(data, null, 2) );
      promise.resolve(data);
    },
    error: function(req, status, err) {
      window.console.error("Could not retrieve data from cross-ref", status, err);
      promise.rejectWith(null, err);
    }
  });
  return promise;
};

ve.ui.CrossrefCitationLookup.prototype.find = function( searchStr, context ) {
  var promisedResult = $.Deferred(),
    lastResult;

  // deliver a cached result if the search has not changed
  if (this.lastSearch === searchStr) {
    lastResult = this.lastResult;
    window.setTimeout(function() {
      lastResult.forEach(function(data) {
        promisedResult.notifyWith(context, [ data ]);
      });
      promisedResult.resolveWith(context);
    }, 0);
  }
  // otherwise start a new search;
  else {
    this.lastSearch = searchStr;
    this.lastResult = [];
    lastResult = this.lastResult;

    var searchTerms = searchStr.trim().toLowerCase().split(/\s+/);
    var doiQueryParams = searchTerms.join('+');
    var count = 0;

    $.ajax('http://search.crossref.org/dois', {
      data: {
        q: doiQueryParams,
        sort: "score"
      },
      success: function(searchResult) {
        function step() {
          if (count < searchResult.length) {
            var entry = searchResult[count++];
            var promisedData = ve.ui.CrossrefCitationLookup.resolveDOI(entry.doi);
            promisedData.done(function(data) {
              window.console.log("Progressing: ", data);
              lastResult.push(data);
              promisedResult.notifyWith(context, [ data ]);
            });
            promisedData.always(step);
          } else {
            promisedResult.resolveWith(context);
          }
        }
        // start the chain
        step();
      },
      error: function(req, status, err) {
        promisedResult.rejectWith(context, [err]);
      }
    });
  }
  return promisedResult;
};

ve.ui.CitationLookupService.register( ve.ui.CrossrefCitationLookup );
