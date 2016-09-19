// NOTE:
// The default 'codecell.js' does not support <C-n>/<C-p> completion and
// <C-g> tooltip so monkey-patch the module to support that keys
define([
  'jquery',
  'base/js/namespace',
], function($, ns) {
  "use strict";
  var undefined;
  var exports = {};
  var actions = ns.keyboard_manager.actions;
  var Original = undefined;

  var isInInsertMode = function isInInsertMode(cm) {
    return cm && cm.state.vim.insertMode;
  };

  exports.attach = function(params) {
    if (Original !== undefined) {
      return;
    }
    Original = $.extend(actions._actions);
    // Register altrenative actions of jupyter-notebook
    for (var name in actions._actions) {
      if (name.match(/^jupyter-notebook:/)) {
        var action = (function() {
          var action = $.extend({}, actions._actions[name]);
          var handler = action.handler;
          action.handler = function(env, event) {
            var cell = env.notebook.get_selected_cell();
            if (cell && (isInInsertMode(cell.code_mirror))) {
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
        actions.register(
          action,
          name.replace(/^jupyter-notebook:/, ''),
          'vim-binding'
        );
      }
    }

    // vim-binding original actions (Insert mode)
    actions.register({
      'help': 'run cell, select below',
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-cell-and-select-next', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-cell-and-select-next', 'vim-binding');

    actions.register({
      'help': 'run cell, select below',
      'handler': function(env, event) {
        env.notebook.command_mode();
        if (env.notebook.get_selected_cell().cell_type == 'markdown') {
            actions.call('jupyter-notebook:run-cell-and-select-next', event, env);
        } else {
            actions.call('jupyter-notebook:select-next-cell', event, env);
        }
        env.notebook.edit_mode();
      }
    }, 'select-next-cell-eval-markdown', 'vim-binding');

    actions.register({
      'help': 'run cell, select above',
      'handler': function(env, event) {
        env.notebook.command_mode();
        if (env.notebook.get_selected_cell().cell_type == 'markdown') {
            actions.call('jupyter-notebook:run-cell', event, env);
        }
        actions.call('jupyter-notebook:select-previous-cell', event, env);
        env.notebook.edit_mode();
      }
    }, 'select-previous-cell-eval-markdown', 'vim-binding');

    actions.register({
      'help': 'run selected cells',
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-cell', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-cell', 'vim-binding');

    actions.register({
      'help': 'run cell, insert below',
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-cell-and-insert-below', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-cell-and-insert-below', 'vim-binding');

    actions.register({
      'help': 'run all cells',
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-all-cells', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-all-cells', 'vim-binding');

    actions.register({
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-all-cells-above', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-all-cells-above', 'vim-binding');

    actions.register({
      'handler': function(env, event) {
        env.notebook.command_mode();
        actions.call('jupyter-notebook:run-all-cells-below', event, env);
        env.notebook.edit_mode();
      }
    }, 'run-all-cells-below', 'vim-binding');

    // vin-binding original actions (Command mode)
    actions.register({
      'help': 'scroll notebook up',
      'handler': function(env, event) {
        // Page scroll is a bit buggy and slow so replace it to faster one.
        // If the scroll-speed is fast enough, I think we actually don't need
        // to scroll exactly one page
        var repeat = 20;
        while (repeat) {
          actions.call('vim-binding-normal:scroll-up', event, env);
          repeat--;
        }
      }
    }, 'scroll-notebook-up', 'vim-binding-normal');

    actions.register({
      'help': 'scroll notebook down',
      'handler': function(env, event) {
        // Page scroll is a bit buggy and slow so replace it to faster one.
        // If the scroll-speed is fast enough, I think we actually don't need
        // to scroll exactly one page
        var repeat = 20;
        while (repeat) {
          actions.call('vim-binding-normal:scroll-down', event, env);
          repeat--;
        }
      }
    }, 'scroll-notebook-down', 'vim-binding-normal');

    actions.register({
      'help': 'scroll up',
      'handler': function(env, event) {
        var scrollUnit = params.scroll_unit;
        var site = document.querySelector('#site');
        var prev = site.scrollTop;
        site.scrollTop -= scrollUnit;
      }
    }, 'scroll-up', 'vim-binding-normal');

    actions.register({
      'help': 'scroll down',
      'handler': function(env, event) {
        var scrollUnit = params.scroll_unit;
        var site = document.querySelector('#site');
        var prev = site.scrollTop;
        site.scrollTop += scrollUnit;
      }
    }, 'scroll-down', 'vim-binding-normal');

    actions.register({
      'help': 'select the first cell',
      'handler': function(env, event) {
        var cells = env.notebook.get_cells();
        if (cells.length > 0) {
          cells[0].focus_cell();
        }
      }
    }, 'select-first-cell', 'vim-binding-normal');

    actions.register({
      'help': 'select the last cell',
      'handler': function(env, event) {
        var cells = env.notebook.get_cells();
        if (cells.length > 0) {
          cells[cells.length - 1].focus_cell();
        }
      }
    }, 'select-last-cell', 'vim-binding-normal');

    actions.register({
      'help': 'expand output',
      'handler': function(env, event) {
        env.notebook.expand_output();
      }
    }, 'expand-output', 'vim-binding-normal');

    actions.register({
      'help': 'expand all output',
      'handler': function(env, event) {
        env.notebook.expand_all_output();
      }
    }, 'expand-all-output', 'vim-binding-normal');

    actions.register({
      'help': 'collapse output',
      'handler': function(env, event) {
        env.notebook.collapse_output();
      }
    }, 'collapse-output', 'vim-binding-normal');

    actions.register({
      'help': 'collapse all output',
      'handler': function(env, event) {
        env.notebook.collapse_all_output();
      }
    }, 'collapse-all-output', 'vim-binding-normal');


    // vim-binding original actions (Edit mode)
    actions.register({
      'help': 'scroll notebook up',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        actions.call('vim-binding-normal:scroll-notebook-up', event, env);
        env.notebook.edit_mode();
      }
    }, 'scroll-notebook-up', 'vim-binding');

    actions.register({
      'help': 'scroll notebook down',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        actions.call('vim-binding-normal:scroll-notebook-down', event, env);
        env.notebook.edit_mode();
      }
    }, 'scroll-notebook-down', 'vim-binding');

    actions.register({
      'help': 'scroll up',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        actions.call('vim-binding-normal:scroll-up', event, env);
        env.notebook.edit_mode();
      }
    }, 'scroll-up', 'vim-binding');

    actions.register({
      'help': 'scroll down',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        actions.call('vim-binding-normal:scroll-down', event, env);
        env.notebook.edit_mode();
      }
    }, 'scroll-down', 'vim-binding');

    actions.register({
      'help': 'select the first cell',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:select-first-cell', event, env);
        env.notebook.edit_mode();
      }
    }, 'select-first-cell', 'vim-binding');

    actions.register({
      'help': 'select the last cell',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:select-last-cell', event, env);
        env.notebook.edit_mode();
      }
    }, 'select-last-cell', 'vim-binding');

    actions.register({
      'help': 'expand output',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:expand-output', event, env);
        env.notebook.edit_mode();
      }
    }, 'expand-output', 'vim-binding');

    actions.register({
      'help': 'expand all output',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:expand-all-output', event, env);
        env.notebook.edit_mode();
      }
    }, 'expand-all-output', 'vim-binding');

    actions.register({
      'help': 'collapse output',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:collapse-output', event, env);
        env.notebook.edit_mode();
      }
    }, 'collapse-output', 'vim-binding');

    actions.register({
      'help': 'collapse all output',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        actions.call('vim-binding-normal:collapse-all-output', event, env);
        env.notebook.edit_mode();
      }
    }, 'collapse-all-output', 'vim-binding');


    // jupyter-notebook actions which should call command_mode but edit_mode
    actions.register({
      'help': 'extend selected cells above',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        return actions.call(
          'jupyter-notebook:extend-selection-above', event, env
        );
      }
    }, 'extend-selection-above', 'vim-binding');

    actions.register({
      'help': 'extend selected cells below',
      'handler': function(env, event) {
        var cell = env.notebook.get_selected_cell();
        if (cell && isInInsertMode(cell.code_mirror)) {
          return;
        }
        env.notebook.command_mode();
        return actions.call(
          'jupyter-notebook:extend-selection-below', event, env
        );
      }
    }, 'extend-selection-below', 'vim-binding');
  };

  exports.detach = function() {
    if (Original === undefined) {
      return;
    }
    actions._actions = Original;
    Original = undefined;
  };

  return exports;
});
