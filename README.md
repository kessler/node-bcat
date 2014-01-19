# node-bcat

Pipe to browser utility, this is (sort of a) a [bcat](https://github.com/rtomayko/bcat) clone in javascript.
## usage
```
  --port                      set a port for this bcat execution
  --contentType               content type header                         [default: "text/html"]
  --ansi                      add --ansi to show colorful ansi
  --ansiBackground, --ansiBg  change the background when displaying ansi  [default: "#000000"]
  --backgroundColor, --bg     change the background color in the browser  [default: "#ffffff"]
```
## example
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