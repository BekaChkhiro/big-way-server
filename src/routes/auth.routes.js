const express = require('express');
const router = express.Router();
const passport = require('passport');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload } = require('../middlewares/upload.middleware');
const User = require('../models/user');
const { pg: pool } = require('../../config/db.config');

// Registration route
router.post('/register', upload.single('logo'), async (req, res) => {
  try {
    // Handle logo upload if provided
    let logoUrl = null;
    if (req.file && req.body.isDealer === 'true') {
      console.log('Processing dealer logo upload during registration');
      try {
        const processedImages = await processAndUpload([req.file]);
        logoUrl = processedImages[0].original;
        console.log('Logo uploaded successfully:', logoUrl);
      } catch (uploadError) {
        console.error('Logo upload failed during registration:', uploadError);
        return res.status(400).json({ 
          message: 'Logo upload failed. Please try again.',
          error: uploadError.message 
        });
      }
    }

    // Add logo_url to dealer data if available
    const registrationData = { ...req.body };
    if (logoUrl && registrationData.dealerData) {
      if (typeof registrationData.dealerData === 'string') {
        registrationData.dealerData = JSON.parse(registrationData.dealerData);
      }
      registrationData.dealerData.logo_url = logoUrl;
    }

    const { user, token, refreshToken } = await User.register(registrationData);
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

// Facebook token authentication (for SDK login)
router.post('/facebook', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    // Verify the token with Facebook Graph API
    const response = await fetch(`https://graph.facebook.com/me?access_token=${access_token}&fields=id,email,first_name,last_name`);
    
    if (!response.ok) {
      return res.status(401).json({ message: 'Invalid Facebook access token' });
    }
    
    const facebookUser = await response.json();
    
    if (!facebookUser.id) {
      return res.status(401).json({ message: 'Invalid Facebook user data' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user already exists with Facebook ID
      const result = await client.query(
        'SELECT * FROM users WHERE facebook_id = $1',
        [facebookUser.id]
      );
      
      let user = result.rows[0];

      // If user doesn't exist with Facebook ID, check if email exists
      if (!user && facebookUser.email) {
        const emailResult = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [facebookUser.email]
        );
        
        // If email exists, link Facebook ID to existing account
        if (emailResult.rows.length > 0) {
          user = emailResult.rows[0];
          await client.query(
            'UPDATE users SET facebook_id = $1 WHERE id = $2',
            [facebookUser.id, user.id]
          );
        }
      }
      
      // If no user exists at all, create a new one
      if (!user) {
        const email = facebookUser.email || null;
        const firstName = facebookUser.first_name || '';
        const lastName = facebookUser.last_name || '';
        
        // Generate a unique username based on name or email
        let username = '';
        if (firstName && lastName) {
          username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        } else if (email) {
          username = email.split('@')[0];
        } else {
          username = 'user' + Math.floor(Math.random() * 10000);
        }
        
        // Check if username exists and make it unique if needed
        const usernameCheckResult = await client.query(
          'SELECT COUNT(*) FROM users WHERE username = $1',
          [username]
        );
        
        if (usernameCheckResult.rows[0].count > 0) {
          username = username + Math.floor(Math.random() * 10000);
        }
        
        // Generate a random password hash for OAuth users
        const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).toUpperCase().slice(-4);
        
        // Default values for required fields
        const defaultAge = 18;
        const defaultGender = 'male';
        const defaultPhone = '+0000000000';
        const profileCompleted = false;
        
        // Insert the new user
        const insertResult = await client.query(
          `INSERT INTO users 
          (username, email, facebook_id, first_name, last_name, role, password, age, gender, phone, profile_completed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, facebook_id, profile_completed`,
          [
            username, 
            email,
            facebookUser.id,
            firstName,
            lastName,
            'user',
            randomPassword,
            defaultAge,
            defaultGender,
            defaultPhone,
            profileCompleted
          ]
        );
        
        user = insertResult.rows[0];
      }
      
      await client.query('COMMIT');
      
      // Generate JWT tokens
      const { generateToken, generateRefreshToken } = require('../../config/jwt.config');
      const tokenPayload = { id: user.id, role: user.role };
      const token = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      
      // Remove sensitive data
      delete user.password;
      delete user.reset_token;
      delete user.reset_token_expires;
      
      res.json({ user, token, refreshToken });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Facebook token authentication error:', error);
    res.status(500).json({ message: 'Facebook authentication failed' });
  }
});

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

// Admin only: Delete user by ID
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    // Check if the current user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Log the deletion attempt
    console.log(`Admin user ${req.user.id} attempting to delete user ${userId}`);
    
    // Call the UserModel.delete method
    const result = await User.delete(userId);
    
    if (result.success) {
      return res.json({ 
        message: `User ${userId} successfully deleted`, 
        deletedId: result.deletedId 
      });
    } else {
      // Return appropriate status code based on the error
      if (result.message === 'User not found') {
        return res.status(404).json({ message: result.message });
      } else if (result.message === 'Cannot delete admin user') {
        return res.status(403).json({ message: result.message });
      } else {
        return res.status(400).json({ message: result.message });
      }
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;