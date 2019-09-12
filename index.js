#!/usr/bin/env node

var isos = require('isos')
var http = require('http')
var child = require('child_process')
var findPort = require('find-port')
var ansi = require('ansi-html-stream')
var replaceStream = require('replacestream')
var os = require('os')
var rc = require('rc')

var argv = require('optimist')
	.boolean('ansi')
	.boolean('disableTabReplace')
	.boolean('disableNewlineReplace')
	.argv

var config = rc('bcat', {
	contentType: 'text/html',
	scrollDownInterval: 1000,
	backgroundColor: '#333',
	foregroundColor: '#fefefe',
	tabLength: 4,
	tabReplace: '&nbsp;&nbsp;&nbsp;&nbsp;',
	disableTabReplace: false,
	newlineReplace: '<br />',
	disableNewlineReplace: false,
	ansi: true,
	ansiOptions: {
		foregrounds: {
	    	'30': { style: 'color:#fffaaa' } // black
	    },
		backgrounds: {
			'40': { style: 'background-color:#fffaaa' } // black
		}
	},
	serverTimeout: 0,
	command: undefined
})

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
	
	server.timeout = config.serverTimeout;

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

			var style = 'body { background-color: ' + bg + '; color: ' + fg + '; font-family:Monaco, Menlo, monospace; padding:2em;} ' +
						'div#headline { position: absolute; top: 2em; right: 2em ; text-align: right;} ' +
						'div#autoscroll { position: fixed; bottom: 2em; right: 2em ; }' 


			response.write('<html><head><style>' + style + '</style></head>' +
							'<body>' +
							'<div id="headline">Pipe from terminal to browser<br> <br><code style="color:gray">echo 123 | bcat<br>node index.js | bcat<br>tail -f $HISTFILE | bcat</code></div>' +
							'<div id="autoscroll">Auto scroll <input type="checkbox" id="autoscrollToggle" checked /></div>' +
							'<script>' + script + '</script><div id="container">')
		}

		stream.pipe(response)

		response.on('finish', function () {
			process.exit(0)
		})
	}
}


