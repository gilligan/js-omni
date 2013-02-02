var net = require('net');
var phantom = require('node-phantom');

var version = 'jsomni-0.1';

/*jshint multistr:true */
/*jshint evil:true */

phantom.create(function (err, ph) {

    return ph.createPage(function (err, page) {
        return page.open('http://localhost', function (err, status) {
            console.log('jsomni-server: ready');

            var server = net.createServer(function (socket) {

                socket.on('connect', function () {
                    console.log('jsomni-server: client connection from ' + socket.remoteAddress);
                });

                socket.on('close', function () {
                    console.log('jsomni-server: client disconnected');
                });

                /* Handle incoming requests
                 * @param rawData {String} command string
                 *
                 * The command string should be of the format: '<cmd> <args>'
                 * Currently the only available command is 'dir'
                 */
                socket.on('data', function (rawData) {

                    console.log('data: ' + rawData);

                    var writeResponse = function (data) {
                        var payload = (data === undefined || data.length === 0) ? '[]' : data;
                        var dataLen = payload.length;
                        var lenBytes = new Array(4);
                        lenBytes[0] = dataLen >> 24;
                        lenBytes[1] = dataLen >> 16;
                        lenBytes[2] = dataLen >> 8;
                        lenBytes[3] = dataLen;
                        socket.write(new Buffer(lenBytes));
                        socket.write(payload);
                    };

                    /* validate the input
                     */
                    var data = rawData.toString().split(' ');
                    if (data.length < 2) {
                        writeResponse('[]');
                        return;
                    }
                    var cmd = data[0];
                    var args = data[1].trim();
                    if (cmd.length === 0 || args.length === 0) {
                        writeResponse('[]');
                        return;
                    }

                    var dirFn = "\
                    var object = ____object____;\
                    var property, properties = [], seen = {};\
                    function valid(name) {\
                    var invalid = ['arguments', 'caller', 'name', 'length', 'prototype'];\
                    for (var i in invalid) {\
                    if (invalid[i] === name) {\
                    return false;\
                    }\
                    }\
                    return true;\
                    }\
                    if (Object.getOwnPropertyNames !== 'undefined') {\
                    properties = Object.getOwnPropertyNames(object);\
                    for (property in object) {\
                    properties.push(property);\
                    }\
                    properties = properties.filter(function (name) { return valid(name); });\
                    for (var i = 0; i < properties.length; i++) {\
                    seen[properties[i]] = '';\
                    }\
                    return Object.keys(seen)\
                    } else{\
                    for (property in object) {\
                    properties.push(property);\
                    }\
                    }\
                    return JSON.stringify(properties);";

                    if (cmd === 'dir') {
                        try {
                            var evalFn = new Function(dirFn.replace('____object____', args));
                            page.evaluate(evalFn,
                                          function (err, result) {
                                                console.log(result);
                                                writeResponse(JSON.stringify(args + '.' + result));
                                            });
                        } catch (e) {
                            writeResponse('[]');
                        }
                    } else if (cmd === 'ping') {
                        socket.write('pong ' + version);
                    } else {
                        writeResponse('[]');
                    }
                });
            });
            server.listen(20222, '127.0.0.1');
        });
    });
});
