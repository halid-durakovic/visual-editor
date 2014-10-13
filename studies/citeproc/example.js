( function() {

var references = [
  {"subtitle":[],"subject":["Immunology","Immunology and Allergy","Infectious Diseases"],"issued":{"date-parts":[[2007,7]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.1016","author":[{"family":"Huse","given":"Morgan"},{"family":"Klein","given":"Lawrence O."},{"family":"Girvin","given":"Andrew T."},{"family":"Faraj","given":"Joycelyn M."},{"family":"Li","given":"Qi-Jing"},{"family":"Kuhns","given":"Michael S."},{"family":"Davis","given":"Mark M."}],"container-title":"Immunity","reference-count":64,"page":"76-88","deposited":{"date-parts":[[2011,6,20]],"timestamp":1308528000000},"issue":"1","title":"Spatial and Temporal Dynamics of T Cell Receptor Signaling with a Photoactivatable Agonist","type":"journal-article","DOI":"10.1016\/j.immuni.2007.05.017","ISSN":["1074-7613"],"URL":"http:\/\/dx.doi.org\/10.1016\/j.immuni.2007.05.017","source":"CrossRef","publisher":"Elsevier BV","indexed":{"date-parts":[[2014,9,3]],"timestamp":1409720359617},"volume":"27","member":"http:\/\/id.crossref.org\/member\/78"},
  {"subtitle":[],"subject":["General"],"issued":{"date-parts":[[2002,10,24]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.1038","author":[{"family":"Irvine","given":"Darrell J."},{"family":"Purbhoo","given":"Marco A."},{"family":"Krogsgaard","given":"Michelle"},{"family":"Davis","given":"Mark M."}],"container-title":"Nature","reference-count":30,"page":"845-849","deposited":{"date-parts":[[2011,8,22]],"timestamp":1313971200000},"issue":"6909","title":"Direct observation of ligand recognition by T cells","type":"journal-article","DOI":"10.1038\/nature01076","ISSN":["0028-0836"],"URL":"http:\/\/dx.doi.org\/10.1038\/nature01076","source":"CrossRef","publisher":"Nature Publishing Group","indexed":{"date-parts":[[2014,9,4]],"timestamp":1409808407302},"volume":"419","member":"http:\/\/id.crossref.org\/member\/339"},
  {"subtitle":[],"subject":["General"],"issued":{"date-parts":[[2011,5,16]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.1073","update-policy":"http:\/\/dx.doi.org\/10.1073\/pnas.cm10313","author":[{"family":"Manz","given":"B. N."},{"family":"Jackson","given":"B. L."},{"family":"Petit","given":"R. S."},{"family":"Dustin","given":"M. L."},{"family":"Groves","given":"J."}],"container-title":"Proceedings of the National Academy of Sciences","reference-count":43,"page":"9089-9094","deposited":{"date-parts":[[2013,10,27]],"timestamp":1382832000000},"issue":"22","title":"T-cell triggering thresholds are modulated by the number of antigen within individual T-cell receptor clusters","type":"journal-article","DOI":"10.1073\/pnas.1018771108","ISSN":["0027-8424","1091-6490"],"URL":"http:\/\/dx.doi.org\/10.1073\/pnas.1018771108","source":"CrossRef","publisher":"Proceedings of the National Academy of Sciences","indexed":{"date-parts":[[2014,9,8]],"timestamp":1410204741433},"volume":"108","member":"http:\/\/id.crossref.org\/member\/341"},
  {"subtitle":[],"subject":["General"],"issued":{"date-parts":[[1994,12,20]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.1073","update-policy":"http:\/\/dx.doi.org\/10.1073\/pnas.cm10313","author":[{"family":"Matsui","given":"K."},{"family":"Boniface","given":"J. J."},{"family":"Steffner","given":"P."},{"family":"Reay","given":"P. A."},{"family":"Davis","given":"M. M."}],"container-title":"Proceedings of the National Academy of Sciences","reference-count":0,"page":"12862-12866","deposited":{"date-parts":[[2014,5,1]],"timestamp":1398902400000},"issue":"26","title":"Kinetics of T-cell receptor binding to peptide\/I-Ek complexes: correlation of the dissociation rate with T-cell responsiveness.","type":"journal-article","DOI":"10.1073\/pnas.91.26.12862","ISSN":["0027-8424","1091-6490"],"URL":"http:\/\/dx.doi.org\/10.1073\/pnas.91.26.12862","source":"CrossRef","publisher":"Proceedings of the National Academy of Sciences","indexed":{"date-parts":[[2014,9,10]],"timestamp":1410383130390},"volume":"91","member":"http:\/\/id.crossref.org\/member\/341"},
  {"subtitle":[],"subject":["Medicine(all)"],"issued":{"date-parts":[[2007,9,1]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.4049","author":[{"family":"Tian","given":"S."},{"family":"Maile","given":"R."},{"family":"Collins","given":"E. J."},{"family":"Frelinger","given":"J. A."}],"container-title":"The Journal of Immunology","reference-count":0,"page":"2952-2960","deposited":{"date-parts":[[2014,4,18]],"timestamp":1397779200000},"issue":"5","title":"CD8+ T Cell Activation Is Governed by TCR-Peptide\/MHC Affinity, Not Dissociation Rate","type":"journal-article","DOI":"10.4049\/jimmunol.179.5.2952","ISSN":["0022-1767","1550-6606"],"URL":"http:\/\/dx.doi.org\/10.4049\/jimmunol.179.5.2952","source":"CrossRef","publisher":"The American Association of Immunologists","indexed":{"date-parts":[[2014,5,23]],"timestamp":1400888651383},"volume":"179","member":"http:\/\/id.crossref.org\/member\/2487"},
  {"subtitle":[],"subject":["Biochemistry, Genetics and Molecular Biology(all)"],"issued":{"date-parts":[[1994,1]]},"score":1.0,"prefix":"http:\/\/id.crossref.org\/prefix\/10.1016","author":[{"family":"Weiss","given":"Arthur"},{"family":"Littman","given":"Dan R."}],"container-title":"Cell","reference-count":125,"page":"263-274","deposited":{"date-parts":[[2011,8,23]],"timestamp":1314057600000},"issue":"2","title":"Signal transduction by lymphocyte antigen receptors","type":"journal-article","DOI":"10.1016\/0092-8674(94)90334-4","ISSN":["0092-8674"],"URL":"http:\/\/dx.doi.org\/10.1016\/0092-8674(94)90334-4","source":"CrossRef","publisher":"Elsevier BV","indexed":{"date-parts":[[2014,9,4]],"timestamp":1409848222905},"volume":"76","member":"http:\/\/id.crossref.org\/member\/78"}
];

var cslStyleURLs = {
  "APA": "csl/apa.csl",
  "IEEE": "csl/ieee.csl",
  "ISO690": "csl/iso690-author-date-en.csl",
  "Nature": "csl/nature.csl",
  "PeerJ": "csl/peerj.csl",
  "PLOS": "csl/plos.csl",
  "PNAS": "csl/pnas.csl"
};

var cslStyles = {};

function withStyle(name, cb) {
  var url = "../../demos/ve/" + cslStyleURLs[name];
  $.ajax( {
    url: url,
    dataType: 'text'
  } ).always( function ( result, status ) {
    if ( status === 'error' ) {
      window.console.error("Error", result, status);
    } else {
      cb(result);
    }
  } );
}

function allCitedOnce(cslXML) {
  var config = new ve.dm.CiteprocDefaultConfig({ style: cslXML });
  var citeproc = new ve.dm.CiteprocCompiler(config);

  var ids = [];
  references.forEach(function(reference) {
    var id = citeproc.addReference(reference);
    ids.push(id);
  });

  var citations = [];
  ids.forEach(function(id) {
    citations.push(citeproc.addCitation([ id ]));
  });

  var $el = $('<div>');
  $el.append( $('<h2>').text("Every reference cited once") );
  $el.append( $('<h3>').text("Citations") );
  var $p = $('<p>');
  var text = ["In the text this would look like"];
  citations.forEach(function(citation) {
    text.push('...');
    text.push('<span>'+citation.label+'</span>');
    text.push('...');
  } );
  $p.html(text);
  $el.append($p);
  $el.append( $('<h3>').text("Bibliography") );

  var citeProcResult = citeproc.engine.makeBibliography();
  $el.append($('<div>').html(citeProcResult[1].join('\n')));

  $('body').append($el);
}

function mixedWithUncited(cslXML) {
  var config = new ve.dm.CiteprocDefaultConfig( { style: cslXML } );
  var citeproc = new ve.dm.CiteprocCompiler(config);

  var ids = [];
  references.forEach(function(reference) {
    var id = citeproc.addReference(reference);
    ids.push(id);
  });


  var citations = [];
  var uncited = [];
  for (var i = 0; i < ids.length; i++) {
    if (i % 2 === 0) {
      uncited.push(ids[i]);
    } else {
      citations.push(citeproc.addCitation(ids[i]));
    }
  }

  citeproc.engine.updateUncitedItems(uncited);

  var $el = $('<div>');
  $el.append( $('<h2>').text("Mixed with Uncited items") );
  var citeProcResult = citeproc.engine.makeBibliography();
  $el.append($('<div>').html(citeProcResult[1].join('\n')));

  $('body').append($el);
}

function renderExample(style) {
  $('body').append($('<h1>').text('CSL Style "' + style +'"'));
  allCitedOnce(cslStyles[style]);
  mixedWithUncited(cslStyles[style]);
}

function updateCitationStudy(style) {
  var $body = $('body');
  $body.append($('<h1>').text('Update Citation (' + style + ')'));

  var config = new ve.dm.CiteprocDefaultConfig( { style: cslStyles[style] } );
  var citeproc = new ve.dm.CiteprocCompiler(config);

  var ids = [];
  references.forEach(function(reference) {
    var id = citeproc.addReference(reference);
    ids.push(id);
  });

  var citations = [];
  ids.forEach(function(id) {
    citations.push(citeproc.addCitation([ id ]));
  });

  var $el = $('<div>');
  $el.append( $('<h3>').text("Initial citations") );
  var $p = $('<p>');
  var text = [];
  citations.forEach(function(citation) {
    text.push('...');
    text.push('<span>'+citation.label+'</span>');
    text.push('...');
  } );
  $p.html(text);
  $el.append($p);

  var updated = citeproc.updateCitation(citations[2].id, [references[2].id, references[3].id]);
  citations[2] = updated;

  $el.append( $('<h3>').text("After update") );
  $p = $('<p>');
  text = [];
  citations.forEach(function(citation) {
    text.push('...');
    text.push('<span>'+citation.label+'</span>');
    text.push('...');
  } );
  $p.html(text);
  $el.append($p);

  $('body').append($el);
}

function uncitedStudy(style) {
  var $body = $('body');
  $body.append($('<h1>').text('Study for Uncited References (' + style + ')'));

  var config = new ve.dm.CiteprocDefaultConfig( { style: cslStyles[style] } );
  var citeproc = new ve.dm.CiteprocCompiler(config);

  var ids = [];
  references.forEach(function(reference) {
    var id = citeproc.addReference(reference);
    ids.push(id);
  });

  var citations = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (i%2 === 1) {
      citations.push(citeproc.addCitation([ id ]));
    }
  }

  var bib = citeproc.makeBibliography();
  var bibList = bib.asList();
  for (var i = 0; i < bibList.length; i++) {
    var entry = bibList[i];
    var $ref = $('<div>').addClass('reference');
    $ref.append( $('<div>').addClass('label').text( entry.label || '') );
    $ref.append( $('<div>').addClass('content').html( entry.content ) );
    $ref.append( $('<div>').addClass('count').text( 'cited ' + entry.citeCount + ' times' ) );
    $body.append($ref);
  }
}

function loadStyles(cb) {
  var names = Object.keys(cslStyleURLs).sort();
  var idx = 0;
  var next = function() {
    var name = names[idx];
    withStyle(name, function(cslXML) {
      cslStyles[name] = cslXML;
      idx++;
      if (idx < names.length) {
        next();
      } else {
        cb();
      }
    });
  };
  next();
}

function run() {
  $('body').empty();
  loadStyles(function() {
    // for (var name in cslStyles) {
    //   renderExample(name);
    // }
    // updateCitationStudy('APA');
    uncitedStudy('PLOS');
  });
}

function renderReferencesAsHTML() {
  references.forEach(function(reference) {
    var data = {
      type: 'reference',
      attributes: reference
    };
    reference.id = reference.DOI;
    var els = ve.dm.ReferenceNode.static.toDomElements(data, window.document);
    var dummy = document.createElement('div');
    dummy.appendChild(els[0]);
    console.log('-----------------------------------------');
    console.log(dummy.innerHTML);
    console.log('-----------------------------------------');
  });
}

$( function() {
  run();
} );

} )(window);
