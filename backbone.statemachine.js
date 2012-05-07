// Backbone.StateMachine v0.1
//
// Copyright (C)2012 Sébastien Piquemal, Aidbrella
// Distributed Under MIT License
//
// Documentation and Full License Available at:
// https://github.com/sebpiq/backbone.statemachine


Backbone.StateMachine = (function(Backbone, _){


    // Mixin object to create a state machine out of any other object.
    // Note that this requires to be mixed-in with Backbone.Event as well. 
    var StateMachine = {

        currentState: undefined,

        // If `silent` is true, the state machine doesn't send events during a transition.        
        silent: false,

        // Initializes the state machine : binds states, transitions, ...
        startStateMachine: function(options){
            this._transitions = {};
            this._states = {};
            options || (options = {});
            this._bindStates();
            this._bindTransitions();
            options.currentState && (this.currentState = options.currentState);
            if (options.debugStateMachine == true) DebugView.register(this);
            this.bind('all', this._receive, this);
        },

        // Declares a new transition on the state machine.
        transition: function(leaveState, event, data) {
            if (!(data.enterState in this._states)) {
                throw Error('unknown state "' + data.enterState + '"');
            }
            if (!(leaveState in this._transitions)) this._transitions[leaveState] = {};
            this._transitions[leaveState][event] = data;
        },

        // Declares a new state on the state machine
        state: function(name, data) {
            this._states[name] = data;
        },

        // Forces the state machine to state 'name'. No transition will occur, but the
        // normal "enter new state" mess will (calling the callbacks, ...).
        toState: function(name) {
            var extraArgs = _.toArray(arguments).slice(1);
            this._callCallbacks(this._states[name].enterCb, extraArgs);
            this.currentState = name;
        },

        // Callback bound to all events. Does the actual work when receiving an event.
        _receive: function(event) {
            if (!this._transitions.hasOwnProperty(this.currentState)) return;
            if (!this._transitions[this.currentState].hasOwnProperty(event)) return;
            var data = this._transitions[this.currentState][event];
            var extraArgs = _.toArray(arguments).slice(1);
            this._doTransition.apply(this, [data, event].concat(extraArgs));
        },

        // Executes a transition.
        _doTransition: function(data, event) {
            var extraArgs = _.toArray(arguments).slice(2);
            var leaveState = this.currentState;
            var enterState = data.enterState;
            var triggers = data.triggers;
            if (!this.silent) this.trigger.apply(this, ['leaveState:' + leaveState].concat(extraArgs));
            this._callCallbacks(this._states[leaveState].leaveCb, extraArgs);
            if (!this.silent) {
                this.trigger.apply(this, ['transition', leaveState, enterState].concat(extraArgs));
                if (triggers) this.trigger.apply(this, [triggers].concat(extraArgs));
            }
            this._callCallbacks(data.callbacks, extraArgs);
            if (!this.silent) this.trigger.apply(this, ['enterState:' + enterState].concat(extraArgs));
            this.toState.apply(this, [enterState].concat(extraArgs));
        },

        // Creates transitions from `this.transitions`, which is a hash 
        //      {   
        //          leaveStateName: {
        //              event: {
        //                  enterState: 'enterStateName',
        //                  triggers: 'eventName',
        //                  callbacks: [callback1, callback2, ...]
        //              }
        //          }
        //      }
        // Transitions are created by calling the `transition` method.
        _bindTransitions : function() {
            if (!this.transitions) return;
            for (var leaveState in this.transitions) {
                for (var event in this.transitions[leaveState]) {
                    var data = _.clone(this.transitions[leaveState][event]);
                    data.callbacks = this._collectMethods((data.callbacks || []));
                    this.transition(leaveState, event, data);
                }
            }
        },

        // Creates states from `this.states`, which is a hash 
        //      {   
        //          stateName: {
        //              className: 'cssClass',
        //              enterCb: [enterCb1, enterCb2, ...], leaveCb: [leaveCb1, leaveCb2, ...]
        //          }
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

        // Helper for collecting callbacks provided as strings.   
        _collectMethods : function(methodNames) {
            methods = [];
            for (var i = 0; i < methodNames.length; i++){
                var method = this[methodNames[i]];
                if (!method) throw new Error('Method "' + methodNames[i] + '" does not exist');
                methods.push(method);
            }
            return methods;
        },

        // Helper for calling a list of callbacks.
        _callCallbacks : function(cbArray, extraArgs) {
            for (var i = 0; i < cbArray.length; i++){
                cbArray[i].apply(this, extraArgs);
            }
        }



    };

    // View for a state machine in the debugger.
    var DebugView = Backbone.View.extend({
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
                function periodicRender() {
                    this.render();
                    setTimeout(_.bind(periodicRender, this), 100);
                }
                setTimeout(_.bind(periodicRender, this), 100);
                this.rendered = true;
                // sets-up the debug view's html
                var innerHtml = $('<div class="state"></div><a class="log">console.log</a>');
                $(this.el).append(innerHtml);
                // when the debug view is hovered, if the state machine it represents is a view
                // itself, we highlight its element on the page.
                if ('el' in this.model) {
                    $(this.el).hover(_.bind(function(){
                        var modelEl = $(this.model.el);
                        this.cssMem = {'background-color': '', 'border': ''}
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
            if (this.viewsArray.length == 0) {
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
            var debugView = new DebugView({model: instance});
            var bgColor = this.pickColor();
            $(debugView.el).appendTo(this.el).css({'background-color': bgColor});
            debugView.render();
            if (this.collapsed) $(debugView.el).hide();
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

    StateMachine.version = '0.2';

    return StateMachine;

})(Backbone, _);


// A Backbone view that is also a state machine.
Backbone.StatefulView = (function(Backbone, _){

    var StatefulView = function(options) {
        Backbone.View.prototype.constructor.apply(this, arguments);
        this.startStateMachine(options);
    };

    _.extend(StatefulView.prototype, Backbone.View.prototype, Backbone.StateMachine, {

        startStateMachine: function() {
            // Remembers the events registered using `transition`, so that 
            // they are not bound twice.
            this._eventRegistry = [];
            Backbone.StateMachine.startStateMachine.apply(this, arguments);
        },

        toState: function(name) {
            Backbone.StateMachine.toState.apply(this, arguments);
            if (this.el) {
                $(this.el).removeClass((this.stateClassName || ''));
                this.stateClassName = (this._states[name].className || name);
                $(this.el).addClass(this.stateClassName);
            }
        },

        // TODO: improve this implementation
        // maybe extra options in `transitions`
        // maybe pass initial DOMEvent as extra arguments to transition callbacks
        transition: function(leaveState, event, data) {
            // Get the callback declared in view's `events`.
            var events;
            if (events = this['events']) {
                events = _.isFunction(events) ? events() : events;
            } else events = {};
            var eventCb = events[event];
            if (eventCb) {
                if (!_.isFunction(eventCb)) eventCb = this[events[event]];
                if (!eventCb) throw new Error('Method "' + events[event] + '" does not exist');
            }

            if (this._eventRegistry.indexOf(event) == -1) {
            // Use view's `delegateEvents` to connect the DOM event with state machine.
                var newEventCb = _.bind(function(DOMEvent) {
                    if (eventCb) eventCb.apply(this, arguments);
                    this._receive(event);
                    if (data.preventDefault) DOMEvent.preventDefault();
                }, this);
                events[event] = newEventCb;
                this.delegateEvents(events);
                this._eventRegistry.push(event);
            }
            Backbone.StateMachine.transition.apply(this, arguments);
        }

    });

    // Set up inheritance for StatefulView.
    StatefulView.extend = Backbone.View.extend;

    return StatefulView;
})(Backbone, _);

