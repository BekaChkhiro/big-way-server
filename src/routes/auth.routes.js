const express = require('express');
const router = express.Router();
const passport = require('passport');
const authMiddleware = require('../middlewares/auth.middleware');
const User = require('../models/user');
const pool = require('../../config/db.config');

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
    console.log('Profile endpoint: Received request with user ID:', req.user.id);
    
    try {
      const user = await User.findById(req.user.id);
      console.log('Profile endpoint: Database query result:', user ? 'User found' : 'User not found');
      
      if (!user) {
        console.log('Profile endpoint: User not found in database');
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('Profile endpoint: Returning user data');
      res.json(user);
    } catch (dbError) {
      console.error('Profile endpoint: Database error:', dbError);
      return res.status(500).json({ message: 'Database error', error: dbError.message });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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

// Update user profile (alternative endpoint)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    // Extract all fields except email to ensure it can't be updated
    const { email, ...updateData } = req.body;
    
    // Make sure we have a valid user ID
    const userId = req.userId || req.user.id;
    if (!userId) {
      console.error('Missing user ID in request');
      return res.status(401).json({ message: 'Authentication error: Missing user ID' });
    }
    
    console.log('Updating profile via /api/auth/profile endpoint for user ID:', userId);
    
    // Handle gender mapping - database only accepts 'male' or 'female'
    if (updateData.gender && updateData.gender === 'other') {
      // Map 'other' to a valid enum value
      updateData.gender = 'male'; // Default to 'male' when 'other' is selected
    }
    
    const user = await User.updateProfile(userId, updateData);
    
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Successfully updated profile for user ID: ${userId}`);
    res.json({ user, message: 'Profile updated successfully' });
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

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Facebook OAuth routes
router.get(
  '/facebook',
  (req, res, next) => {
    // Check if Facebook strategy is available
    if (!passport._strategies.facebook) {
      return res.status(501).json({ 
        message: 'Facebook authentication is not configured. Please set up FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.' 
      });
    }
    next();
  },
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('Google OAuth callback request received, query params:', req.query);
    next();
  },
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login',
    failWithError: true // Enable error handling
  }),
  (req, res) => {
    // Success handler
    console.log('Google OAuth authentication successful');
    
    try {
      // User authenticated, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('Frontend URL:', frontendUrl);
      
      const lang = 'ka'; // Default language prefix used in your app
      
      // Debug info
      console.log('Auth info:', req.authInfo);
      console.log('User:', req.user);
      
      // Confirm authInfo exists
      if (!req.authInfo || !req.authInfo.token || !req.authInfo.refreshToken) {
        console.error('Missing authInfo in Google callback. req.authInfo:', req.authInfo);
        return res.status(500).send(
          '<html><body><h1>Authentication Error</h1><p>Missing authentication tokens. Please try again later.</p></body></html>'
        );
      }
      
      // Get tokens from authInfo that passport attached
      const token = encodeURIComponent(req.authInfo.token);
      const refreshToken = encodeURIComponent(req.authInfo.refreshToken);
      const userData = encodeURIComponent(JSON.stringify(req.user));
      
      const redirectUrl = `${frontendUrl}/${lang}/auth/google/callback?token=${token}&refreshToken=${refreshToken}&user=${userData}`;
      console.log('Redirecting to:', redirectUrl);
      
      // Try a different approach with HTML and meta refresh
      // This sometimes works better across different hosting environments
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <script>window.location.href = "${redirectUrl}";</script>
        </head>
        <body>
          <h1>Authentication successful!</h1>
          <p>Redirecting to application...</p>
          <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Google callback:', error);
      return res.status(500).send(
        '<html><body><h1>Authentication Error</h1><p>An unexpected error occurred. Please try again later.</p><pre>' + 
        (process.env.NODE_ENV === 'development' ? error.stack : '') + '</pre></body></html>'
      );
    }
  },
  (err, req, res, next) => {
    // Error handler
    console.error('Google authentication error:', err);
    return res.status(500).send(
      '<html><body><h1>Google Authentication Failed</h1><p>' + 
      (err.message || 'Unknown error occurred') + '</p></body></html>'
    );
  }
);

// Facebook OAuth callback
router.get(
  '/facebook/callback',
  (req, res, next) => {
    console.log('Facebook OAuth callback request received, query params:', req.query);
    // Check if Facebook strategy is available
    if (!passport._strategies.facebook) {
      return res.status(501).json({ 
        message: 'Facebook authentication is not configured. Please set up FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.' 
      });
    }
    next();
  },
  passport.authenticate('facebook', { 
    session: false, 
    failureRedirect: '/login',
    failWithError: true // Enable error handling
  }),
  (req, res) => {
    // Success handler
    console.log('Facebook OAuth authentication successful');
    
    try {
      // User authenticated, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('Frontend URL:', frontendUrl);
      
      const lang = 'ka'; // Default language prefix used in your app
      
      // Debug info
      console.log('Auth info:', req.authInfo);
      console.log('User:', req.user);
      
      // Confirm authInfo exists
      if (!req.authInfo || !req.authInfo.token || !req.authInfo.refreshToken) {
        console.error('Missing authInfo in Facebook callback. req.authInfo:', req.authInfo);
        return res.status(500).send(
          '<html><body><h1>Authentication Error</h1><p>Missing authentication tokens. Please try again later.</p></body></html>'
        );
      }
      
      // Get tokens from authInfo that passport attached
      const token = encodeURIComponent(req.authInfo.token);
      const refreshToken = encodeURIComponent(req.authInfo.refreshToken);
      const userData = encodeURIComponent(JSON.stringify(req.user));
      
      const redirectUrl = `${frontendUrl}/${lang}/auth/facebook/callback?token=${token}&refreshToken=${refreshToken}&user=${userData}`;
      console.log('Redirecting to:', redirectUrl);
      
      // Try a different approach with HTML and meta refresh
      // This sometimes works better across different hosting environments
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <script>window.location.href = "${redirectUrl}";</script>
        </head>
        <body>
          <h1>Authentication successful!</h1>
          <p>Redirecting to application...</p>
          <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Facebook callback:', error);
      return res.status(500).send(
        '<html><body><h1>Authentication Error</h1><p>An unexpected error occurred. Please try again later.</p><pre>' + 
        (process.env.NODE_ENV === 'development' ? error.stack : '') + '</pre></body></html>'
      );
    }
  },
  (err, req, res, next) => {
    // Error handler
    console.error('Facebook authentication error:', err);
    return res.status(500).send(
      '<html><body><h1>Facebook Authentication Failed</h1><p>' + 
      (err.message || 'Unknown error occurred') + '</p></body></html>'
    );
  }
);

// Facebook Data Deletion Request Endpoint
router.post('/facebook-data-deletion', async (req, res) => {
  try {
    console.log('Facebook data deletion request received:', req.body);
    
    // Verify the request is coming from Facebook
    const signedRequest = req.body.signed_request;
    if (!signedRequest) {
      return res.status(400).json({ error: 'Missing signed_request parameter' });
    }
    
    // Parse the signed request
    const [encodedSig, payload] = signedRequest.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    
    // Extract the user ID from the request
    const userId = data.user_id;
    
    // In a real implementation, you would verify the signature with your app secret
    // For simplicity, we're skipping that step here
    
    // Find and anonymize/delete the user data
    if (userId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Option 1: Delete the user completely
        // await client.query('DELETE FROM users WHERE facebook_id = $1', [userId]);
        
        // Option 2: Anonymize the user data (preferred approach)
        await client.query(`
          UPDATE users 
          SET 
            facebook_id = NULL,
            email = CONCAT('deleted_', id, '@example.com'),
            first_name = 'Deleted',
            last_name = 'User',
            phone = NULL,
            profile_picture = NULL
          WHERE facebook_id = $1
        `, [userId]);
        
        await client.query('COMMIT');
        console.log(`User data for Facebook ID ${userId} has been anonymized/deleted`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing Facebook data deletion:', error);
        // Still return success to Facebook as we'll handle this internally
      } finally {
        client.release();
      }
    }
    
    // Facebook expects a specific response format
    res.json({
      url: `https://${req.get('host')}/privacy-policy`, // URL to your privacy policy
      confirmation_code: data.user_id // Confirmation code (can be any string)
    });
  } catch (error) {
    console.error('Facebook data deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;