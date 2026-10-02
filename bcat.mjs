import http from 'http';
import { PassThrough, Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { finished } from 'stream/promises';
import ansi from '@kessler/ansi-html-stream';
import ansiColors from '@kessler/ansi-html-stream/colors.js';
import replaceStream from 'replacestream';

export const defaults = {
  port: 0,
  contentType: 'text/html',
  scrollDownInterval: 1000,
  backgroundColor: '#333',
  foregroundColor: '#fefefe',
  tabLength: 4,
  tabReplace: undefined,
  disableTabReplace: false,
  newlineReplace: '<br />',
  disableNewlineReplace: false,
  ansi: true,
  ansiOptions: {
    foregrounds: {
      '30': { style: 'color:#fffaaa' }, // black
    },
    backgrounds: {
      '40': { style: 'background-color:#fffaaa' }, // black
    }
  },
  serverTimeout: 0,
  command: undefined
};

const booleanKeys = ['ansi', 'disableTabReplace', 'disableNewlineReplace'];
const numberKeys = ['port', 'scrollDownInterval', 'tabLength', 'serverTimeout'];

// rc/minimist hand over strings for values like `--ansi false` or `bcat_port=8080`
export function normalizeConfig(config) {
  const normalized = { ...config };

  for (const key of booleanKeys) {
    normalized[key] = toBoolean(normalized[key]);
  }

  for (const key of numberKeys) {
    const value = Number(normalized[key]);
    if (Number.isNaN(value)) {
      throw new Error(`--${key} must be a number, got "${normalized[key]}"`);
    }

    normalized[key] = value;
  }

  return normalized;
}

function toBoolean(value) {
  if (typeof value !== 'string') {
    return Boolean(value);
  }

  return !['false', '0', 'no', 'off', ''].includes(value.trim().toLowerCase());
}

function utf8Decoder() {
  const decoder = new StringDecoder('utf8');

  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, decoder.write(chunk));
    },
    flush(callback) {
      callback(null, decoder.end());
    }
  });
}

const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function htmlEscaper() {
  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString().replace(/[&<>"']/g, c => htmlEntities[c]));
    }
  });
}

// ansi-html-stream merges its theme shallowly, so overriding one color would drop the rest of its group
function ansiTheme(overrides = {}) {
  const theme = {};

  for (const [group, codes] of Object.entries(overrides)) {
    theme[group] = { ...ansiColors.inline[group], ...codes };
  }

  return theme;
}

function isHtml(config) {
  return config.ansi || config.contentType === 'text/html';
}

function buildPipeline(config, input) {
  let stream = input.pipe(utf8Decoder());

  if (config.ansi) {
    // ansi-html-stream escapes html on its own
    stream = stream.pipe(ansi({ theme: ansiTheme(config.ansiOptions) }));
  } else if (isHtml(config)) {
    stream = stream.pipe(htmlEscaper());
  }

  if (isHtml(config) && !config.disableTabReplace && config.tabReplace !== undefined) {
    stream = stream.pipe(replaceStream('\t', config.tabReplace));
  }

  if (isHtml(config) && !config.disableNewlineReplace) {
    stream = stream.pipe(replaceStream('\r\n', config.newlineReplace)).pipe(replaceStream('\n', config.newlineReplace));
  }

  // end with a modern stream so pause() / resume() are reliable
  return stream.pipe(new PassThrough());
}

function clientScript(clientConfig) {
  function run() {
    let ref;

    const startAutoScroll = () => {
      ref = setInterval(() => {
        document.getElementById('container').scrollIntoView(false);
      }, clientConfig.scrollDownInterval);
    };

    const stopAutoScroll = () => {
      clearInterval(ref);
    };

    const scrollToggle = document.getElementById('autoscrollToggle');
    if (scrollToggle) {
      scrollToggle.addEventListener('change', () => {
        scrollToggle.checked ? startAutoScroll() : stopAutoScroll();
      });
    }

    startAutoScroll();
  }

  return `var clientConfig = ${JSON.stringify(clientConfig)};\n${run.toString()}\nrun();`;
}

function pageHeader(config) {
  const { backgroundColor: bg, foregroundColor: fg } = config;
  const script = clientScript({ scrollDownInterval: config.scrollDownInterval });
  const style = `body { background-color: ${bg}; color: ${fg}; font-family:Monaco, Menlo, monospace; padding:2em; }
    div#headline { position: fixed; top: 2em; right: 2em; text-align: right; }
    div#autoscroll { position: fixed; bottom: 2em; right: 2em; }
    div#container { white-space: pre-wrap; tab-size: ${config.tabLength}; }`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${style}</style></head>
    <body>
    <div id="headline">Pipe from terminal to browser<br><br><code style="color:gray">started at: ${new Date()}</code></div>
    <div id="autoscroll">Auto scroll <input type="checkbox" id="autoscrollToggle" checked /></div>
    <script>${script}</script><div id="container">`;
}

/**
 * Serves `input` to every client of `/`. Each client receives the output produced
 * while it is connected; reading pauses while no client is connected.
 * `done` resolves once `input` ended and every client received all of it.
 */
export function createBcatServer(config, input) {
  const output = buildPipeline(config, input);
  const clients = new Set();
  const contentType = isHtml(config) ? 'text/html' : config.contentType;
  let ended = false;

  output.pause();

  output.on('data', chunk => {
    for (const response of clients) {
      response.write(chunk);
    }
  });

  const done = new Promise(resolve => {
    output.on('end', async () => {
      ended = true;
      const responses = [...clients];
      responses.forEach(response => response.end());
      await Promise.allSettled(responses.map(response => finished(response)));
      resolve();
    });
  });

  const server = http.createServer((request, response) => {
    if (request.url !== '/') {
      response.statusCode = 404;
      response.end();
      return;
    }

    response.setHeader('Content-Type', contentType.includes('charset') ? contentType : `${contentType}; charset=utf-8`);

    if (contentType === 'text/html') {
      response.write(pageHeader(config));
    } else {
      response.flushHeaders();
    }

    if (ended) {
      response.end();
      return;
    }

    clients.add(response);
    output.resume();

    response.on('close', () => {
      clients.delete(response);
      if (clients.size === 0) {
        output.pause();
      }
    });
  });

  server.timeout = config.serverTimeout;

  return { server, done };
}
