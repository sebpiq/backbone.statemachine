$(document).ready(function(){

    module('StateMachine');

        var stateMachine = {};
        _.extend(stateMachine, Backbone.StateMachine, Backbone.Events, {
            transitions: {
                'init': {
                    'initialized': {enterState: 'visible'}
                },
                'visible': {
                    'hide': {
                        enterState: 'hidden',
                        callbacks: ['visibleToHidden1', 'visibleToHidden2']
                    }
                },
                'hidden': {
                    'show': {
                        enterState: 'visible',
                        callbacks: ['hiddenToVisible1', 'hiddenToVisible2'],
                        triggers: 'showTime'
                    }
                },
                '*': {
                    'panic': {enterState: 'panicking'}
                }
            },
            states: {
                'visible': {enter: ['enterVisible1', 'enterVisible2'], leave: ['leaveVisible1', 'leaveVisible2']},
                'hidden': {enter: ['enterHidden1']}
            },
            visibleToHidden1: function() {this._saveCb('visibleToHidden1', arguments);},
            visibleToHidden2: function() {this._saveCb('visibleToHidden2', arguments);},
            hiddenToVisible1: function() {this._saveCb('hiddenToVisible1', arguments);},
            hiddenToVisible2: function() {this._saveCb('hiddenToVisible2', arguments);},
            enterVisible1: function() {this._saveCb('enterVisible1', arguments);},
            enterVisible2: function() {this._saveCb('enterVisible2', arguments);},
            leaveVisible1: function() {this._saveCb('leaveVisible1', arguments);},
            leaveVisible2: function() {this._saveCb('leaveVisible2', arguments);},
            enterHidden1: function() {this._saveCb('enterHidden1', arguments);},
            _saveCb: function(name, args) {
                this.cbData.push([name].concat(_.toArray(args)));
            },
            testSetUp: function(initState, connect) {
                this.unbind(null, this.testCb);
                if (connect) this.bind('all', this.testCb, this);
                this.toState(initState);
                this.eventsData = [];
                this.cbData = [];
                this.silent = false;
            },
            testCb: function(){
                this.eventsData.push(_.toArray(arguments));
            },
            cbData: [],
            eventsData: []
        });

        stateMachine.startStateMachine({currentState: 'hidden'});

        test('StateMachine - getMachineEvents', function () {
            deepEqual(stateMachine.getMachineEvents(), ['initialized', 'hide', 'show', 'panic']);
        });

        test('StateMachine - transition events and arguments', function () {
            stateMachine.testSetUp('visible', true);
            stateMachine.trigger('hide', 'behind a tree');
            equal(stateMachine.currentState, 'hidden');
            deepEqual(stateMachine.eventsData, [
                ['leaveState:visible', 'behind a tree'],
                ['transition', 'visible', 'hidden', 'behind a tree'],
                ['enterState:hidden', 'behind a tree'],
                ['hide', 'behind a tree']                           // the initial trigger
            ]);
        });

        test("StateMachine - transition's 'triggers' option", function () {
            stateMachine.testSetUp('hidden', true);
            stateMachine.trigger('show', 'shamelessly', 'your', 'feet');
            equal(stateMachine.currentState, 'visible');
            deepEqual(stateMachine.eventsData, [
                ['leaveState:hidden', 'shamelessly', 'your', 'feet'],
                ['transition', 'hidden', 'visible', 'shamelessly', 'your', 'feet'],
                ['showTime', 'shamelessly', 'your', 'feet'],
                ['enterState:visible', 'shamelessly', 'your', 'feet'],
                ['show', 'shamelessly', 'your', 'feet']             // the initial trigger
            ]);
        });

        test('StateMachine - transition callbacks and arguments', function () {
            stateMachine.testSetUp('visible');
            stateMachine.trigger('hide', 'under your bed');
            equal(stateMachine.currentState, 'hidden');
            deepEqual(stateMachine.cbData, [
                ['leaveVisible1', 'under your bed'],
                ['leaveVisible2', 'under your bed'],
                ['visibleToHidden1', 'under your bed'],
                ['visibleToHidden2', 'under your bed'],
                ['enterHidden1', 'under your bed']
            ]);
        });

        test('StateMachine - declaring transition with a wildcard', function () {
            stateMachine.testSetUp('visible');
            stateMachine.trigger('panic');
            equal(stateMachine.currentState, 'panicking');
        });

        test('StateMachine - toState', function () {
            stateMachine.testSetUp('visible');
            stateMachine.toState('hidden', 'in the box');
            equal(stateMachine.currentState, 'hidden');
            deepEqual(stateMachine.cbData, [
                ['enterHidden1', 'in the box']
            ]);
        });

        test('StateMachine - no transition', function () {
            stateMachine.testSetUp('hidden', true);
            stateMachine.trigger('hide');
            equal(stateMachine.currentState, 'hidden');
            deepEqual(stateMachine.eventsData, [
                ['hide']                                            // the initial trigger
            ]);
            deepEqual(stateMachine.cbData, []);
        });

        test('StateMachine - trigger silent', function () {
            stateMachine.testSetUp('hidden', true);
            stateMachine.silent = true;
            stateMachine.trigger('show', 'bla');
            equal(stateMachine.currentState, 'visible');
            deepEqual(stateMachine.eventsData, [
                ['show', 'bla']                                     // the initial trigger
            ]);
            deepEqual(stateMachine.cbData, [
                ['hiddenToVisible1', 'bla'],
                ['hiddenToVisible2', 'bla'],
                ['enterVisible1', 'bla'],
                ['enterVisible2', 'bla']
            ]);
        });

        var eventSender = {};
        _.extend(eventSender, Backbone.Events);

    module('StatefulView');
        
        var TestStatefulView = Backbone.StatefulView.extend({
            transitions: {
                'hidden': {
                    'show': {enterState: 'visible'},
                    'click .clickable': {enterState: 'visible'}
                },
                'visible': {
                    'hide': {enterState: 'hidden'},
                    'click .clickable': {enterState: 'hidden'},
                    'click .clickable2': {enterState: 'hidden', callbacks: ['visibleToHiddenCb']}
                }
            },
            states: {
                'hidden': {className: 'hiddenBehindTree'}
            },
            events: {
                'click .clickable': 'clickedCb'
            },
            testSetUp: function(currentState) {
                this.currentState = currentState;
                this.clicked = false;
                this.clickEvent = null;
            },
            visibleToHiddenCb: function(event) {
                this.clickEvent = event;
            },
            clickedCb: function() {
                this.clicked = true;
            }
        });
        var el = $('<div><span class="clickable"></span><span class="clickable2"></span></div>');
        var statefulView = new TestStatefulView({
            currentState: 'hidden',
            el: el
        });

        test('StatefulView - instanceof', function () {
            ok(statefulView instanceof Backbone.View);
        });

        test('StatefulView - transition css class auto', function () {
            statefulView.testSetUp('hidden');
            statefulView.trigger('show');
            equal(statefulView.currentState, 'visible');
            equal($(statefulView.el).attr('class'), 'visible');
        });

        test('StatefulView - transition css class provided', function () {
            statefulView.testSetUp('visible');
            statefulView.trigger('hide');
            equal(statefulView.currentState, 'hidden');
            equal($(statefulView.el).attr('class'), 'hiddenBehindTree');
        });

        test('StatefulView - trigger DOM events', function () {
            statefulView.testSetUp('hidden');

            // simple test
            $('.clickable2', statefulView.el).trigger('click');
            equal(statefulView.currentState, 'hidden');

            $('.clickable2', statefulView.el).trigger('show');
            equal(statefulView.currentState, 'visible');

            $('.clickable2', statefulView.el).trigger('click');
            equal(statefulView.currentState, 'hidden');
            equal(statefulView.clickEvent.type, 'click');

            // test with events that occur in several transitions
            // and with DOM events.
            $('.clickable', statefulView.el).trigger('click');
            equal(statefulView.currentState, 'visible');
            // Test that standard View.events callbacks are still called
            equal(statefulView.clicked, true);

            $('.clickable', statefulView.el).trigger('hide');
            equal(statefulView.currentState, 'hidden');
        });

});
