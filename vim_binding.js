/*
 * vim_binding.js
 *
 * A vim key binding plugin for Jupyter/IPython
 *
 * @author    Alisue <lambdalisue@hashnote.net>
 * @version   2.0.0
 * @license   MIT license
 * @see       http://github.com/lambdalisue/jupyter-vim-binding
 * @copyright 2015-2016, Alisue, hashnote.net
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
  'base/js/keyboard',
  'notebook/js/notebook',
  'notebook/js/cell',
  'notebook/js/codecell',
  'notebook/js/completer',
  'codemirror/keymap/vim'
], function(require, ns, keyboard, notebook, cell, codecell, completer) {
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
  var isInInsertMode = function isInInsertMode(cm) {
    return cm && cm.state.vim.insertMode;
  };

  // Extend Jupyter
  var ORIGINAL = Object.freeze({
    'ShortcutManager': {
      'call_handler': keyboard.ShortcutManager.prototype.call_handler
    },
    'Notebook': {
      'handle_command_mode': notebook.Notebook.prototype.handle_command_mode,
      'handle_edit_mode':    notebook.Notebook.prototype.handle_edit_mode
    },
    'Completer': {
      'keydown':   completer.Completer.prototype.keydown
    },
    'CodeCell': {
      'handle_codemirror_keyevent': codecell.CodeCell.prototype.handle_codemirror_keyevent
    }
  });

  keyboard.ShortcutManager.prototype.call_handler = function(event) {
    // NOTE:
    // It seems at least Jupyter 4.1 in Firefox has a bug in the following
    // internal function and that's why 'ctrl-o,shift-o' type mapping did not
    // work.
    // So override the function and mimic a correct behaviour
    // NOTE:
    // At least in Firefox, event.altKey || event.ctrlKey || ... fail when
    // only a modifier key is pressed (everything become false and only key
    // shows a correct modifier pressed).
    var only_modifier_event = function(event){
      var key = keyboard.inv_keycodes[event.which];
      return (key === 'alt'|| key === 'ctrl'|| key === 'meta'|| key === 'shift');
    };

    this.clearsoon();
    if(only_modifier_event(event)){
      return true;
    }
    return ORIGINAL.ShortcutManager.call_handler.call(this, event);
  };
  notebook.Notebook.prototype.handle_command_mode = function(cell) {
    if (document.querySelector('.CodeMirror-dialog')) {
      // .CodeMirror-dialog exists, mean that user hit ':' to enter Vim's
      // command mode so do not leave Jupyter's edit mode in this case
      return;
    }
    ORIGINAL.Notebook.handle_command_mode.call(this, cell);
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
    ORIGINAL.Notebook.handle_edit_mode.call(this, cell);
  };
  completer.Completer.prototype.keydown = function(event) {
    var keycodes = keyboard.keycodes;
    var code = event.keyCode;
    var ctrl = event.modifiers === undefined ? event.ctrlKey : event.modifiers & Event.CONTROL_MASK;
    if (ctrl && (code === keycodes.n || code === keycodes.p)) {
      // need to do that to be able to move the arrow
      // when on the first or last line ofo a code cell
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
      // Perform original keydown
      ORIGINAL.Completer.keydown.call(this, event);
    }
  };
  codecell.CodeCell.prototype.handle_codemirror_keyevent = function(editor, event) {
    if (!this.completer.visible) {
      // Completer is not shown so check if <C-n> or <C-p> is pressed
      var keycodes = keyboard.keycodes;
      var code = event.keyCode;
      var ctrl = event.modifiers === undefined ? event.ctrlKey : event.modifiers & Event.CONTROL_MASK;

      if (event.type === 'keydown' && (ctrl && code === keycodes.g)) {
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
      } else if (event.type === 'keydown' && (ctrl && (code === keycodes.n || code === keycodes.p))) {
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
    return ORIGINAL.CodeCell.handle_codemirror_keyevent.call(this, editor, event);
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
          var cell = env.notebook.get_selected_cell();
          if (cell && isInInsertMode(cell.code_mirror)) {
            // CodeMirror is in InsertMode, prevent any Jupyter action in
            // InsertMode and let CodeMirror to do things
            return;
          }
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
    'help': 'scroll notebook up',
    'handler': function(env, event) {
      // Page scroll is a bit buggy and slow so replace it to faster one.
      // If the scroll-speed is fast enough, I think we actually don't need
      // to scroll exactly one page
      var repeat = 20;
      while (repeat) {
        km.actions.call('vim-binding-normal:scroll-up', event, env);
        repeat--;
      }
    }
  }, 'scroll-notebook-up', 'vim-binding-normal');
  km.actions.register({
    'help': 'scroll notebook down',
    'handler': function(env, event) {
      // Page scroll is a bit buggy and slow so replace it to faster one.
      // If the scroll-speed is fast enough, I think we actually don't need
      // to scroll exactly one page
      var repeat = 20;
      while (repeat) {
        km.actions.call('vim-binding-normal:scroll-down', event, env);
        repeat--;
      }
    }
  }, 'scroll-notebook-down', 'vim-binding-normal');
  km.actions.register({
    'help': 'scroll up',
    'handler': function(env, event) {
      var scrollUnit = ns.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop -= scrollUnit;
    }
  }, 'scroll-up', 'vim-binding-normal');
  km.actions.register({
    'help': 'scroll down',
    'handler': function(env, event) {
      var scrollUnit = ns.VimBinding.scrollUnit || defaultConfig.scrollUnit;
      var site = document.querySelector('#site');
      var prev = site.scrollTop;
      site.scrollTop += scrollUnit;
    }
  }, 'scroll-down', 'vim-binding-normal');
  km.actions.register({
    'help': 'select the first cell',
    'handler': function(env, event) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[0].focus_cell();
      }
    }
  }, 'select-first-cell', 'vim-binding-normal');
  km.actions.register({
    'help': 'select the last cell',
    'handler': function(env, event) {
      var cells = env.notebook.get_cells();
      if (cells.length > 0) {
        cells[cells.length - 1].focus_cell();
      }
    }
  }, 'select-last-cell', 'vim-binding-normal');
  km.actions.register({
    'help': 'expand output',
    'handler': function(env, event) {
      env.notebook.expand_output();
    }
  }, 'expand-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'expand all output',
    'handler': function(env, event) {
      env.notebook.expand_all_output();
    }
  }, 'expand-all-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'collapse output',
    'handler': function(env, event) {
      env.notebook.collapse_output();
    }
  }, 'collapse-output', 'vim-binding-normal');
  km.actions.register({
    'help': 'collapse all output',
    'handler': function(env, event) {
      env.notebook.collapse_all_output();
    }
  }, 'collapse-all-output', 'vim-binding-normal');
  // vim-binding original actions (Edit mode)
  km.actions.register({
    'help': 'scroll notebook up',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      km.actions.call('vim-binding-normal:scroll-notebook-up', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-notebook-up', 'vim-binding');
  km.actions.register({
    'help': 'scroll notebook down',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      km.actions.call('vim-binding-normal:scroll-notebook-down', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-notebook-down', 'vim-binding');
  km.actions.register({
    'help': 'scroll up',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      km.actions.call('vim-binding-normal:scroll-up', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-up', 'vim-binding');
  km.actions.register({
    'help': 'scroll down',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      km.actions.call('vim-binding-normal:scroll-down', event, env);
      env.notebook.edit_mode();
    }
  }, 'scroll-down', 'vim-binding');
  km.actions.register({
    'help': 'select the first cell',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:select-first-cell', event, env);
      env.notebook.edit_mode();
    }
  }, 'select-first-cell', 'vim-binding');
  km.actions.register({
    'help': 'select the last cell',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:select-last-cell', event, env);
      env.notebook.edit_mode();
    }
  }, 'select-last-cell', 'vim-binding');
  km.actions.register({
    'help': 'expand output',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:expand-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'expand-output', 'vim-binding');
  km.actions.register({
    'help': 'expand all output',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:expand-all-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'expand-all-output', 'vim-binding');
  km.actions.register({
    'help': 'collapse output',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:collapse-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'collapse-output', 'vim-binding');
  km.actions.register({
    'help': 'collapse all output',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      km.actions.call('vim-binding-normal:collapse-all-output', event, env);
      env.notebook.edit_mode();
    }
  }, 'collapse-all-output', 'vim-binding');
  // jupyter-notebook actions which should call command_mode but edit_mode
  km.actions.register({
    'help': 'extend selected cells above',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      return km.actions.call(
        'jupyter-notebook:extend-selection-above', event, env
      );
    }
  }, 'extend-selection-above', 'vim-binding');
  km.actions.register({
    'help': 'extend selected cells below',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
      env.notebook.command_mode();
      return km.actions.call(
        'jupyter-notebook:extend-selection-below', event, env
      );
    }
  }, 'extend-selection-below', 'vim-binding');
  km.actions.register({
    'help': 'start completion',
    'handler': function(env, event) {
      var cell = env.notebook.get_selected_cell();
      if (cell && isInInsertMode(cell.code_mirror)) {
        return;
      }
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
    'ctrl-k': 'vim-binding:select-previous-cell', // require C-k unmapping in CodeMirror
    'ctrl-j': 'vim-binding:select-next-cell',     // require C-j unmapping in CodeMirror
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
    // Defined in searchandreplace.js
    // https://github.com/jupyter/notebook/blob/4.x/notebook/static/notebook/js/searchandreplace.js#L375
    'ctrl-o,/': 'jupyter-notebook:find-and-replace',
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
    'cmdtrl-s': 'jupyter-notebook:save-notebook',
    'shift-r': 'jupyter-notebook:rename-notebook',
    'cmdtrl-shift-p': 'jupyter-notebook:show-command-palette',
    // Repeat operations
    'ctrl-y': 'vim-binding-normal:scroll-up',
    'ctrl-e': 'vim-binding-normal:scroll-down',
    'k': 'jupyter-notebook:select-previous-cell',
    'j': 'jupyter-notebook:select-next-cell',
    'ctrl-k': 'jupyter-notebook:select-previous-cell',
    'ctrl-j': 'jupyter-notebook:select-next-cell',
    'shift-k': 'jupyter-notebook:extend-selection-above',
    'shift-j': 'jupyter-notebook:extend-selection-below',
    'ctrl-shift-k': 'jupyter-notebook:extend-selection-above',
    'ctrl-shift-j': 'jupyter-notebook:extend-selection-below',
    'ctrl-u': 'vim-binding-normal:scroll-notebook-up',
    'ctrl-d': 'vim-binding-normal:scroll-notebook-down',
    'ctrl-shift-u': 'vim-binding-normal:scroll-notebook-up',
    'ctrl-shift-d': 'vim-binding-normal:scroll-notebook-down',
    // Onetime operations
    'g,g': 'vim-binding-normal:select-first-cell',
    'shift-g': 'vim-binding-normal:select-last-cell',
    'o': 'jupyter-notebook:insert-cell-below',
    'ctrl-o': 'jupyter-notebook:insert-cell-below',
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
    'z,a': 'jupyter-notebook:toggle-cell-output-collapsed',
    'z,shift-a': 'jupyter-notebook:toggle-all-cells-output-collapsed',
    'z,m': 'vim-binding-normal:collapse-output',
    'z,shift-m': 'vim-binding-normal:collapse-all-output',
    'z,r': 'vim-binding-normal:expand-output',
    'z,shift-r': 'vim-binding-normal:expand-all-output',
    'shift-h': 'jupyter-notebook:show-keyboard-shortcuts',
    'shift-l': 'jupyter-notebook:toggle-cell-line-numbers',
    'shift-v': 'jupyter-notebook:toggle-cell-output-collapsed',
    'shift-s': 'jupyter-notebook:toggle-cell-output-scrolled',
    'cmdtrl-c': 'jupyter-notebook:interrupt-kernel',
    // Defined in searchandreplace.js
    // https://github.com/jupyter/notebook/blob/4.x/notebook/static/notebook/js/searchandreplace.js#L375
    '/': 'jupyter-notebook:find-and-replace',
  });

  // motion commands should jump to the next or previous cell
  // hence we patch CodeMirror's moveByLines method
  var Pos = CodeMirror.Pos;
  // method is based on moveByLines from CodeMirror's Vim mode
  // @see: https://github.com/codemirror/CodeMirror/blob/master/keymap/vim.js#L1677 
  var moveByLinesOrCell = function moveByLinesOrCell(cm, head, motionArgs, vim){
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
    var repeat = motionArgs.repeat + (motionArgs.repeatOffset || 0);
    var line = motionArgs.forward ? cur.line + repeat : cur.line - repeat;
    var first = cm.firstLine();
    var last = cm.lastLine();
    // Vim cancels linewise motions that start on an edge and move beyond
    // that edge. It does not cancel motions that do not start on an edge.

    // JUPYTER PATCH BEGIN
    // here we insert the jumps to the next cells
    if(line < first || line > last){
      var current_cell = ns.notebook.get_selected_cell();
      var key = '';
      if (motionArgs.forward) {
        ns.notebook.select_next();
        key = 'j';
      } else {
        ns.notebook.select_prev();
        key = 'k';
      }
      ns.notebook.edit_mode();
      var new_cell = ns.notebook.get_selected_cell();
      if (current_cell !== new_cell && !!new_cell) {
        // The selected cell has moved. Move the cursor at very end
        var cm2 = new_cell.code_mirror;
        cm2.setCursor({
          ch:   cm2.getCursor().ch,
          line: motionArgs.forward ? cm2.firstLine() : cm2.lastLine()
        });
        // Perform remaining repeats
        repeat = motionArgs.forward ? line - last : first - line;
        repeat -= 1;
        if (Math.abs(repeat) > 0) {
          CodeMirror.Vim.handleKey(cm2, repeat + key);  // e.g. 4j, 6k, etc.
        }
      }
      return;
    }
    // JUPYTER PATCH END

    if (motionArgs.toFirstChar){
      endCh = findFirstNonWhiteSpaceCharacter(cm.getLine(line));
      vim.lastHPos = endCh;
    }
    vim.lastHSPos = cm.charCoords(Pos(line, endCh), 'div').left;
    return Pos(line, endCh);
  };
  var moveByDisplayLinesOrCell = function moveByDisplayLinesOrCell(cm, head, motionArgs, vim) {
    var cur = head;
    switch (vim.lastMotion) {
      case this.moveByDisplayLines:
      case this.moveByScroll:
      case this.moveByLines:
      case this.moveToColumn:
      case this.moveToEol:
      // JUPYTER PATCH
      case moveByDisplayLinesOrCell:
        break;
      default:
        vim.lastHSPos = cm.charCoords(cur, 'div').left;
    }
    var repeat = motionArgs.repeat;
    var res = cm.findPosV(
      cur, (motionArgs.forward ? repeat : -repeat), 'line', vim.lastHSPos
    );

    // JUPYTER PATCH BEGIN
    if (res.hitSide) {
      var current_cell = ns.notebook.get_selected_cell();
      var key = '';
      if (motionArgs.forward) {
        ns.notebook.select_next();
        key = 'gj';
      } else {
        ns.notebook.select_prev();
        key = 'gk';
      }
      ns.notebook.edit_mode();
      var new_cell = ns.notebook.get_selected_cell();
      if (current_cell !== new_cell && !!new_cell) {
        // The selected cell has moved. Move the cursor at very end
        var cm2 = new_cell.code_mirror;
        cm2.setCursor({
          ch:   cm2.getCursor().ch,
          line: motionArgs.forward ? cm2.firstLine() : cm2.lastLine()
        });
        // Perform remaining repeats
        repeat = repeat - Math.abs(res.line - cur.line);
        repeat -= 1;
        if (repeat > 0) {
          CodeMirror.Vim.handleKey(cm2, repeat + key);  // e.g. 4j, 6k, etc.
        }
        return;
      }
    }
    // JUPYTER PATCH END

    if (res.hitSide) {
      if (motionArgs.forward) {
        var lastCharCoords = cm.charCoords(res, 'div');
        var goalCoords = { top: lastCharCoords.top + 8, left: vim.lastHSPos };
        res = cm.coordsChar(goalCoords, 'div');
      } else {
        var resCoords = cm.charCoords(Pos(cm.firstLine(), 0), 'div');
        resCoords.left = vim.lastHSPos;
        res = cm.coordsChar(resCoords, 'div');
      }
    }
    vim.lastHPos = res.ch;
    return res;
  };

  // we remap the motion keys with our patched method
  CodeMirror.Vim.defineMotion("moveByLinesOrCell", moveByLinesOrCell);
  CodeMirror.Vim.defineMotion("moveByDisplayLinesOrCell", moveByDisplayLinesOrCell);
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-k)", "motion", "moveByLinesOrCell",
    {forward: false, linewise: true },
    {context: "normal"}
  ); 
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-j)", "motion", "moveByLinesOrCell",
    {forward: true, linewise: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-gk)", "motion", "moveByDisplayLinesOrCell",
    {forward: false },
    {context: "normal"}
  ); 
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-gj)", "motion", "moveByDisplayLinesOrCell",
    {forward: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-+)", "motion", "moveByLinesOrCell",
    {forward: true, toFirstChar: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding--)", "motion", "moveByLinesOrCell",
    {forward: false, toFirstChar: true },
    {context: "normal"}
  );
  CodeMirror.Vim.mapCommand(
    "<Plug>(vim-binding-_)", "motion", "moveByLinesOrCell",
    {forward: true, toFirstChar: true, repeatOffset: -1 },
    {context: "normal"}
  );
  CodeMirror.Vim.map('k', '<Plug>(vim-binding-k)', 'normal');
  CodeMirror.Vim.map('j', '<Plug>(vim-binding-j)', 'normal');
  CodeMirror.Vim.map('gk', '<Plug>(vim-binding-gk)', 'normal');
  CodeMirror.Vim.map('gj', '<Plug>(vim-binding-gj)', 'normal');
  CodeMirror.Vim.map('+', '<Plug>(vim-binding-+)', 'normal');
  CodeMirror.Vim.map('-', '<Plug>(vim-binding--)', 'normal');
  CodeMirror.Vim.map('_', '<Plug>(vim-binding-_)', 'normal');
  CodeMirror.Vim.map('<C-k>', '<Nop>', 'normal');
  CodeMirror.Vim.map('<C-j>', '<Nop>', 'normal');

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
