// NOTE:
// The default 'notebook.js' does not suite for Vimmer in some case
// so monkey-patch the module to regulate the behavior
define([
  'jquery',
  'base/js/namespace',
  'notebook/js/notebook',
], function($, ns, notebook) {
  "use strict";
  var undefined;
  var exports = {};
  var Original = undefined;
  var Notebook = notebook.Notebook;

  var was_in_insert_before_blur = false;
  var onBlurWindow = function() {
    var cell = ns.notebook.get_selected_cell();
    if (cell && cell.code_mirror) {
      was_in_insert_before_blur = cell.code_mirror.state.vim.insertMode;
    }
  };

  exports.attach = function attach() {
    if (Original !== undefined) {
      return;
    }
    Original = $.extend({}, Notebook.prototype);
    Notebook.prototype.handle_command_mode = function handle_command_mode(cell) {
      if (document.querySelector('.CodeMirror-dialog')) {
        // .CodeMirror-dialog exists, mean that user hit ':' to enter Vim's
        // command mode so do not leave Jupyter's edit mode in this case
        return;
      }
      return Original.handle_command_mode.apply(this, arguments);
    };
    Notebook.prototype.handle_edit_mode = function handle_edit_mode(cell) {
      if (cell.code_mirror && was_in_insert_before_blur) {
        cell.code_mirror.leaveInsertMode();
      }
      was_in_insert_before_blur = false;
      return Original.handle_edit_mode.apply(this, arguments);
    };
    window.addEventListener('blur', onBlurWindow);
  };

  exports.detach = function detach() {
    if (Original === undefined) {
      return;
    }
    Notebook.prototype = Original;
    Original = undefined;
    window.removeEventListener('blur', onBlurWindow);
  };

  return exports;
});
