" send data to nodejs server
"

if !has('python')
    echo 'js.vim requires python support'
    finish
endif

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
