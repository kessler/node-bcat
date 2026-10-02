#!/usr/bin/env node

import open from 'open';
import { spawn } from 'child_process';
import rc from 'rc';
import usage from './usage.mjs';
import { defaults, normalizeConfig, createBcatServer } from './bcat.mjs';

const rawConfig = rc('bcat', defaults);

if (rawConfig.usage || rawConfig.help) {
  console.log(usage);
  process.exit(0);
}

let config;
try {
  config = normalizeConfig(rawConfig);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const { server, done } = createBcatServer(config, process.stdin);

server.on('listening', () => {
  const url = `http://localhost:${server.address().port}`;
  console.error(`bcat is serving at ${url}`);
  openBrowser(url);
});

server.on('error', err => {
  console.error(`bcat server error: ${err.message}`);
  process.exit(1);
});

server.listen(config.port);

await done;
process.exit(0);

function openBrowser(url) {
  const command = config.command ?? process.env.BROWSER;
  const onError = err => console.error(`Failed to open a browser (${err.message}), open ${url} manually.`);

  if (!command) {
    open(url).catch(onError);
    return;
  }

  const child = spawn(command, [url], { detached: true, stdio: 'ignore' });
  child.on('error', onError);
  child.unref();
}
