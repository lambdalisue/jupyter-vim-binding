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

define(['base/js/namespace', 'notebook/js/cell', 'codemirror/keymap/vim'], function(namespace, cell) {
  var extend = function(destination, source) {
    for (var property in source) {
      if (source.hasOwnProperty(property)) {
        destination[property] = source[property];
      }
    }
    return destination;
  };
  var leaveInsert = function(cm) {
    CodeMirror.Vim.handleKey(cm, '<Esc>');
  };
  var leaveInsertOrNormal = function(cm) {
    if (cm.state.vim.insertMode || cm.state.vim.visualMode) {
      CodeMirror.Vim.handleKey(cm, '<Esc>');
    } else {
      namespace.notebook.command_mode();
      namespace.notebook.focus_cell();
    }
  };
  var insertSoftTab = function(cm) {
    cm.execCommand('insertSoftTab');
  }

  // Override save method of CodeMirror to save a checkpoint
  CodeMirror.prototype.save = function() {
    namespace.notebook.save_checkpoint();
  };

  // Override default config of CodeMirror to enable Vim binding
  var options = cell.Cell.options_default;
  options.cm_config.keyMap = 'vim';
  options.cm_config.extraKeys = extend(options.cm_config.extraKeys || {}, {
    'Esc': leaveInsertOrNormal,
    'Tab': insertSoftTab,
    'Ctrl-C': false,
  });

  // Override 'bind_events' to ensure 'Normal' mode on blur
  var original_bind_events = cell.Cell.prototype.bind_events;
  cell.Cell.prototype.bind_events = function() {
    original_bind_events.apply(this);
    if (this.code_mirror) {
      this.code_mirror.on('blur', leaveInsert);
    }
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

  // Keys defined to 'command_shortcuts' would steal pressed keys in CodeMirror's Vim command mode
  // Thus the following shortcuts, which is not often used, are not defined even it is defined in
  // normal IPython/Jupyter.
  // See https://github.com/lambdalisue/jupyter-vim-binding/issues/2
  //km.command_shortcuts.add_shortcut('0,0', 'ipython.restart-kernel');
  //km.command_shortcuts.add_shortcut('1', 'ipython.change-selected-cell-to-heading-1');
  //km.command_shortcuts.add_shortcut('2', 'ipython.change-selected-cell-to-heading-2');
  //km.command_shortcuts.add_shortcut('3', 'ipython.change-selected-cell-to-heading-3');
  //km.command_shortcuts.add_shortcut('4', 'ipython.change-selected-cell-to-heading-4');
  //km.command_shortcuts.add_shortcut('5', 'ipython.change-selected-cell-to-heading-5');
  //km.command_shortcuts.add_shortcut('6', 'ipython.change-selected-cell-to-heading-6');

  var exports = {
    'load_ipython_extension': function() {
      var options = cell.Cell.options_default;
      // apply options and events on existing CodeMirror instances
      namespace.notebook.get_cells().map(function(cell) {
        var cm = cell.code_mirror;
        if (cm) {
          cm.setOption('keyMap', options.cm_config.keyMap);
          cm.setOption('extraKeys', options.cm_config.extraKeys);
          cm.on('blur', leaveInsert);
        }
      });
    },
    'leaveInsert': leaveInsert,
    'leaveInsertOrNormal': leaveInsertOrNormal,
    'insertSoftTab': insertSoftTab,
  };
  return exports;
});
