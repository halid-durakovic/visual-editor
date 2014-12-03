Example 1
=========

Load a mini document from HTML and convert it into a VE datamodel.


## Challenge

Experiment how a minimal integration of VE could look like, and how modularization could be increased.
To reveal problems we will eliminate the singletons and try to use properly injected, shared instances.

## Issues

- ve.dm.ModelFactory is using other singletons:

  ```
      ve.dm.annotationFactory.register( constructor );
      ve.dm.nodeFactory.register( constructor );
      ve.dm.metaItemFactory.register( constructor );
  ```
  Instead it should used injected shared instances and the singletons only as default (~legacy)

- The singleton ve.dm.nodeFactory is used all over the whole project
  - ve.dm.Converter: this seems completely inconsistent, as the converter has its own nodeFactory
  - ve.dm.Document: to create new nodes, and to retrieve Node related information (parent types, child types, etc.)
    -> Document needs access to a shared nodeFactory
    -> Node properties could be retrieved from a node instance instead
  - ve.dm.ModelRegistry
    -> needs access to a shared nodeFactory
  - ve.dm.Node
    -> delegates the implementation such as Node.canHaveChildren etc - which actually is very surprising, and unnecessary
