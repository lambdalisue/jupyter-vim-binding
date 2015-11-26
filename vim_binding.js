/*
 * vim_binding.js
 *
 * A vim key binding plugin for Jupyter/IPython
 *
 * @author    Alisue <lambdalisue@hashnote.net>
 * @version   0.1.0
 * @license   MIT license
 * @see       http://github.com/lambdalisue/jupyter-vim-binding
 * @copyright 2015, Alisue, hashnote.net
 *
 * Refs:
 *  - https://github.com/ivanov/ipython-vimception
 *  - http://stackoverflow.com/questions/25730516/vi-shortcuts-in-ipython-notebook
 *  - http://mindtrove.info/#nb-server-exts
 *  - http://akuederle.com/customize-ipython-keymap/
 */
"use strict";

define([
  'base/js/namespace',
  'notebook/js/notebook',
  'notebook/js/cell',
  'codemirror/keymap/vim'
], function(namespace, notebook, cell) {
  var undefined;
  var extend = function(destination, source) {
    for (var property in source) {
      if (source.hasOwnProperty(property)) {
        destination[property] = source[property];
      }
    }
    return destination;
  };

  //
  // Extend CodeMirror
  //
  CodeMirror.prototype.save = function() {
    namespace.notebook.save_checkpoint();
  };
  CodeMirror.Vim.Jupyter = {};
  CodeMirror.Vim.Jupyter.leaveInsertMode = function(cm) {
    CodeMirror.Vim.handleKey(cm, '<Esc>');
  };
  CodeMirror.Vim.Jupyter.leaveNormalMode = function(cm) {
    namespace.notebook.command_mode();
    namespace.notebook.focus_cell();
  };
  CodeMirror.Vim.Jupyter.leaveInsertOrNormalMode = function(cm) {
    if (cm.state.vim.insertMode || cm.state.vim.visualMode) {
      CodeMirror.Vim.Jupyter.leaveInsertMode(cm);
    } else {
      CodeMirror.Vim.Jupyter.leaveNormalMode(cm);
    }
  };
  CodeMirror.Vim.Jupyter.insertSoftTab = function(cm) {
    cm.execCommand('insertSoftTab');
  };
  CodeMirror.Vim.Jupyter.init = function() {
    var config = cell.Cell.options_default.cm_config;
    config.keyMap = 'vim';
    config.extraKeys = extend(config.extraKeys || {}, {
      'Esc': CodeMirror.Vim.Jupyter.leaveInsertOrNormalMode,
      'Tab': CodeMirror.Vim.Jupyter.insertSoftTab,
      'Ctrl-C': false,  // To enable clipboard copy
    });
  };
  // Initialize
  CodeMirror.Vim.Jupyter.init();

  // Extend Jupyter
  var original = {};
  original.handle_command_mode = notebook.Notebook.prototype.handle_command_mode;
  original.handle_edit_mode = notebook.Notebook.prototype.handle_edit_mode;

  notebook.Notebook.prototype.handle_command_mode = function(cell) {
    if (document.querySelector('.CodeMirror-dialog')) {
      // .CodeMirror-dialog exists, mean that user hit ':' to enter Vim's
      // command mode so do not leave Jupyter's edit mode in this case
      return;
    }
    original.handle_command_mode.call(this, cell);
  };
  notebook.Notebook.prototype.handle_edit_mode = function(cell) {
    // Make sure that the CodeMirror is in Vim's Normal mode
    if (cell.code_mirror) {
      CodeMirror.Vim.Jupyter.leaveInsertMode(cell.code_mirror);
    }
    original.handle_edit_mode.call(this, cell);
  };

  // Register custom actions
  var km = namespace.keyboard_manager;
  km.actions.register({
    'help': 'focus the first cell',
    'help_index': 'zz',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[0].focus_cell();
      }
      return false;
    }
  }, 'focus_first_cell', 'vim_binding');
  km.actions.register({
    'help': 'focus the last cell',
    'help_index': 'zz',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[cells.length - 1].focus_cell();
      }
      return false;
    }
  }, 'focus_last_cell', 'vim_binding');

  // Assign custom Vim-like mappings
  km.edit_shortcuts.clear_shortcuts();
  km.edit_shortcuts.add_shortcut('ctrl-shift--', 'ipython.split-cell-at-cursor');
  km.edit_shortcuts.add_shortcut('ctrl-shift-subtract', 'ipython.split-cell-at-cursor');
  km.edit_shortcuts.add_shortcut('ctrl-j', 'ipython.select-next-cell');
  km.edit_shortcuts.add_shortcut('ctrl-k', 'ipython.select-previous-cell');
  km.edit_shortcuts.add_shortcut('alt-enter', 'ipython.execute-and-insert-after');
  km.edit_shortcuts.add_shortcut('ctrl-enter', 'ipython.execute-in-place');
  km.edit_shortcuts.add_shortcut('shift-enter', 'ipython.run-select-next');
  km.edit_shortcuts.add_shortcut('shift', 'ipython.ignore');
  km.edit_shortcuts.add_shortcut('ctrl-s', 'ipython.save-notebook');
  km.edit_shortcuts.add_shortcut('ctrl-1', 'ipython.change-selected-cell-to-code-cell');
  km.edit_shortcuts.add_shortcut('ctrl-2', 'ipython.change-selected-cell-to-markdown-cell');
  km.edit_shortcuts.add_shortcut('ctrl-3', 'ipython.change-selected-cell-to-raw-cell');

  km.command_shortcuts.clear_shortcuts();
  km.command_shortcuts.add_shortcut('ctrl-c', 'ipython.interrupt-kernel');
  km.command_shortcuts.add_shortcut('shift-o', 'ipython.insert-cell-before');
  km.command_shortcuts.add_shortcut('o', 'ipython.insert-cell-after');
  km.command_shortcuts.add_shortcut('y,y', 'ipython.copy-selected-cell');
  km.command_shortcuts.add_shortcut('d,d', 'ipython.cut-selected-cell');
  km.command_shortcuts.add_shortcut('shift-p', 'ipython.paste-cell-before');
  km.command_shortcuts.add_shortcut('p', 'ipython.paste-cell-after');
  km.command_shortcuts.add_shortcut('esc', 'ipython.close-pager');
  km.command_shortcuts.add_shortcut('q', 'ipython.close-pager');
  km.command_shortcuts.add_shortcut('enter', 'ipython.enter-edit-mode');
  km.command_shortcuts.add_shortcut('i', 'ipython.enter-edit-mode');
  km.command_shortcuts.add_shortcut('j', 'ipython.select-next-cell');
  km.command_shortcuts.add_shortcut('k', 'ipython.select-previous-cell');
  km.command_shortcuts.add_shortcut('ctrl-j', 'ipython.select-next-cell');
  km.command_shortcuts.add_shortcut('ctrl-k', 'ipython.select-previous-cell');
  km.command_shortcuts.add_shortcut('shift-j', 'ipython.extend-selection-next');
  km.command_shortcuts.add_shortcut('shift-k', 'ipython.extend-selection-previous');
  km.command_shortcuts.add_shortcut('shift-m', 'ipython.merge-selected-cells');
  km.command_shortcuts.add_shortcut('g,g', 'vim_binding.focus_first_cell');
  km.command_shortcuts.add_shortcut('shift-g', 'vim_binding.focus_last_cell');
  km.command_shortcuts.add_shortcut('ctrl-u', 'ipython.scroll-up');
  km.command_shortcuts.add_shortcut('ctrl-d', 'ipython.scroll-down');
  km.command_shortcuts.add_shortcut('u', 'ipython.undo-last-cell-deletion');
  km.command_shortcuts.add_shortcut('ctrl-1', 'ipython.change-selected-cell-to-code-cell');
  km.command_shortcuts.add_shortcut('ctrl-2', 'ipython.change-selected-cell-to-markdown-cell');
  km.command_shortcuts.add_shortcut('ctrl-3', 'ipython.change-selected-cell-to-raw-cell');
  km.command_shortcuts.add_shortcut('shift-h', 'ipython.show-keyboard-shortcut-help-dialog');
  km.command_shortcuts.add_shortcut('shift-l', 'ipython.toggle-line-number-selected-cell');
  km.command_shortcuts.add_shortcut('shift-v', 'ipython.toggle-output-visibility-selected-cell');
  km.command_shortcuts.add_shortcut('shift-s', 'ipython.toggle-output-scrolling-selected-cell');
  km.command_shortcuts.add_shortcut('ctrl-s', 'ipython.save-notebook');
  km.command_shortcuts.add_shortcut('alt-enter', 'ipython.execute-and-insert-after');
  km.command_shortcuts.add_shortcut('ctrl-enter', 'ipython.execute-in-place');
  km.command_shortcuts.add_shortcut('shift-enter', 'ipython.run-select-next');
  km.command_shortcuts.add_shortcut('0,0', 'ipython.restart-kernel');
  km.command_shortcuts.add_shortcut('1', 'ipython.change-selected-cell-to-heading-1');
  km.command_shortcuts.add_shortcut('2', 'ipython.change-selected-cell-to-heading-2');
  km.command_shortcuts.add_shortcut('3', 'ipython.change-selected-cell-to-heading-3');
  km.command_shortcuts.add_shortcut('4', 'ipython.change-selected-cell-to-heading-4');
  km.command_shortcuts.add_shortcut('5', 'ipython.change-selected-cell-to-heading-5');
  km.command_shortcuts.add_shortcut('6', 'ipython.change-selected-cell-to-heading-6');

  var exports = {
    'load_ipython_extension': function() {
      // Apply default CodeMirror config to existing CodeMirror instances
      var config = cell.Cell.options_default.cm_config;
      namespace.notebook.get_cells().map(function(cell) {
        var cm = cell.code_mirror;
        if (cm) {
          cm.setOption('keyMap', config.keyMap);
          cm.setOption('extraKeys', config.extraKeys);
        }
      });
    },
  };
  return exports;
});
