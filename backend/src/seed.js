'use strict';

// Demo data for an empty shop: two accounts and a few cases, so the site has
// something to show right away. Turn off with SEED_DEMO=false.
// Sizes are the phone's height × width × thickness in mm (approximate).

const { hashPassword } = require('./passwords');
const { transaction } = require('./db');

const DEMO_PASSWORD = 'demo12345';

const PRODUCTS = [
  ['iPhone 15', 147.6, 71.6, 7.8, 'Черен', 'Силикон', 'Мек силиконов калъф с микрофибър отвътре.', 1990, 25],
  ['iPhone 15', 147.6, 71.6, 7.8, 'Прозрачен', 'TPU', 'Тънък прозрачен калъф, не пожълтява.', 1290, 40],
  ['iPhone 13', 146.7, 71.5, 7.65, 'Син', 'Силикон', 'Силиконов калъф с повдигнати ръбове около камерата.', 1590, 12],
  ['iPhone 12 Pro', 146.7, 71.5, 7.4, 'Черен', 'Карбон', 'Твърд калъф с карбонова текстура.', 1790, 8],
  ['Samsung Galaxy S24', 147.0, 70.6, 7.6, 'Черен', 'Карбон', 'Удароустойчив калъф с карбонова текстура.', 1890, 15],
  ['Samsung Galaxy A55', 161.1, 77.4, 8.2, 'Зелен', 'Силикон', 'Матов силиконов калъф.', 1390, 20],
  ['Samsung Galaxy A13 4G', 165.1, 76.4, 8.8, 'Черен', 'Карбон', 'Premium Carbon Case.', 990, 30],
  ['Xiaomi Redmi Note 13', 162.2, 75.6, 8.0, 'Червен', 'Кожа', 'Калъф тип книга от еко кожа с джоб за карта.', 1490, 10],
  ['Google Pixel 8', 150.5, 70.8, 8.9, 'Бежов', 'Плат', 'Калъф с текстилна повърхност.', 2190, 5],
  ['Nokia Lumia 520', 119.9, 64.0, 9.9, 'Жълт', 'Пластмаса', 'Класически твърд калъф.', 590, 3],
  ['Samsung Galaxy Ace', 112.4, 59.9, 11.5, 'Бял', 'Силикон', 'Силиконов калъф за класиката.', 490, 0],
  ['Nokia 6310 (2021)', 131.5, 55.5, 16.4, 'Черен', 'Кожа', 'Кожен калъф с щипка за колан.', 890, 6],
];

function seedDemo(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n > 0) return false;

  transaction(db, () => {
    const addUser = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, company_name) VALUES (?, ?, ?, ?, ?)',
    );
    const hash = hashPassword(DEMO_PASSWORD);
    const seller = addUser.run('demo-seller', 'seller@example.com', hash, 'seller', 'CaseShop ООД');
    addUser.run('demo-buyer', 'buyer@example.com', hash, 'buyer', null);

    const addProduct = db.prepare(
      `INSERT INTO products (seller_id, phone_model, height_mm, width_mm, thickness_mm, color, material, description,
                             price_cents, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of PRODUCTS) addProduct.run(seller.lastInsertRowid, ...p);
  });
  return true;
}

module.exports = { seedDemo, DEMO_PASSWORD };
