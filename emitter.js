var inspect = require('eyes').inspector(/*{ stream: null }*/);
var util = require('util')

var obj = {
	x: 1,
	y: 2,
	f: {
		g: 3,
		z: 9
	}
}

console.log('abcdefg foo bar')
inspect(obj)

setInterval(function () {
	inspect(obj)
}, 1000)
