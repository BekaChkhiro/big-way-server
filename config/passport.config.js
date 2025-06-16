const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db.config');
const UserModel = require('../src/models/user/base');
const { generateToken, generateRefreshToken } = require('./jwt.config');

// Setup passport with Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Check if user already exists
        const result = await client.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );
        
        let user = result.rows[0];

        // If user doesn't exist with Google ID, check if email exists
        if (!user && profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          
          const emailResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );
          
          // If email exists, link Google ID to existing account
          if (emailResult.rows.length > 0) {
            user = emailResult.rows[0];
            await client.query(
              'UPDATE users SET google_id = $1 WHERE id = $2',
              [profile.id, user.id]
            );
          }
        }
        
        // If no user exists at all, create a new one
        if (!user) {
          // Extract profile info
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
          const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
          
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
          
          // Insert the new user
          const insertResult = await client.query(
            `INSERT INTO users 
            (username, email, google_id, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, google_id`,
            [
              username, 
              email,
              profile.id,
              firstName,
              lastName,
              'user' // default role
            ]
          );
          
          user = insertResult.rows[0];
        }
        
        await client.query('COMMIT');
        
        // Generate JWT tokens
        const tokenPayload = { id: user.id, role: user.role };
        const token = generateToken(tokenPayload);
        const jwtRefreshToken = generateRefreshToken(tokenPayload);
        
        // Remove sensitive data
        delete user.password;
        delete user.reset_token;
        delete user.reset_token_expires;
        
        // Pass along tokens and user data
        return done(null, {
          user,
          token,
          refreshToken: jwtRefreshToken
        });
      } catch (error) {
        await client.query('ROLLBACK');
        return done(error, null);
      } finally {
        client.release();
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;
