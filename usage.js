var table = require('text-table');

module.exports = table([
['Options:\n'],
['--port', 					'set a port for this bcat execution\n', 	''],
['--contentType', 			'content type header, must be lower case', 	'[default: "text/html"]\n'],
['--backgroundColor', 		'(only in text/html) ', 					'[default: "#000000"]\n'],
['--foregroundColor', 		'(only in text/html) ', 					'[default: "#ffffff"]\n'],
['--tabLength', 			'length of a tab in spaces', 				'[default: 4]\n'],
['--tabReplace', 			'tab replacement', 							'[default: "&nbsp;&nbsp;&nbsp;&nbsp;"\n'],
['--disableTabReplace', 	'disable tab replacement', 					'[default: false]\n'],
['--newlineReplace', 		'new line replacement', 					'[default: "<br />"\n'],
['--disableNewlineReplace', 'disable new line replacement', 			'[default: false]\n'],
['--ansi', 					'show colorful ansi (implies text/html)', 	'[default: true]\n'],
['--ansiOptions', 			'override replacement of ansi black color\n', ''],
['--scrollDownInterval', 	'interval to execute javascript scroll down', '[default: 1000 (ms)]\n'],
['--serverTimeout', 		'http://nodejs.org/api/http.html#http_server_timeout', '[default: 0 (no timeout)]\n'],
]);
