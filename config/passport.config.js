const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const pool = require('./db.config');
const UserModel = require('../src/models/user/base');
const { generateToken, generateRefreshToken } = require('./jwt.config');

// Setup passport with OAuth strategies
// Log environment variables during initialization (without exposing secrets)
console.log('Initializing OAuth strategies with:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Defined' : 'Missing');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Defined' : 'Missing');
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback');
console.log('- FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? 'Defined' : 'Missing');
console.log('- FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? 'Defined' : 'Missing');
console.log('- FACEBOOK_CALLBACK_URL:', process.env.FACEBOOK_CALLBACK_URL || '/auth/facebook/callback');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not defined');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback", // Make sure it includes /api prefix
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
          
          // Generate a random password hash for OAuth users (they'll never use it for login)
          const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).toUpperCase().slice(-4);
          
          // Default values for required fields that are mandatory but will be updated by user later
          const defaultAge = 18; // Temporary default age
          const defaultGender = 'male'; // Temporary default gender - must be a valid enum value
          const defaultPhone = '+0000000000'; // Temporary default phone
          const profileCompleted = false; // Mark profile as not completed
          
          // Insert the new user with all required fields
          const insertResult = await client.query(
            `INSERT INTO users 
            (username, email, google_id, first_name, last_name, role, password, age, gender, phone, profile_completed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, google_id, profile_completed`,
            [
              username, 
              email,
              profile.id,
              firstName,
              lastName,
              'user', // default role
              randomPassword, // random password for OAuth users
              defaultAge,
              defaultGender,
              defaultPhone,
              profileCompleted // mark profile as not completed
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
        
        // Attach tokens and user to req object
        return done(null, user, { token, refreshToken: jwtRefreshToken });
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

// Facebook OAuth Strategy - only initialize if credentials are available
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  console.log('Initializing Facebook OAuth strategy');
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName'],
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Check if user already exists with Facebook ID
        const result = await client.query(
          'SELECT * FROM users WHERE facebook_id = $1',
          [profile.id]
        );
        
        let user = result.rows[0];

        // If user doesn't exist with Facebook ID, check if email exists
        if (!user && profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          
          const emailResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );
          
          // If email exists, link Facebook ID to existing account
          if (emailResult.rows.length > 0) {
            user = emailResult.rows[0];
            await client.query(
              'UPDATE users SET facebook_id = $1 WHERE id = $2',
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
          
          // Generate a random password hash for OAuth users (they'll never use it for login)
          const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).toUpperCase().slice(-4);
          
          // Default values for required fields that are mandatory but will be updated by user later
          const defaultAge = 18; // Temporary default age
          const defaultGender = 'male'; // Temporary default gender - must be a valid enum value
          const defaultPhone = '+0000000000'; // Temporary default phone
          const profileCompleted = false; // Mark profile as not completed
          
          // Insert the new user with all required fields
          const insertResult = await client.query(
            `INSERT INTO users 
            (username, email, facebook_id, first_name, last_name, role, password, age, gender, phone, profile_completed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, facebook_id, profile_completed`,
            [
              username, 
              email,
              profile.id,
              firstName,
              lastName,
              'user', // default role
              randomPassword, // random password for OAuth users
              defaultAge,
              defaultGender,
              defaultPhone,
              profileCompleted // mark profile as not completed
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
        
        // Attach tokens and user to req object
        return done(null, user, { token, refreshToken: jwtRefreshToken });
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
}

module.exports = passport;
