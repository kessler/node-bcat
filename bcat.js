#!/usr/bin/env node

var isos = require('isos')
var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var pipeResponse = require('./lib/pipeResponse.js')
var rc = require('rc')

var argv = require('optimist')
	.boolean('ansi')
	.boolean('disableTabReplace')
	.boolean('disableNewlineReplace')
	.argv

var config = rc('bcat', pipeResponse.defaultConfig)

if (argv.usage || argv.help) {
	console.log(require('./usage.js'))
	process.exit(0)
}

if (config.port) {
	cat(config.port)
} else {
	findPort(8080, 8181, function(ports) {
		if (ports.length === 0)
			throw new Error('no available ports found between 8080 - 8181')
		else
			cat(ports.pop())
	})
}

function cat(port) {

	var server = http.createServer(handler)

	server.listen(port)

	server.timeout = config.serverTimeout

	var command

	if (config.command) {
		command = config.command
	} else if (isos('osx')) {
		command = 'open'
	} else if (isos('windows')) {
		command = 'start'
	} else {
		command = 'xdg-open'
	}

	child.exec(command + ' http://localhost:' + port, function (err, stdout, stderr) {
		if (err) {
			console.error(err)
			console.error('cannot open url using command "%s"', command)
			console.error('point your browser to http://localhost:%d to see the data', port)
		}
	})

	function handler(request, response) {

		pipeResponse.pipeResponse(config, response, process.stdin)

		response.on('finish', function () {
			process.exit(0)
		})
	}
}
