$(function() {
  var $searchButton = $('#search-button');
  var $searchText = $('#search-text');
  var $result = $('#result');

  function resolveDOI(doi, options, cb) {
    if (!(/^http:/.exec(doi))) {
      doi = "http://dx.doi.org/"+doi;
    }
    var headers = {
      Accept: "application/citeproc+json"
    };
    if (options.style === "bibtex") {
      headers.Accept = "text/bibliography; style=bibtex";
    } else if (options.style === 'citeproc+json') {
      headers.Accept = "application/citeproc+json";
    }
    $.ajax(doi, {
        headers: headers,
        success: function(data) {
        console.log("Received data:", data);
        cb(null, data);
      },
      error: function(req, status, err) {
        console.error("Could not retrieve data from cross-ref", status, err);
        cb(null, err);
      }
    });
  }

  // a cb that renders
  function searchCrossRef(options, cb) {

    var searchStr = options.search;
    var doiQueryParams = searchStr.split().join('+');

    var _wrapCallback = function(result) {
      return function(err, data) {
        result.data = data;
        cb(err, result);
      };
    };

    $.ajax('http://search.crossref.org/dois', {
      data: {
        q: doiQueryParams,
        sort: options.ranking
      },
      success: function(searchResult) {
        for (var i = 0; i < searchResult.length; i++) {
          var result = {
            meta: searchResult[i],
            data: null
          };
          resolveDOI(searchResult[i].doi, options, _wrapCallback(result));
        }
      },
      error: function(req, status, err) {
        console.error("Could not retrieve data from cross-ref", status, err);
        cb(null, err);
      }
    });

  }

  function appendSearchResult(err, result) {
    if (err) {
      console.error(err);
    } else {
      var $meta = $('<pre>').addClass('meta').text(JSON.stringify(result.meta, undefined, 2));
      var $data = $('<pre>').addClass('data').text(JSON.stringify(result.data, undefined, 2));
      $entry = $('<div>').addClass('reference').append([$meta, $data]);
      $result.append($entry);
    }
  }

  function search() {
    $result.empty();

    var searchStr = $searchText.val();
    searchCrossRef({
      search: searchStr,
      ranking: 'score'
    }, appendSearchResult);
  }

  $searchButton.click(search);

  $searchText.on('keydown', function(ev) {
    if(ev.which === 13) {
      search();
      ev.preventDefault();
    }
  });
});