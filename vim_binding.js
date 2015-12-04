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
  'require',
  'base/js/namespace',
  'notebook/js/notebook',
  'notebook/js/cell',
  'codemirror/keymap/vim'
], function(require, ns, notebook, cell) {
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
  var CONST = Object.freeze({
    'SCROLL_UNIT': 30,
    'CLOSEST_CELL_MARGIN': 30
  });
  ns.VimBinding = extend({
      'scrollUnit':        CONST.SCROLL_UNIT,
      'closestCellMargin': CONST.CLOSEST_CELL_MARGIN
  }, ns.VimBinding || {});

  //
  // Extend CodeMirror
  //
  CodeMirror.prototype.save = function() {
    ns.notebook.save_checkpoint();
  };
  var leaveInsertMode = function leaveInsertMode(cm) {
    CodeMirror.Vim.handleKey(cm, '<Esc>');
  };
  var leaveNormalMode = function leaveNormalMode(cm) {
    ns.notebook.command_mode();
    ns.notebook.focus_cell();
  };
  var leaveInsertOrNormalMode = function leaveInsertOrNormalMode(cm) {
    if (cm.state.vim.insertMode || cm.state.vim.visualMode) {
      leaveInsertMode(cm);
    } else {
      leaveNormalMode(cm);
    }
  };
  var insertSoftTab = function insertSoftTab(cm) {
    cm.execCommand('insertSoftTab');
  };

  // Extend Jupyter
  var ORIGINAL = Object.freeze({
    'handle_command_mode': notebook.Notebook.prototype.handle_command_mode,
    'handle_edit_mode':    notebook.Notebook.prototype.handle_edit_mode
  });

  notebook.Notebook.prototype.handle_command_mode = function(cell) {
    if (document.querySelector('.CodeMirror-dialog')) {
      // .CodeMirror-dialog exists, mean that user hit ':' to enter Vim's
      // command mode so do not leave Jupyter's edit mode in this case
      return;
    }
    ORIGINAL.handle_command_mode.call(this, cell);
  };
  notebook.Notebook.prototype.handle_edit_mode = function(cell) {
    // Make sure that the CodeMirror is in Vim's Normal mode
    if (cell.code_mirror) {
      leaveInsertMode(cell.code_mirror);
    }
    ORIGINAL.handle_edit_mode.call(this, cell);
  };
  var getElementBox = function getElementBox(element) {
    // We don't need left/right properties
    return {
      'top':    element.offsetTop,
      'bottom': element.offsetTop + element.clientHeight
    };
  };
  var selectClosestCell = function selectClosestCell(env, direction) {
      var margin = ns.VimBinding.closestCellMargin || CONST.CLOSEST_CELL_MARGIN;
      var site = document.querySelector('#site');
      var elems = env.notebook.get_cell_elements();
      var index = env.notebook.get_selected_index();
      var viewport = {
        'top':    site.scrollTop,
        'bottom': site.scrollTop + (site.clientHeight - site.offsetTop)
      };
      var box = getElementBox(elems[index]);
      if (box.bottom - margin < viewport.top && direction !== 'up') {
        for (var i=index; i<elems.length; i++) {
          var nextBox = getElementBox(elems[i]);
          if (nextBox.top >= viewport.top) {
            env.notebook.select(i);
            return;
          }
        }
      } else if(box.top + margin > viewport.bottom && direction !== 'down') {
        for (var i=index; i>=0; i--) {
          var prevBox = getElementBox(elems[i]);
          if (prevBox.bottom <= viewport.bottom) {
            env.notebook.select(i);
            return;
          }
        }
      }
  };

  // soft-failing shortcut helper - works around the hard-failing shortcut
  // manager in IPython
  var addShortcuts = function addShortcuts(manager, data){
    for(var shortcut in data){
      try { 
        manager.add_shortcut(shortcut, data[shortcut], true);
      } catch(e){
        console.error(
          'Unable to add shortcut for ', shortcut, ' to action ', data[shortcut]
        );
      }
    }
    manager.events.trigger('rebuild.QuickHelp');
  }

  // Register custom actions
  var km = ns.keyboard_manager;
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
      var scrollUnit = ns.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop += scrollUnit;
      if (prev === site.scrollTop) {
        env.notebook.select_next();
      } else {
        selectClosestCell(env, 'down');
      }
      return false
    }
  }, 'scroll-down', 'vim-binding');
  km.actions.register({
    'help': 'scroll up',
    'help_index': 'zz',
    'handler': function(env) {
      var scrollUnit = ns.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop -= scrollUnit;
      if (prev === site.scrollTop) {
        env.notebook.select_prev();
      } else {
        selectClosestCell(env, 'up');
      }
      return false;
    }
  }, 'scroll-up', 'vim-binding');

  // Assign custom Vim-like mappings
  var common_shortcuts = km.get_default_common_shortcuts();
  if ((common_shortcuts.shift || '') === 'jupyter-notebook:ignore') {
    km.edit_shortcuts.clear_shortcuts();
    addShortcuts(km.edit_shortcuts, {
      'ctrl-shift--': 'jupyter-notebook:split-cell-at-cursor',
      'ctrl-shift-subtract': 'jupyter-notebook:split-cell-at-cursor',
      'ctrl-j': 'vim-binding:select-next-cell-and-edit',
      'ctrl-k': 'vim-binding:select-previous-cell-and-edit',
      'alt-enter': 'jupyter-notebook:run-cell-and-insert-below',
      'ctrl-enter': 'jupyter-notebook:run-cell',
      'shift-enter': 'jupyter-notebook:run-cell-and-select-next',
      'shift': 'jupyter-notebook:ignore',
      'ctrl-s': 'jupyter-notebook:save-notebook',
      'ctrl-1': 'jupyter-notebook:change-cell-to-code',
      'ctrl-2': 'jupyter-notebook:change-cell-to-markdown',
      'ctrl-3': 'jupyter-notebook:change-cell-to-raw',
    });

    km.command_shortcuts.clear_shortcuts();
    addShortcuts(km.command_shortcuts, {
      'ctrl-c': 'jupyter-notebook:interrupt-kernel',
      'shift-o': 'jupyter-notebook:insert-cell-above',
      'o': 'jupyter-notebook:insert-cell-below',
      'y,y': 'jupyter-notebook:copy-cell',
      'd,d': 'jupyter-notebook:cut-cell',
      'shift-p': 'jupyter-notebook:paste-cell-above',
      'p': 'jupyter-notebook:paste-cell-below',
      'esc': 'jupyter-notebook:close-pager',
      'q': 'jupyter-notebook:close-pager',
      'enter': 'jupyter-notebook:enter-edit-mode',
      'i': 'jupyter-notebook:enter-edit-mode',
      'j': 'vim-binding:scroll-down',
      'k': 'vim-binding:scroll-up',
      'z,z': 'jupyter-notebook:scroll-cell-center',
      'z,t': 'jupyter-notebook:scroll-cell-top',
      'ctrl-j': 'jupyter-notebook:select-next-cell',
      'ctrl-k': 'jupyter-notebook:select-previous-cell',
      'shift-j': 'jupyter-notebook:extend-marked-cells-below',
      'shift-k': 'jupyter-notebook:extend-marked-cells-above',
      'shift-m': 'jupyter-notebook:merge-cells',
      'g,g': 'vim-binding:select-first-cell',
      'shift-g': 'vim-binding:select-last-cell',
      'ctrl-u': 'jupyter-notebook:scroll-notebook-up',
      'ctrl-d': 'jupyter-notebook:scroll-notebook-down',
      'u': 'jupyter-notebook:undo-cell-deletion',
      'ctrl-1': 'jupyter-notebook:change-cell-to-code',
      'ctrl-2': 'jupyter-notebook:change-cell-to-markdown',
      'ctrl-3': 'jupyter-notebook:change-cell-to-raw',
      'shift-h': 'jupyter-notebook:show-keyboard-shortcuts',
      'shift-l': 'jupyter-notebook:toggle-cell-line-numbers',
      'shift-v': 'jupyter-notebook:toggle-cell-output-collapsed',
      'shift-s': 'jupyter-notebook:toggle-cell-output-scrolled',
      'ctrl-s': 'jupyter-notebook:save-notebook',
      'alt-enter': 'jupyter-notebook:run-cell-and-insert-below',
      'ctrl-enter': 'jupyter-notebook:run-cell',
      'shift-enter': 'jupyter-notebook:run-cell-and-select-next',
      '0,0': 'jupyter-notebook:confirm-restart-kernel',
      '1': 'jupyter-notebook:change-cell-to-heading-1',
      '2': 'jupyter-notebook:change-cell-to-heading-2',
      '3': 'jupyter-notebook:change-cell-to-heading-3',
      '4': 'jupyter-notebook:change-cell-to-heading-4',
      '5': 'jupyter-notebook:change-cell-to-heading-5',
      '6': 'jupyter-notebook:change-cell-to-heading-6',
    });
  } else {
    km.edit_shortcuts.clear_shortcuts();
    addShortcuts(km.edit_shortcuts, {
      'ctrl-shift--': 'ipython.split-cell-at-cursor',
      'ctrl-shift-subtract': 'ipython.split-cell-at-cursor',
      'ctrl-j': 'vim-binding.select-next-cell-and-edit',
      'ctrl-k': 'vim-binding.select-previous-cell-and-edit',
      'alt-enter': 'ipython.execute-and-insert-after',
      'ctrl-enter': 'ipython.execute-in-place',
      'shift-enter': 'ipython.run-select-next',
      'shift': 'ipython.ignore',
      'ctrl-s': 'ipython.save-notebook',
      'ctrl-1': 'ipython.change-selected-cell-to-code-cell',
      'ctrl-2': 'ipython.change-selected-cell-to-markdown-cell',
      'ctrl-3': 'ipython.change-selected-cell-to-raw-cell',
    });

    km.command_shortcuts.clear_shortcuts();
    addShortcuts(km.command_shortcuts, {
      'ctrl-c': 'ipython.interrupt-kernel',
      'shift-o': 'ipython.insert-cell-before',
      'o': 'ipython.insert-cell-after',
      'y,y': 'ipython.copy-selected-cell',
      'd,d': 'ipython.cut-selected-cell',
      'shift-p': 'ipython.paste-cell-before',
      'p': 'ipython.paste-cell-after',
      'esc': 'ipython.close-pager',
      'q': 'ipython.close-pager',
      'enter': 'ipython.enter-edit-mode',
      'i': 'ipython.enter-edit-mode',
      'j': 'vim-binding.scroll-down',
      'k': 'vim-binding.scroll-up',
      'z,z': 'ipython.scroll-cell-center',
      'z,t': 'ipython.scroll-cell-top',
      'ctrl-j': 'ipython.select-next-cell',
      'ctrl-k': 'ipython.select-previous-cell',
      'shift-j': 'ipython.extend-selection-next',
      'shift-k': 'ipython.extend-selection-previous',
      'shift-m': 'ipython.merge-selected-cells',
      'g,g': 'vim-binding.select-first-cell',
      'shift-g': 'vim-binding.select-last-cell',
      'ctrl-u': 'ipython.scroll-up',
      'ctrl-d': 'ipython.scroll-down',
      'u': 'ipython.undo-last-cell-deletion',
      'ctrl-1': 'ipython.change-selected-cell-to-code-cell',
      'ctrl-2': 'ipython.change-selected-cell-to-markdown-cell',
      'ctrl-3': 'ipython.change-selected-cell-to-raw-cell',
      'shift-h': 'ipython.show-keyboard-shortcut-help-dialog',
      'shift-l': 'ipython.toggle-line-number-selected-cell',
      'shift-v': 'ipython.toggle-output-visibility-selected-cell',
      'shift-s': 'ipython.toggle-output-scrolling-selected-cell',
      'ctrl-s': 'ipython.save-notebook',
      'alt-enter': 'ipython.execute-and-insert-after',
      'ctrl-enter': 'ipython.execute-in-place',
      'shift-enter': 'ipython.run-select-next',
      '0,0': 'ipython.restart-kernel',
      '1': 'ipython.change-selected-cell-to-heading-1',
      '2': 'ipython.change-selected-cell-to-heading-2',
      '3': 'ipython.change-selected-cell-to-heading-3',
      '4': 'ipython.change-selected-cell-to-heading-4',
      '5': 'ipython.change-selected-cell-to-heading-5',
      '6': 'ipython.change-selected-cell-to-heading-6',
    });
  }

  var requireCSS = function requireCSS(url) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = require.toUrl(url);
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  var exports = {
    'load_ipython_extension': function() {
      // Include required CSS
      requireCSS('./vim_binding.css');
      // Initialize
      var cm_config = cell.Cell.options_default.cm_config;
      cm_config.keyMap = 'vim';
      cm_config.extraKeys = extend(cm_config.extraKeys || {}, {
        'Esc': leaveInsertOrNormalMode,
        'Tab': insertSoftTab,
        'Ctrl-C': false,  // To enable clipboard copy
      });

      // Apply default CodeMirror config to existing CodeMirror instances
      ns.notebook.get_cells().map(function(cell) {
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
