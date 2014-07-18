#!/usr/bin/env node

var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var pipeResponse = require('./lib/pipeResponse.js')
var rc = module.require('rc')

var argv = require('optimist')
	.boolean('ansi')
	.boolean('disableTabReplace')
	.boolean('disableNewlineReplace')
	.argv

var config = rc('bcat', pipeResponse.defaultConfig)

if (argv.usage) {
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

	var command = 'open'

	if (process.platform === 'win32')
		command = 'start'

	child.exec(command + ' http://localhost:' + port)

	function handler(request, response) {

		pipeResponse.pipeResponse(config, response, process.stdin)

		response.on('finish', function () {
			process.exit(0)
		})
	}
}
