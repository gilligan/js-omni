# functions for server communication

import sys
import socket

input_port   = 20222      # port to connect to
sock         = None       # the socket object
recv_timeout = 0.001      # socket recv timeout in seconds

def jsomni_disconnect():
    try:
        sock.close()
    except socket.error:
        sys.stdout.write('Error closing socket.\n');

def jsomni_recv(resultvar):
    global sock
    response = ""
    try:
        response = sock.recv(4096)
    except socket.error:
        sys.stderr.write('Error reading socket.\n');
        response = ""
    #sys.stdout.write(response.__str__().strip())
    vim.command('let ' + resultvar + '=' + response)

def jsomni_send(text):
    global sock

    try:
        sock.send(text)
    except socket.error:
        sys.stdout.write('Error sending data to jsomni server.\n')
        jsomni_disconnect()

def jsomni_connect(host, port, resultvar):

    """
    Create socket connection to the jsomni server
    and make a ping request
    """

    global sock
    global input_port

    if not sock:
        try:
            input_port = port
            jsomni_server = (host, input_port)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(jsomni_server)
            vim.command('let ' + resultvar + '=""')
            return sock
        except socket.error:
            vim.command('let ' + resultvar + '="jsomni server is not running."')
            sock = None
            return sock
    vim.command('let ' + resultvar + '=""')
