#!/usr/bin/env node

var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var ansi = require('ansi-html-stream')

var opts = require('optimist')
.options('port', {
	description: 'set a port for this bcat execution'
})
.options('contentType', {
	default: 'text/html',
	description: 'content type header'
})

var argv = opts.argv

if (argv.usage) {
	console.log(opts.help())
	process.exit(0)
}

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

var contentType = 'text/html';

function cat(port) {
	var server = http.createServer(function(request, response) {
		response.setHeader('Content-Type', argv.contentType)

		if (argv.contentType === 'text/plain')
			process.stdin.pipe(ansi).pipe(response)
		else
			process.stdin.pipe(response)

		response.on('finish', function () {
			process.exit(0)
		})
	});

	server.listen(port)

	var command = 'open'

	if (process.platform === 'win32')
		command = 'start'


	child.exec(command + ' http://localhost:' + port);
}


