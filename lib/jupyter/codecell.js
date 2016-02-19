// NOTE:
// The default 'codecell.js' does not support <C-n>/<C-p> completion and
// <C-g> tooltip so monkey-patch the module to support that keys
define([
  'jquery',
  'base/js/keyboard',
  'notebook/js/codecell',
], function($, keyboard, codecell) {
  "use strict";
  var undefined;
  var exports = {};
  var keycodes = keyboard.keycodes;
  var Original = undefined;
  var CodeCell = codecell.CodeCell;

  exports.attach = function attach() {
    if (Original !== undefined) {
      return;
    }
    Original = $.extend(CodeCell.prototype);
    CodeCell.prototype.handle_codemirror_keyevent = function handle_codemirror_keyevent(editor, event) {
      if (!this.completer.visible && event.type === 'keydown') {
        var code = event.keyCode;
        var ctrl = event.ctrlKey;

        if (ctrl && code === keycodes.g) {
          if (editor.somethingSelected() || editor.getSelections().length !== 1){
            var anchor = editor.getCursor("anchor");
            var head = editor.getCursor("head");
            if( anchor.line !== head.line){
              return false;
            }
          }
          this.tooltip.request(this);
          event.codemirrorIgnore = true;
          event.preventDefault();
          return true;
        } else if (ctrl && (code === keycodes.n || code === keycodes.p)) {
          this.tooltip.remove_and_cancel_tooltip();

          // completion does not work on multicursor, it might be possible though in some cases
          if (editor.somethingSelected() || editor.getSelections().length > 1) {
            return false;
          }
          event.codemirrorIgnore = true;
          event.preventDefault();
          this.completer.startCompletion();
          return true;
        }
      }
      return Original.handle_codemirror_keyevent.apply(this, arguments);
    };
  };

  exports.detach = function detach() {
    if (Original === undefined) {
      return;
    }
    CodeCell.prototype = Original;
    Original = undefined;
  };

  return exports;
});
