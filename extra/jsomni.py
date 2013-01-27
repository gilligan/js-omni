#!/usr/bin/python

import socket
s = socket.socket()
s.connect(('127.0.0.1', 20222))

while True:
    cmd = raw_input("")
    if cmd == 'q':
        break;
    s.send('dir' + ' ' + cmd);
    completions = eval(s.recv(4096))
    print completions

s.close()
