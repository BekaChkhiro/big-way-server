const { verifyToken } = require('../../config/jwt.config');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Auth middleware: Authorization header missing');
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth middleware: Token missing');
      return res.status(401).json({ message: 'Token missing' });
    }

    console.log('Auth middleware: Verifying token...');
    try {
      const decoded = verifyToken(token);
      console.log('Auth middleware: Token verified successfully', { userId: decoded.id, role: decoded.role });
      req.user = decoded;
      // Make sure userId is always set for compatibility with both routes
      req.userId = decoded.id;
      next();
    } catch (tokenError) {
      console.error('Auth middleware: Token verification failed', tokenError);
      return res.status(401).json({ message: 'Invalid or expired token', error: tokenError.message });
    }
  } catch (error) {
    console.error('Auth middleware: Unexpected error', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;