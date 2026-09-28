import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function positivePort(value) {
  if (!/^\d+$/.test(value ?? '')) {
    throw new Error('PORT must be a positive integer.');
  }
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  return port;
}

const port = positivePort(process.env.PORT ?? '3000');
const distDirectory = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const relativePath = normalize(pathname).replace(/^([/\\])+/, '');
  let filePath = resolve(distDirectory, relativePath || 'index.html');
  if (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${sep}`)) {
    response.writeHead(404).end();
    return;
  }

  let body;
  try {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      if (extname(pathname)) {
        response.writeHead(404).end();
        return;
      }
      filePath = join(distDirectory, 'index.html');
    }
    body = readFileSync(filePath);
  } catch {
    response.writeHead(500).end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    'Content-Length': body.length
  });
  response.end(request.method === 'HEAD' ? undefined : body);
});

server.listen(port, '0.0.0.0', () => {
  console.log('Frontend static server listening.');
});
