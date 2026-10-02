import test from 'ava';
import http from 'http';
import { once } from 'events';
import { PassThrough } from 'stream';
import { defaults, normalizeConfig, createBcatServer } from './bcat.mjs';

async function start(overrides = {}) {
  const input = new PassThrough();
  const { server, done } = createBcatServer(normalizeConfig({ ...defaults, ...overrides }), input);
  server.listen(0);
  await once(server, 'listening');
  const url = `http://localhost:${server.address().port}`;
  return { input, server, done, url };
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve({ response, body }));
    }).on('error', reject);
  });
}

// resolves once the response headers arrived, i.e. the client is registered
function connect(url) {
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      const ended = once(response, 'end').then(() => body);
      resolve({ response, ended });
    }).on('error', reject);
  });
}

function content(body) {
  return body.split('<div id="container">')[1];
}

test('serves the page with piped content and utf-8 charset', async t => {
  const { input, server, done, url } = await start();
  const client = await connect(url);
  input.end('hello\n');
  const body = await client.ended;
  await done;
  server.close();

  t.is(client.response.headers['content-type'], 'text/html; charset=utf-8');
  t.true(body.includes('Pipe from terminal to browser'));
  t.is(content(body), 'hello<br />');
});

test('escapes html when ansi is disabled', async t => {
  const { input, server, url } = await start({ ansi: 'false' });
  const client = await connect(url);
  input.end('<script>alert(1)</script>');
  const body = await client.ended;
  server.close();

  t.is(content(body), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('keeps multi-byte characters split across chunks intact', async t => {
  const { input, server, url } = await start({ ansi: false });
  const client = await connect(url);
  const bytes = Buffer.from('é');
  input.write(bytes.subarray(0, 1));
  input.end(bytes.subarray(1));
  const body = await client.ended;
  server.close();

  t.is(content(body), 'é');
});

test('applies ansiOptions overrides without dropping other colors', async t => {
  const { input, server, url } = await start();
  const client = await connect(url);
  input.end('\x1b[30mblack\x1b[0m \x1b[31mred\x1b[0m');
  const body = await client.ended;
  server.close();

  t.true(content(body).includes('<span style="color:#fffaaa">black</span>'));
  t.true(content(body).includes('<span style="color:#ff7e76">red</span>'));
});

test('renders tabs natively unless tabReplace is set', async t => {
  const native = await start();
  const nativeClient = await connect(native.url);
  native.input.end('a\tb    c');
  const nativeBody = await nativeClient.ended;
  native.server.close();

  t.is(content(nativeBody), 'a\tb    c');
  t.true(nativeBody.includes('tab-size: 4'));

  const replaced = await start({ tabReplace: '&nbsp;&nbsp;' });
  const replacedClient = await connect(replaced.url);
  replaced.input.end('a\tb');
  const replacedBody = await replacedClient.ended;
  replaced.server.close();

  t.is(content(replacedBody), 'a&nbsp;&nbsp;b');
});

test('non html content types are passed through untouched', async t => {
  const { input, server, url } = await start({ ansi: false, contentType: 'text/plain' });
  const client = await connect(url);
  input.end('a\n<b>\n');
  const body = await client.ended;
  server.close();

  t.is(client.response.headers['content-type'], 'text/plain; charset=utf-8');
  t.is(body, 'a\n<b>\n');
});

test('other paths return 404 and do not consume the input', async t => {
  const { input, server, url } = await start();
  const favicon = await get(`${url}/favicon.ico`);
  t.is(favicon.response.statusCode, 404);

  input.write('early\n');
  const client = await connect(url);
  input.end('late\n');
  const body = await client.ended;
  server.close();

  t.is(content(body), 'early<br />late<br />');
});

test('broadcasts to every connected client', async t => {
  const { input, server, url } = await start();
  const first = await connect(url);
  const second = await connect(url);
  input.end('shared\n');
  const bodies = await Promise.all([first.ended, second.ended]);
  server.close();

  t.deepEqual(bodies.map(content), ['shared<br />', 'shared<br />']);
});

test('normalizeConfig coerces string flags', t => {
  const config = normalizeConfig({ ...defaults, ansi: 'false', disableTabReplace: 'true', port: '8080' });

  t.false(config.ansi);
  t.true(config.disableTabReplace);
  t.is(config.port, 8080);
  t.throws(() => normalizeConfig({ ...defaults, port: 'abc' }), { message: /port/ });
});
