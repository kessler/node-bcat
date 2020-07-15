# node-bcat
Pipe to the browser utility, Very useful for log tail fun :)

node-bcat features auto scrolling (with enable/disable), ansi to html coloring (--ansi) and behavior and color customization.

This module uses [RC](https://github.com/dominictarr/rc) to manage its configuration, so in addition to command line arguments you may save your favorite configuration in .bcatrc. 

## example
```
> npm install -g bcat

> cat somefile | bcat

// redirect error stream also
> node index.js 2>&1 | bcat
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
![screenshot](https://raw.github.com/kessler/static/master/node-bcat.png)

## usage
```
 --port                   set a port for this bcat execution
 --contentType            content type header, must be lower case      [default: "text/html"]
 --backgroundColor        (only in text/html)                          [default: "#000000"]
 --foregroundColor        (only in text/html)                          [default: "#ffffff"]
 --tabLength              length of a tab in spaces                    [default: 4]
 --tabReplace             tab replacement                              [default: "&nbsp;&nbsp;&nbsp;&nbsp;"
 --disableTabReplace      disable tab replacement                      [default: false]
 --newlineReplace         new line replacement                         [default: "<br />"
 --disableNewlineReplace  disable new line replacement                 [default: false]
 --ansi                   show colorful ansi (implies text/html)       [default: true]
 --ansiOptions            override replacement of ansi black color
 --scrollDownInterval     interval to execute javascript scroll down   [default: 1000 (ms)]
 --serverTimeout          http://nodejs.org/api/http.html#http_server_timeout  [default: 0 (no timeout)]
```
- _An available port between 8080 - 8181 will be automatically picked if --port is not specified_
- _ansi feature is on by default_

![be a good cat](https://raw.github.com/kessler/static/master/bcat.jpg)

## related
[catchart](https://github.com/kessler/catchart) - pipe data into charts in your browser

[scat](https://github.com/hughsk/scat) - pipes javascript into your browser

[hcat](https://github.com/kessler/node-hcat) - pipes html into your browser

[bpipe](https://github.com/Marak/bpipe) - bidirectional piping between unix and the browser

[browser-run](https://github.com/juliangruber/browser-run) - The easiest way of running code in a browser environment

Inspired by a ruby [bcat](https://github.com/rtomayko/bcat) implementation
