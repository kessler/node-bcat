import table from 'text-table'

export default 'Usage: <command> | bcat [options]\n\nOptions:\n\n' + table([
  ['--port', 'set a port for this bcat execution', '[default: random free port]'],
  ['--contentType', 'content type header, must be lower case', '[default: "text/html"]'],
  ['--backgroundColor', '(only in text/html)', '[default: "#333"]'],
  ['--foregroundColor', '(only in text/html)', '[default: "#fefefe"]'],
  ['--tabLength', 'width of a tab, in spaces', '[default: 4]'],
  ['--tabReplace', 'replace tab characters with this string', '[default: none, tabs are rendered natively]'],
  ['--disableTabReplace', 'disable tab replacement', '[default: false]'],
  ['--newlineReplace', 'new line replacement', '[default: "<br />"]'],
  ['--disableNewlineReplace', 'disable new line replacement', '[default: false]'],
  ['--ansi', 'show colorful ansi (implies text/html)', '[default: true, disable with --no-ansi]'],
  ['--ansiOptions', 'override ansi colors (see README)', ''],
  ['--scrollDownInterval', 'interval to execute javascript scroll down', '[default: 1000 (ms)]'],
  ['--serverTimeout', 'https://nodejs.org/api/http.html#servertimeout', '[default: 0 (no timeout)]'],
  ['--command', 'the command to launch the browser', '[default: $BROWSER, otherwise the os default]']
])
