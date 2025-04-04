// JWT configuration
const jwt = require('jsonwebtoken');

// Default values - these will be overridden by environment variables when available
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret_replace_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '30d', // გავზარდეთ 30 დღემდე
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '60d', // refresh token ვადა 60 დღე
  algorithm: 'HS256',
  issuer: process.env.JWT_ISSUER || 'bigway-api'
};

/**
 * Generates a JWT token
 * @param {Object} payload - Data to include in the token
 * @returns {String} - JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer
  });
};

/**
 * Generates a JWT refresh token
 * @param {Object} payload - Data to include in the token
 * @returns {String} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer
  });
};

/**
 * Verifies a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.secret, {
    algorithms: [JWT_CONFIG.algorithm],
    issuer: JWT_CONFIG.issuer
  });
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  generateRefreshToken,
  verifyToken
};