var Iterator = (function() {
  var index = 0,
      length = 0;

  function Iterator(data) {
    this.data = data;
    length = data.length;

    this.current = function() { return data[index]; };

    this.next = function() {
      if (!this.hasNext()) return null;
      var element = this.data[index];
      index += 1;
      return element;
    };

    this.hasNext = function() { return index < length; };
    this.rewind = function() { index = 0; this.current(); };
  };

  return Iterator;
})();


var InstantReplay = (function(jQuery, Iterator) {
  var _actions;
  var eventsToWatch = [
    "click.ireplay",
    "mousemove.ireplay",
    //"mousein",
    //"mouseout"
  ].join(" ");

  var tags = [
    "button",
    "div",
    "a",
    "li"
  ].join(", ");

  var setup = function() {
    _actions = [];
    $(document).on(eventsToWatch, function(e) { recordEvent(e); });
    $(tags).on(eventsToWatch, function(e) { recordEvent(e); });
  };

  var teardown = function() {
    $(document).off(eventsToWatch);
    $(tags).off(eventsToWatch);
  };

  var recordEvent = function(e) {
    _actions.push({
      x:      e.clientX,
      y:      e.clientY,
      type:   e.type,
      target: e.target,
      time:   e.timeStamp
    });
  };

  var wait = function(ms) {
    var date = new Date(), current = new Date();
    while(current - date < ms) {
      current = new Date();
    }
  };

  var mouse = {
    css: {
       "position": "absolute",
       "top": "50px",
       "left": "50px",
       "z-index": "999999999",
       "width": "40px",
       "height": "40px",
       "border-radius": "40px",
       "background-color": "red",
       "opacity": 0.6,
    },
    el: "<div class='ir-mouse'></div>",
    init: function() {
      if ($(".ir-mouse").length == 0) {
      $("body").append(this.el);
      }
      this.$el = $(".ir-mouse");
      this.$el.css(this.css);
    },
    move: function(x, y) {
      this.$el.css({
        "top": y + "px",
        "left": x + "px"
      });
    }
  };

  var triggerAction = function(action) {
    if (action.type === "mousemove") {
      mouse.move(action.x, action.y);
    }
    else {
      $(action.target).trigger(action.type);
    }
  };

  return {
    record: function() {
      console.log("RECORDING.....");
      setup();
    },
    play: function() {
      console.log("PLAYING BACK.....");
      teardown();
      mouse.init();

      var pollInterval = 10;

      if (_actions.length == 0) {
        console.log("No actions recorded.");
        return;
      }

      console.log(_actions.length, _actions);

      var actions = new Iterator(_actions);
      var current = actions.current();

      var triggerCurrent = function() {
        triggerAction(actions.current());
      };

      var lastEventAt = actions.current().time - 1;
      var lastDelta = 0;

      var playInterval = setInterval(function() {

        var currentAction = actions.current();
        if (actions.hasNext() && currentAction) {
          var timeDelta = currentAction.time - lastEventAt;
          lastDelta += pollInterval;
          if (timeDelta <= lastDelta) {
            triggerAction(currentAction);
            lastEventAt = currentAction.time;
            lastDelta = 0;
            actions.next();
          }
        }
        else {
          clearInterval(playInterval);
          console.log("done playing all actions")
        }

      }, pollInterval);

    }
  };
})(jQuery, Iterator);
