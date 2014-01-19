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
.options('ansi', {
	description: 'add --ansi to show colorful ansi'
})
.options('ansiBackground', {
	alias: 'ansiBg',
	default: '#000000',
	description: 'change the background when displaying ansi'
})
.options('backgroundColor', {
	alias: 'bg',
	default: '#ffffff',
	description: 'change the background color in the browser'
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

		var bg = argv.bg

		if (argv.ansi) {
			bg = argv.ansiBg
			process.stdin.pipe(ansi()).pipe(response)
		} else {
			process.stdin.pipe(response)
		}

		response.write('<html><head></head><body style="background-color:' + bg + '">')

		process.stdin.on('end', function() {
			console.log(1)
		})

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


