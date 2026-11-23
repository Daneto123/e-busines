'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');

const { loadUser } = require('./auth');
const { HttpError } = require('./validation');
const { MAX_BYTES } = require('./images');

/**
 * The web application (without listen(), so tests can use it directly).
 *   db          node:sqlite database
 *   uploadsDir  where product pictures are kept
 *   mailer      { sendMail } or null
 *   frontendDir built Angular app to serve (optional)
 */
function createApp({ db, uploadsDir, mailer = null, frontendDir = null, log = console, trustProxy = false }) {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1); // behind Render, Railway, nginx … (for HTTPS cookies)

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:'],
        },
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(loadUser(db));

  const deps = { db, uploadsDir, mailer, log };
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', require('./routes/auth')(deps));
  app.use('/api/products', require('./routes/products')(deps));
  app.use('/api', require('./routes/shop')(deps));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Няма такъв адрес в API.' }));

  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true, fallthrough: false }));

  // The Angular site: files as they are, any other page -> index.html (the
  // Angular router decides what to show).
  if (frontendDir && fs.existsSync(path.join(frontendDir, 'index.html'))) {
    app.use(express.static(frontendDir, { index: false }));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, ...(err.fields && { fields: err.fields }) });
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? `Снимката е твърде голяма (до ${MAX_BYTES / 1024 / 1024} MB).` : 'Невалидно качване на файл.';
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: message, fields: { image: message } });
    }
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Невалиден JSON.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Данните са твърде големи.' });
    if (err.status === 404 || err.statusCode === 404) return res.status(404).json({ error: 'Няма такъв файл.' });
    log.error(err);
    return res.status(500).json({ error: 'Грешка в сървъра. Опитайте отново.' });
  });

  return app;
}

module.exports = { createApp };
