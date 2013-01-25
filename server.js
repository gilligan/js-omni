var net = require('net');
var phantom = require('node-phantom');

/*jshint multistr:true */
/*jshint evil:true */

phantom.create(function (err, ph) {

    return ph.createPage(function (err, page) {
        return page.open('http://localhost', function (err, status) {
            console.log('jsomni-server: ready');

            var server = net.createServer(function (socket) {
                socket.on('data', function (rawData) {

                    if (rawData.length <= 3) {
                        return;
                    }

                    var data = rawData.toString();
                    var cmd = data.slice(0, 3);

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
                        var args = data.slice(3);
                        var evalFn = new Function(dirFn.replace('____object____', args));
                        page.evaluate(evalFn,
                                      function (err, result) {
                                        console.log(result);
                                        socket.write(JSON.stringify(result));
                                    });
                    } else {
                        console.log('ignoring unknown command: ' + cmd);
                        return;
                    }
                });
            });
            server.listen(20222, '127.0.0.1');
        });
    });
});
