#!/usr/bin/env node

var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var ansi = require('ansi-html-stream')
var replaceStream = require('replacestream')

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

var ansiOptions = {
	foregrounds: {
    	'30': { style: 'color:#fffaaa' } // black
    },
	backgrounds: {
		'40': { style: 'background-color:#fffaaa' } // black
	}
};

var script = 'window.setInterval(function () { document.getElementById(\'container\').scrollIntoView(false); }, 1000)';

function cat(port) {
	var server = http.createServer(function(request, response) {
		response.setHeader('Content-Type', argv.contentType)

		var style

		if (argv.ansi) {
			style = 'body { background-color: ' + argv.ansiBg + '; color: #ffffff }'

			process.stdin
				.pipe(ansi(ansiOptions))
				.pipe(replaceStream('\n', '<br />'))
				.pipe(response)
		} else {
			style = 'body { background-color: ' + argv.bg + '; }'
			process.stdin.pipe(response)
		}

		response.write('<html><head><script>' + script + '</script><style>' + style + '</style></head><body><div id="container">')

		process.stdin.on('close', function() {
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


