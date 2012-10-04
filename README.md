Backbone.StateMachine
=======================

Is a small javascript library to add state machine capacities to any *Backbone* or *non-Backbone* object.


Index
-------
    
- ``Backbone.StateMachine``. A module that can be mixed into any object, giving this object the super-powers of a state machine.
- ``Backbone.StatefulView``. A Backbone view, augmented with state machine capabilities. 


StateMachine
--------------

`Backbone.StateMachine` is used as a mixin, somewhat like `Backbone.Events`.


### Declaring a state machine ###########

Let's declare a very simple state machine representing an HTML element that can be either hidden or visible.

This machine will have 3 states, *init*, *hidden* and *visible*, and 3 transitions :

    init --['initialized']--> visible
    hidden  --['show']--> visible
    visible --['hide']--> hidden

Also, in order to actually show or hide the element, everytime the state machine enters in state *visible* a method *doShow* will be called, and everytime it leaves the state *visible*, a method *doHide* will be called.

```javascript

var element = {el: $('#myElement')};

// !!! note that `StateMachine` requires the `Events` mixin
_.extend(element, Backbone.StateMachine, Backbone.Events, {
    states: {
        visible: {enter: ['doShow'], leave: ['doHide']},      // All options see: 'state options'
        hidden: {}                                            // Declaring this is optional
    },
    transitions: {
        init: {
            initialized: {enterState: 'visible'}
        },
        visible: {
            hide: {enterState: 'hidden'}                      // All options see: 'transition options'
        },
        hidden: {
            show: {enterState: 'visible'}
        }
    },
    doShow: function() { this.el.show(); },
    doHide: function() { this.el.hide(); }
});
```



**state options**

- `enter` - array containing names of methods to call when entering the state _(Optional)_.
- `leave` - array containing names of methods to call when leaving the state _(Optional)_.

**transition options**

- `enterState` - arrival state of the transition.
- `callbacks` - array containing names of methods to call when transition is crossed _(Optional)_.
- `triggers` - Backbone event to trigger when transition is crossed _(Optional)_.


### Triggering transitions ###########

The state machines are always created in `init` state, even if it isn't declared. Therefore, you should always declare at least one transition from state `init` to another state.

```javascript

// !!! this method needs to be called before the state machine can be used
element.startStateMachine();

// First, let's get the machine out from 'init' state
element.trigger('initialized');

element.currentState;                // 'visible'
element.trigger('hide');             // a transition is triggered, the element should disappear
element.currentState;                // 'hidden'
element.trigger('hide');             // event 'hide' while in state 'hidden' -> no transition
element.trigger('show', 'quick');    // extra arguments will be passed to the callbacks
```


### Transition events ###########

Every time a transition is crossed, the state machine triggers a bunch of Backbone events. This way, you can setup an efficient event-based communication between the different parts of your application. Cool thing with using this method is that those different parts don't need to know each other.

```javascript

element.bind('transition', function(leaveState, enterState) {
    alert('Transition from state "'+leaveState+'" to state "'+enterState+'"');
});
element.bind('leaveState:hidden', function() {
    // synchronize other objects in your application
    bla.trigger('activate');
    aView.render();
});
element.bind('enterState:hidden', function() {
    // synchronize other objects in your application
    bla.trigger('deactivate');
});
```

Also, if your transition defines the `triggers` option, for example `{triggers: 'showItAll'}`, an extra event *'showItAll'* will be triggered when that transition is crossed :

```javascript

element.bind('showItAll', function() {
    // do stuff
});
```

If you want to hush-up the state machine, and prevent any of those events to be triggered, just set `silent` to `true` :

```javascript

element.silent = true;      // next transitions will happen in silence
element.trigger('show');
element.trigger('hide');
element.silent = false;     // next transitions will trigger events as described above
```


### Matching any state with '*' ###########

When declaring the transitions of your state machine, you can use the wildcard character `'*'` to match any state.

```javascript

var obj = {};
_.extend(obj, Backbone.StateMachine, Backbone.Events, {
    transitions: {
        visible: { hide: {enterState: 'hidden'} },
        hidden: { show: {enterState: 'visible'} },
        // No matter the machine's state, 'panic' will always trigger a transition :
        '*': { panic: {enterState: 'panicking'} }
    }
});
```


### Forcing the machine to a given state ###########

You can use the method `toState` to force the machine to a particular state. In that case, no transition will occur, but the `enter` callbacks will be executed.

```javascript
element.currentState;       // 'hidden'
element.toState('visible'); // the callback 'doShow' is executed.
element.currentState;       // 'visible'
```


StatefulView
----------------

`Backbone.StatefulView` is a backbone view that has state machine capabilities, plus a few goodies.


### A css class for each state ################

To each state of the machine corresponds a css class on the view's `el`. By default the css class name is the state.

This makes styling very easy, for example :

```css

#myStatefulView.visible {
    display: block;
}
#myStatefulView.hidden {
    display: none;
}
```


### Transition events as view events ################

It is possible to declare transition events exactly the same way as in the `Backbone.View.events` hash. For example :

```javascript

var MyView = Backbone.StatefulView.extend({
    transitions: {
        'idle': {
            'click .activate': {enterState: 'active'}   // transition will occur when clicking on '.activate'
        }
    },

    initialize: function(opts) {
        this.toState('idle');                           // you need to set manually the initial state
    }
});
```


**state options**

- `className` - a css class added to view's `el` when the view is in this state.


Requirements
=============

``backbone.statemachine`` requires ``backbone`` (and therefore all its dependencies).

It is tested against backbone 0.9.2.


Questions, contributions ?
==============================

Any suggestion, comment, question - are welcome - contact me directly or open a ticket.

Any bug report, feature request, ... open a ticket !  To run tests, either open `tests/tests.html` in a browser, or run them from NodeJS (requires [PhantomJS](http://phantomjs.org/)):

```bash
npm install -g grunt
grunt
```


More infos about state machines
================================

http://en.wikipedia.org/wiki/Finite-state_machine

http://upload.wikimedia.org/wikipedia/commons/c/cf/Finite_state_machine_example_with_comments.svg


Release History
================

0.2.3
------

- 'enterCb' and 'leaveCb' renamed to 'enter' and 'leave'
- now machine always created in 'init' state.

0.2.2
------

- added the wilcard characted '*' to match any state.

0.2.1
------

- the states of the machine don't need to be declared anymore, the state machine can deduce it from the transitions.

0.2.0
-------

- `Backbone.StateMachine` now fully uses backbone's events system. Events now triggered with `trigger`, instead of `receive` previously.
- in `Backbone.StatefulView`, transitions can now contain DOM events, using the same syntax as `Backbone.View.events`.

0.1.0
-------

- Initial release


License
=========
Copyright (c) 2012 Sébastien Piquemal  
Licensed under the MIT license.
