'use strict';

const express = require('express');
const { DUMMY_HASH, hashPassword, verifyPassword } = require('../passwords');
const { LoginLimiter, endSession, publicUser, startSession } = require('../auth');
const { HttpError, validateRegistration } = require('../validation');

module.exports = function authRoutes({ db }) {
  const router = express.Router();
  const limiter = new LoginLimiter();

  router.post('/register', (req, res) => {
    const data = validateRegistration(req.body);
    const taken = db
      .prepare('SELECT username = ? COLLATE NOCASE AS sameName FROM users WHERE username = ? OR email = ?')
      .get(data.username, data.username, data.email);
    if (taken) {
      const field = taken.sameName ? 'username' : 'email';
      const message = taken.sameName ? 'Това потребителско име е заето.' : 'Вече има профил с този имейл.';
      throw new HttpError(409, message, { [field]: message });
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (username, email, password_hash, role, company_name) VALUES (?, ?, ?, ?, ?)')
      .run(data.username, data.email, hashPassword(data.password), data.role, data.companyName);
    startSession(db, req, res, Number(lastInsertRowid));
    res.status(201).json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)));
  });

  // The password goes in the request body, never in the URL.
  router.post('/login', (req, res) => {
    const login = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!login || !password) throw new HttpError(400, 'Въведете потребителско име и парола.');
    limiter.check(req, login);

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login.toLowerCase());
    const ok = verifyPassword(password, user ? user.password_hash : DUMMY_HASH) && Boolean(user);
    if (!ok) {
      limiter.fail(req, login);
      throw new HttpError(401, 'Грешно потребителско име или парола.');
    }
    limiter.succeed(req, login);
    startSession(db, req, res, user.id);
    res.json(publicUser(user));
  });

  router.post('/logout', (req, res) => {
    endSession(db, req, res);
    res.status(204).end();
  });

  // Who is logged in: the user, or null (not an error, so the browser console stays clean).
  router.get('/me', (req, res) => {
    res.json(req.user ?? null);
  });

  return router;
};
