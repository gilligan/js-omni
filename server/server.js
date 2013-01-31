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

                    /* validate the input
                     */
                    var data = rawData.toString().split(' ');
                    if (data.length < 2) {
                        return ' ';
                    }
                    var cmd = data[0];
                    var args = data[1];
                    if (cmd.length === 0 || args.length === 0) {
                        return ' ';
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
                        var evalFn = new Function(dirFn.replace('____object____', args));
                        page.evaluate(evalFn,
                                      function (err, result) {
                                        console.log(result);
                                        socket.write(JSON.stringify(result));
                                    });
                    } else if (cmd === 'ping') {
                        socket.write('pong ' + version);
                    } else {
                        console.log('ignoring unknown command: ' + cmd);
                        return '';
                    }
                });
            });
            server.listen(20222, '127.0.0.1');
        });
    });
});
