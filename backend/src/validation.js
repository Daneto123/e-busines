'use strict';

// Checks what users send. Messages are in Bulgarian: the site shows them as they are.

class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

class Checker {
  constructor(body) {
    this.body = body && typeof body === 'object' ? body : {};
    this.errors = {};
    this.out = {};
  }

  has(key) {
    return this.body[key] !== undefined && this.body[key] !== null && String(this.body[key]).trim() !== '';
  }

  fail(key, message) {
    if (!this.errors[key]) this.errors[key] = message;
  }

  text(key, label, { required = false, min = 0, max = 100, pattern, patternMessage } = {}) {
    if (!this.has(key)) {
      if (required) this.fail(key, `Въведете ${label}.`);
      else this.out[key] = '';
      return this;
    }
    const value = String(this.body[key]).trim().replace(/[ \t]+/g, ' ');
    if (value.length < min) this.fail(key, `Най-малко ${min} знака.`);
    else if (value.length > max) this.fail(key, `Най-много ${max} знака.`);
    else if (pattern && !pattern.test(value)) this.fail(key, patternMessage);
    else this.out[key] = value;
    return this;
  }

  number(key, label, { required = false, min, max, integer = false } = {}) {
    if (!this.has(key)) {
      if (required) this.fail(key, `Въведете ${label}.`);
      else this.out[key] = null;
      return this;
    }
    const value = Number(String(this.body[key]).trim().replace(',', '.'));
    if (!Number.isFinite(value)) this.fail(key, `${label}: въведете число.`);
    else if (integer && !Number.isInteger(value)) this.fail(key, `${label}: цяло число.`);
    else if (value < min || value > max) this.fail(key, `${label}: от ${min} до ${max}.`);
    else this.out[key] = value;
    return this;
  }

  done() {
    if (Object.keys(this.errors).length) {
      throw new HttpError(400, Object.values(this.errors)[0], this.errors);
    }
    return this.out;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[\p{L}\d_.-]+$/u;

function validateRegistration(body) {
  const c = new Checker(body)
    .text('username', 'потребителско име', {
      required: true,
      min: 3,
      max: 30,
      pattern: USERNAME,
      patternMessage: 'Само букви, цифри, точка, тире и долна черта.',
    })
    .text('email', 'имейл', { required: true, max: 254, pattern: EMAIL, patternMessage: 'Невалиден имейл адрес.' })
    .text('password', 'парола', { required: true, min: 8, max: 200 });
  const role = c.body.role;
  if (role !== 'buyer' && role !== 'seller') c.fail('role', 'Изберете тип профил.');
  else c.out.role = role;
  if (role === 'seller') c.text('companyName', 'име на фирмата', { required: true, min: 2, max: 80 });
  else c.out.companyName = null;
  const out = c.done();
  out.email = out.email.toLowerCase();
  return out;
}

const DIMENSIONS = {
  heightMm: ['височина', 50, 250],
  widthMm: ['ширина', 20, 150],
  thicknessMm: ['дебелина', 3, 40],
};

function validateProduct(body, { partial = false } = {}) {
  const c = new Checker(body);
  const want = (key) => !partial || c.body[key] !== undefined;
  if (want('phoneModel')) c.text('phoneModel', 'модел на телефона', { required: true, min: 2, max: 80 });
  for (const [key, [label, min, max]] of Object.entries(DIMENSIONS)) {
    if (want(key)) c.number(key, `${label[0].toUpperCase()}${label.slice(1)} (мм)`, { required: true, min, max });
  }
  if (want('color')) c.text('color', 'цвят', { required: true, max: 30 });
  if (want('material')) c.text('material', 'материал', { max: 40 });
  if (want('description')) c.text('description', 'описание', { max: 1000 });
  if (want('price')) c.number('price', 'Цена', { required: true, min: 0.01, max: 10000 });
  if (want('stock')) c.number('stock', 'Наличност', { required: true, min: 0, max: 100000, integer: true });
  const out = c.done();
  if (out.price !== undefined) {
    out.priceCents = Math.round(out.price * 100);
    delete out.price;
  }
  return out;
}

function validateCaseRequest(body) {
  const c = new Checker(body)
    .text('phoneModel', 'модел на телефона', { required: true, min: 2, max: 80 })
    .text('email', 'имейл за отговор', { required: true, max: 254, pattern: EMAIL, patternMessage: 'Невалиден имейл адрес.' })
    .text('color', 'цвят', { max: 30 })
    .text('details', 'подробности', { max: 1000 });
  for (const [key, [label, min, max]] of Object.entries(DIMENSIONS)) c.number(key, label, { min, max });
  return c.done();
}

/** Search parameters from the query string; anything invalid is ignored. */
function parseSearch(query) {
  const num = (v) => {
    const n = Number(String(v ?? '').replace(',', '.'));
    return v !== undefined && v !== '' && Number.isFinite(n) && n > 0 ? n : null;
  };
  const tolerance = num(query.tolerance);
  return {
    q: typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '',
    heightMm: num(query.height),
    widthMm: num(query.width),
    thicknessMm: num(query.thickness),
    tolerance: tolerance === null ? 1.5 : Math.min(tolerance, 10),
    color: typeof query.color === 'string' ? query.color.trim() : '',
    maxPriceCents: num(query.maxPrice) === null ? null : Math.round(num(query.maxPrice) * 100),
    inStock: query.inStock === 'true' || query.inStock === '1',
    sort: ['price', '-price', 'new', 'fit'].includes(query.sort) ? query.sort : null,
  };
}

module.exports = { HttpError, validateRegistration, validateProduct, validateCaseRequest, parseSearch };
