var bcat = require('./');

var http = require('http');
http.createServer(function (req, res) {
  var tail = require('child_process').spawn('tail', ['-c', '+0', '-f', './test.html']).stdout;
	bcat.pipeResponse(res, tail);
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
