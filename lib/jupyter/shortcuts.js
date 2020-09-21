define([
  'base/js/namespace',
], function(ns) {
  "use strict";
  var undefined;
  var exports = {};

  exports.get_default_common_shortcuts = function get_default_common_shortcuts() {
    return {
      'shift': 'jupyter-notebook:ignore',
      'F1': 'jupyter-notebook:show-keyboard-shortcuts'
    };
  };

  exports.get_default_command_shortcuts = function get_default_command_shortcuts() {
    return {
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
      'shift-o': 'jupyter-notebook:insert-cell-above',
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
      'm': 'vim-binding-normal:mark-cell',
      '~': 'vim-binding-normal:goto-mark-cell',
      // Defined in searchandreplace.js
      // https://github.com/jupyter/notebook/blob/4.x/notebook/static/notebook/js/searchandreplace.js#L375
      '/': 'jupyter-notebook:find-and-replace'
    };
  };

  exports.get_default_edit_shortcuts = function get_default_edit_shortcuts() {
    return {
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
      'ctrl-k': 'vim-binding:select-previous-cell-eval-markdown', // require C-k unmapping in CodeMirror
      'ctrl-j': 'vim-binding:select-next-cell-eval-markdown',     // require C-j unmapping in CodeMirror
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
      'ctrl-o,/': 'jupyter-notebook:find-and-replace'
    };
  };

  exports.add_shortcuts = function add_shortcuts(manager, data){
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
  };

  exports.attach = function attach() {
    var km = ns.keyboard_manager;
    km.command_shortcuts.clear_shortcuts();
    exports.add_shortcuts(
      km.command_shortcuts,
      exports.get_default_common_shortcuts()
    );
    exports.add_shortcuts(
      km.command_shortcuts,
      exports.get_default_command_shortcuts()
    );

    km.edit_shortcuts.clear_shortcuts();
    exports.add_shortcuts(
      km.edit_shortcuts,
      exports.get_default_common_shortcuts()
    );
    exports.add_shortcuts(
      km.edit_shortcuts,
      exports.get_default_edit_shortcuts()
    );

    // Apply user defined Keyboard shortcuts
    if (km.config && km.config.data.keys) {
      exports.add_shortcuts(
        km.command_shortcuts,
        (km.config.data.keys.command || {}).bind || {}
      );
      exports.add_shortcuts(
        km.edit_shortcuts,
        (km.config.data.keys.edit || {}).bind || {}
      );
    }
  };

  return exports;
});
