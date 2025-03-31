const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const User = require('../models/user');

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { user, token, refreshToken } = await User.register(req.body);
    res.status(201).json({ 
      user, 
      token, 
      refreshToken,
      message: 'Registration successful' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('exists')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { user, token, refreshToken } = await User.login(email, password);
    res.json({ user, token, refreshToken });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ message: 'Account already exists' });
    }
    
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // JWT doesn't really have server-side logout, but we can invalidate tokens in a more complex setup
    // Here we just return a success message as the client should remove the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Email verification
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    await User.verifyEmail(token);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    const { token, refreshToken: newRefreshToken, user } = await User.refreshToken(refreshToken);
    res.json({ token, refreshToken: newRefreshToken, user });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Get current user profile (alias for /me)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.message.includes('in use')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await User.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    if (error.message.includes('incorrect')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = await User.resetPassword(email);
    
    // In a real application, send this token via email
    // For development, we'll return it directly
    res.json({ 
      message: 'Password reset instructions sent to email',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    // Don't reveal if user exists
    res.status(200).json({ message: 'If email exists, reset instructions will be sent' });
  }
});

// Reset password with token
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    await User.setNewPassword(email, token, newPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete account
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    await User.delete(req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin only: Get all users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin only: Get user by ID
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const user = await User.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin only: Update user role
router.put('/users/:id/role', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { role } = req.body;
    const user = await User.updateRole(parseInt(req.params.id), role);
    res.json(user);
  } catch (error) {
    console.error('Role update error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;