var inspect = require('eyes').inspector(/*{ stream: null }*/);
var util = require('util')

console.error('stderr')

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
// '\32'
// 	var str = inspect(obj)

// 	for (var i in str)
// 	console.log(i, str.charCodeAt(i), str[i])
// str = str.replace(, '!!!')
// console.log(str)
}, 1000)
