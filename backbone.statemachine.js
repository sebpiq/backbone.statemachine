/*
 * backbone.statemachine
 * https://github.com/sebpiq/backbone.statemachine
 *
 * Copyright (c) 2012 Sébastien Piquemal.
 * Licensed under the MIT license.
 */


Backbone.StateMachine = (function(Backbone, _) {

    // This is a key that means 'any state'.
    var ANY_STATE = '*';

    // This is the key for the initial state.
    var INIT_STATE = 'init';

    // Mixin object to create a state machine out of any other object.
    // Note that this requires to be mixed-in with Backbone.Event as well.
    var StateMachine = {

        currentState: undefined,

        // If `silent` is true, the state machine doesn't send events during a transition.
        silent: false,

        // Initializes the state machine : binds states, transitions, ...
        startStateMachine: function(options) {
            this._transitions = {};
            this._states = {};
            options = options || {};
            this._bindStates();
            this._bindTransitions();
            if (options.debugStateMachine === true) {
                StateMachine.DebugView.register(this);
            }
            this.bind('all', this._onMachineEvent, this);
            this.currentState = INIT_STATE;
        },

        // Declares a new transition on the state machine.
        transition: function(leaveState, event, data) {
            data = _.clone(data);
            if (leaveState !== ANY_STATE && !this._states.hasOwnProperty(leaveState)) {
                this.state(leaveState, {});
            }
            if (!this._states.hasOwnProperty(data.enterState))  {
                this.state(data.enterState, {});
            }
            if (!this._transitions.hasOwnProperty(leaveState)) {
                this._transitions[leaveState] = {};
            }
            data.callbacks = this._collectMethods((data.callbacks || []));
            this._transitions[leaveState][event] = data;
        },

        // Declares a new state on the state machine
        state: function(name, data) {
            if (name === ANY_STATE) {
                throw new Error('state name "' + ANY_STATE + '" is forbidden');
            }
            data = _.clone(data);
            data.enter = this._collectMethods((data.enter || []));
            data.leave = this._collectMethods((data.leave || []));
            this._states[name] = data;
        },

        // Forces the state machine to state 'name'. No transition will occur, but the
        // normal "enter new state" mess will (calling the callbacks, ...).
        toState: function(name) {
            if (!this._states.hasOwnProperty(name)) throw new Error('unknown state "'+name+'"');
            var extraArgs = _.toArray(arguments).slice(1);
            this.currentState = name;
            this._callCallbacks(this._states[name].enter, extraArgs);
        },

        // Returns the list of all events that can trigger a transition
        getMachineEvents: function() {
            var events = _.reduce(_.values(this._transitions), function(memo, transitions) {
                return memo.concat(_.keys(transitions));
            }, []);
            return _.uniq(events);
        },

        // Callback bound to all events. If no transition available, do nothing.
        // Otherwise, starts the transition.
        _onMachineEvent: function(event) {
            var data, extraArgs, key, transitions = this._transitions;
            if (transitions.hasOwnProperty((key = this.currentState)) &&
                transitions[key].hasOwnProperty(event)) {
                data = transitions[key][event];
            } else if (transitions.hasOwnProperty(ANY_STATE) &&
                transitions[ANY_STATE].hasOwnProperty(event)) {
                data = transitions[ANY_STATE][event];
            } else {
                return;
            }

            extraArgs = _.toArray(arguments).slice(1);
            this._doTransition.apply(this, [data, event].concat(extraArgs));
        },

        // Executes a transition.
        _doTransition: function(data, event) {
            var extraArgs = _.toArray(arguments).slice(2),
                leaveState = this.currentState,
                enterState = data.enterState,
                triggers = data.triggers;

            if (!this.silent) {
                this.trigger.apply(this, ['leaveState:' + leaveState].concat(extraArgs));
            }
            this._callCallbacks(this._states[leaveState].leave, extraArgs);
            if (!this.silent) {
                this.trigger.apply(this, ['transition', leaveState, enterState].concat(extraArgs));
                if (triggers) {
                    this.trigger.apply(this, [triggers].concat(extraArgs));
                }
            }
            this._callCallbacks(data.callbacks, extraArgs);
            if (!this.silent) {
                this.trigger.apply(this, ['enterState:' + enterState].concat(extraArgs));
            }
            this.toState.apply(this, [enterState].concat(extraArgs));
        },

        // Declares transitions from `this.transitions`, which is a hash :
        //  { leaveState: { event: data, ... }, ... }
        _bindTransitions: function() {
            if (!this.transitions) return;

            var leaveState, event, transitions = this.transitions;
            for (leaveState in transitions) {
                for (event in transitions[leaveState]) {
                    this.transition(leaveState, event, transitions[leaveState][event]);
                }
            }
            if (!(transitions.hasOwnProperty(INIT_STATE) || transitions.hasOwnProperty(ANY_STATE)) && typeof console !== 'undefined') {
                console.warn('there is no transition from state "init" to another state.');
            }
        },

        // Declare states from `this.states`, which is a hash :
        // { stateName: data, ... }
        // Also defines `init` state if not defined in the hash.
        _bindStates: function() {
            if (!this.states) {
                return;
            }
            if (!this.states.hasOwnProperty(INIT_STATE)) {
                this.state(INIT_STATE, {});
            }

            var name, states = this.states;
            for (name in states) {
                this.state(name, states[name]);
            }
        },

        // Helper for collecting callbacks provided as strings.
        _collectMethods: function(methodNames) {
            var methods = [], i, length, method;

            for (i = 0, length = methodNames.length; i < length; i++){
                method = this[methodNames[i]];
                if (!method) {
                    throw new Error('Method "' + methodNames[i] + '" does not exist');
                }
                methods.push(method);
            }
            return methods;
        },

        // Helper for calling a list of callbacks.
        _callCallbacks: function(cbArray, extraArgs) {
            var i, length;

            for (i = 0, length = cbArray.length; i < length; i++){
                cbArray[i].apply(this, extraArgs);
            }
        }
    };

    StateMachine.version = '0.2.2';

    return StateMachine;

}(Backbone, _));


// A Backbone view that is also a state machine.
Backbone.StatefulView = (function(Backbone, _){

    var StatefulView = function(options) {
        this.startStateMachine(options);
        Backbone.View.prototype.constructor.apply(this, arguments);
    };
    // Fix instanceof for StatefulView
    var sfvProto = StatefulView.prototype = new Backbone.View();
    delete sfvProto.cid;
    delete sfvProto.options;
    delete sfvProto.el;
    delete sfvProto.$el;

    _.extend(StatefulView.prototype, Backbone.View.prototype, Backbone.StateMachine, {

        toState: function(name) {
            if (this.el) {
                $(this.el).removeClass((this.stateClassName || ''));
                this.stateClassName = (this._states[name].className || name);
                $(this.el).addClass(this.stateClassName);
            }
            Backbone.StateMachine.toState.apply(this, arguments);
        },

        delegateEvents: function(events) {
            // We want all the events in the `transitions` hash to be triggered
            // like events in `View.events`.
            if (!events) {
                events = (this.events && _.clone(this.events)) || {};
                if (events && _.isFunction(events)) {
                    events = events();
                }

                _.each(this.getMachineEvents(), function(event) {
                    // If there was already a callback for that event,
                    // we must fetch it, and call it ourselves ... sigh ...
                    var method = events[event];
                    if (method) {
                        if (!_.isFunction(method)) {
                            method = this[method];
                        }
                        if (!method) {
                            throw new Error('Method "' + events[event] + '" does not exist');
                        }
                    }
                    events[event] = function(DOMEvent) {
                        if (method) {
                            method.apply(this, arguments);
                        }
                        this._onMachineEvent(event, DOMEvent);
                    };
                }, this);
            }
            Backbone.View.prototype.delegateEvents.call(this, events);
        }
    });

    // Set up inheritance for StatefulView.
    StatefulView.extend = Backbone.View.extend;

    return StatefulView;
}(Backbone, _));


// State machine debugger (ugh :-S).
(function(Backbone, _){
    Backbone.StateMachine.DebugView = Backbone.View.extend({
        tagName: 'div',
        className: 'backbone-statemachine-debug',
        rendered: false,
        events: {
            'click .log': 'logStateMachine'
        },
        render: function() {
            // This is only called when rendering the first time.
            if (!this.rendered) {
                // sets-up periodic rendering, so the debug view is always up-to-date.
                var periodicRender = function() {
                    this.render();
                    setTimeout(_.bind(periodicRender, this), 100);
                };
                setTimeout(_.bind(periodicRender, this), 100);
                this.rendered = true;
                // sets-up the debug view's html
                var innerHtml = $('<div class="state"></div><a class="log">console.log</a>');
                $(this.el).append(innerHtml);
                // when the debug view is hovered, if the state machine it represents is a view
                // itself, we highlight its element on the page.
                if (this.model.hasOwnProperty('el')) {
                    $(this.el).hover(_.bind(function(){
                        var modelEl = $(this.model.el);
                        this.cssMem = {'background-color': '', 'border': ''};
                        modelEl.css({'background-color': 'blue','border': '3px solid DarkBlue'});
                    }, this));
                    $(this.el).mouseleave(_.bind(function(){
                        var modelEl = $(this.model.el);
                        modelEl.css(this.cssMem);
                    }, this));
                }
            }
            // this does the actual updating of the debug view's html.
            this.$('.state').html(this.model.currentState);
            return this;
        },
        logStateMachine: function(event) {
            event.preventDefault();
            console.log(this.model);
        }
    }, {
        // Registers a state machine in the debugger, so that a debug view will be created for it.
        register: function(instance) {
            // If this is the first state machine registered in the debugger,
            // we create the debugger's html.
            if (this.viewsArray.length === 0) {
                var container = this.el = $('<div id="backbone-statemachine-debug-container">'+
                    '<h3>backbone.statemachine: DEBUGGER</h3>'+
                    '<a id="backbone-statemachine-debug-hideshow">hide</a>'+
                    '<style>'+
                    '#backbone-statemachine-debug-container{background-color:rgba(0,0,0,0.5);position:absolute;height:300px;width:300px;right:0;top:0;padding:10px;z-index:10;-moz-border-radius-bottomleft:30px;-webkit-border-radius-bottomleft:30px;border-bottom-left-radius:30px;}'+
                    '#backbone-statemachine-debug-container.collapsed{height:20px;width:60px;}'+
                    '#backbone-statemachine-debug-container a{color:blue;cursor:pointer;}'+
                    '#backbone-statemachine-debug-container h3{margin:0;text-align:center;color:white;margin-bottom:0.5em;}'+
                    '.backbone-statemachine-debug{width:60px;height:60px;-moz-border-radius:30px;-webkit-border-radius:30px;border-radius:30px;text-align:center;}'+
                    '.backbone-statemachine-debug .state{font-weight:bold;}'+
                    'a#backbone-statemachine-debug-hideshow{position:absolute;bottom:12px;left:12px;font-weight:bold;color:white;}'+
                    '</style></div>'
                ).appendTo($('body'));
                $('#backbone-statemachine-debug-hideshow', this.el).click(function(event){
                    event.preventDefault();
                    if (this.collapsed) {
                        $(container).removeClass('collapsed').children().show();
                        $(this).html('hide');
                        this.collapsed = false;
                    } else {
                        $(container).addClass('collapsed').children().hide();
                        $(this).html('show').show();
                        this.collapsed = true;
                    }
                });
            }
            // create the debug view, pick a random color for it, and add it to the debugger.
            var debugView = new this({model: instance});
            var bgColor = this.pickColor();
            $(debugView.el).appendTo(this.el).css({'background-color': bgColor});
            debugView.render();
            if (this.collapsed) {
                $(debugView.el).hide();
            }
            this.viewsArray.push(debugView);
        },
        update: function() {
            _.each(this.viewsArray, function(view){
                view.render();
            });
        },
        pickColor: function() {
            return '#'+Math.floor(Math.random()*16777215).toString(16);
        },
        viewsArray: [],
        el: undefined,
        collapsed: false
    });
}(Backbone, _));
