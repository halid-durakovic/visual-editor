Studies for modularizing VE
===========================


## Singletons

There are severeal singletons used in the project which make modularization hard.

### `ve.init.platform`:

  Is used, e.g., for i18n messages

  ```
  /home/oliver/projects/plos/tahi-refactorings/src/ve.utils.js:
    359   */
    360  ve.msg = function () {
    361:   // Avoid using bind because ve.init.platform doesn't exist yet.
    362:   // TODO: Fix dependency issues between ve.js and ve.init.platform
    363:   return ve.init.platform.getMessage.apply( ve.init.platform, arguments );
    364  };
    365
    ...
   1177   */
   1178  ve.getSystemPlatform = function () {
   1179:   return ( ve.init.platform && ve.init.platform.constructor || ve.init.Platform ).static.getSystemPlatform();
   1180  };
   1181
  ```

  The most important thing is to have `ve.init.platform` in place before including ve.utils.js.


### `ve.dm.nodeFactory` is used all over the whole project

- mainly it is used for the purpose of creating new nodes and for querying static properties of node types
  The latter seems unnecessary if it was implemented on the node in first place
- ve.dm.Converter: this seems completely inconsistent, as the converter has its own nodeFactory
- ve.dm.Document: to create new nodes, and to retrieve Node related information (parent types, child types, etc.)
  -> Document needs access to a shared nodeFactory
  -> Node properties could be retrieved from a node instance instead
- ve.dm.ModelRegistry
  -> needs access to a shared nodeFactory
- ve.dm.Node
  -> delegates the implementation such as Node.canHaveChildren etc - which actually is very surprising, and unnecessary


```
/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.Converter.js:
 1187      var dataSlice;
 1188      if (
 1189:       ve.dm.nodeFactory.lookup( data[i].type ) &&
 1190:       ve.dm.nodeFactory.doesNodeHandleOwnChildren( data[i].type )
 1191      ) {
 1192        dataSlice = data.slice( i, findEndOfNode( i ) );
 ....
 1204        if (
 1205          data[i].type && data[i].type.charAt( 0 ) !== '/' &&
 1206:         ve.dm.nodeFactory.lookup( data[i].type ) &&
 1207:         ve.dm.nodeFactory.isNodeInternal( data[i].type )
 1208        ) {
 1209          // Copy data if we haven't already done so
 ....
 1232        isStart = i > 0 &&
 1233          ve.dm.LinearData.static.isOpenElementData( data[i - 1] ) &&
 1234:         !ve.dm.nodeFactory.doesNodeHaveSignificantWhitespace(
 1235            ve.dm.LinearData.static.getType( data[i - 1] )
 1236          );
 ....
 1461          // Ascend to parent node, except if this is an internal node
 1462          // TODO: It's not covered with unit tests.
 1463:         if ( !ve.dm.nodeFactory.lookup( type ) || !ve.dm.nodeFactory.isNodeInternal( type ) ) {
 1464            domElement = parentDomElement;
 1465          }
 ....
 1564  /* Initialization */
 1565
 1566: ve.dm.converter = new ve.dm.Converter( ve.dm.modelRegistry, ve.dm.nodeFactory, ve.dm.annotationFactory, ve.dm.metaItemFactory );
 1567

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.Document.js:
  252          // Branch or leaf node opening
  253          // Create a childless node
  254:         node = ve.dm.nodeFactory.create(
  255            this.data.getType( i ), this.data.getData( i )
  256          );
  ...
  258          // Put the childless node on the current inner stack
  259          currentStack.push( node );
  260:         if ( ve.dm.nodeFactory.canNodeHaveChildren( node.getType() ) ) {
  261            // Create a new inner stack for this node
  262            parentStack = currentStack;
  ...
  267        } else {
  268          // Branch or leaf node closing
  269:         if ( ve.dm.nodeFactory.canNodeHaveChildren( currentNode.getType() ) ) {
  270            // Pop this node's inner stack from the outer stack. It'll have all of the
  271            // node's child nodes fully constructed
  ...
  646      if (
  647        data.isElementData( adjacentDataOffset ) &&
  648:       ve.dm.nodeFactory.isNodeFocusable( data.getType( adjacentDataOffset ) )
  649      ) {
  650        // We are adjacent to a focusableNode, move inside it
  ...
  659        isFocusable = ( relativeStructuralOffset - offset < 0 ? -1 : 1 ) === direction &&
  660          data.isElementData( relativeStructuralOffset + direction ) &&
  661:         ve.dm.nodeFactory.isNodeFocusable( data.getType( relativeStructuralOffset + direction ) );
  662      }
  663      // Check if we've moved into a slug or a focusableNode
  ...
  756        if (
  757          this.isOpenElementData( index ) &&
  758:         ve.dm.nodeFactory.isNodeFocusable( this.getType( index ) )
  759        ) {
  760          coveredOffset = index + 1;
  ...
  763        if (
  764          this.isCloseElementData( index ) &&
  765:         ve.dm.nodeFactory.isNodeFocusable( this.getType( index ) )
  766        ) {
  767          coveredOffset = index;
  ...
 1008                // Only throw an error if the content can't be adopted from one content
 1009                // branch to another
 1010:               !ve.dm.nodeFactory.canNodeContainContent( element.type.slice( 1 ) ) ||
 1011:               !ve.dm.nodeFactory.canNodeContainContent( expectedType )
 1012              )
 1013            ) {
 ....
 1042        // If this node is content, check that the containing node can contain content. If not,
 1043        // wrap in a paragraph
 1044:       if ( ve.dm.nodeFactory.isNodeContent( childType ) &&
 1045:         !ve.dm.nodeFactory.canNodeContainContent( parentType )
 1046        ) {
 1047          childType = 'paragraph';
 1048:         openings.unshift( ve.dm.nodeFactory.getDataElement( childType ) );
 1049        }
 1050
 ....
 1052        // wrap it until it's fixed
 1053        do {
 1054:         allowedParents = ve.dm.nodeFactory.getParentNodeTypes( childType );
 1055          parentsOK = allowedParents === null ||
 1056            ve.indexOf( parentType, allowedParents ) !== -1;
 ....
 1063            // Open an allowed node around this node
 1064            childType = allowedParents[0];
 1065:           openings.unshift( ve.dm.nodeFactory.getDataElement( childType ) );
 1066          }
 1067        } while ( !parentsOK );
 ....
 1070        // until it's fixed
 1071        do {
 1072:         allowedChildren = ve.dm.nodeFactory.getChildNodeTypes( parentType );
 1073          childrenOK = allowedChildren === null ||
 1074            ve.indexOf( childType, allowedChildren ) !== -1;
 ....
 1076          // content
 1077          childrenOK = childrenOK && !(
 1078:           !ve.dm.nodeFactory.isNodeContent( childType ) &&
 1079:           ve.dm.nodeFactory.canNodeContainContent( parentType )
 1080          );
 1081          if ( !childrenOK ) {

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.ModelRegistry.js:
   91        ve.dm.annotationFactory.register( constructor );
   92      } else if ( constructor.prototype instanceof ve.dm.Node ) {
   93:       ve.dm.nodeFactory.register( constructor );
   94      } else if ( constructor.prototype instanceof ve.dm.MetaItem ) {
   95        ve.dm.metaItemFactory.register( constructor );

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.Node.js:
  324   */
  325  ve.dm.Node.prototype.canHaveChildren = function () {
  326:   return ve.dm.nodeFactory.canNodeHaveChildren( this.type );
  327  };
  328
  ...
  331   */
  332  ve.dm.Node.prototype.canHaveChildrenNotContent = function () {
  333:   return ve.dm.nodeFactory.canNodeHaveChildrenNotContent( this.type );
  334  };
  335

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.SurfaceFragment.js:
 1148      startOffset, endOffset, oldExclude,
 1149      outerDepth = 0,
 1150:     factory = ve.dm.nodeFactory,
 1151      allowedParents = factory.getSuggestedParentNodeTypes( isolateForType ),
 1152      startSplitRequired = false,

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.Transaction.js:
  298      if ( data.isElementData( i ) ) {
  299        type = data.getType( i );
  300:       if ( ve.dm.nodeFactory.doesNodeHandleOwnChildren( type ) ) {
  301          handlesOwnChildrenDepth += data.isOpenElementData( i ) ? 1 : -1;
  302        }
  303:       if ( ve.dm.nodeFactory.isNodeContent( type ) ) {
  304:         if ( method === 'set' && !ve.dm.nodeFactory.canNodeTakeAnnotationType( type, annotation ) ) {
  305            // Blacklisted annotations can't be set
  306            annotatable = false;
  ...
 1088    // we are inside an internal node
 1089    for ( i = removeStart; i < removeEnd; i++ ) {
 1090:     if ( doc.data.isElementData( i ) && ve.dm.nodeFactory.isNodeInternal( doc.data.getType( i ) ) ) {
 1091        if ( !doc.data.isCloseElementData( i ) ) {
 1092          if ( internalStackDepth === 0 ) {

/home/oliver/projects/plos/tahi-refactorings/src/dm/ve.dm.TransactionProcessor.js:
  141      isElement = this.document.data.isElementData( i );
  142      if ( isElement ) {
  143:       if ( !ve.dm.nodeFactory.isNodeContent( this.document.data.getType( i ) ) ) {
  144          throw new Error( 'Invalid transaction, cannot annotate a non-content element' );
  145        }

/home/oliver/projects/plos/tahi-refactorings/src/dm/lineardata/ve.dm.ElementLinearData.js:
   88    var left = this.getData( offset - 1 ),
   89      right = this.getData( offset ),
   90:     factory = ve.dm.nodeFactory;
   91    return (
   92      // Data exists at offsets
   ..
  175    var left = this.getData( offset - 1 ),
  176      right = this.getData( offset ),
  177:     factory = ve.dm.nodeFactory;
  178    return (
  179      (
  ...
  255      if ( item.type !== undefined &&
  256        item.type.charAt( 0 ) !== '/' &&
  257:       !ve.dm.nodeFactory.isNodeContent( item.type )
  258      ) {
  259        return false;
  ...
  282      !ignoreClose &&
  283      this.isCloseElementData( offset ) &&
  284:     !ve.dm.nodeFactory.canNodeHaveChildren( this.getType( offset ) ) // leaf node
  285    ) {
  286      offset = this.getRelativeContentOffset( offset, -1 );
  ...
  436    for ( i = range.start; i < range.end; i++ ) {
  437      // Skip non-content data
  438:     if ( this.isElementData( i ) && !ve.dm.nodeFactory.isNodeContent( this.getType( i ) ) ) {
  439        continue;
  440      }
  ...
  585      if (
  586        this.isElementData( dataOffset ) &&
  587:       ve.dm.nodeFactory.doesNodeHandleOwnChildren( this.getType( dataOffset ) )
  588      ) {
  589        isOpen = this.isOpenElementData( dataOffset );
  ...
  804      this.setAnnotationIndexesAtOffset( i, indexes );
  805      if ( this.isOpenElementData( i ) ) {
  806:       nodeClass = ve.dm.nodeFactory.lookup( this.getType( i ) );
  807        nodeClass.static.remapStoreIndexes( this.data[i], mapping );
  808      }
  ...
  824    for ( i = 0, ilen = this.data.length; i < ilen; i++ ) {
  825      if ( this.isOpenElementData( i ) ) {
  826:       nodeClass = ve.dm.nodeFactory.lookup( this.getType( i ) );
  827        nodeClass.static.remapInternalListIndexes( this.data[i], mapping, internalList );
  828      }
  ...
  842    for ( i = 0, ilen = this.data.length; i < ilen; i++ ) {
  843      if ( this.isOpenElementData( i ) ) {
  844:       nodeClass = ve.dm.nodeFactory.lookup( this.getType( i ) );
  845        nodeClass.static.remapInternalListKeys( this.data[i], internalList );
  846      }
  ...
  898        }
  899        // Convert content-containing non-paragraph nodes to paragraphs in plainText mode
  900:       if ( plainText && type !== 'paragraph' && ve.dm.nodeFactory.canNodeContainContent( type ) ) {
  901          type = 'paragraph';
  902          this.setData( i, {
  ...
  925          !keepEmptyContentBranches &&
  926          i > 0 && this.isCloseElementData( i ) && this.isOpenElementData( i - 1 ) &&
  927:         ve.dm.nodeFactory.canNodeContainContent( type )
  928        ) {
  929          this.splice( i - 1, 2 );
  ...
  981    for ( i = 0, l = this.getLength(); i < l; i++ ) {
  982      type = this.getType( i );
  983:     if ( type && ve.dm.nodeFactory.isNodeInternal( type ) ) {
  984        if ( this.isOpenElementData( i ) ) {
  985          internalDepth++;

```



- ve.dm.ModelFactory is using other singletons:

  ```
      ve.dm.annotationFactory.register( constructor );
      ve.dm.nodeFactory.register( constructor );
      ve.dm.metaItemFactory.register( constructor );
  ```
  Instead it should use injected instances and singletons only as default (~for legacy)

