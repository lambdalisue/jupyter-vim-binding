jupyter-vim-binding
===============================================================================
![Version 2.0.0](https://img.shields.io/badge/version-2.0.0-yellow.svg?style=flat-square) ![Support Jupyter 4.1 or above](https://img.shields.io/badge/support-Jupyter%204.1%20or%20above-yellowgreen.svg?style=flat-square) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE) ![Doc](https://img.shields.io/badge/doc-%3Ah%20Press%20F1%20on%20Jupyter-orange.svg?style=flat-square)

Do you use Vim? And you need to use [Jupyter Notebook]?
This is a [Jupyter Notebook][] (formerly known as [IPython Notebook][]) extension to enable Vim like environment powered by [CodeMirror's Vim][].
I'm sure that this plugin helps to improve your QOL.

[Jupyter Notebook]: https://jupyter.org/
[IPython Notebook]: http://ipython.org/notebook.html
[CodeMirror's Vim]: https://codemirror.net/demo/vim.html
[IPython-notebook-extensions]: https://github.com/ipython-contrib/IPython-notebook-extensions

<div align="center">
![Screencast](http://g.recordit.co/apWN0VYYZb.gif)
</div>

This extension stands for providing a Vim like environment, so it would drastically overwrite the default mappings and introduce a new behaviors.
For example

- Jupyter has two modes, *Command mode* and *Edit mode* but this extension has three modes, *Jupyter mode*, *Command mode*, and *Insert mode*
- Jupyter provides `C` (`Shift-c`) and `V` (`Shift-v`) to perform copy and paste cells but this extension provides `yy` and `p` to perform copy and paste cells
- Jupyter provides `<C-s>` (`Ctrl-s`) to save a checkpoint but this extension eliminate that mapping while `:w` works same
- A lot more.


Installation
-------------------------------------------------------------------------------

There are several ways to install the extension, see [Installation](https://github.com/lambdalisue/jupyter-vim-binding/wiki/Installation) for detail.
The procedure below is a most simple one for quick use (**A recommended way is different from this. See the link above if you are beginner.**)

```bash
# Create required directory in case (optional)
$ mkdir -p $(jupyter --data-dir)/nbextensions
# Clone the repository
$ cd $(jupyter --data-dir)/nbextensions
$ git clone https://github.com/lambdalisue/jupyter-vim-binding vim_binding
# Activate the extension
$ jupyter nbextension enable vim_binding/vim_binding
```


Usage
-------------------------------------------------------------------------------

This extension provides *Jupyter mode* (For manipulating Jupyter) and *Vim mode* (For manipulating text).
In *Vim mode*, there are *Command mode* and *Insert mode* like native Vim.
Users can distinguish these mode by background color of the cell.

Key mappings are designed for Vimmer so probably you don't need to know much about the mapping but remember the followings to survive:

- All mappings are shown by hitting `<F1>`
- Enter *Vim mode*; a super mode of *Command mode* and *Insert mode*; by 1) Double clicking a cell, 2) Hit `<Enter>` on a cell, or 3) Hit `i` on a cell
- Leave *Vim mode* and re-enter *Jupyter mode* by hitting `<S-Esc>` (`Shift-Escape`), uncomfortable mapping on purpose
- Enter *Insert mode* or leave *Insert mode* as like Vim (`i`, `a`, etc.)

You can find detail information about the mappings or concept in [Concept](https://github.com/lambdalisue/jupyter-vim-binding/wiki/Concept) page.


Customize
-------------------------------------------------------------------------------

To customize key mappings in *Vim mode*, you need to understand that there are two kinds of mappings in this extension:

1. Mappings provided by [Jupyter][], users can customize this type of mappings with [Keyboard shortcut editor][] provided in [IPython notebook extensions][]
2. Mappings provided by [CodeMirror.Vim][], users can customize this type of mappings with [`custom.js`][] as described below

To customize mappings provided by [CodeMirror.Vim][], create a [`custom.js`][] at `~/.jupyter/custom/custom.js` (at least in Linux) and use [CodeMirror's Vim API][] to manipulate like:

```javascript
// Configure CodeMirror
require(['codemirror/keymap/vim'], function() {
  // Map jj to <Esc>
  CodeMirror.Vim.map("jj", "<Esc>", "insert");
  // Use gj/gk instead of j/k
  CodeMirror.Vim.map("j", "gj", "normal");
  CodeMirror.Vim.map("k", "gk", "normal");
});
// Configure Jupyter (VimBinding)
require(['base/js/namespace'], function(namespace) {
  namespace.VimBinding = namespace.VimBinding || {};
  // Regulate scroll speed (default: 30)
  namespace.VimBinding.scrollUnit = 100;
  // Regulate offset (default: 30)
  namespace.VimBinding.closestCellMargin = 5;
});
```

If you would like to customize the design, create a your `custom.css` at `~/.jupyter/custom/custom.css` (at least in Linux) like:

```css
/* Jupyter cell is in normal mode when code mirror */
.edit_mode .cell.selected .CodeMirror-focused.cm-fat-cursor {
  background-color: #F5F6EB;
}
/* Jupyter cell is in insert mode when code mirror */
.edit_mode .cell.selected .CodeMirror-focused:not(.cm-fat-cursor) {
  background-color: #F6EBF1;
}
```

See [Customize](https://github.com/lambdalisue/jupyter-vim-binding/wiki/Customize) to find useful snippets. Don't be afraid to share your snippets at that page ;-)

[Keyboard shortcut editor]: https://github.com/ipython-contrib/IPython-notebook-extensions/tree/master/nbextensions/usability/keyboard_shortcut_editor
[`custom.js`]: http://jdfreder-notebook.readthedocs.org/en/docs/examples/Notebook/JavaScript%20Notebook%20Extensions.html
[CodeMirror's Vim API]: https://codemirror.net/doc/manual.html#vimapi


License
-------------------------------------------------------------------------------

The MIT License (MIT)

Copyright (c) 2015-2016 Alisue, hashnote.net

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
