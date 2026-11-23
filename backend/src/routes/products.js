'use strict';

const express = require('express');
const { requireSeller } = require('../auth');
const { deleteImage, saveImage, upload } = require('../images');
const { HttpError, parseSearch, validateProduct } = require('../validation');

function toProduct(row) {
  return {
    id: row.id,
    phoneModel: row.phone_model,
    heightMm: row.height_mm,
    widthMm: row.width_mm,
    thicknessMm: row.thickness_mm,
    color: row.color,
    material: row.material,
    description: row.description,
    price: row.price_cents / 100,
    priceCents: row.price_cents,
    stock: row.stock,
    imageUrl: row.image ? `/uploads/${row.image}` : null,
    seller: { id: row.seller_id, companyName: row.company_name },
    createdAt: row.created_at,
  };
}

const SELECT = 'SELECT p.*, u.company_name FROM products p JOIN users u ON u.id = p.seller_id';

const fold = (s) => String(s).toLocaleLowerCase('bg').replace(/[\s\-_]+/g, ' ').trim();

/** "galaxy ace", "Galaxy-Ace" and "ace" all find "Samsung Galaxy Ace". */
function matchesModel(model, query) {
  const target = fold(model);
  const compact = target.replace(/ /g, '');
  return fold(query)
    .split(' ')
    .filter(Boolean)
    .every((word) => target.includes(word) || compact.includes(word));
}

/**
 * How far a phone is from the size a case is made for: the biggest difference
 * in mm over the dimensions that were given (null = not searched by size).
 */
function sizeDistance(row, s) {
  const pairs = [
    [s.heightMm, row.height_mm],
    [s.widthMm, row.width_mm],
    [s.thicknessMm, row.thickness_mm],
  ].filter(([wanted]) => wanted !== null);
  if (!pairs.length) return null;
  return Math.max(...pairs.map(([wanted, actual]) => Math.abs(wanted - actual)));
}

module.exports = function productRoutes({ db, uploadsDir }) {
  const router = express.Router();

  function load(id) {
    const row = db.prepare(`${SELECT} WHERE p.id = ?`).get(Number(id) || 0);
    if (!row) throw new HttpError(404, 'Няма такъв продукт.');
    return row;
  }

  function loadOwn(req) {
    const row = load(req.params.id);
    if (row.seller_id !== req.user.id) throw new HttpError(403, 'Това не е ваш продукт.');
    return row;
  }

  // Search: by phone model, by size (with tolerance), colour, price, stock.
  router.get('/', (req, res) => {
    const s = parseSearch(req.query);
    let rows = db.prepare(SELECT).all();
    if (s.q) rows = rows.filter((r) => matchesModel(r.phone_model, s.q));
    if (s.color) rows = rows.filter((r) => fold(r.color) === fold(s.color));
    if (s.maxPriceCents !== null) rows = rows.filter((r) => r.price_cents <= s.maxPriceCents);
    if (s.inStock) rows = rows.filter((r) => r.stock > 0);

    let results = rows.map((r) => ({ row: r, distance: sizeDistance(r, s) }));
    const bySize = results.some((r) => r.distance !== null);
    if (bySize) results = results.filter((r) => r.distance <= s.tolerance + 1e-9);

    const sort = s.sort ?? (bySize ? 'fit' : 'new');
    const compare = {
      fit: (a, b) => a.distance - b.distance || a.row.price_cents - b.row.price_cents,
      price: (a, b) => a.row.price_cents - b.row.price_cents,
      '-price': (a, b) => b.row.price_cents - a.row.price_cents,
      new: (a, b) => b.row.id - a.row.id,
    }[sort === 'fit' && !bySize ? 'new' : sort];
    results.sort(compare);

    res.json(
      results.map(({ row, distance }) => ({
        ...toProduct(row),
        ...(distance !== null && { sizeDifferenceMm: Math.round(distance * 10) / 10 }),
      })),
    );
  });

  // Values for the filters on the page.
  router.get('/filters', (req, res) => {
    const colors = db.prepare('SELECT DISTINCT color FROM products ORDER BY color COLLATE NOCASE').all().map((r) => r.color);
    const price = db.prepare('SELECT MIN(price_cents) AS min, MAX(price_cents) AS max FROM products').get();
    res.json({ colors, minPrice: (price.min ?? 0) / 100, maxPrice: (price.max ?? 0) / 100 });
  });

  router.get('/mine', requireSeller, (req, res) => {
    res.json(db.prepare(`${SELECT} WHERE p.seller_id = ? ORDER BY p.id DESC`).all(req.user.id).map(toProduct));
  });

  router.get('/:id', (req, res) => {
    res.json(toProduct(load(req.params.id)));
  });

  router.post('/', requireSeller, upload.single('image'), (req, res) => {
    const p = validateProduct(req.body);
    const image = saveImage(uploadsDir, req.file);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO products (seller_id, phone_model, height_mm, width_mm, thickness_mm, color, material,
                               description, price_cents, stock, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(req.user.id, p.phoneModel, p.heightMm, p.widthMm, p.thicknessMm, p.color, p.material, p.description,
        p.priceCents, p.stock, image);
    res.status(201).json(toProduct(load(lastInsertRowid)));
  });

  router.patch('/:id', requireSeller, upload.single('image'), (req, res) => {
    const row = loadOwn(req);
    const p = validateProduct(req.body, { partial: true });
    const columns = {
      phoneModel: 'phone_model',
      heightMm: 'height_mm',
      widthMm: 'width_mm',
      thicknessMm: 'thickness_mm',
      color: 'color',
      material: 'material',
      description: 'description',
      priceCents: 'price_cents',
      stock: 'stock',
    };
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(columns)) {
      if (p[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(p[key]);
      }
    }
    let newImage;
    if (req.file) newImage = saveImage(uploadsDir, req.file);
    else if (req.body?.removeImage === 'true') newImage = null;
    if (newImage !== undefined) {
      sets.push('image = ?');
      values.push(newImage);
    }
    if (sets.length) db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...values, row.id);
    if (newImage !== undefined) deleteImage(uploadsDir, row.image);
    res.json(toProduct(load(row.id)));
  });

  router.delete('/:id', requireSeller, (req, res) => {
    const row = loadOwn(req);
    db.prepare('DELETE FROM products WHERE id = ?').run(row.id);
    deleteImage(uploadsDir, row.image);
    res.status(204).end();
  });

  return router;
};

module.exports.toProduct = toProduct;
module.exports.matchesModel = matchesModel;
