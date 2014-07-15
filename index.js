var ansi = require('ansi-html-stream')
var http = require('http')
var replaceStream = require('replacestream')
var os = require('os')

var defaultConfig = {
	contentType: 'text/html',
	scrollDownInterval: 1000,
	backgroundColor: '#000000',
	foregroundColor: '#ffffff',
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
	serverTimeout: 0
}
exports.defaultConfig = defaultConfig

function defaults(obj, def) {
	obj = obj || (Array.isArray(def) ? [] : {})
	for (var field in def) {
		if (def.hasOwnProperty(field)) {
			if (typeof def[field] === 'object')
				obj[field] = defaults(obj[field], def[field])
			else
				if (!obj.hasOwnProperty(field))
					obj[field] = def[field]
		}
	}
	return obj
}

/* this function is rendered into client side script (inside the browser) */
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

var script = '\n' + run.toString() + '\nrun()'

function pipeResponse(config, response, stream) {
	if (config instanceof http.OutgoingMessage) {
		stream = response
		response = config
		config = {}
	}
	config = defaults(config, defaultConfig)
	var contentType = config.contentType

	var bg = config.backgroundColor
	var fg = config.foregroundColor

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

		var style = 'body { background-color: ' + bg + '; color: ' + fg + '; font-family: monospace; white-space: pre-wrap; } ' +
					'div#autoscroll { position: fixed; top: 1em; right: 1em }'


		var clientConfig = {
			scrollDownInterval: config.scrollDownInterval
		}
		response.write('<html><head><style>' + style + '</style></head>' +
						'<body>' +
						'<div id="autoscroll">Auto scroll <input type="checkbox" id="autoscrollToggle" checked /></div>' +
						'<script>var clientConfig = ' + JSON.stringify(clientConfig) + script + '</script><div id="container">')
	}

	stream.pipe(response)
}
exports.pipeResponse = pipeResponse
