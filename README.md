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

Let's declare a very simple state machine representing an HTML element that can be either hidden or visible.

This machine will have 2 states, *hidden* and *visible*, and 2 transitions :

    hidden  --['show']--> visible
    visible --['hide']--> hidden

Also, in order to actually show or hide the element, everytime the state machine enters in state *visible* a method *doShow* will be called, and everytime it leaves the state *visible*, a method *doHide* will be called.

```javascript

    var element = {el: $('#myElement')};

    // !!! note that `StateMachine` requires the `Events` mixin
    _.extend(element, Backbone.StateMachine, Backbone.Events, {
        states: {
            visible: {enterCb: ['doShow'], leaveCb: ['doHide']},  // All options see: 'state options'
            hidden: {},
        },
        transitions: {
            visible: {
                hide: {enterState: 'hidden'},                     // All options see: 'transition options'
            },
            hidden: {
                show: {enterState: 'visible'}
            }
        },
        doShow: function() { this.el.show(); },
        doHide: function() { this.el.hide(); },
    });
```

**state options**

- `enterCb` - array containing names of methods to call when entering the state _(Optional)_.
- `leaveCb` - array containing names of methods to call when leaving the state _(Optional)_.

**transition options**

- `enterState` - arrival state of the transition.
- `callbacks` - array containing names of methods to call when transition is crossed _(Optional)_.
- `triggers` - Backbone event to trigger when transition is crossed _(Optional)_. 


### Triggering transitions ###########

```javascript

    // !!! this method needs to be called before the state machine can be used
    element.startStateMachine({currentState: 'visible'});

    element.currentState;                // 'visible'
    element.receive('hide');             // a transition is triggered, the element should disappear
    element.currentState;                // 'hidden'
    element.receive('hide');             // event 'hide' while in state 'hidden' -> no transition
    element.receive('show', 'quick');    // extra arguments will be passed to the callbacks
```


### Transition events ###########

Every time a transition is crossed, the state machine triggers a bunch of Backbone events. This way, you can setup an efficient event-based communication between the different parts of your application. Cool thing with using this method is that those different parts don't need to know each other.

```javascript

    element.bind('transition', function(leaveState, enterState){
        alert('Transition from state "'+leaveState+'" to state "'+enterState+'"');
    });
    element.bind('leaveState:hidden', function(){
        // synchronize other objects in your application
        bla.receive('activate');
        aView.render();
    });
    element.bind('enterState:hidden', function(){
        // synchronize other objects in your application
        bla.receive('deactivate');
    });
```

Also, if your transition defines the `triggers` option, for example `{triggers: 'showItAll'}`, an extra event *'showItAll'* will be triggered when that transition is crossed :

```javascript

    element.bind('showItAll', function(){
        // do stuff
    });
```

**TODO** : document `silent` attribute of the state machine.


StatefulView
----------------

A very simple example for ``Backbone.StatefulView`` is provided in the *examples* folder.

**state options**

- `className` - a css class added to view's `el` when the view is this in state.

**transition options**

- `preventDefault` - if the event triggering the transition is a DOM event, `event.preventDefault()` will be called on it.


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
