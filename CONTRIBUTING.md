Contributing
===============================================================================

Please read the rules listed below before you contribute this extension.


Correcting document
-------------------------------------------------------------------------------

**YOU ARE VERY WELCOME !!!**

While I'm not native English speaker, I would ask you to correct documents.


Reporting an issue
-------------------------------------------------------------------------------

I'm welcome to hear issues to improve jupyter-vim-binding, but please read the
followings to save time of yours and mines ;-)

### Before reporting an issue

Please confirm the following before reporting an issue:

1. Confirm the version of your jupyter-vim-binding and Jupyter. Only a latest
   version (and maybe one or two below) is supported
2. Confirm the behavior in [CodeMirror.Vim][]. If the issue is reproducible
   even in [CodeMirror.Vim][] then the issue belongs to the [CodeMirror.Vim][]

[CodeMirror.Vim]: https://codemirror.net/demo/vim.html

### Required information in an issue

Please write the following information in your issue:

- Operating system and version (e.g. Ubuntu Gnome 15.04 64bit)
- Browser and version (e.g. Firefox 44.0.2)
- Version (revision of the repository) of your Jupyter notebook
- Version (revision of the repository) of your jupyter-vim-binding
- Step by step procedure to reproduce
- Expected behavior and actual behavior
- What you have done to solve the issue if you did (e.g. Confirmed with Firefox
  xxxx and Chrome xxxx)

Less information makes difficult to debug, so please write as much information
as you can.


Adding extra mappings for Jupyter manipulation
-------------------------------------------------------------------------------

If you feel that jupyter-vim-binding should provide extra default mappings for
manipulating Jupyter, please read the followings ;-)


### Read and follow the basic concept

Read and follow the basic concept of jupyter-vim-binding described at
[Concept][] page.
For example, I probably reject your PR if you provide *One-time mappings*
without `<C-o>` prefix in *Command mode* without reason.

[Concept]: https://github.com/lambdalisue/jupyter-vim-binding/wiki/Concept

### Read and try to avoid conflicts with native Vim

Read and try to avoid conflicts with native Vim key mappings as much as
possible.

I understand that Vim provides a lot of native mappings which seems not useful
in Jupyter (such as `<C-o>`/`<C-i>` jumps which does not work.)
So conflicted key mappings are OK if you can provide any reason or evidence to
avoid the native mappings. But otherwise, you should try to avoid conflicts.

Note that most of key mappings can be confirmed by executing `:h CTRL-O` or
whatever in a native Vim.


### Follow coding style

Not fully and critical but I prefer to follow [Google JavaScript Style Guide][].
So I may ask you to modify your PR code a bit to follow the style.

[Google JavaScript Style Guide]: https://google.github.io/styleguide/javascriptguide.xml
