# node-bcat

Pipe to browser utility, this is (sort of a) a [bcat](https://github.com/rtomayko/bcat) clone in javascript.

```
> npm install -g bcat

> cat somefile | bcat

> echo '<hr>' | bcat
```
Want to see something moving too?

test.js:
```js
setInterval(function () {
	console.log(1)
}, 1000)
```
then
```
> node test.js | bcat
```
![be a good cat](https://raw.github.com/kessler/static/master/bcat.jpg)