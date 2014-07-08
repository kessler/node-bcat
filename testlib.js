var bcat = require('./');
var fs = require('fs');

var http = require('http');
http.createServer(function (req, res) {
	var file = fs.createReadStream('./test.html');
	bcat.pipeResponse(res, file);
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
