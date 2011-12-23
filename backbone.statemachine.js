// Backbone.StateMachine v0.1
//
// Copyright (C)2011 Sébastien Piquemal, Aidbrella
// Distributed Under MIT License
//
// Documentation and Full License Available at:
// https://github.com/sebpiq/backbone.statemachine

// TODO: clash : state machine event/view event/Events event

Backbone.StateMachine = (function(Backbone, _){

    var StateMachine = {

        state: undefined,

        startStateMachine: function(options){
            this.handlers = {};
            options || (options = {});
            if (options.state) this.state = options.state;
            this._bindTransitions();
        },

        transition: function(leaveState, event, handler) {
            if (!(leaveState in this.handlers)) this.handlers[leaveState] = {};
            this.handlers[leaveState][event] = handler;
        },

        receive: function(event) {
            return this._receive.apply(this, [event, false].concat(_.toArray(arguments)));
        },

        receiveInSilence: function(event) {
            return this._receive.apply(this, [event, true].concat(_.toArray(arguments)));
        },

        asReceiver: function(event) {
            return _.bind(function(){
                return this.receive.apply(this, [event].concat(_.toArray(arguments)));
            }, this);
        },

        _receive: function(event, silent) {
            if (!(this.state in this.handlers)) return false;
            if (!(event in this.handlers[this.state])) return false;
            var handler = this.handlers[this.state][event];
            var extraArgs = _.toArray(arguments).slice(3);
            return this._doTransition.apply(this, [handler, event, silent].concat(extraArgs));
        },

        _doTransition: function(handler, event, silent) {
            var extraArgs = _.toArray(arguments).slice(3);
            if (silent == false) {
                var leaveState = this.state;
                var enterState = handler.enterState;
                this.trigger.apply(this, ["leaveState:" + leaveState].concat(extraArgs));
                this.trigger.apply(this, ["transition", leaveState, enterState].concat(extraArgs));
                this.trigger.apply(this, ["transition:" + leaveState + ":" + enterState].concat(extraArgs));
                this.trigger.apply(this, ["enterState:" + enterState].concat(extraArgs));
            }
            this.state = handler.enterState;
            return true;
        },

        // Creates transitions from `this.transitions`, which is a hash 
        //      {   
        //          <leaveState1>: {
        //              <event1>: {enterState: <enterState1>, className: <className1>}
        //          }
        //      }
        // Transitions are created by calling the `transition` method.
        _bindTransitions: function() {
            if (!this.transitions) return;
            for (var leaveState in this.transitions) {
                for (var event in this.transitions[leaveState]) {
                    var handler = _.clone(this.transitions[leaveState][event]);
                    this.transition(leaveState, event, handler);
                }
            }
        },
    };

    StateMachine.version = "0.1.0";

    return StateMachine;

})(Backbone, _);


Backbone.StatefulView = (function(Backbone, _){

    var StatefulView = function(options) {
        Backbone.View.prototype.constructor.apply(this, arguments);
        this.startStateMachine(options);
        options.state && (this.state = options.state);
    };

    _.extend(StatefulView.prototype, Backbone.View.prototype, Backbone.StateMachine, {

        // TODO: tests
        viewEventReceiver: function(event) {
            this.receive(event.type);
        },

        _doTransition: function(handler, event, silent) {
            var leaveState = this.state;
            var triggered = Backbone.StateMachine._doTransition.apply(this, arguments);
            if (triggered && (this.el)) {
                $(this.el).removeClass(this.stateClassName);
                this.stateClassName = (handler.className || this.state);
                $(this.el).addClass(this.stateClassName);
            }
            return triggered;
        },

    });

    // Set up inheritance for StatefulView.
    StatefulView.extend = Backbone.View.extend;

    return StatefulView;
})(Backbone, _);

