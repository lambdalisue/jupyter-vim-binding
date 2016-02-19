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
      if (ctrl && (code === keycodes.n || code === keycodes.p)) {
        event.codemirrorIgnore = true;
        event._ipkmIgnore = true;
        event.preventDefault();

        var options = this.sel.find('option');
        var index = this.sel[0].selectedIndex;
        if (code === keycodes.p) {
          index--;
        }
        if (code === keycodes.n) {
          index++;
        }
        index = Math.min(Math.max(index, 0), options.length-1);
        this.sel[0].selectedIndex = index;
      } else {
        Original.keydown.apply(this, arguments);
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
