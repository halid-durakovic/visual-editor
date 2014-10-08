
ve.ui.CrossrefCitationLookup = function VeUiCrossrefCitationLookup() {
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
      window.console.log("Received citeproc-json:", data);
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
  var promisedResult = $.Deferred();
  searchStr = "Bishop 1992";

  var searchTerms = searchStr.trim().toLowerCase().split(/\s+/);
  var doiQueryParams = searchTerms.join('+');
  var count = 0;

  $.ajax('http://search.crossref.org/dois', {
    data: {
      q: doiQueryParams,
      sort: "score"
    },
    success: function(searchResult) {
      searchResult.forEach(function(entry) {
        var promisedData = ve.ui.CrossrefCitationLookup.resolveDOI(entry.doi);
        promisedData.done(function(data) {
          window.console.log("Progressing: ", data);
          promisedResult.notifyWith(context, [ data ]);
        });
        promisedData.always(function() {
          count++;
          if (count === searchResult.length) {
            promisedResult.resolveWith(context);
          }
        });
      });
    },
    error: function(req, status, err) {
      promisedResult.rejectWith(context, [err]);
    }
  });

  return promisedResult;
};

ve.ui.CitationLookupService.register( ve.ui.CrossrefCitationLookup );