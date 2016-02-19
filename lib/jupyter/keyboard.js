// NOTE:
// It seems that an internal function ('only_modifier_event') of keyboard.js
// in jupyter-client 4.1 has a bug in Firefox.
// It checks 'event.altKey || event.ctrlKey || ...' but the result is always
// 'false' if only modifier keys are pressed.
// So monkey-patch the prototype of the class to fix this issue.
define([
  'jquery',
  'base/js/keyboard'
], function($, keyboard) {
  "use strict";
  var undefined;
  var exports = {};
  var Original = undefined;
  var ShortcutManager = keyboard.ShortcutManager;

  var only_modifier_event = function only_modifier_event(event){
    var key = keyboard.inv_keycodes[event.which];
    return (key === 'alt'|| key === 'ctrl'|| key === 'meta'|| key === 'shift');
  };

  exports.attach = function attach() {
    if (Original === undefined) {
      Original = $.extend(ShortcutManager.prototype);
      ShortcutManager.prototype.call_handler = function(event) {
        this.clearsoon();
        if(only_modifier_event(event)){
          return true;
        }
        return Original.call_handler.apply(this, arguments);
      };
    }
  };

  exports.detach = function detach() {
    if (Original !== undefined) {
      ShortcutManager.prototype = Original;
      Original = undefined;
    }
  };

  return exports;
});
