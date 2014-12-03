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

- ve.dm.ModelFactory is using other singletons:

  ```
      ve.dm.annotationFactory.register( constructor );
      ve.dm.nodeFactory.register( constructor );
      ve.dm.metaItemFactory.register( constructor );
  ```
  Instead it should use injected instances and singletons only as default (~for legacy)

