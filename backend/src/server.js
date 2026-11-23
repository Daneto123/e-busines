'use strict';

// Starts the shop: npm start (in the backend folder)

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const { createApp } = require('./app');
const { openDatabase } = require('./db');
const { createMailer } = require('./mail');
const { seedDemo, DEMO_PASSWORD } = require('./seed');

const root = path.join(__dirname, '..');
const DATA_DIR = path.resolve(root, process.env.DATA_DIR || 'data');
const PORT = Number(process.env.PORT) || 5200;

const db = openDatabase(path.join(DATA_DIR, 'shop.db'));
if (process.env.SEED_DEMO !== 'false' && seedDemo(db)) {
  console.log(`Добавени са примерни данни. Вход: demo-buyer / demo-seller, парола ${DEMO_PASSWORD}`);
}

const mailer = createMailer();
if (!mailer) console.log('Няма SMTP настройки: заявките за калъфи се пазят само в базата (панел на продавача).');

const app = createApp({
  db,
  uploadsDir: path.join(DATA_DIR, 'uploads'),
  mailer,
  frontendDir: path.resolve(root, process.env.FRONTEND_DIR || '../frontend/dist/frontend/browser'),
  trustProxy: process.env.TRUST_PROXY === 'true',
});

const server = app.listen(PORT, () => {
  console.log(`Магазинът работи на http://localhost:${PORT}`);
});

const stop = () => server.close(() => {
  db.close();
  process.exit(0);
});
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
