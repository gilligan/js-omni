" js-omni.vim - Code completion for js using phantomjs
" Maintainer: Tobias Pflug
" Version:    0.1

if !has('python')
    echo 'js.vim requires python support'
    finish
endif


" Find swank.py in the Vim plugin directory (if not given in vimrc)
if !exists( 'g:jsomni_path' )
    let plugins = split( globpath( &runtimepath, 'plugin/**/jsomni.py'), '\n' )
    if len( plugins ) > 0
        let g:jsomni_path = plugins[0]
    else
        let g:jsomni_path = 'jsomni.py'
    endif
endif


"if exists('g:loaded_jsomni') || &cp
    "finish
"endif

"
" global and script variables
"

let g:loaded_jsomni = 1
let g:jsomni_host = '127.0.0.1'
let g:jsomni_port = 20222
let s:jsomni_connected = 0
let s:python_initialized = 0
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

function! js#OmniCompleteJS(findstart, complWord)
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

    if synIDattr(synID(line('.'), len(context) - 1, 0), 'name') == 'javaScriptComment'
        return []
    endif

    let compltoken = substitute(shortcontext, '^\s*\(.\{-}\)\s*$', '\1', '')
    let dotidx = strridx(compltoken, ".")

    if dotidx > 0
        let compltoken = compltoken[0:dotidx-1]
    endif

    if s:jsomni_connected && len(compltoken) > 0
        call js#sendData('dir ' . compltoken)
        return js#recvData()
    else
        return []
    endif
endfunction


function! js#sendData(str)
    let str = a:str
    execute 'python jsomni_send("' . str . '")'
endfunction

function! js#recvData()
    let response=[]
    execute 'python jsomni_get("response")'
    return response
endfunction

function! js#OmniDisconnect()
    if s:jsomni_connected
        execute 'python jsomni_disconnect()'
    endif
    let s:jsomni_connected = 0
endfunction

function! js#OmniConnect()
    if !s:python_initialized
        python import vim
        execute 'pyfile ' . g:jsomni_path
        let s:python_initialized = 1
    endif
    execute 'python jsomni_connect("' . g:jsomni_host . '", ' . g:jsomni_port . ', "result" )'
    if result != ''
        echo 'js-omni: ooops'
        return 0
    endif
    let s:jsomni_connected = 1
endfunction
