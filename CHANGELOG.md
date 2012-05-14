Release notes 
===============


0.2.1
------

- the states of the machine don't need to be declared anymore, the state machine can deduce it from the transitions.

0.2.0
-------

- `Backbone.StateMachine` now fully uses backbone's events system. Events now triggered with `trigger`, instead of `receive` previously.
- in `Backbone.StatefulView`, transitions can now contain DOM events, using the same syntax as `Backbone.View.events`.

0.1.0
-------

Initial release
