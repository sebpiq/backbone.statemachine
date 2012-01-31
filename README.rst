Backbone.StateMachine
=======================

Is a small javascript library to add state machine capacities to any Backbone or non-Backbone object.

It provides a ``Backbone.StateMachine`` mixin and a ``Backbone.StatefulView``.

``Backbone.StateMachine`` is a simple object that you can mixin into any other object in order to give it the super-powers of a state machine. Note however that you MUST call ``Backbone.StateMachine.startStateMachine`` at some point, or your state machine won't work properly. Note also that the state machine object must be mixed-in with ``Backbone.Events``.

``Backbone.StatefulView`` is a Backbone view augmented with state machine capabilitites. It has all of ``Backbone.StateMachine``'s features, plus it also allows to automatically set ``el``'s html class when the state changes. A very simple example is provided in the `examples` folder. 

Example
========

Here's how you can make a stateful backbone model :

.. code-block:: javascript
    
    // write a constructor that calls the Backbone.Model's constructor,
    // and then starts the state machine. 
    var StatefulModel = function(options) {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.startStateMachine(options);
    };

    // Mix-in the new constructor, with Backbone.Model's prototype and the Backbone.StateMachine mixin.
    _.extend(StatefulModel.prototype, Backbone.Model.prototype, Backbone.StateMachine);

    // Add a useful method that is not in the prototype.
    StatefulModel.extend = Backbone.Model.extend;

Then subclass it to declare a model ::

    // 'states' hash contains all the states and the associated data.
    // Each state can declare :
    //     'leaveCb' - array containing names of methods to call when entering the state.
    //     'enterCb' - array containing names of methods to call when leaving the state.
    //
    // 'transitions' hash contains all the existing transitions between 2 states.
    // Structure of that hash is {leaveState: {event: transitionData}}
    // So for every starting state there is a bunch of events triggering a transition.
    // Transition can declare :
    //     'enterState' - Mandatory, this the arrival state of the transition.
    //     'callbacks' - array containing names of methods to call when transition is crossed.
    //     'triggers' - Backbone event to trigger when transition is crossed. 

    var Traveller = StatefulModel.extend({
        defaults: {experience: 'beginner'},
        states: {
            atHome: {
                leaveCb: ['lockDoor', 'throwAwayKeys'],
                enterCb: ['changeTheLock', 'unlockDoor']
            },
            travelling: {
                enterCb: ['sayHooray']
            }
        },
        transitions: {
            atHome: {
                winTicket: {enterState: 'travelling'},
                looseJob: {enterState: 'travelling', callback: ['destroyBossCar']},
            },
            travelling: {
                outOfMoney: {enterState: 'atHome'},
            }
        },
        lockDoor: function(){ /*bla*/ },
        throwAwayKeys: function(){ /*bla*/ },
        changeTheLock: function(){ /*bla*/ },
        unlockDoor: function(){ /*bla*/ },
        sayHooray: function(){ /*bla*/ },
        destroyBossCar: function(){ /*bla*/ },
    });

Then create an instance and trigger transitions ::

    // Initially jack is in state 'atHome'
    var jack = new Traveller({
        experience: 'hobo',
        currentState: 'atHome',
    });

    // receiving event 'looseJob' when in state 'atHome' will cause
    // jack to go travelling somewhere (as specified in 'transitions'). 
    jack.receive('looseJob');

    // state is now 'travelling'
    alert(jack.currentState);


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
