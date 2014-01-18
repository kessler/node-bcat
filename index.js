#!/usr/bin/env node

var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var argv = require('optimist').argv

if (argv.port) {
	cat(argv.port)
} else {
	findPort(8080, 8181, function(ports) {
		if (ports.length === 0)
			throw new Error('no available ports found between 8080 - 8181')
		else
			cat(ports.pop())
	})
}



function cat(port) {
	var server = http.createServer(function(request, response) {
		process.stdin.pipe(response)
		response.on('finish', function () {
			process.exit(0)
		})
	});

	server.listen(port)

	var commmand = 'open'

	if (process.platform === 'win32')
		command = 'start'


	child.exec(command + ' http://localhost:' + port);
}


