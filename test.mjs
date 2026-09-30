import test from 'ava';
import http from 'http';
import { cat } from './index.mjs'; // Adjust the import to your script's file path

test('server responds with expected content', async t => {
  const port = 3000; // Choose a port for testing
  const server = cat(port);

  const response = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}`, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });

  t.is(response.statusCode, 200);
  t.true(response.data.includes('Pipe from terminal to browser'));

  server.close();
});