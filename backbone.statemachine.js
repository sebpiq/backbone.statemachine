// Backbone.StateMachine v0.1
//
// Copyright (C)2011 Sébastien Piquemal, Aidbrella
// Distributed Under MIT License
//
// Documentation and Full License Available at:
// https://github.com/sebpiq/backbone.statemachine

// TODO: name clash : state machine event/view event/Events event

Backbone.StateMachine = (function(Backbone, _){


    var StateMachine = {

        currentState: undefined,

        startStateMachine: function(options){
            this._transitions = {};
            this._states = {};
            options || (options = {});
            this._bindStates();
            this._bindTransitions();
            options.currentState && (this.currentState = options.currentState);
            if (options.debugStateMachine == true) DebugView.register(this);
        },

        transition: function(leaveState, event, data) {
            if (!(data.enterState in this._states)) {
                throw Error('unknown state "' + data.enterState + '"');
            }
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
            var extraArgs = _.toArray(arguments).slice(1);
            this._callCallbacks(this._states[name].enterCb, extraArgs);
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
            var leaveState = this.currentState;
            var enterState = data.enterState;
            var triggers = data.triggers;
            if (silent == false) this.trigger.apply(this, ["leaveState:" + leaveState].concat(extraArgs));
            this._callCallbacks(this._states[leaveState].leaveCb, extraArgs);
            if (silent == false) {
                this.trigger.apply(this, ["transition", leaveState, enterState].concat(extraArgs));
                if (triggers) this.trigger.apply(this, [triggers].concat(extraArgs));
            }
            this._callCallbacks(data.callbacks, extraArgs);
            if (silent == false) this.trigger.apply(this, ["enterState:" + enterState].concat(extraArgs));
            this.toState.apply(this, [enterState].concat(extraArgs));
            return true;
        },

        // Creates transitions from `this.transitions`, which is a hash 
        //      {   
        //          leaveStateName: {
        //              event: {
        //                  enterState: "enterStateName",
        //                  triggers: "eventName",
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
        //              className: "cssClass",
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
        _callCallbacks : function(cbArray, extraArgs) {
            for (var i = 0; i < cbArray.length; i++){
                cbArray[i].apply(this, extraArgs);
            }
        }



    };

    var DebugView = Backbone.View.extend({
        tagName: "div",
        className: "backbone-statemachine-debug",
        rendered: false,
        events: {
            "click .log": "logStateMachine"
        },
        render: function() {
            if (!this.rendered) {
                function periodicRender() {
                    this.render();
                    setTimeout(_.bind(periodicRender, this), 100);
                }
                setTimeout(_.bind(periodicRender, this), 100);
                this.rendered = true;
                var innerHtml = $("<div class='state'></div><a class='log'>console.log</a>");
                $(this.el).append(innerHtml);
                if ("el" in this.model) {
                    $(this.el).hover(_.bind(function(){
                        var modelEl = $(this.model.el);
                        this.cssMem = {"background-color": "", "border": ""}
                        modelEl.css({"background-color": "blue","border": "3px solid DarkBlue"});
                    }, this));
                    $(this.el).mouseleave(_.bind(function(){
                        var modelEl = $(this.model.el);
                        modelEl.css(this.cssMem);
                    }, this));
                }
            }
            this.$(".state").html(this.model.currentState);
            return this;
        },
        logStateMachine: function(event) {
            event.preventDefault();
            console.log(this.model);
        }
    }, {
        register: function(instance) {
            if (this.viewsArray.length == 0) {
                var container = this.el = $("<div id='backbone-statemachine-debug-container'>"+
                    "<a id='backbone-statemachine-debug-hideshow'>hide</a>"+
                    "<style>"+
                    "#backbone-statemachine-debug-container{background-color:rgba(0,0,0,0.5);position:absolute;height:300px;width:300px;right:0;top:0;padding:10px;z-index:10;-moz-border-radius-bottomleft:30px;-webkit-border-radius-bottomleft:30px;border-bottom-left-radius:30px;}"+
                    "#backbone-statemachine-debug-container.collapsed{height:20px;width:60px;}"+
                    "#backbone-statemachine-debug-container a{color:blue;cursor:pointer;}"+
                    ".backbone-statemachine-debug{width:60px;height:60px;-moz-border-radius:30px;-webkit-border-radius:30px;border-radius:30px;text-align:center;}"+
                    ".backbone-statemachine-debug .state{font-weight:bold;}"+
                    "a#backbone-statemachine-debug-hideshow{position:absolute;bottom:12px;left:12px;font-weight:bold;color:white;}"+
                    "</style></div>"
                ).appendTo($("body"));
                $("#backbone-statemachine-debug-hideshow", this.el).click(function(event){
                    event.preventDefault();
                    if (this.collapsed) {
                        $(this).html("hide");
                        $(container).removeClass("collapsed");
                        this.collapsed = false;
                        $(".backbone-statemachine-debug", container).show();
                    } else {
                        $(this).html("show");
                        $(container).addClass("collapsed");
                        this.collapsed = true;
                        $(".backbone-statemachine-debug", container).hide();
                    }
                });
            }
            var debugView = new DebugView({model: instance});
            var bgColor = this.pickColor();
            $(debugView.el).appendTo(this.el).css({"background-color": bgColor});
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

    StateMachine.version = "0.1.0";

    return StateMachine;

})(Backbone, _);


Backbone.StatefulView = (function(Backbone, _){

    var StatefulView = function(options) {
        Backbone.View.prototype.constructor.apply(this, arguments);
        this.startStateMachine(options);
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

