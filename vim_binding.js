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
  // Configure
  //
  var defaultConfig = {};
  defaultConfig.scrollUnit = 30;
  defaultConfig.closestCellMargin = 30;
  namespace.VimBinding = extend({
      'scrollUnit': defaultConfig.scrollUnit,
      'closestCellMargin': defaultConfig.closestCellMargin
  }, namespace.VimBinding || {});

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
  notebook.Notebook.prototype.select_closest_cell = function(direction) {
      var margin = namespace.VimBinding.closestCellMargin || defaultConfig.closestCellMargin;
      var site = document.querySelector('#site');
      var elems = this.get_cell_elements();
      var index = this.get_selected_index();
      var viewport = {
        'top': site.scrollTop,
        'bottom': site.scrollTop + (site.clientHeight - site.offsetTop)
      };
      var box = {
        'top': elems[index].offsetTop,
        'bottom': elems[index].offsetTop + elems[index].clientHeight
      };
      if (box.bottom - margin < viewport.top && direction !== 'up') {
        for (var i=index; i<elems.length; i++) {
          if (elems[i].offsetTop >= viewport.top) {
            this.select(i);
            return;
          }
        }
      } else if(box.top + margin > viewport.bottom && direction !== 'down') {
        for (var i=index; i>=0; i--) {
          if (elems[i].offsetTop + elems[i].clientHeight < viewport.bottom) {
            this.select(i);
            return;
          }
        }
      }
  };
  // Register custom actions
  var km = namespace.keyboard_manager;
  km.actions.register({
    'help': 'select a next cell and enter edit mode',
    'help_index': 'zz',
    'handler': function(env) {
      env.notebook.select_next();
      env.notebook.edit_mode();
    }
  }, 'select-next-cell-and-edit', 'vim-binding');
  km.actions.register({
    'help': 'select a previous cell and enter edit mode',
    'help_index': 'zz',
    'handler': function(env) {
      env.notebook.select_prev();
      env.notebook.edit_mode();
    }
  }, 'select-previous-cell-and-edit', 'vim-binding');
  km.actions.register({
    'help': 'select the first cell',
    'help_index': 'zz',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[0].focus_cell();
      }
      return false;
    }
  }, 'select-first-cell', 'vim-binding');
  km.actions.register({
    'help': 'select the last cell',
    'help_index': 'zz',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[cells.length - 1].focus_cell();
      }
      return false;
    }
  }, 'select-last-cell', 'vim-binding');
  km.actions.register({
    'help': 'scroll down',
    'help_index': 'zz',
    'handler': function(env) {
      // scroll down
      var scrollUnit = namespace.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop += scrollUnit;
      if (prev === site.scrollTop) {
        env.notebook.select_next();
      } else {
        env.notebook.select_closest_cell('down');
      }
      return false
    }
  }, 'scroll-down', 'vim-binding');
  km.actions.register({
    'help': 'scroll up',
    'help_index': 'zz',
    'handler': function(env) {
      var scrollUnit = namespace.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop -= scrollUnit;
      if (prev === site.scrollTop) {
        env.notebook.select_prev();
      } else {
        env.notebook.select_closest_cell('up');
      }
      return false;
    }
  }, 'scroll-up', 'vim-binding');

  // Assign custom Vim-like mappings
  var common_shortcuts = km.get_default_common_shortcuts();
  if ((common_shortcuts.shift || '') === 'jupyter-notebook:ignore') {
    km.edit_shortcuts.clear_shortcuts();
    km.edit_shortcuts.add_shortcut('ctrl-shift--', 'jupyter-notebook:split-cell-at-cursor');
    km.edit_shortcuts.add_shortcut('ctrl-shift-subtract', 'jupyter-notebook:split-cell-at-cursor');
    km.edit_shortcuts.add_shortcut('ctrl-j', 'vim-binding:select-next-cell-and-edit');
    km.edit_shortcuts.add_shortcut('ctrl-k', 'vim-binding:select-previous-cell-and-edit');
    km.edit_shortcuts.add_shortcut('alt-enter', 'jupyter-notebook:run-cell-and-insert-below');
    km.edit_shortcuts.add_shortcut('ctrl-enter', 'jupyter-notebook:run-cell');
    km.edit_shortcuts.add_shortcut('shift-enter', 'jupyter-notebook:run-cell-and-select-next');
    km.edit_shortcuts.add_shortcut('shift', 'jupyter-notebook:ignore');
    km.edit_shortcuts.add_shortcut('ctrl-s', 'jupyter-notebook:save-notebook');
    km.edit_shortcuts.add_shortcut('ctrl-1', 'jupyter-notebook:change-cell-to-code');
    km.edit_shortcuts.add_shortcut('ctrl-2', 'jupyter-notebook:change-cell-to-markdown');
    km.edit_shortcuts.add_shortcut('ctrl-3', 'jupyter-notebook:change-cell-to-raw');

    km.command_shortcuts.clear_shortcuts();
    km.command_shortcuts.add_shortcut('ctrl-c', 'jupyter-notebook:interrupt-kernel');
    km.command_shortcuts.add_shortcut('shift-o', 'jupyter-notebook:insert-cell-above');
    km.command_shortcuts.add_shortcut('o', 'jupyter-notebook:insert-cell-below');
    km.command_shortcuts.add_shortcut('y,y', 'jupyter-notebook:copy-cell');
    km.command_shortcuts.add_shortcut('d,d', 'jupyter-notebook:cut-cell');
    km.command_shortcuts.add_shortcut('shift-p', 'jupyter-notebook:paste-cell-above');
    km.command_shortcuts.add_shortcut('p', 'jupyter-notebook:paste-cell-below');
    km.command_shortcuts.add_shortcut('esc', 'jupyter-notebook:close-pager');
    km.command_shortcuts.add_shortcut('q', 'jupyter-notebook:close-pager');
    km.command_shortcuts.add_shortcut('enter', 'jupyter-notebook:enter-edit-mode');
    km.command_shortcuts.add_shortcut('i', 'jupyter-notebook:enter-edit-mode');
    km.command_shortcuts.add_shortcut('j', 'vim-binding:scroll-down');
    km.command_shortcuts.add_shortcut('k', 'vim-binding:scroll-up');
    km.command_shortcuts.add_shortcut('z,z', 'jupyter-notebook:scroll-cell-center');
    km.command_shortcuts.add_shortcut('z,t', 'jupyter-notebook:scroll-cell-top');
    km.command_shortcuts.add_shortcut('ctrl-j', 'jupyter-notebook:select-next-cell');
    km.command_shortcuts.add_shortcut('ctrl-k', 'jupyter-notebook:select-previous-cell');
    km.command_shortcuts.add_shortcut('shift-j', 'jupyter-notebook:extend-marked-cells-below');
    km.command_shortcuts.add_shortcut('shift-k', 'jupyter-notebook:extend-marked-cells-above');
    km.command_shortcuts.add_shortcut('shift-m', 'jupyter-notebook:merge-cells');
    km.command_shortcuts.add_shortcut('g,g', 'vim-binding:select-first-cell');
    km.command_shortcuts.add_shortcut('shift-g', 'vim-binding:select-last-cell');
    km.command_shortcuts.add_shortcut('ctrl-u', 'jupyter-notebook:scroll-notebook-up');
    km.command_shortcuts.add_shortcut('ctrl-d', 'jupyter-notebook:scroll-notebook-down');
    km.command_shortcuts.add_shortcut('u', 'jupyter-notebook:undo-cell-deletion');
    km.command_shortcuts.add_shortcut('ctrl-1', 'jupyter-notebook:change-cell-to-code');
    km.command_shortcuts.add_shortcut('ctrl-2', 'jupyter-notebook:change-cell-to-markdown');
    km.command_shortcuts.add_shortcut('ctrl-3', 'jupyter-notebook:change-cell-to-raw');
    km.command_shortcuts.add_shortcut('shift-h', 'jupyter-notebook:show-keyboard-shortcuts');
    km.command_shortcuts.add_shortcut('shift-l', 'jupyter-notebook:toggle-cell-line-numbers');
    km.command_shortcuts.add_shortcut('shift-v', 'jupyter-notebook:toggle-cell-output-visibility');
    km.command_shortcuts.add_shortcut('shift-s', 'jupyter-notebook:toggle-cell-output-scrolling');
    km.command_shortcuts.add_shortcut('ctrl-s', 'jupyter-notebook:save-notebook');
    km.command_shortcuts.add_shortcut('alt-enter', 'jupyter-notebook:run-cell-and-insert-below');
    km.command_shortcuts.add_shortcut('ctrl-enter', 'jupyter-notebook:run-cell');
    km.command_shortcuts.add_shortcut('shift-enter', 'jupyter-notebook:run-cell-and-select-next');
    km.command_shortcuts.add_shortcut('0,0', 'jupyter-notebook:confirm-restart-kernel');
    km.command_shortcuts.add_shortcut('1', 'jupyter-notebook:change-cell-to-heading-1');
    km.command_shortcuts.add_shortcut('2', 'jupyter-notebook:change-cell-to-heading-2');
    km.command_shortcuts.add_shortcut('3', 'jupyter-notebook:change-cell-to-heading-3');
    km.command_shortcuts.add_shortcut('4', 'jupyter-notebook:change-cell-to-heading-4');
    km.command_shortcuts.add_shortcut('5', 'jupyter-notebook:change-cell-to-heading-5');
    km.command_shortcuts.add_shortcut('6', 'jupyter-notebook:change-cell-to-heading-6');
  } else {
    km.edit_shortcuts.clear_shortcuts();
    km.edit_shortcuts.add_shortcut('ctrl-shift--', 'ipython.split-cell-at-cursor');
    km.edit_shortcuts.add_shortcut('ctrl-shift-subtract', 'ipython.split-cell-at-cursor');
    km.edit_shortcuts.add_shortcut('ctrl-j', 'vim-binding.select-next-cell-and-edit');
    km.edit_shortcuts.add_shortcut('ctrl-k', 'vim-binding.select-previous-cell-and-edit');
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
    km.command_shortcuts.add_shortcut('j', 'vim-binding.scroll-down');
    km.command_shortcuts.add_shortcut('k', 'vim-binding.scroll-up');
    km.command_shortcuts.add_shortcut('z,z', 'ipython.scroll-cell-center');
    km.command_shortcuts.add_shortcut('z,t', 'ipython.scroll-cell-top');
    km.command_shortcuts.add_shortcut('ctrl-j', 'ipython.select-next-cell');
    km.command_shortcuts.add_shortcut('ctrl-k', 'ipython.select-previous-cell');
    km.command_shortcuts.add_shortcut('shift-j', 'ipython.extend-selection-next');
    km.command_shortcuts.add_shortcut('shift-k', 'ipython.extend-selection-previous');
    km.command_shortcuts.add_shortcut('shift-m', 'ipython.merge-selected-cells');
    km.command_shortcuts.add_shortcut('g,g', 'vim-binding.select-first-cell');
    km.command_shortcuts.add_shortcut('shift-g', 'vim-binding.select-last-cell');
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
  }

  var exports = {
    'load_ipython_extension': function() {
      // Initialize
      var cm_config = cell.Cell.options_default.cm_config;
      cm_config.keyMap = 'vim';
      cm_config.extraKeys = extend(cm_config.extraKeys || {}, {
        'Esc': CodeMirror.Vim.Jupyter.leaveInsertOrNormalMode,
        'Tab': CodeMirror.Vim.Jupyter.insertSoftTab,
        'Ctrl-C': false,  // To enable clipboard copy
      });

      // Apply default CodeMirror config to existing CodeMirror instances
      namespace.notebook.get_cells().map(function(cell) {
        var cm = cell.code_mirror;
        if (cm) {
          cm.setOption('keyMap', cm_config.keyMap);
          cm.setOption('extraKeys', cm_config.extraKeys);
        }
      });
    },
  };
  return exports;
});
