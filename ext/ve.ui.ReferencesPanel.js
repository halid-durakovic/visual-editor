
ve.ui.ReferencesPanel = function VeUiReferencesPanel( bibliographyNode, config ) {
  OO.EventEmitter.call(this);

  this.$element = $('<div>').addClass('reference-list');
  this.element = this.$element[0];

  this.bibliographyNode = bibliographyNode;
  this.bibData = null;

  this.references = [];
  this.cursorIdx = -1;
  this.selectedReferences = [];

  this.bibliographyNode.connect(this, {
    'csl-style-changed': 'updateBibData',
    'citation-changed': 'updateBibData'
  });

  this.updateBibData();
};

OO.initClass( ve.ui.ReferencesPanel );
OO.mixinClass( ve.ui.ReferencesPanel, OO.EventEmitter );

ve.ui.ReferencesPanel.prototype.dispose = function() {
  this.bibliographyNode.disconnect(this);
};

ve.ui.ReferencesPanel.prototype.clear = function() {
  this.references = [];
  this.cursorIdx = -1;
  this.$element.empty();
};

ve.ui.ReferencesPanel.prototype.createReferenceElement = function(refData) {
  var $reference, $label, $content, $buttons, selectButton;
  $reference = $('<div>').addClass('reference').attr('data-ref-id', refData.id);
  $label = $('<div>').addClass('label');
  $reference.append($label);
  $content = $('<div>').addClass('content');
  $reference.append($content);
  $buttons = $('<div>').addClass('buttons');
  selectButton = new OO.ui.ActionWidget({
    action: 'select',
    // label: 'Select',
    icon: 'citation',
    classes: ['select-button']
  });
  selectButton.connect(this, { click: [ 'onSelect', refData ] });
  $buttons.append([ selectButton.$element ]);
  $reference.append($buttons);

  return $reference;
};

ve.ui.ReferencesPanel.prototype.setSelectedReferences = function(refIds) {
  this.selectedReferences = refIds;
};

ve.ui.ReferencesPanel.prototype.scrollToFirstSelected = function() {
  var $selected = this.$element.find('.selected');
  if ($selected.length > 0)
  OO.ui.Element.scrollIntoView($selected[0]);
};

ve.ui.ReferencesPanel.prototype.onSelect = function(refData) {
  this.emit('onSelectReference', refData);
};

ve.ui.ReferencesPanel.prototype.update = function() {
  var refEls = this.element.children;
  for (var i = 0; i < this.references.length; i++) {
    var ref = this.references[i];
    var el = refEls[i];
    var $el = $(el);
    var $label = $el.find('.label');
    var $content = $el.find('.content');
    var id = el.dataset.refId;
    if (this.selectedReferences.indexOf(id) >= 0) {
      $el.addClass('selected');
    } else {
      $el.removeClass('selected');
    }
    var existingEntry = this.bibData[id];
    if (existingEntry) {
      $label.html(existingEntry.label || '').show();
      $content.html(existingEntry.content || '');
    } else {
      var compiler = this.bibliographyNode.getCompiler();
      $label.html('').hide();
      if (!$content[0].innerHTML) $content.html(compiler.renderReference(ref));
    }
  }
};

ve.ui.ReferencesPanel.prototype.addReference = function(refData) {
  this.references.push(refData);
  var $reference = this.createReferenceElement(refData);
  this.$element.append($reference);
  this.update();
};

ve.ui.ReferencesPanel.prototype.removeSelectedReferences = function() {
  for (var i = 0; i < this.references.length; i++) {
    if (this.selectedReferences.indexOf(this.references[i].id) >= 0) {
      this.element.removeChild(this.element.children[i]);
      this.references.splice(i, 1);
      i--;
    }
  }
};

// a simple AND over all terms in the given searchStr
ve.ui.ReferencesPanel.prototype.applyFilter = function(searchStr) {
  var patterns, child, i, pass, content, pattern, re;
  patterns = searchStr.toLowerCase().split(/\s+/);
  for (child = this.element.firstElementChild; child; child = child.nextElementSibling) {
    content = child.textContent.toLowerCase();
    pass = true;
    for (i = 0; i < patterns.length; i++) {
      pattern = patterns[i];
      re = new RegExp(pattern, 'g');
      if (!re.test(content)) {
        pass = false;
        break;
      }
    }
    if (!pass) {
      $(child).hide();
    } else {
      $(child).show();
    }
  }
};

ve.ui.ReferencesPanel.prototype.moveCursorDown = function() {
  if (this.cursorIdx < this.references.length-1) {
    this.updateCursor(this.cursorIdx, this.cursorIdx+1);
    this.cursorIdx++;
  }
};

ve.ui.ReferencesPanel.prototype.moveCursorUp = function() {
  if (this.cursorIdx >= 0) {
    this.updateCursor(this.cursorIdx, this.cursorIdx-1);
    this.cursorIdx--;
  }
};

ve.ui.ReferencesPanel.prototype.updateCursor = function(oldIdx, newIdx) {
  var oldRef, newRef, refEls;
  refEls = this.element.children;
  oldRef = refEls[oldIdx];
  newRef = refEls[newIdx];
  if (oldRef) {
    $(oldRef).removeClass('cursor');
  }
  if (newRef) {
    $(newRef).addClass('cursor');
    OO.ui.Element.scrollIntoView(newRef);
  }
};

ve.ui.ReferencesPanel.prototype.activateCursor = function() {
  if (this.cursorIdx < 0) {
    this.cursorIdx = 0;
  }
  this.updateCursor(null, this.cursorIdx);
};

ve.ui.ReferencesPanel.prototype.deactivateCursor = function() {
  this.updateCursor(this.cursorIdx, null);
};

ve.ui.ReferencesPanel.prototype.getSelectedReference = function() {
  return this.references[this.cursorIdx];
};

ve.ui.ReferencesPanel.prototype.show = function() {
  this.$element.show();
  return this;
};

ve.ui.ReferencesPanel.prototype.hide = function() {
  this.$element.hide();
  return this;
};

ve.ui.ReferencesPanel.prototype.updateBibData = function() {
  this.bibData = this.bibliographyNode.getCompiler().makeBibliography();
};
