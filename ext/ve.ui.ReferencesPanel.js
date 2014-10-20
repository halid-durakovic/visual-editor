
ve.ui.ReferencesPanel = function VeUiReferencesPanel( bibliographyNode, config ) {
  OO.EventEmitter.call(this);

  config = config || { placeholder: 'No references available.'};

  this.$references = $('<div>').addClass('reference-list');
  this.$placeholder = $('<div>').addClass('placeholder');

  this.$placeholder.append( [
    $('<div>').addClass('empty').text(config.placeholder),
    $('<div>').addClass('searching').text('Searching...').append(
        $('<div>').addClass('spinner large').append( $('<div>').addClass('throbber') )
      ),
    ] ).hide();

  this.$element = $('<div>').addClass('reference-panel');
  if (config.classes) this.$element.addClass(config.classes);
  this.$element.append(this.$references, this.$placeholder);
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
  this.$references.empty();
  this.$placeholder.show();
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
  var $selected = this.$references.find('.selected');
  if ($selected.length > 0)
  OO.ui.Element.scrollIntoView($selected[0]);
};

ve.ui.ReferencesPanel.prototype.onSelect = function(refData) {
  this.emit('onSelectReference', refData);
};

ve.ui.ReferencesPanel.prototype.update = function() {
  var refEls, ref, el, $el, $label, $content, id, i, existingEntry, compiler;
  refEls = this.$references[0].children;
  for (i = 0; i < this.references.length; i++) {
    ref = this.references[i];
    el = refEls[i];
    $el = $(el);
    $label = $el.find('.label');
    $content = $el.find('.content');
    id = el.dataset.refId;
    if (this.selectedReferences.indexOf(id) >= 0) {
      $el.addClass('selected');
    } else {
      $el.removeClass('selected');
    }
    existingEntry = this.bibData[id];
    if (existingEntry) {
      if (existingEntry.label) {
        $label.html(existingEntry.label).show();
      } else {
        $label.hide();
      }
      $content.html(existingEntry.content || '');
    } else {
      compiler = this.bibliographyNode.getCompiler();
      $label.html('').hide();
      if (!$content[0].innerHTML) $content.html(compiler.renderReference(ref));
    }
  }
};

ve.ui.ReferencesPanel.prototype.addReference = function(refData) {
  this.references.push(refData);
  var $reference = this.createReferenceElement(refData);
  this.$references.append($reference);
  this.$placeholder.hide();
  this.update();
};

ve.ui.ReferencesPanel.prototype.removeSelectedReferences = function() {
  for (var i = 0; i < this.references.length; i++) {
    if (this.selectedReferences.indexOf(this.references[i].id) >= 0) {
      this.$references[0].removeChild(this.$references[0].children[i]);
      this.references.splice(i, 1);
      i--;
    }
  }
  if (!this.$references[0].children) {
    this.$placeholder.show();
  }
};

// a simple AND over all terms in the given searchStr
ve.ui.ReferencesPanel.prototype.applyFilter = function(searchStr) {
  var patterns, child, i, pass, content, pattern, re, visibleCount;
  patterns = searchStr.toLowerCase().split(/\s+/);
  visibleCount = 0;
  for (child = this.$references.firstElementChild; child; child = child.nextElementSibling) {
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
      visibleCount++;
    }
  }
  if (visibleCount === 0) {
    this.$placeholder.show();
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
  refEls = this.$references[0].children;
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
