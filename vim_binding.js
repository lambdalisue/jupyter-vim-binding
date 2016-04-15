/*
 * vim_binding.js
 *
 * A vim key binding plugin for Jupyter/IPython
 *
 * @author    Alisue <lambdalisue@hashnote.net>
 * @version   2.0.3
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
define([
  'require',
  'jquery',
  'services/config',
  'base/js/namespace',
  'base/js/utils',
  'notebook/js/cell',
  './lib/codemirror',
  './lib/jupyter/actions',
  './lib/jupyter/codecell',
  './lib/jupyter/completer',
  './lib/jupyter/keyboard',
  './lib/jupyter/notebook',
  './lib/jupyter/shortcuts',
], function(require, $, config, ns, utils, cell) {
  "use strict";
  var undefined;
  var exports = {};
  var modules = Array.prototype.slice.call(arguments, 6);
  var Cell = cell.Cell;
  var conf = new config.ConfigSection('notebook', {
    base_url: utils.get_body_data('baseUrl')
  });
  var params = {
    'scroll_unit': 30,
  };


  var require_css = function(url) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = require.toUrl(url);
    document.getElementsByTagName('head')[0].appendChild(link);
  };


  conf.loaded.then(function() {
    params = $.extend(params, conf.data);
    exports.attach();
  });

  exports.attach = function attach() {
    for(var i=0; i<modules.length; i++) {
      modules[i].attach(params);
    }
    // Include required CSS
    require_css('./vim_binding.css');
    // Initialize
    var cm_config = Cell.options_default.cm_config;
    cm_config.keyMap = 'vim';
    cm_config.extraKeys = $.extend(cm_config.extraKeys || {}, {
      'Esc': CodeMirror.prototype.leaveInsertMode,
      'Shift-Esc': CodeMirror.prototype.leaveNormalMode,
      'Ctrl-C': false,  // To enable clipboard copy
    });

    // Apply default CodeMirror config to existing CodeMirror instances
    ns.notebook.get_cells().map(function(cell) {
      var cm = cell.code_mirror;
      if (cm) {
        cm.setOption('keyMap', cm_config.keyMap);
        cm.setOption('extraKeys', $.extend(
          cm.getOption('extraKeys') || {},
          cm_config.extraKeys
        ));
      }
    });
  };

  exports.detach = function detach() {
    for(var i=0; i<modules.length; i++) {
      modules[i].detach(params);
    }
  };

  exports.load_ipython_extension = function load_ipython_extension() {
    conf.load();
  };

  return exports;
});
