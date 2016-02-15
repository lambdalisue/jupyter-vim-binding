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
  var wasInInsertBeforeBlur = false;
  window.addEventListener('blur', function() {
    var cell = ns.notebook.get_selected_cell();
    if (cell && cell.code_mirror) {
      var cm = cell.code_mirror;
      wasInInsertBeforeBlur = cm.state.vim.insertMode;
    }
  });
  notebook.Notebook.prototype.handle_edit_mode = function(cell) {
    // Make sure that the CodeMirror is in Vim's Normal mode
    if (cell.code_mirror && !wasInInsertBeforeBlur) {
      leaveInsertMode(cell.code_mirror);
    }
    wasInInsertBeforeBlur = false;
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

  var km = ns.keyboard_manager;
  // Register altrenative actions of jupyter-notebook
  for (var name in km.actions._actions) {
    if (name.match(/^jupyter-notebook:/)) {
      var action = (function() {
        var action = extend({}, km.actions._actions[name]);
        var handler = action.handler;
        action.handler = function(env, event) {
          var restore = env.notebook.mode === 'edit';
          env.notebook.command_mode();
          var result = handler(env, event);
          if (restore) env.notebook.edit_mode();
          return result;
        };
        return action;
      })();
      km.actions.register(
        action,
        name.replace(/^jupyter-notebook:/, ''),
        'vim-binding'
      );
    }
  }
  // vin-binding original actions (Command mode)
  km.actions.register({
    'help': 'scroll up',
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
    }
  }, 'scroll-up', 'vim-binding-normal');
  km.actions.register({
    'help': 'scroll down',
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
    }
  }, 'scroll-down', 'vim-binding-normal');
  km.actions.register({
    'help': 'select the first cell',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[0].focus_cell();
      }
    }
  }, 'select-first-cell', 'vim-binding-normal');
  km.actions.register({
    'help': 'select the last cell',
    'handler': function(env) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[cells.length - 1].focus_cell();
      }
    }
  }, 'select-last-cell', 'vim-binding-normal');
  km.actions.register({
    'help': 'expand output',
    'handler': function(env) {
      env.notebook.expand_output();
    }
  }, 'expand-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'expand all output',
    'handler': function(env) {
      env.notebook.expand_all_output();
    }
  }, 'expand-all-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'collapse output',
    'handler': function(env) {
      env.notebook.collapse_output();
    }
  }, 'collapse-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'collapse all output',
    'handler': function(env) {
      env.notebook.collapse_all_output();
    }
  }, 'collapse-all-output', 'vim-binding-normal');
  // vim-binding original actions (Edit mode)
  km.actions.register({
    'help': 'scroll up',
    'handler': function(env, event) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:scroll-up', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-up', 'vim-binding');
  km.actions.register({
    'help': 'scroll down',
    'handler': function(env, event) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:scroll-down', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-down', 'vim-binding');
  km.actions.register({
    'help': 'select the first cell',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:select-first-cell', event, env);
      env.notebook.edit_mode();
    }
  }, 'select-first-cell', 'vim-binding');
  km.actions.register({
    'help': 'select the last cell',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:select-last-cell', event, env);
      env.notebook.edit_mode();
    }
  }, 'select-last-cell', 'vim-binding');
  km.actions.register({
    'help': 'expand output',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:expand-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'expand-output', 'vim-binding');
  km.actions.register({
    'help': 'expand all output',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:expand-all-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'expand-all-output', 'vim-binding');
  km.actions.register({
    'help': 'collapse output',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:collapse-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'collapse-output', 'vim-binding');
  km.actions.register({
    'help': 'collapse all output',
    'handler': function(env) {
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:collapse-all-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'collapse-all-output', 'vim-binding');
  // jupyter-notebook actions which should call command_mode but edit_mode
  km.actions.register({
    'help': 'extend selected cells above',
    'handler': function(env, event) {
      env.notebook.command_mode();
      return km.actions.call(
        'jupyter-notebook:extend-selection-above', event, env
      );
    }
  }, 'extend-selection-above', 'vim-binding');
  km.actions.register({
    'help': 'extend selected cells below',
    'handler': function(env, event) {
      env.notebook.command_mode();
      return km.actions.call(
        'jupyter-notebook:extend-selection-below', event, env
      );
    }
  }, 'extend-selection-below', 'vim-binding');

  // Assign custom Vim-like mappings
  var common_shortcuts = km.get_default_common_shortcuts();
  km.edit_shortcuts.clear_shortcuts();
  addShortcuts(km.edit_shortcuts, {
    'F1': 'vim-binding:show-keyboard-shortcuts',
    'shift': 'vim-binding:ignore',
    'alt-enter': 'vim-binding:run-cell-and-insert-below',
    'shift-enter': 'vim-binding:run-cell-and-select-next',
    'cmdtrl-enter': 'vim-binding:run-cell',
    'cmdtrl-shift-enter': 'vim-binding:run-all-cells',
    'cmdtrl-1': 'vim-binding:change-cell-to-code',
    'cmdtrl-2': 'vim-binding:change-cell-to-markdown',
    'cmdtrl-3': 'vim-binding:change-cell-to-raw',
    'cmdtrl-shift-p': 'jupyter-notebook:show-command-palette',
    // Repeat operations
    'ctrl-y': 'vim-binding:scroll-up',
    'ctrl-e': 'vim-binding:scroll-down',
    'ctrl-k': 'vim-binding:select-previous-cell',
    'ctrl-j': 'vim-binding:select-next-cell',
    'ctrl-shift-k': 'vim-binding:extend-selection-above',
    'ctrl-shift-j': 'vim-binding:extend-selection-below',
    'ctrl-shift-u': 'vim-binding:scroll-notebook-up',
    'ctrl-shift-d': 'vim-binding:scroll-notebook-down',
    // Onetime operations (<C-o> is a prefix like <C-o> in Vim's insert mode)
    'ctrl-o,g,g': 'vim-binding:select-first-cell',
    'ctrl-o,shift-g': 'vim-binding:select-last-cell',
    'ctrl-o,o': 'vim-binding:insert-cell-below',
    'ctrl-o,shift-o': 'vim-binding:insert-cell-above',
    'ctrl-o,z,z': 'vim-binding:scroll-cell-center',
    'ctrl-o,z,t': 'vim-binding:scroll-cell-top',
    'ctrl-o,shift-m': 'vim-binding:merge-cells',
    'ctrl-o,-': 'vim-binding:split-cell-at-cursor',
    'ctrl-o,subtract': 'vim-binding:split-cell-at-cursor',
    'ctrl-o,y,y': 'vim-binding:copy-cell',
    'ctrl-o,d,d': 'vim-binding:cut-cell',
    'ctrl-o,shift-p': 'vim-binding:paste-cell-above',
    'ctrl-o,p': 'vim-binding:paste-cell-below',
    'ctrl-o,u': 'vim-binding:undo-cell-deletion',
    'ctrl-o,/': 'jupyter-notebook:find-and-replace',
    'ctrl-o,z,a': 'vim-binding:toggle-cell-output-collapsed',
    'ctrl-o,z,shift-a': 'vim-binding:toggle-all-cells-output-collapsed',
    'ctrl-o,z,m': 'vim-binding:collapse-output',
    'ctrl-o,z,shift-m': 'vim-binding:collapse-all-output',
    'ctrl-o,z,r': 'vim-binding:expand-output',
    'ctrl-o,z,shift-r': 'vim-binding:expand-all-output',
    'ctrl-o,shift-h': 'vim-binding:show-keyboard-shortcuts',
    'ctrl-o,shift-l': 'vim-binding:toggle-cell-line-numbers',
    'ctrl-o,shift-v': 'vim-binding:toggle-cell-output-collapsed',
    'ctrl-o,shift-s': 'vim-binding:toggle-cell-output-scrolled',
    'ctrl-o,ctrl-c': 'vim-binding:interrupt-kernel',
  });

  km.command_shortcuts.clear_shortcuts();
  addShortcuts(km.command_shortcuts, {
    'F1': 'jupyter-notebook:show-keyboard-shortcuts',
    'q': 'jupyter-notebook:close-pager',
    'esc': 'jupyter-notebook:close-pager',
    'i': 'jupyter-notebook:enter-edit-mode',
    'enter': 'jupyter-notebook:enter-edit-mode',
    'alt-enter': 'jupyter-notebook:run-cell-and-insert-below',
    'shift-enter': 'jupyter-notebook:run-cell-and-select-next',
    'cmdtrl-enter': 'jupyter-notebook:run-cell',
    'cmdtrl-shift-enter': 'jupyter-notebook:run-all-cells',
    'cmdtrl-1': 'jupyter-notebook:change-cell-to-code',
    'cmdtrl-2': 'jupyter-notebook:change-cell-to-markdown',
    'cmdtrl-3': 'jupyter-notebook:change-cell-to-raw',
    '0,0': 'jupyter-notebook:confirm-restart-kernel',
    '1': 'jupyter-notebook:change-cell-to-heading-1',
    '2': 'jupyter-notebook:change-cell-to-heading-2',
    '3': 'jupyter-notebook:change-cell-to-heading-3',
    '4': 'jupyter-notebook:change-cell-to-heading-4',
    '5': 'jupyter-notebook:change-cell-to-heading-5',
    '6': 'jupyter-notebook:change-cell-to-heading-6',
    'ctrl-s': 'jupyter-notebook:save-notebook',
    'shift-r': 'jupyter-notebook:rename-notebook',
    'cmdtrl-shift-p': 'jupyter-notebook:show-command-palette',
    // Repeat operations
    'ctrl-y': 'jupyter-notebook:scroll-up',
    'ctrl-e': 'jupyter-notebook:scroll-down',
    'k': 'jupyter-notebook:select-previous-cell',
    'j': 'jupyter-notebook:select-next-cell',
    'ctrl-k': 'jupyter-notebook:select-previous-cell',
    'ctrl-j': 'jupyter-notebook:select-next-cell',
    'shift-k': 'jupyter-notebook:extend-selection-above',
    'shift-j': 'jupyter-notebook:extend-selection-below',
    'ctrl-shift-k': 'jupyter-notebook:extend-selection-above',
    'ctrl-shift-j': 'jupyter-notebook:extend-selection-below',
    'ctrl-u': 'jupyter-notebook:scroll-notebook-up',
    'ctrl-d': 'jupyter-notebook:scroll-notebook-down',
    'ctrl-shift-u': 'jupyter-notebook:scroll-notebook-up',
    'ctrl-shift-d': 'jupyter-notebook:scroll-notebook-down',
    // Onetime operations
    'g,g': 'vim-binding-normal:select-first-cell',
    'shift-g': 'vim-binding-normal:select-last-cell',
    'o': 'jupyter-notebook:insert-cell-below',
    'cmdtrl-o': 'jupyter-notebook:insert-cell-below',
    'z,z': 'jupyter-notebook:scroll-cell-center',
    'z,t': 'jupyter-notebook:scroll-cell-top',
    'shift-m': 'jupyter-notebook:merge-cells',
    '-': 'jupyter-notebook:split-cell-at-cursor',
    'subtract': 'jupyter-notebook:split-cell-at-cursor',
    'y,y': 'jupyter-notebook:copy-cell',
    'd,d': 'jupyter-notebook:cut-cell',
    'shift-p': 'jupyter-notebook:paste-cell-above',
    'p': 'jupyter-notebook:paste-cell-below',
    'u': 'jupyter-notebook:undo-cell-deletion',
    '/': 'jupyter-notebook:find-and-replace',
    'z,a': 'jupyter-notebook:toggle-cell-output-collapsed',
    'z,shift-a': 'jupyter-notebook:toggle-all-cells-output-collapsed',
    'z,m': 'jupyter-notebook:collapse-output',
    'z,shift-m': 'jupyter-notebook:collapse-all-output',
    'z,r': 'jupyter-notebook:expand-output',
    'z,shift-r': 'jupyter-notebook:expand-all-output',
    'shift-h': 'jupyter-notebook:show-keyboard-shortcuts',
    'shift-l': 'jupyter-notebook:toggle-cell-line-numbers',
    'shift-v': 'jupyter-notebook:toggle-cell-output-collapsed',
    'shift-s': 'jupyter-notebook:toggle-cell-output-scrolled',
    'ctrl-c': 'vim-binding:interrupt-kernel',
  });

  // motion commands should jump to the next or previous cell
  // hence we patch CodeMirror's moveByLines method
  var Pos = CodeMirror.Pos;
  // method is based on moveByLines from CodeMirror's Vim mode
  // @see: https://github.com/codemirror/CodeMirror/blob/master/keymap/vim.js#L1677 
  var moveByLinesOrCell = function(cm, head, motionArgs, vim){
      var cur = head;
      var endCh = cur.ch;
      // TODO: these references will be undefined
      // Depending what our last motion was, we may want to do different
      // things. If our last motion was moving vertically, we want to
      // preserve the HPos from our last horizontal move.  If our last motion
      // was going to the end of a line, moving vertically we should go to
      // the end of the line, etc.
      switch (vim.lastMotion) {
          case this.moveByLines:
          case this.moveByDisplayLines:
          case this.moveByScroll:
          case this.moveToColumn:
          case this.moveToEol:
              // JUPYTER PATCH: add our custom method to the motion cases
          case moveByLinesOrCell:
              endCh = vim.lastHPos;
              break;
          default:
              vim.lastHPos = endCh;
      }
      var repeat = motionArgs.repeat+(motionArgs.repeatOffset||0);
      var line = motionArgs.forward ? cur.line + repeat : cur.line - repeat;
      var first = cm.firstLine();
      var last = cm.lastLine();
      // Vim cancels linewise motions that start on an edge and move beyond
      // that edge. It does not cancel motions that do not start on an edge.

      // JUPYTER PATCH BEGIN
      // here we insert the jumps to the next cells
      if(line < first || line > last){
          var current_cell = ns.notebook.get_selected_cell();
          var diff = 0;
          var key = '';
          if (line < first) {
              ns.notebook.select_prev();
              diff = first - line;
              key = 'k';
          } else if(line > last) {
              ns.notebook.select_next()
              diff = line - last;
              key = 'j';
          }
          ns.notebook.edit_mode();
          // send remaining lines to next/prev cm instance
          var new_cell = ns.notebook.get_selected_cell();
          diff--; // we already jump one line
          if(current_cell != new_cell && !!new_cell){
              // reset cursor to top or end line 
              var cm2 = new_cell.code_mirror;
              cm2.setCursor({
                ch: cm2.getCursor().ch,
                line: (line < first) ? cm2.lastLine(): cm2.firstLine()
              });
              if(diff > 0){
                  var seq = "" + diff  + key;
                  for(var i=0; i<seq.length;i++){
                      CodeMirror.Vim.handleKey(cm2, seq[i]);
                  };
              }
          }
          return;
      }
      // JUPYTER PATCH END

      if (motionArgs.toFirstChar){
          endCh=findFirstNonWhiteSpaceCharacter(cm.getLine(line));
          vim.lastHPos = endCh;
      }
      vim.lastHSPos = cm.charCoords(Pos(line, endCh),'div').left;
      return Pos(line, endCh);
  };

  // we remap the motion keys with our patched method
  CodeMirror.Vim.defineMotion("moveByLinesOrCell", moveByLinesOrCell);
  CodeMirror.Vim.mapCommand(
    "k", "motion", "moveByLinesOrCell",
    {forward: false, linewise: true },
    {context: "normal"}
  ); 
  CodeMirror.Vim.mapCommand(
    "j", "motion", "moveByLinesOrCell",
    {forward: true, linewise: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "+", "motion", "moveByLinesOrCell",
    {forward: true, toFirstChar: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "-", "motion", "moveByLinesOrCell",
    {forward: false, toFirstChar: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "_", "motion", "moveByLinesOrCell",
    {forward: true, toFirstChar: true, repeatOffset: -1 },
    {context: "normal"}
  );

  var requireCSS = function(url) {
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
        'Esc': leaveInsertMode,
        'Shift-Esc': leaveNormalMode,
        'Ctrl-C': false,  // To enable clipboard copy
      });

      // Apply default CodeMirror config to existing CodeMirror instances
      ns.notebook.get_cells().map(function(cell) {
        var cm = cell.code_mirror;
        if (cm) {
          cm.setOption('keyMap', cm_config.keyMap);
          cm.setOption('extraKeys', extend(
            cm.getOption('extraKeys') || {},
            cm_config.extraKeys
          ));
        }
      });
    },
  };
  return exports;
});
