jupyter-vim-binding
========================
Enable Vim key bindings in [jupyter](https://jupyter.org/) or [IPython notebook](http://ipython.org/notebook.html).

This is a [jupyter](https://jupyter.org/) plugin to enable Vim key bindings in jupyter or IPython (4.0).
While the development of [ivanov/ipython-vimception](https://github.com/ivanov/ipython-vimception) seemed be stopped, I decide to create a new one.


Install
--------
This version simply use [Notebook Extensions](http://mindtrove.info/#nb-extensions) to enable Vim key bindings.
Thus you can install the plugin with the following code in your notebook.

```python
from notebook.nbextensions import install_nbextension
install_nbextension('https://goo.gl/5TK96v', user=True)
# Or if you prefre a full URL
#install_nbextension('https://rawgithub.com/lambdalisue/jupyter-vim-binding/master/nbextensions/vim_binding.js', user=True)
```

For instant use
----------------
Call the following in your notebook to enable Vim bindings instantly & temporary.

```javascript
%%javascript
Jupyter.utils.load_extensions('vim_binding')
```

For permanent use
------------------
Call the following in your notebook to enable Vim bindings permanently.

```javascript
%%javascript
Jupyter.notebook.config.update({
  'load_extensions': { 'vim_binding': True },
});
```

License
--------
MIT License

© 2015 Alisue, hashnote.net
