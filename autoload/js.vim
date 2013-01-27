" js-omni.vim - Code completion for js using phantomjs
" Maintainer: Tobias Pflug
" Version:    0.1

if !has('python')
    echo 'js.vim requires python support'
    finish
endif


" Find swank.py in the Vim plugin directory (if not given in vimrc)
if !exists( 'g:jsomni_path' )
    let plugins = split( globpath( &runtimepath, 'plugin/**/swank.py'), '\n' )
    if len( plugins ) > 0
        let g:jsomni_path = plugins[0]
    else
        let g:jsomni_path = 'jsomni.py'
    endif
endif


if exists('g:loaded_jsomni') || &cp
    finish
endif
let g:loaded_jsomni = 1

"
" jscomplete functions
"

function! js#GetCompletePosition (text, lineNum)
  let l:pos = len(a:text)
  if synIDattr(synID(a:lineNum, l:pos, ''), 'name') =~ '^javaScriptString'
    while l:pos >= 0 && synIDattr(synID(a:lineNum, l:pos, ''), 'name') =~ '^javaScriptString'
      let l:pos -= 1
    endwhile
  else
    while l:pos >= 0 && a:text[l:pos - 1] =~ '[$a-zA-Z0-9_]'
      let l:pos -= 1
    endwhile
  endif
  return l:pos
endfunction

function! js#CompleteJS(findstart, complWord)
    let currentLine = line('.')
    if a:findstart
        " locate the start of the word
        let line = getline('.')
        let compl_begin = col('.') - 2
        let start = js#GetCompletePosition(line, currentLine)
        let b:compl_context = line[0:compl_begin]
        return start
    endif
    let context = b:compl_context
    let shortcontext = substitute(context, '\s*'.a:complWord.'$', '', '')
    unlet! b:compl_context

    if empty(shortcontext)
        let currentLine = prevnonblank(currentLine - 1)
        let shortcontext = getline(currentLine)
    endif

    " コメント行なら即終了
    if synIDattr(synID(line('.'), len(context) - 1, 0), 'name') == 'javaScriptComment'
        return []
    endif
    "return ['foo', 'bar', 'baz']
    return js#queryServer(a:complWord[:-2])
endfunction

function! js#queryServer(str)
python << EOF
import vim
import socket
s = socket.socket()
s.connect(('127.0.0.1', 20222))
complText = vim.eval('a:str');
s.send('dir ' + complText)
responseData = s.recv(4096);
vim.command('return ' + responseData.__str__());
EOF
endfunction

function! PythonGetArray()
    let List = js#queryServer('GL')
    return List
endfunction

function! JSsendToServer()
    python << EOF
    import socket
    import vim
    s = socket.socket()
    s.connect(('127.0.0.1', 20222))
    s.send('foobar')
    response = s.recv(4096)
    print response
    s.close()
EOF
endfunction
