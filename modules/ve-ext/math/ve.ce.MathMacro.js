
ve.ce.MathMacro = function VeCeMathMacro() {
  OO.EventEmitter.call( this );

  this.surface = null;
  this.document = null;
  this.transacting = false;
};

OO.inheritClass( ve.ce.MathMacro, OO.EventEmitter );

ve.ce.MathMacro.prototype.attach = function(surfaceView) {
  this.surface = surfaceView.model;
  this.document = this.surface.documentModel;
  this.document.on('transact', this.onTransaction, null, this);
};

ve.ce.MathMacro.MATH_REGEX = "\\$\\$([^$]+)\\$\\$";
ve.ce.MathMacro.MINIMAL_LENGTH = 4;

ve.ce.MathMacro.prototype.onTransaction = function(transaction) {

  // do not react on transactions triggered by this macro itself
  if ( this.transacting ) return;

  console.log("###", transaction);

  var surface = this.surface,
      doc = this.document,
      caret, offset, node, paragraph, textNode, text, match, range;

  // TODO explain
  if (transaction.operations.length === 0 || transaction.operations[0].type !== 'retain') {
    return;
  }

  caret = transaction.operations[0].length;
  node = doc.getNodeFromOffset(caret);

  // only consider changes on paragraphs
  if (!node || node.type !== 'paragraph' || node.length < ve.ce.MathMacro.MINIMAL_LENGTH ) return;

  paragraph = node;
  offset = caret - paragraph.getRange().start;
  node = paragraph.getNodeFromOffset(offset, true);

  if (!node || node.type !== 'text' || node.length < ve.ce.MathMacro.MINIMAL_LENGTH ) return;

  textNode = node;
  //text = doc.getText(new ve.Range(textNode.getRange().start, caret));
  text = doc.getText(textNode.getRange());
  match = new RegExp(ve.ce.MathMacro.MATH_REGEX, 'g').exec(text);

  if (match) {
    offset = match.index + textNode.getOuterRange().start;
    range = new ve.Range(offset, offset + match[0].length);

    var self = this;
    window.setTimeout(function() {
      self.transacting = true;
      self.insertFormula(range, match[1]);
      self.transacting = false;
    }, 200);
  }
};

ve.ce.MathMacro.prototype.insertFormula = function(range, formula) {
  var surface, doc, txs, data;

  surface = this.surface;
  doc = this.document;

  data = [
    {
      type: 'mathInline',
      attributes: {
        formula: formula,
        format: 'tex'
      }
    },
    {
      type: '/mathInline'
    }
  ];

  txs = [];
  txs.push( ve.dm.Transaction.newFromRemoval(doc, range) );
  txs.push( ve.dm.Transaction.newFromInsertion(doc, range.start, data));
  surface.change(txs, new ve.Range(range.start + 2));
};

ve.ce.MathMacro.onSurfaceReady = function(surface) {
  var macro = new ve.ce.MathMacro();
  macro.attach(surface);
};

if (ve.globalEvents) {
  ve.globalEvents.on('surfaceReady', ve.ce.MathMacro.onSurfaceReady);
} else {
  window.console.error("Warning: ve.ce.MathMacro expects to use ve.globalEvents to receive 'surfaceReady' events.");
}
