define([
  'jquery',
  'base/js/namespace',
  'codemirror/keymap/vim',
], function($, ns) {
  var undefined;
  var exports = {};
  var Original = undefined;

  var moveByLinesOrCell = function moveByLinesOrCell(cm, head, motionArgs, vim) {
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
      if (current_cell.cell_type == 'markdown') {
          current_cell.execute();
      }
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
    vim.lastHSPos = cm.charCoords(CodeMirror.Pos(line, endCh), 'div').left;
    return CodeMirror.Pos(line, endCh);
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
        var resCoords = cm.charCoords(CodeMirror.Pos(cm.firstLine(), 0), 'div');
        resCoords.left = vim.lastHSPos;
        res = cm.coordsChar(resCoords, 'div');
      }
    }
    vim.lastHPos = res.ch;
    return res;
  };
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

  exports.attach = function attach() {
    if (Original !== undefined) {
      return;
    }
    Original = $.extend(CodeMirror.prototype);
    CodeMirror.prototype.save = function() {
      ns.notebook.save_checkpoint();
    };
    CodeMirror.prototype.leaveInsertMode = function leaveInsertMode(cm) {
      CodeMirror.Vim.handleKey(cm || this, '<Esc>');
    };
    CodeMirror.prototype.leaveNormalMode = function leaveNormalMode(cm) {
      ns.notebook.command_mode();
      ns.notebook.focus_cell();
    };
  };

  exports.detach = function detach() {
    if (Original === undefined) {
      return;
    }
    CodeMirror.prototype = Original;
    Original = undefined;
    CodeMirror.Vim.mapCommand(
      "k", "motion", "moveByLines",
      {forward: false, linewise: true },
      {context: "normal"}
    ); 
    CodeMirror.Vim.mapCommand(
      "j", "motion", "moveByLines",
      {forward: true, linewise: true },
      {context: "normal"}
    );
    CodeMirror.Vim.mapCommand(
      "gk", "motion", "moveByDisplayLines",
      {forward: false },
      {context: "normal"}
    ); 
    CodeMirror.Vim.mapCommand(
      "gj", "motion", "moveByDisplayLines",
      {forward: true },
      {context: "normal"}
    );
    CodeMirror.Vim.mapCommand(
      "+", "motion", "moveByLines",
      {forward: true, toFirstChar: true },
      {context: "normal"}
    );
    CodeMirror.Vim.mapCommand(
      "-", "motion", "moveByLines",
      {forward: false, toFirstChar: true },
      {context: "normal"}
    );
    CodeMirror.Vim.mapCommand(
      "_", "motion", "moveByLines",
      {forward: true, toFirstChar: true, repeatOffset: -1 },
      {context: "normal"}
    );
  };

  // NOTE:
  // These default mapping requires to be out side of 'attach' to allow
  // users to customize in 'custom.js'
  CodeMirror.Vim.map('k', '<Plug>(vim-binding-k)', 'normal');
  CodeMirror.Vim.map('j', '<Plug>(vim-binding-j)', 'normal');
  CodeMirror.Vim.map('gk', '<Plug>(vim-binding-gk)', 'normal');
  CodeMirror.Vim.map('gj', '<Plug>(vim-binding-gj)', 'normal');
  CodeMirror.Vim.map('+', '<Plug>(vim-binding-+)', 'normal');
  CodeMirror.Vim.map('-', '<Plug>(vim-binding--)', 'normal');
  CodeMirror.Vim.map('_', '<Plug>(vim-binding-_)', 'normal');
  CodeMirror.Vim.map('<C-k>', '<Nop>', 'normal');
  CodeMirror.Vim.map('<C-j>', '<Nop>', 'normal');
  CodeMirror.Vim.map('<C-o>', '<Nop>', 'normal');
  CodeMirror.Vim.map('<C-i>', '<Nop>', 'normal');

  return exports;
});
