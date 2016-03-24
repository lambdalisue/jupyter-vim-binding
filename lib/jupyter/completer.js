// NOTE:
// The default 'completer.js' does not support <C-n>/<C-p> completion
// so monkey-patch the module to support that keys
define([
  'jquery',
  'base/js/keyboard',
  'notebook/js/completer',
], function($, keyboard, completer) {
  "use strict";
  var undefined;
  var exports = {};
  var keycodes = keyboard.keycodes;
  var Original = undefined;
  var Completer = completer.Completer;

  exports.attach = function attach() {
    if (Original !== undefined) {
      return;
    }
    Original = $.extend({}, Completer.prototype);
    Completer.prototype.keydown = function(event) {
      var code = event.keyCode;
      var ctrl = event.ctrlKey;
      var alternative;
      if (ctrl && (code === keycodes.n || code === keycodes.p)) {
        alternative = {
          'key':  code == keycodes.p ? 'up' : 'down',
          'code': code == keycodes.p ? keycodes.up : keycodes.down,
        };
      } else if (ctrl && code === keycodes.y) {
        alternative = {
          'key':  '',
          'code': keycodes.enter,
        };
      } else if (ctrl && code === keycodes.e) {
        alternative = {
          'key':  '',
          'code': keycodes.esc,
        };
      } else if (ctrl && code === keycodes.l) {
        alternative = {
          'key':  '',
          'code': keycodes.tab,
        };
      }
      if (alternative !== undefined) {
        if (alternative.code !== keycodes.tab) {
          // the following could not be called in orignal code while we create
          // a new keyboard event so call these at this point
          event.codemirrorIgnore = true;
          event._ipkmIgnore = true;
          event.preventDefault();
        }
        Original.keydown.call(this, new KeyboardEvent(event.type, {
          'key': alternative.key,
          'code': alternative.code,
          'location': event.location,
          'ctrlKey': alternative.ctrlKey !== undefined ? event.ctrlKey : alternative.ctrlKey,
          'shiftKey': alternative.shiftKey !== undefined ? event.ctrlKey : alternative.ctrlKey,
          'altKey': alternative.altKey !== undefined ? event.altKey : alternative.altKey,
          'metaKey': alternative.metaKey !== undefined ? event.metaKey : alternative.metaKey,
          'repeat': event.repeat,
          'isComposing': event.isComposing,
          'charCode': alternative.key === '' ? 0 : alternative.key.charCodeAt(0),
          'keyCode': alternative.code,
          'which': alternative.code,
        }));
      } else {
        Original.keydown.call(this, event);
      }
    };
  };

  exports.detach = function detach() {
    if (Original === undefined) {
      return;
    }
    Completer.prototype = Original;
    Original = undefined;
  };

  return exports;
});
