/**
 * Middleware to check if user is an admin
 * @param {*} req - Express request object
 * @param {*} res - Express response object
 * @param {*} next - Express next function
 */
const adminMiddleware = (req, res, next) => {
  // Check if user exists in request (should be set by auth middleware)
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }

  // Check if user role is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  // If user is admin, proceed to next middleware/controller
  next();
};

module.exports = adminMiddleware;
