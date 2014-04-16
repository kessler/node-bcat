#!/usr/bin/env node

var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var ansi = require('ansi-html-stream')
var replaceStream = require('replacestream')
var os = require('os')
var rc = module.require('rc')

var argv = require('optimist')
	.boolean('ansi')
	.boolean('disableTabReplace')
	.boolean('disableNewlineReplace')
	.argv

var config = rc('bcat', {
	contentType: 'text/html',
	scrollDownInterval: 1000,
	backgroundColor: '#000000',
	foregroundColor: '#ffffff',
	tabLength: 4,
	tabReplace: '&nbsp;&nbsp;&nbsp;&nbsp;',
	disableTabReplace: false,
	newlineReplace: '<br />',
	disableNewlineReplace: false,
	ansi: false,
	ansiOptions: {
		foregrounds: {
	    	'30': { style: 'color:#fffaaa' } // black
	    },
		backgrounds: {
			'40': { style: 'background-color:#fffaaa' } // black
		}
	}
})

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

/* this part is rendered into client side script (inside the browser) */
var clientConfig = {
	scrollDownInterval: config.scrollDownInterval
};

function run() {
	var ref
	function startAutoScroll() {
		ref = window.setInterval(function () {
			document.getElementById('container').scrollIntoView(false)
		}, clientConfig.scrollDownInterval)
	}

	function stopAutoScroll() {
		clearInterval(ref)
	}

    var scrollToggle = document.getElementById('autoscrollToggle')

    if (scrollToggle) {
    	scrollToggle.addEventListener('change', function () {
    		if (scrollToggle.checked) {
    			startAutoScroll()
    		} else {
    			stopAutoScroll()
    		}
    	});
    }

    startAutoScroll()
}
/**/

var script = 'var clientConfig = ' + JSON.stringify(clientConfig) + '\n' + run.toString() + '\nrun()'

function cat(port) {

	var server = http.createServer(handler)

	server.listen(port)

	var command = 'open'

	if (process.platform === 'win32')
		command = 'start'

	child.exec(command + ' http://localhost:' + port);

	function handler(request, response) {

		var contentType = config.contentType

		var bg = config.backgroundColor
		var fg = config.foregroundColor

		var stream = process.stdin

		if (config.ansi) {
			contentType = 'text/html'
			stream = stream.pipe(ansi(config.ansiOptions))
		}

		if (!config.disableTabReplace) {
			var tab = ''
			for (var i = 0; i < config.tabLength; i++)
				tab += ' '

			var tabStream = replaceStream(tab, config.tabReplace)
			stream = stream.pipe(tabStream)
		}

		if (!config.disableNewlineReplace) {
			var osNewLineStream = replaceStream(os.EOL, config.newlineReplace)
			var newLineStream = replaceStream('\n', config.newlineReplace)

			stream = stream.pipe(osNewLineStream).pipe(newLineStream)
		}

		response.setHeader('Content-Type', contentType)

		if (contentType === 'text/html') {

			var style = 'body { background-color: ' + bg + '; color: ' + fg + ' } ' +
						'div#autoscroll { position: fixed; top: 1em; right: 1em }'


			response.write('<html><head><style>' + style + '</style></head>' +
							'<body>' +
							'<div id="autoscroll">Auto scroll <input type="checkbox" id="autoscrollToggle" checked /></div>' +
							'<script>' + script + '</script><div id="container">')
		}

		stream.pipe(response)

		response.on('finish', function () {
			process.exit(0)
		})
	}
}


