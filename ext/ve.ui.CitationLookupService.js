
ve.ui.CitationLookupService = function VeUiCitationLookupService() {
};

OO.initClass( ve.ui.CitationLookupService );

ve.ui.CitationLookupService.prototype.find = function(searchStr) {
  var process = new OO.ui.Process();
  return process;
};

ve.ui.CitationLookupService.registry = new OO.Factory();

ve.ui.CitationLookupService.getServices = function() {
  var services = {};
  for (var i = 0; i < ve.ui.CitationLookupService.registry.entries.length; i++) {
    var name = ve.ui.CitationLookupService.registry.entries[i];
    var service = ve.ui.CitationLookupService.registry.create(name);
    services[name] = service;
  }
  return services;
};

ve.ui.CitationLookupService.register = function( citationLookupService ) {
  ve.ui.CitationLookupService.registry.register(citationLookupService);
};
