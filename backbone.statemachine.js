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

        currentState: undefined,

        startStateMachine: function(options){
            this._transitions = {};
            this._states = {};
            options || (options = {});
            if (options.currentState) this.currentState = options.currentState;
            this._bindStates();
            this._bindTransitions();
        },

        transition: function(leaveState, event, data) {
            if (!(leaveState in this._transitions)) this._transitions[leaveState] = {};
            this._transitions[leaveState][event] = data;
        },

        state: function(name, data) {
            this._states[name] = data;
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

        toState: function(name) {
            var cbArgs = _.toArray(arguments).slice(1);
            this._callCallbacks(this._states[name].enterCb, cbArgs);
            this.currentState = name;
        },

        _receive: function(event, silent) {
            if (!(this.currentState in this._transitions)) return false;
            if (!(event in this._transitions[this.currentState])) return false;
            var data = this._transitions[this.currentState][event];
            var extraArgs = _.toArray(arguments).slice(3);
            return this._doTransition.apply(this, [data, event, silent].concat(extraArgs));
        },

        _doTransition: function(data, event, silent) {
            var extraArgs = _.toArray(arguments).slice(3);
            var cbArgs = [event].concat(extraArgs);
            var leaveState = this.currentState;
            var enterState = data.enterState;
            if (silent == false) this.trigger.apply(this, ["leaveState:" + leaveState].concat(extraArgs));
            this._callCallbacks(this._states[leaveState].leaveCb, cbArgs);
            if (silent == false) {
                this.trigger.apply(this, ["transition", leaveState, enterState].concat(extraArgs));
                this.trigger.apply(this, ["transition:" + leaveState + ":" + enterState].concat(extraArgs));
            }
            this._callCallbacks(data.callbacks, cbArgs);
            if (silent == false) this.trigger.apply(this, ["enterState:" + enterState].concat(extraArgs));
            this.toState.apply(this, [enterState].concat(cbArgs));
            return true;
        },

        // Creates transitions from `this.transitions`, which is a hash 
        //      {   
        //          <leaveState1>: {
        //              <event1>: {enterState: <enterState1>, callbacks: <callbackArray1>}
        //          }
        //      }
        // Transitions are created by calling the `transition` method.
        _bindTransitions : function() {
            if (!this.transitions) return;
            for (var leaveState in this.transitions) {
                for (var event in this.transitions[leaveState]) {
                    var data = _.clone(this.transitions[leaveState][event]);
                    if (!data.enterState in this._states) throw Error("unknown state " + data.enterState);
                    data.callbacks = this._collectMethods((data.callbacks || []));
                    this.transition(leaveState, event, data);
                }
            }
        },

        // Creates states from `this.states`, which is a hash 
        //      {   
        //          <state1>: {className: <cssClass1>, enterCb: <callbackArray1>, leaveCb: <callbackArray2>}
        //      }
        // States are created by calling the `state` method.
        _bindStates : function() {
            if (!this.states) return;
            for (var name in this.states) {
                var data = _.clone(this.states[name]);
                data.enterCb = this._collectMethods((data.enterCb || []));
                data.leaveCb = this._collectMethods((data.leaveCb || []));
                this.state(name, data);
            }
        },

        // Convenience method for collecting callbacks provided as strings.   
        _collectMethods : function(methodNames) {
            methods = [];
            for (var i = 0; i < methodNames.length; i++){
                var method = this[methodNames[i]];
                if (!method) throw new Error('Method "' + methodNames[i] + '" does not exist');
                methods.push(method);
            }
            return methods;
        },

        // Convenience method for calling a list of callbacks.
        _callCallbacks : function(cbArray, cbArgs) {
            for (var i = 0; i < cbArray.length; i++){
                cbArray[i].apply(this, cbArgs);
            }
        }



    };

    StateMachine.version = "0.1.0";

    return StateMachine;

})(Backbone, _);


Backbone.StatefulView = (function(Backbone, _){

    var StatefulView = function(options) {
        Backbone.View.prototype.constructor.apply(this, arguments);
        this.startStateMachine(options);
        options.currentState && (this.currentState = options.currentState);
    };

    _.extend(StatefulView.prototype, Backbone.View.prototype, Backbone.StateMachine, {

        // TODO: tests
        viewEventReceiver: function(event) {
            this.receive(event.type);
        },

        toState: function(name) {
            Backbone.StateMachine.toState.apply(this, arguments);
            if (this.el) {
                $(this.el).removeClass((this.stateClassName || ""));
                this.stateClassName = (this._states[name].className || name);
                $(this.el).addClass(this.stateClassName);
            }
        },

    });

    // Set up inheritance for StatefulView.
    StatefulView.extend = Backbone.View.extend;

    return StatefulView;
})(Backbone, _);

