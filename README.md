#jupyter-vim-binding

This extension enables VIM keybindings in [Jupyter Notebook](https://jupyter.org/) (4.0+), formerly known as [IPython Notebook](http://ipython.org/notebook.html).

![Screencast](http://recordit.co/62sg2aC9cZ.gif)

Since the development of [ivanov/ipython-vimception](https://github.com/ivanov/ipython-vimception) seems to have stalled, I decided to create a new one.

#Installation

There are two ways to install the extension: 1. Directly as a notebook extension, or 2. By extending [IPython-notebook-extensions] (https://github.com/ipython-contrib/IPython-notebook-extensions)

## Direct
### Get the file
[Recommended] Clone the repository in Jupyter's data directory by running the following from a shell (e.g., bash)
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
On Linux machines, either command should create a new file under
`~/.local/share/jupyter/nbextensions/vim_binding/vim_binding.js`. 

On Mac, this path should be 
`~/Library/Jupyter/nbextensions/vim_binding/vim_binding.js`.

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

## Custimization
If you want to remap `<Esc>` to `jk`, we can insert the line ``CodeMirror.Vim.map("jk","<Esc>","insert")`` in `vim_binding.js` within the main function. For example,

```javascript
define(['base/js/namespace', 'notebook/js/cell', 'codemirror/keymap/vim'], function(namespace, cell) {
  CodeMirror.Vim.map("jk","<Esc>","insert") // remap <Esc> to `jk`
  var extend = function(destination, source) {
    for (var property in source) {
      if (source.hasOwnProperty(property)) {
        destination[property] = source[property];
      }
    }
    return destination;
  };
  // rest of file ...
```

This maps any key to any key; for example, you can include the line ``CodeMirror.Vim.map("H","^","normal")`` to bind `H` to go to the beginning of the line in normal mode. See [issue #8] for more detail.

[issue #8]:https://github.com/lambdalisue/jupyter-vim-binding/issues/8

## Extending IPython-notebook-extensions
[IPython-notebook-extensions](https://github.com/ipython-contrib/IPython-notebook-extensions) "*contains a collection of extensions that add functionality to the Jupyter notebook. These extensions are mostly written in Javascript and will be loaded locally in your Browser*". 

The project simplifies the task of maintaining multiple extensions as, "*all extensions that are maintained and active have a markdown readme file for documentation and a yaml file to allow them being configured using the 'nbextensions' server extension.*"

### Install IPython-notebook-extensions
Follow the instructions at https://github.com/ipython-contrib/IPython-notebook-extensions#installation.
In a nutshell, clone the repository and run `python setup.py install` to install as local user.

### Add *vim_binding* to IPython-notebook-extensions
Once you have installed *IPython-notebook-extensions*, run the following from a shell (e.g., bash):
```bash
> cd $(jupyter --data-dir)/nbextensions/usability
> git clone https://github.com/lambdalisue/jupyter-vim-binding.git vim_binding
> chmod -R go-w vim_binding
```

### Activate the extension
Launch a Jupyter notebook session. Then, in a browser go to `<root>/nbextensions/`; for example, if the notebook is hosted under `localhost:8888`, go to `localhost:8888/nbextensions/`. Activate **VIM binding** from the list of extensions. Check [documentation](https://github.com/ipython-contrib/IPython-notebook-extensions#installation) for more details.

# License

MIT License

© 2015 Alisue, hashnote.net
