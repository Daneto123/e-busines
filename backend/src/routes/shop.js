'use strict';

// Cart, orders and requests for cases that are not in the shop.

const express = require('express');
const { requireSeller, requireUser } = require('../auth');
const { transaction } = require('../db');
const { caseRequestEmail } = require('../mail');
const { HttpError, validateCaseRequest } = require('../validation');

const euros = (cents) => Math.round(cents) / 100;

module.exports = function shopRoutes({ db, mailer, log = console }) {
  const router = express.Router();

  // ------------------------------------------------------------------ cart

  function cart(userId) {
    const rows = db
      .prepare(
        `SELECT c.quantity, p.id, p.phone_model, p.color, p.price_cents, p.stock, p.image
         FROM cart_items c JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ? ORDER BY p.phone_model`,
      )
      .all(userId);
    const items = rows.map((r) => ({
      productId: r.id,
      phoneModel: r.phone_model,
      color: r.color,
      price: euros(r.price_cents),
      quantity: r.quantity,
      stock: r.stock,
      lineTotal: euros(r.price_cents * r.quantity),
      imageUrl: r.image ? `/uploads/${r.image}` : null,
      problem: r.stock === 0 ? 'Няма наличност' : r.quantity > r.stock ? `Налични са само ${r.stock}` : null,
    }));
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: euros(rows.reduce((sum, r) => sum + r.price_cents * r.quantity, 0)),
    };
  }

  router.get('/cart', requireUser, (req, res) => res.json(cart(req.user.id)));

  // Sets the quantity of a product in the cart (0 removes it).
  router.put('/cart/:productId', requireUser, (req, res) => {
    const productId = Number(req.params.productId);
    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
      throw new HttpError(400, 'Количеството трябва да е от 0 до 99.');
    }
    const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId || 0);
    if (!product) throw new HttpError(404, 'Няма такъв продукт.');
    if (quantity === 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
    } else {
      if (quantity > product.stock) {
        throw new HttpError(409, product.stock ? `Налични са само ${product.stock} бр.` : 'Продуктът е изчерпан.');
      }
      db.prepare(
        `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
         ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
      ).run(req.user.id, productId, quantity);
    }
    res.json(cart(req.user.id));
  });

  router.delete('/cart/:productId', requireUser, (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, Number(req.params.productId) || 0);
    res.json(cart(req.user.id));
  });

  // ------------------------------------------------------------------ orders

  // Buys everything in the cart: checks stock, saves the order, lowers stock
  // and empties the cart, all in one transaction.
  router.post('/orders', requireUser, (req, res) => {
    const orderId = transaction(db, () => {
      const current = cart(req.user.id);
      if (!current.items.length) throw new HttpError(400, 'Кошницата е празна.');
      const problems = current.items.filter((i) => i.quantity > i.stock);
      if (problems.length) {
        throw new HttpError(409, `Няма достатъчно наличност: ${problems.map((p) => `${p.phoneModel} (${p.problem})`).join(', ')}.`);
      }
      const totalCents = current.items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.quantity, 0);
      const { lastInsertRowid } = db.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)').run(req.user.id, totalCents);
      const addItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, phone_model, color, price_cents, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      );
      const lowerStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const i of current.items) {
        addItem.run(lastInsertRowid, i.productId, i.phoneModel, i.color, Math.round(i.price * 100), i.quantity);
        if (lowerStock.run(i.quantity, i.productId, i.quantity).changes !== 1) {
          throw new HttpError(409, `Няма достатъчно наличност за ${i.phoneModel}.`);
        }
      }
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      return Number(lastInsertRowid);
    });
    res.status(201).json(orders(req.user.id).find((o) => o.id === orderId));
  });

  function orders(userId) {
    const list = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(userId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    return list.map((o) => ({
      id: o.id,
      total: euros(o.total_cents),
      createdAt: o.created_at,
      items: items.all(o.id).map((i) => ({
        productId: i.product_id,
        phoneModel: i.phone_model,
        color: i.color,
        price: euros(i.price_cents),
        quantity: i.quantity,
      })),
    }));
  }

  router.get('/orders', requireUser, (req, res) => res.json(orders(req.user.id)));

  // ------------------------------------------------------------------ case requests

  router.post('/requests', async (req, res) => {
    const body = { ...req.body };
    if (!body.email && req.user) body.email = req.user.email;
    const r = validateCaseRequest(body);
    db.prepare(
      `INSERT INTO case_requests (user_id, phone_model, height_mm, width_mm, thickness_mm, color, email, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(req.user?.id ?? null, r.phoneModel, r.heightMm, r.widthMm, r.thicknessMm, r.color, r.email, r.details);

    // Every seller gets the request by e-mail (if e-mail is set up).
    let emailed = 0;
    const sellers = db.prepare("SELECT email FROM users WHERE role = 'seller'").all();
    if (mailer && sellers.length) {
      try {
        await mailer.sendMail(caseRequestEmail(r, sellers));
        emailed = sellers.length;
      } catch (err) {
        log.error('Имейлът със заявката не беше изпратен:', err.message);
      }
    }
    res.status(201).json({ message: 'Благодарим! Продавачите ще видят заявката и ще ви пишат.', emailed });
  });

  router.get('/requests', requireSeller, (req, res) => {
    const rows = db.prepare('SELECT * FROM case_requests ORDER BY id DESC LIMIT 200').all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        phoneModel: r.phone_model,
        heightMm: r.height_mm,
        widthMm: r.width_mm,
        thicknessMm: r.thickness_mm,
        color: r.color,
        email: r.email,
        details: r.details,
        createdAt: r.created_at,
      })),
    );
  });

  return router;
};
