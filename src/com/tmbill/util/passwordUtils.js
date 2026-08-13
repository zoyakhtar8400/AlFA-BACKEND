const crypto = require('crypto');

/**
 * Production-grade salted password hashing using Node native PBKDF2
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify plaintext password against stored hash (PBKDF2, bcrypt, or legacy format)
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;

  // 1. Salted PBKDF2 format (salt:hash)
  if (storedHash.includes(':')) {
    const parts = storedHash.split(':');
    if (parts.length === 2) {
      const [salt, originalHash] = parts;
      const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return computedHash === originalHash;
    }
  }

  // 2. bcrypt format ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      const bcrypt = require('bcryptjs');
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      /* ignore */
    }
  }

  // 3. Legacy plaintext fallback — caller must upgrade hash after this match
  if (storedHash === password) return true;

  try {
    const CryptoJS = require('crypto-js');
    const { Config } = require('../config/config');
    const bytes = CryptoJS.AES.decrypt(storedHash, Config.cipherKey);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (plaintext === password) return true;
  } catch (e) {
    /* ignore */
  }

  return false;
}

module.exports = {
  hashPassword,
  verifyPassword
};
