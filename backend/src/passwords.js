'use strict';

// Passwords are never stored: only a salted scrypt hash (built into Node.js).

const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const COST = 16384; // scrypt N

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, { N: COST });
  return `scrypt$${COST}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  const [scheme, cost, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(cost) });
  return crypto.timingSafeEqual(actual, expected);
}

// Compared against when the user does not exist, so the answer takes the same
// time and does not reveal which usernames are registered.
const DUMMY_HASH = hashPassword('dummy-password-for-timing');

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
