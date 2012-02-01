Backbone.StateMachine
=======================

Is a small javascript library to add state machine capacities to any *Backbone* or *non-Backbone* object.


Index
-------
    
- ``Backbone.StateMachine``. A module that can be mixed into any object, giving this object the super-powers of a state machine.
- ``Backbone.StatefulView``. A Backbone view, augmented with state machine capacities. 


StateMachine
--------------

`Backbone.StateMachine` is used as a mixin, somewhat like `Backbone.Events`.


### Declaring a state machine ###########

```javascript

    var toggle = {};

    // !!! note that `StateMachine` requires the `Events` mixin
    _.extend(toggle, Backbone.StateMachine, Backbone.Events, {
        states: {
            visible: stateOpts1,         // an object {option: value}
            hidden: stateOpts2,
        },
        transitions: {
            visible: {
                hide: transitionOpts1,   // an object {option: value}
            },
            hidden: {
                show: transitionOpts2
            }
        },
    });
```

**state options**

- `enterCb` - array containing names of methods to call when entering the state _(Optional)_.
- `leaveCb` - array containing names of methods to call when leaving the state _(Optional)_.

**transition options**

- `enterState` - arrival state of the transition.
- `callbacks` - array containing names of methods to call when transition is crossed _(Optional)_.
- `triggers` - Backbone event to trigger when transition is crossed _(Optional)_. 


For example : 

```javascript

    var toggle = {};
    _.extend(toggle, Backbone.StateMachine, Backbone.Events, {
        states: {
            visible: {enterCb: ['doShow'], leaveCb: ['doHide']},
            hidden: {},
        },
        transitions: {
            visible: {
                hide: {enterState: 'hidden'},
            },
            hidden: {
                show: {enterState: 'visible'}
            }
        },
        doShow: function() { alert('Now showing !!!') },
        doHide: function() { alert('Now hiding ...') },
    });
```

The above basically declares 2 states, *hidden* and *visible*, and 2 transitions :

    hidden  --['show']--> visible
    visible --['hide']--> hidden

Also, everytime the state machine enters in state *visible* the method *doShow* is called, and everytime it leaves the state *visible*, method *doHide* is called.

### Triggering transitions ###########

```javascript

    // !!! this method needs to be called before the state machine can be used
    toggle.startStateMachine({currentState: 'visible'});

    toggle.currentState;                // 'visible'
    toggle.receive('hide');             // a transition is triggered, and an alert should open
    toggle.currentState;                // 'hidden'
    toggle.receive('hide');             // no transition is defined
    toggle.receive('show', 'quick');    // extra arguments will be passed to the callbacks
```


### Transition events ###########

Every time a transition is crossed the state machine triggers events. That way, you can synchronize it with other objects or other state machines. 

```javascript

    toggle.bind('transition', function(leaveState, enterState){
        alert('Transition from state "'+leaveState+'" to state "'+enterState+'"');
    });
    toggle.bind('leaveState:hidden', function(){
        alert('Leaving state "hidden" !!!');
    });
    toggle.bind('enterState:hidden', function(){
        alert('Entering state "hidden" ...');
    });
```

Also, if your transition defines the `triggers` option, an extra event will be triggered (this event is the value of *triggers*). 


StatefulView
----------------

A very simple example for ``Backbone.StatefulView`` is provided in the *examples* folder.

**state options**

- `className` - a css class added to view's `el` when the view is this in state.


Requirements
=============

``backbone.statemachine`` requires ``backbone`` (and therefore all its dependencies).

It is tested against backbone 0.5.3.


Questions, contributions ?
==============================

Any suggestion, comment, question - are welcome - contact me directly or open a ticket.

Any bug report, feature request, ... open a ticket !


More infos about state machines
================================

http://en.wikipedia.org/wiki/Finite-state_machine

http://upload.wikimedia.org/wikipedia/commons/c/cf/Finite_state_machine_example_with_comments.svg
