var net = require('net');
var server = net.createServer(function (socket) {
    socket.write("Echo server\r\n");
    socket.on('data', function (data) {
        process.stdout.write(data);
    });
});
server.listen(1338, "127.0.0.1");
