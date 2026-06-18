const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// ← ADICIONE ESTAS LINHAS
app.use(express.static(path.join(__dirname)));
// ←

// resto do código...
const PORT = 3000;

const CERT_DIR = path.join(__dirname, 'certs');
const KEY_PATH = path.join(CERT_DIR, 'key.pem');
const CERT_PATH = path.join(CERT_DIR, 'cert.pem');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.csv': 'text/csv; charset=utf-8'
};

function send(res, statusCode, contentType, data) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(data);
}

function serveStaticFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Erro ao ler arquivo: ${filePath}`, err.message);
      send(res, 404, 'text/plain; charset=utf-8', '404 Not Found');
      return;
    }
    send(res, 200, contentType, data);
  });
}

function serverHandler(req, res) {
  const rawUrl = req.url || '/';
  let pathname = decodeURIComponent(rawUrl.split('?')[0]);

  console.log(`[${new Date().toISOString()}] ${req.method} ${rawUrl}`);

  // Redireciona / para welcome.html
  if (pathname === '/') {
    pathname = '/welcome.html';
  }

  // Rotas personalizadas para /index e /camera
  if (pathname === '/index') {
    pathname = '/index.html';
  }

  if (pathname === '/camera') {
    pathname = '/camera.html';
  }

  // Remove leading slash para caminho relativo
  let filePath = path.join(__dirname, pathname);

  // Segurança: impede path traversal
  const resolvedPath = path.resolve(filePath);
  const rootPath = path.resolve(__dirname);
  if (!resolvedPath.startsWith(rootPath)) {
    console.warn(`Tentativa de path traversal bloqueada: ${pathname}`);
    send(res, 403, 'text/plain; charset=utf-8', '403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se o caminho for /model/ sem arquivo específico, tenta index.html dentro de model
      if (pathname === '/model/' || pathname === '/model') {
        const modelIndex = path.join(__dirname, 'model', 'index.html');
        return serveStaticFile(req, res, modelIndex);
      }

      // Fallback para index.html em rotas não encontradas (SPA)
      const fallback = path.join(__dirname, 'index.html');
      return serveStaticFile(req, res, fallback);
    }

    serveStaticFile(req, res, filePath);
  });
}

function startServer() {
  let key;
  let cert;

  try {
    key = fs.readFileSync(KEY_PATH);
    cert = fs.readFileSync(CERT_PATH);
  } catch (err) {
    console.error('Erro ao carregar os certificados SSL:');
    console.error(`Verifique se os arquivos existem em: ${CERT_DIR}`);
    console.error(err.message);
    process.exit(1);
  }

  const options = { key, cert };

  const server = https.createServer(options, serverHandler);

  server.listen(PORT, () => {
    console.log('========================================');
    console.log(`Servidor HTTPS rodando em https://localhost:${PORT}`);
    console.log(`Certificado: ${CERT_PATH}`);
    console.log(`Chave privada: ${KEY_PATH}`);
    console.log('Pressione Ctrl+C para parar');
    console.log('========================================');
  });

  server.on('error', (err) => {
    console.error('Erro no servidor HTTPS:', err.message);
  });
}

startServer();