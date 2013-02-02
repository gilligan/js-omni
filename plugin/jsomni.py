# functions for server communication

import sys
import socket
import struct

input_port   = 20222      # port to connect to
sock         = None       # the socket object
recv_timeout = 0.001      # socket recv timeout in seconds

def jsomni_disconnect():
    try:
        sock.close()
    except socket.error:
        sys.stdout.write('Error closing socket.\n');

def jsomni_recv(recv_len):
    global sock
    response = None
    try:
        response = sock.recv(recv_len)
    except socket.error:
        sys.stderr.write('Error reading socket.\n');
        response = 0
    return response

def jsomni_get(resultvar):
    global sock
    response = None
    response_length = struct.unpack('>i', jsomni_recv(4))[0]
    response = jsomni_recv(response_length)
    sys.stdout.write(response);
    vim.command('let ' + resultvar + '=' + response)
    #vim.command("let " + resultvar + "='%s'" % response.__str__().replace("'", "''"))

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
