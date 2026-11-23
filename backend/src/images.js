'use strict';

// Product pictures. The file type is decided from the bytes, the name is
// random: nothing a user uploads can become a page or overwrite another file.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const { HttpError } = require('./validation');

const MAX_BYTES = 3 * 1024 * 1024;

const TYPES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 20 },
});

function saveImage(uploadsDir, file) {
  if (!file) return null;
  const type = file.buffer.length > 12 && TYPES.find((t) => t.test(file.buffer));
  if (!type) throw new HttpError(400, 'Снимката трябва да е JPEG, PNG или WebP.', { image: 'Снимката трябва да е JPEG, PNG или WebP.' });
  fs.mkdirSync(uploadsDir, { recursive: true });
  const name = `${crypto.randomUUID()}.${type.ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
  return name;
}

function deleteImage(uploadsDir, name) {
  if (!name || name !== path.basename(name)) return;
  fs.rm(path.join(uploadsDir, name), { force: true }, () => {});
}

module.exports = { upload, saveImage, deleteImage, MAX_BYTES };
