// Backbone.StateMachine v0.1
//
// Copyright (C)2011 Sébastien Piquemal, Aidbrella
// Distributed Under MIT License
//
// Documentation and Full License Available at:
// https://github.com/sebpiq/backbone.statemachine


Backbone.StateMachine = (function(Backbone, _){

    var StateMachine = {

        state : undefined,

        stateMachineDebug : false,

        startStateMachine : function(options){
            this.handlers = {};
            options || (options = {});
            if (options.transitions) this.transitions = options.transitions;
            if (options.state) this.state = options.state;
            this._bindTransitions();
            if (this.stateMachineDebug) {
                this.bind("all", function(){console.log(arguments, this)}, this);
            }
        },

        transition : function(fromState, event, handler) {
            if (!(fromState in this.handlers)) this.handlers[fromState] = {};
            handler.enterCb || (handler.enterCb = []);
            handler.leaveCb || (handler.leaveCb = []);
            this.handlers[fromState][event] = handler;
        },

        receive : function(event) {
            return this._receive.apply(this, [event, false].concat(_.toArray(arguments)));
        },

        receiveInSilence : function(event) {
            return this._receive.apply(this, [event, true].concat(_.toArray(arguments)));
        },

        asReceiver: function(event) {
            return _.bind(function(){
                return this.receive.apply(this, [event].concat(_.toArray(arguments)));
            }, this);
        },

        _receive : function(event, silent) {
            if (!(this.state in this.handlers)) return false;
            if (!(event in this.handlers[this.state])) return false;
            var handler = this.handlers[this.state][event];
            var extraArgs = _.toArray(arguments).slice(3);
            return this._doTransition.apply(this, [handler, event, silent].concat(extraArgs));
        },

        _doTransition : function(handler, event, silent) {
            var extraArgs = _.toArray(arguments).slice(3);
            var cbArgs = [event].concat(extraArgs);
            for (var i = 0; i < handler.leaveCb.length; i++){
                handler.leaveCb[i].apply(this, cbArgs);
            }
            if (silent == false) {
                this.trigger.apply(this, ["leaveState:" + this.state].concat(extraArgs));
                this.trigger.apply(this, ["transition", this.state, event, handler.toState]);
                this.trigger.apply(this, ["enterState:" + handler.toState].concat(extraArgs));
            }
            this.state = handler.toState;
            for (var i = 0; i < handler.enterCb.length; i++){
                handler.enterCb[i].apply(this, cbArgs);
            }
            return true;
        },

        _bindTransitions : function() {
            if (!this.transitions) return;
            var transitions = [];
            for (var fromState in this.transitions) {
                for (var event in this.transitions[fromState]) {
                    var handler = _.clone(this.transitions[fromState][event]);
                    // collecting the callbacks
                    var enterCb = []; var leaveCb = [];
                    handler.enterCb || (handler.enterCb = []);
                    handler.leaveCb || (handler.leaveCb = []);
                    for (var i = 0; i < handler.enterCb.length; i++){
                        var method = this[handler.enterCb[i]]
                        if (!method) throw new Error('Method "' + handler.enterCb[i] + '" does not exist');
                        enterCb.push(method);
                    }
                    for (var i = 0; i < handler.leaveCb.length; i++){
                        var method = this[handler.leaveCb[i]]
                        if (!method) throw new Error('Method "' + handler.leaveCb[i] + '" does not exist');
                        leaveCb.push(method);
                    }
                    handler.enterCb = enterCb; handler.leaveCb = leaveCb;
                    // transition is ready to be added
                    transitions.unshift([fromState, event, handler]);
                }
            }
            for (var i = 0; i < transitions.length; i++) {
                this.transition.apply(this, transitions[i]);
            }
        },
    };

    return StateMachine;

})(Backbone, _);

