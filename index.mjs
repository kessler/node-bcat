#!/usr/bin/env node

import open from 'open';
import isos from 'isos';
import http from 'http';
import { spawn } from 'child_process';
import ansi from '@kessler/ansi-html-stream';
import replaceStream from 'replacestream';
import os from 'os';
import rc from 'rc';

const config = rc('bcat', {
    port: 0,
    contentType: 'text/html',
    scrollDownInterval: 1000,
    backgroundColor: '#333',
    foregroundColor: '#fefefe',
    tabLength: 4,
    tabReplace: '&nbsp;&nbsp;&nbsp;&nbsp;',
    disableTabReplace: false,
    newlineReplace: '<br />',
    disableNewlineReplace: false,
    ansi: true,
    ansiOptions: {
        foregrounds: {
            '30': { style: 'color:#fffaaa' },
        },
        backgrounds: {
            '40': { style: 'background-color:#fffaaa' },
        }
    },
    serverTimeout: 0,
    command: undefined
});

if (config.usage || config.help) {
    console.log(await import('./usage.js'));
    process.exit(0);
}

cat(config.port);

const clientConfig = {
    scrollDownInterval: config.scrollDownInterval
};

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

const script = `var clientConfig = ${JSON.stringify(clientConfig)};\n${run.toString()}\nrun();`;

function cat(port) {
    const server = http.createServer(handler);

    server.on('listening', () => {
        const url = `http://localhost:${server.address().port}`;

        if (!process.env.BROWSER) {
            console.error('The environment variable $BROWSER is not set. Falling back to default opening mechanism.');
            open(url, { wait: false });
        } else {
            console.error(`The environment variable $BROWSER is set to "${process.env.BROWSER}"`);
            spawn(process.env.BROWSER, [url], { detached: true });
        }
    });

    server.listen(port);
    server.timeout = config.serverTimeout;
}

function handler(request, response) {
    let contentType = config.contentType;
    const { backgroundColor: bg, foregroundColor: fg } = config;
    let stream = process.stdin;

    if (config.ansi) {
        contentType = 'text/html';
        stream = stream.pipe(ansi(config.ansiOptions));
    }

    if (!config.disableTabReplace) {
        const tab = ' '.repeat(config.tabLength);
        stream = stream.pipe(replaceStream(tab, config.tabReplace));
    }

    if (!config.disableNewlineReplace) {
        stream = stream.pipe(replaceStream(os.EOL, config.newlineReplace)).pipe(replaceStream('\n', config.newlineReplace));
    }

    response.setHeader('Content-Type', contentType);

    if (contentType === 'text/html') {
        const style = `body { background-color: ${bg}; color: ${fg}; font-family:Monaco, Menlo, monospace; padding:2em; } 
            div#headline { position: fixed; top: 2em; right: 2em; text-align: right; } 
            div#autoscroll { position: fixed; bottom: 2em; right: 2em; }`;

        response.write(`<!DOCTYPE html><html><head><style>${style}</style></head>
            <body>
            <div id="headline">Pipe from terminal to browser<br><br><code style="color:gray">started at: ${new Date()}</code></div>
            <div id="autoscroll">Auto scroll <input type="checkbox" id="autoscrollToggle" checked /></div>
            <script>${script}</script><div id="container">`);
    }

    stream.pipe(response);

    response.on('finish', () => process.exit(0));
}
