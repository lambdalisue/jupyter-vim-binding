# jupyter-vim-binding

This extension enables VIM keybindings in [Jupyter Notebook](https://jupyter.org/) (4.0+), formerly known as [IPython Notebook](http://ipython.org/notebook.html).

![Screencast](http://recordit.co/62sg2aC9cZ.gif)

Since the development of [ivanov/ipython-vimception](https://github.com/ivanov/ipython-vimception) seems to have stalled, I decided to create a new one.

# Usage
Once installed and activated ([see below](#installation)), you can see all of the new bindings using the `<F1>` (or `shift-H`) keys:

![F1-help example](https://cloud.githubusercontent.com/assets/200/13184805/91643054-d703-11e5-8e84-1992fa15da24.png)

These bindings can easily be changed ([see ‘Customization’](#customization)) to suit your needs.


# Installation

There are two ways to install the extension: 1. Directly as a notebook extension, or 2. By extending [IPython-notebook-extensions] (https://github.com/ipython-contrib/IPython-notebook-extensions)

## Direct
### Get the file
(*Recommended*) Clone the repository in Jupyter's data directory by running the following from a shell (e.g., bash)

```bash
> cd $(jupyter --data-dir)/nbextensions
> git clone https://github.com/lambdalisue/jupyter-vim-binding.git vim_binding
```

*Or*, if you want to use Python interface for [Notebook Extensions](http://mindtrove.info/#nb-extensions), run the following from a Python shell or a Notebook

```python
from notebook.nbextensions import install_nbextension
from jupyter_core.paths import jupyter_data_dir
install_nbextension('https://rawgithub.com/lambdalisue/jupyter-vim-binding/master/vim_binding.js',
                     nbextensions_dir=jupyter_data_dir()+'/nbextensions/vim_binding')
```

*Or*, from a shell

```bash
jupyter nbextension install https://rawgithub.com/lambdalisue/jupyter-vim-binding/master/vim_binding.js --nbextensions=$(jupyter --data-dir)/nbextensions/vim_binding
```

**On Linux machines**, either command should create a new file under `~/.local/share/jupyter/nbextensions/vim_binding/vim_binding.js`.
**On Mac**, this path should be `~/Library/Jupyter/nbextensions/vim_binding/vim_binding.js`.

### Activate temporarily
To activate the extension temporarily in a notebook session, run the following snippet in a code cell:

```javascript
%%javascript
Jupyter.utils.load_extensions('vim_binding/vim_binding')
```

### Activate permanently
To activate the extension permanently from a notebook, run the following in a code cell:

```javascript
%%javascript
Jupyter.notebook.config.update({
  'load_extensions': { 'vim_binding': true },
});
```

*Or*, from a shell

```bash
jupyter nbextension enable vim_binding/vim_binding
```

## Extending IPython-notebook-extensions
[IPython-notebook-extensions](https://github.com/ipython-contrib/IPython-notebook-extensions) contains a collection of extensions that add functionality to the Jupyter notebook. These extensions are mostly written in Javascript and will be loaded locally in your Browser.

The project simplifies the task of maintaining multiple extensions as, all extensions that are maintained and active have a markdown readme file for documentation and a yaml file to allow them being configured using the 'nbextensions' server extension.

### Install IPython-notebook-extensions
Follow the instructions at https://github.com/ipython-contrib/IPython-notebook-extensions#installation.
In a nutshell, clone the repository and run `python setup.py install` to install as local user.

### Add *vim_binding* to IPython-notebook-extensions
Once you have installed IPython-notebook-extensions, run the following from a shell (e.g., bash):

```bash
> cd $(jupyter --data-dir)/nbextensions/usability
> git clone https://github.com/lambdalisue/jupyter-vim-binding.git vim_binding
> chmod -R go-w vim_binding
```

### Activate the extension
Launch a Jupyter notebook session. Then, in a browser go to `<root>/nbextensions/`; for example, if the notebook is hosted under `localhost:8888`, go to `localhost:8888/nbextensions/`. Activate **VIM binding** from the list of extensions. Check [documentation](https://github.com/ipython-contrib/IPython-notebook-extensions#installation) for more details.

# Customization

To customize your Vim in Jupyter.
Create a [`custom.js`](http://jdfreder-notebook.readthedocs.org/en/docs/examples/Notebook/JavaScript%20Notebook%20Extensions.html) (usually at `~/.jupyter/custom/custom.js`) and use [CodeMirror's Vim API](https://codemirror.net/doc/manual.html#vimapi) to configure like below:

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

### Different cell background during normal or insert mode

Create a your `custom.css` (usually at `~/.jupyter/custom/custom.css`) and configure the insert background like below:

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


# License

The MIT License (MIT)

Copyright (c) 2015 Alisue, hashnote.net

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
