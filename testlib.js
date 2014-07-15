var bcat = require('./')

var http = require('http')
http.createServer(function (req, res) {
	var proc = require('child_process').spawn('tail', ['-c', '+0', '-f', './test.html'])
  var tail = proc.stdout
	bcat.pipeResponse(res, tail)
	res.on('close', function () {
		proc.kill()
	})
	// Note: this will leave tail running if you kill the node process before the
	// client disconnects!  Instead, you may want to consider using
	// node-tail-stream ( https://github.com/juul/tail-stream
	// though that may leak a FSWatcher object on each client or
	// jimbly-tail-stream ( https://github.com/Jimbly/node-tail-stream )
}).listen(1337)
console.log('Server running at http://127.0.0.1:1337/')
