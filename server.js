// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Look for certificates in the root directory first (for mkcert localhost)
// then fall back to the certificates directory
let keyPath, certPath;

if (fs.existsSync(path.join(__dirname, 'localhost-key.pem'))) {
  keyPath = path.join(__dirname, 'localhost-key.pem');
  certPath = path.join(__dirname, 'localhost.pem');
  console.log('Using mkcert-generated certificates in root directory');
} else if (fs.existsSync(path.join(__dirname, 'certificates', 'key.pem'))) {
  keyPath = path.join(__dirname, 'certificates', 'key.pem');
  certPath = path.join(__dirname, 'certificates', 'cert.pem');
  console.log('Using certificates from certificates directory');
} else {
  console.error('No SSL certificates found. Please run "mkcert localhost" in the project root.');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
