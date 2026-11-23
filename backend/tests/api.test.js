'use strict';

// The whole API with an in-memory database and a fake mail server.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const { createApp } = require('../src/app');
const { openDatabase } = require('../src/db');
const { seedDemo, DEMO_PASSWORD } = require('../src/seed');
const { hashPassword, verifyPassword } = require('../src/passwords');
const { matchesModel } = require('../src/routes/products');

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex',
);

function setup({ seed = true } = {}) {
  const db = openDatabase(':memory:');
  if (seed) seedDemo(db);
  const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-uploads-'));
  const sent = [];
  const mailer = { sendMail: async (m) => sent.push(m) };
  const log = { error: () => {} };
  const app = createApp({ db, uploadsDir, mailer, log });
  return { db, app, uploadsDir, sent };
}

async function login(app, username, password = DEMO_PASSWORD) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password }).expect(200);
  return agent;
}

test('passwords are hashed, never stored as they are', () => {
  const hash = hashPassword('тайна-парола');
  assert.ok(!hash.includes('тайна'));
  assert.ok(verifyPassword('тайна-парола', hash));
  assert.ok(!verifyPassword('друга', hash));
  assert.notEqual(hashPassword('x1234567'), hashPassword('x1234567')); // salted
});

test('model search ignores case, spaces and word order', () => {
  assert.ok(matchesModel('Samsung Galaxy Ace', 'galaxy'));
  assert.ok(matchesModel('Samsung Galaxy Ace', 'ace galaxy'));
  assert.ok(matchesModel('Samsung Galaxy Ace', 'Galaxy-Ace'));
  assert.ok(matchesModel('iPhone 15', 'iphone15'));
  assert.ok(!matchesModel('iPhone 15', 'iphone 13'));
});

test('register, log in, log out', async () => {
  const { app, db } = setup();
  const agent = request.agent(app);

  let res = await agent
    .post('/api/auth/register')
    .send({ username: 'Иван', email: 'Ivan@Example.com', password: 'много-тайно', role: 'buyer' })
    .expect(201);
  assert.equal(res.body.username, 'Иван');
  assert.equal(res.body.email, 'ivan@example.com');
  assert.match(res.headers['set-cookie'][0], /HttpOnly/);
  assert.match(res.headers['set-cookie'][0], /SameSite=Lax/);

  const stored = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('Иван');
  assert.ok(stored.password_hash.startsWith('scrypt$'));

  res = await agent.get('/api/auth/me').expect(200);
  assert.equal(res.body.role, 'buyer');
  assert.equal(res.body.password_hash, undefined);

  await agent.post('/api/auth/logout').expect(204);
  res = await agent.get('/api/auth/me').expect(200);
  assert.equal(res.body, null);

  // Log in again with the e-mail instead of the username.
  await request(app).post('/api/auth/login').send({ username: 'IVAN@example.com', password: 'много-тайно' }).expect(200);
});

test('registration errors are clear and per field', async () => {
  const { app } = setup();
  let res = await request(app).post('/api/auth/register').send({ username: 'a', email: 'x', password: '123', role: 'admin' }).expect(400);
  assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'password', 'role', 'username']);

  res = await request(app).post('/api/auth/register').send({ username: 'DEMO-BUYER', email: 'new@example.com', password: '12345678', role: 'buyer' }).expect(409);
  assert.ok(res.body.fields.username);
  res = await request(app).post('/api/auth/register').send({ username: 'new', email: 'BUYER@example.com', password: '12345678', role: 'buyer' }).expect(409);
  assert.ok(res.body.fields.email);

  res = await request(app).post('/api/auth/register').send({ username: 'firma', email: 'f@example.com', password: '12345678', role: 'seller' }).expect(400);
  assert.ok(res.body.fields.companyName);
});

test('wrong passwords: same answer for unknown users, then a lockout', async () => {
  const { app } = setup();
  const a = await request(app).post('/api/auth/login').send({ username: 'demo-buyer', password: 'wrong' }).expect(401);
  const b = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'wrong' }).expect(401);
  assert.equal(a.body.error, b.body.error);
  for (let i = 0; i < 7; i++) await request(app).post('/api/auth/login').send({ username: 'demo-buyer', password: 'wrong' });
  await request(app).post('/api/auth/login').send({ username: 'demo-buyer', password: DEMO_PASSWORD }).expect(429);
});

test('search by name, by size with tolerance, colour, price and stock', async () => {
  const { app } = setup();
  const models = async (query) => (await request(app).get('/api/products').query(query).expect(200)).body.map((p) => p.phoneModel);

  assert.equal((await models({})).length, 12);
  assert.deepEqual(await models({ q: 'galaxy ace' }), ['Samsung Galaxy Ace']);
  assert.deepEqual([...new Set(await models({ q: 'IPHONE 15' }))], ['iPhone 15']);

  // iPhone 13 and 12 Pro have the same size: one search finds both.
  const fit = (await request(app).get('/api/products').query({ height: 146.7, width: 71.5, thickness: 7.5 }).expect(200)).body;
  assert.deepEqual(fit.map((p) => p.phoneModel).slice(0, 2).sort(), ['iPhone 12 Pro', 'iPhone 13']);
  assert.ok(fit.every((p) => p.sizeDifferenceMm <= 1.5));
  assert.ok(fit[0].sizeDifferenceMm <= fit.at(-1).sizeDifferenceMm); // best fit first

  // Height and width are not mixed up (the 2023 bug).
  assert.deepEqual(await models({ height: 119.9, width: 64, thickness: 9.9, tolerance: 0.5 }), ['Nokia Lumia 520']);
  assert.deepEqual(await models({ height: 64, width: 119.9, thickness: 9.9, tolerance: 0.5 }), []);

  assert.ok((await models({ color: 'черен' })).length >= 4);
  assert.ok((await request(app).get('/api/products').query({ maxPrice: '10,00' })).body.every((p) => p.price <= 10));
  assert.ok(!(await models({ inStock: 'true' })).includes('Samsung Galaxy Ace')); // stock 0

  const prices = (await request(app).get('/api/products').query({ sort: 'price' })).body.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((x, y) => x - y));

  const filters = (await request(app).get('/api/products/filters').expect(200)).body;
  assert.ok(filters.colors.includes('Прозрачен'));
});

test('only sellers add products, only to their own name, with real pictures', async () => {
  const { app, uploadsDir } = setup();
  const buyer = await login(app, 'demo-buyer');
  await buyer.post('/api/products').field('phoneModel', 'X').expect(403);
  await request(app).post('/api/products').field('phoneModel', 'X').expect(401);

  const seller = await login(app, 'demo-seller');
  let res = await seller
    .post('/api/products')
    .field({ phoneModel: 'Pixel 9', heightMm: '152,8', widthMm: '72', thicknessMm: '8.5', color: 'Син', price: '19,90', stock: '7' })
    .attach('image', PNG, { filename: '../../evil.html', contentType: 'text/html' })
    .expect(201);
  assert.equal(res.body.price, 19.9);
  assert.equal(res.body.heightMm, 152.8);
  assert.match(res.body.imageUrl, /^\/uploads\/[0-9a-f-]{36}\.png$/); // random name, type from the bytes
  assert.ok(fs.existsSync(path.join(uploadsDir, path.basename(res.body.imageUrl))));
  const id = res.body.id;
  await request(app).get(res.body.imageUrl).expect(200).expect('Content-Type', 'image/png');

  // A file that is not an image is refused.
  res = await seller
    .post('/api/products')
    .field({ phoneModel: 'Pixel 9', heightMm: 152, widthMm: 72, thicknessMm: 8.5, color: 'Син', price: 10, stock: 1 })
    .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'photo.jpg', contentType: 'image/jpeg' })
    .expect(400);
  assert.ok(res.body.fields.image);

  res = await seller.post('/api/products').field({ phoneModel: 'P', heightMm: 999, price: 0 }).expect(400);
  assert.ok(res.body.fields.heightMm && res.body.fields.price && res.body.fields.color);

  // Edit and delete own product; another seller cannot.
  res = await seller.patch(`/api/products/${id}`).field({ stock: '3', removeImage: 'true' }).expect(200);
  assert.equal(res.body.stock, 3);
  assert.equal(res.body.imageUrl, null);

  const other = request.agent(app);
  await other.post('/api/auth/register').send({ username: 'other', email: 'o@example.com', password: '12345678', role: 'seller', companyName: 'Друга фирма' }).expect(201);
  await other.patch(`/api/products/${id}`).field({ stock: '0' }).expect(403);
  await other.delete(`/api/products/${id}`).expect(403);

  const mine = (await seller.get('/api/products/mine').expect(200)).body;
  assert.equal(mine[0].id, id);
  await seller.delete(`/api/products/${id}`).expect(204);
  await request(app).get(`/api/products/${id}`).expect(404);
});

test('cart and checkout: stock is checked and lowered in one go', async () => {
  const { app, db } = setup();
  const buyer = await login(app, 'demo-buyer');
  const products = (await request(app).get('/api/products').query({ q: 'lumia' })).body;
  const lumia = products[0]; // stock 3

  await request(app).get('/api/cart').expect(401);
  let cart = (await buyer.put(`/api/cart/${lumia.id}`).send({ quantity: 2 }).expect(200)).body;
  assert.equal(cart.count, 2);
  assert.equal(cart.total, 11.8);
  await buyer.put(`/api/cart/${lumia.id}`).send({ quantity: 5 }).expect(409); // only 3

  const ace = (await request(app).get('/api/products').query({ q: 'ace' })).body[0];
  await buyer.put(`/api/cart/${ace.id}`).send({ quantity: 1 }).expect(409); // sold out

  // The cart stays after logging out and in again (kept in the database).
  await buyer.post('/api/auth/logout').expect(204);
  const again = await login(app, 'demo-buyer');
  assert.equal((await again.get('/api/cart').expect(200)).body.count, 2);

  // Someone else buys in the meantime: checkout refuses and changes nothing.
  db.prepare('UPDATE products SET stock = 1 WHERE id = ?').run(lumia.id);
  const refused = await again.post('/api/orders').expect(409);
  assert.match(refused.body.error, /Lumia/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 0);

  db.prepare('UPDATE products SET stock = 3 WHERE id = ?').run(lumia.id);
  const order = (await again.post('/api/orders').expect(201)).body;
  assert.equal(order.total, 11.8);
  assert.equal(order.items[0].quantity, 2);
  assert.equal((await request(app).get(`/api/products/${lumia.id}`)).body.stock, 1);
  assert.equal((await again.get('/api/cart')).body.count, 0);
  await again.post('/api/orders').expect(400); // empty cart

  // Order history keeps the price paid even if the product changes later.
  db.prepare('UPDATE products SET price_cents = 9999 WHERE id = ?').run(lumia.id);
  const history = (await again.get('/api/orders').expect(200)).body;
  assert.equal(history[0].items[0].price, 5.9);

  await again.put(`/api/cart/${lumia.id}`).send({ quantity: 1 }).expect(200);
  cart = (await again.delete(`/api/cart/${lumia.id}`).expect(200)).body;
  assert.equal(cart.count, 0);
});

test('requests for missing cases reach every seller by e-mail', async () => {
  const { app, sent } = setup();
  const res = await request(app)
    .post('/api/requests')
    .send({ phoneModel: 'Nokia 3310', heightMm: '115,5', widthMm: 48, thicknessMm: 22, email: 'client@example.com', details: 'червен, ако има' })
    .expect(201);
  assert.equal(res.body.emailed, 1);
  assert.deepEqual(sent[0].bcc, ['seller@example.com']);
  assert.equal(sent[0].replyTo, 'client@example.com');
  assert.match(sent[0].text, /115.5 × 48 × 22/);

  await request(app).post('/api/requests').send({ phoneModel: '', email: 'bad' }).expect(400);

  const buyer = await login(app, 'demo-buyer');
  await buyer.get('/api/requests').expect(403);
  const seller = await login(app, 'demo-seller');
  const list = (await seller.get('/api/requests').expect(200)).body;
  assert.equal(list[0].phoneModel, 'Nokia 3310');
  assert.equal(list[0].email, 'client@example.com');
});

test('SQL in input is only text', async () => {
  const { app, db } = setup();
  const evil = "x'); DROP TABLE users; --";
  await request(app).get('/api/products').query({ q: evil, color: evil }).expect(200);
  await request(app).post('/api/auth/login').send({ username: evil, password: evil }).expect(401);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 2);
});

test('errors are JSON with the right status', async () => {
  const { app } = setup({ seed: false });
  await request(app).get('/api/nothing').expect(404);
  await request(app).get('/api/products/abc').expect(404);
  const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"oops').expect(400);
  assert.equal(bad.body.error, 'Невалиден JSON.');
  await request(app).get('/uploads/none.png').expect(404);
  const page = await request(app).get('/api/health').expect(200);
  assert.ok(page.headers['content-security-policy']);
  assert.equal(page.headers['x-powered-by'], undefined);
});
