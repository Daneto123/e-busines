'use strict';

// Sessions: a random token in an HttpOnly cookie; only its SHA-256 hash is
// stored, so a leaked database does not let anyone log in.

const crypto = require('node:crypto');
const { HttpError } = require('./validation');

const COOKIE = 'sid';
const SESSION_DAYS = 30;

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function publicUser(row) {
  return { id: row.id, username: row.username, email: row.email, role: row.role, companyName: row.company_name };
}

function startSession(db, req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(token),
    userId,
    expires.toISOString(),
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax', // other sites cannot send requests with this cookie
    secure: req.secure,
    expires,
    path: '/',
  });
}

function endSession(db, req, res) {
  const token = readCookie(req, COOKIE);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.clearCookie(COOKIE, { path: '/' });
}

/** Sets req.user when the request has a valid session cookie. */
function loadUser(db) {
  return (req, res, next) => {
    req.user = null;
    const token = readCookie(req, COOKIE);
    if (token) {
      const row = db
        .prepare(
          `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token_hash = ? AND s.expires_at > ?`,
        )
        .get(sha256(token), new Date().toISOString());
      if (row) req.user = publicUser(row);
    }
    next();
  };
}

function requireUser(req, res, next) {
  if (!req.user) throw new HttpError(401, 'Влезте в профила си.');
  next();
}

function requireSeller(req, res, next) {
  if (!req.user) throw new HttpError(401, 'Влезте в профила си.');
  if (req.user.role !== 'seller') throw new HttpError(403, 'Само за продавачи.');
  next();
}

// A few wrong passwords are fine; many in a row from one place are slowed down.
class LoginLimiter {
  constructor({ maxFailures = 8, windowMs = 15 * 60 * 1000 } = {}) {
    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
    this.failures = new Map();
  }

  key(req, username) {
    return `${req.ip}|${String(username).toLowerCase()}`;
  }

  check(req, username) {
    const entry = this.failures.get(this.key(req, username));
    if (entry && entry.count >= this.maxFailures && Date.now() - entry.first < this.windowMs) {
      throw new HttpError(429, 'Твърде много неуспешни опити. Опитайте след 15 минути.');
    }
  }

  fail(req, username) {
    const k = this.key(req, username);
    const entry = this.failures.get(k);
    if (!entry || Date.now() - entry.first >= this.windowMs) this.failures.set(k, { count: 1, first: Date.now() });
    else entry.count += 1;
  }

  succeed(req, username) {
    this.failures.delete(this.key(req, username));
  }
}

module.exports = { startSession, endSession, loadUser, requireUser, requireSeller, publicUser, LoginLimiter };
