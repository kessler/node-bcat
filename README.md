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
Want to see something moving too? Clone this repo, `npm install`, then run the included emitter, which prints an object every second:
```
> node emitter.js | bcat
```
![screenshot](https://raw.github.com/kessler/static/master/node-bcat.png)

## usage
```
Usage: <command> | bcat [options]

Options:

--port                   set a port for this bcat execution              [default: random free port]
--contentType            content type header, must be lower case         [default: "text/html"]
--backgroundColor        (only in text/html)                             [default: "#333"]
--foregroundColor        (only in text/html)                             [default: "#fefefe"]
--tabLength              width of a tab, in spaces                       [default: 4]
--tabReplace             replace tab characters with this string         [default: none, tabs are rendered natively]
--disableTabReplace      disable tab replacement                         [default: false]
--newlineReplace         new line replacement                            [default: "<br />"]
--disableNewlineReplace  disable new line replacement                    [default: false]
--ansi                   show colorful ansi (implies text/html)          [default: true, disable with --no-ansi]
--ansiOptions            override ansi colors (see README)
--scrollDownInterval     interval to execute javascript scroll down      [default: 1000 (ms)]
--serverTimeout          https://nodejs.org/api/http.html#servertimeout  [default: 0 (no timeout)]
--command                the command to launch the browser               [default: $BROWSER, otherwise the os default]
```
- _A random free port is picked if --port is not specified_
- _ansi feature is on by default, disable it with `--no-ansi`_
- _the browser is launched using `--command`, then `$BROWSER`, then the os default. If launching fails, open the printed url manually_
- _every browser tab connected to bcat receives the output from the moment it connects. While no tab is connected, bcat pauses reading its input, so reloading the page does not lose output_
- _override ansi colors with `--ansiOptions.<group>.<code>.style`, e.g. `--ansiOptions.foregrounds.30.style="color:#fff"`. groups are `foregrounds`, `backgrounds`, `bold` and `underline`_

![be a good cat](https://raw.github.com/kessler/static/master/bcat.jpg)

## older version

Since 3.0.0 the code base was updated and all dependencies too. The older version is at `bcat@2.0.0`

## related
[catchart](https://github.com/kessler/catchart) - pipe data into charts in your browser

[scat](https://github.com/hughsk/scat) - pipes javascript into your browser

[hcat](https://github.com/kessler/node-hcat) - pipes html into your browser

[bpipe](https://github.com/Marak/bpipe) - bidirectional piping between unix and the browser

[browser-run](https://github.com/juliangruber/browser-run) - The easiest way of running code in a browser environment

Inspired by a ruby [bcat](https://github.com/rtomayko/bcat) implementation
