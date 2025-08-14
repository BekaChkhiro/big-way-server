const express = require('express');
const router = express.Router();
const { pg: pool } = require('../../config/db.config');
const authMiddleware = require('../middlewares/auth.middleware');

// Complete user profile
router.put('/complete-profile', authMiddleware, async (req, res) => {
  const { age, gender, phone } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!age || !gender || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET age = $1, gender = $2, phone = $3, profile_completed = true 
       WHERE id = $4
       RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, profile_completed`,
      [age, gender, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return updated user data
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

// Update user profile (except email)
router.put('/update-profile', authMiddleware, async (req, res) => {
  const { username, phone, first_name, last_name, age, gender } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!username || !first_name || !last_name) {
      return res.status(400).json({ message: "Username, first name, and last name are required" });
    }

    // Validate gender - database only accepts 'male' or 'female'
    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return res.status(400).json({ 
        message: "Invalid gender value. Must be 'male' or 'female'" 
      });
    }
    
    // Log the gender being saved
    console.log('Saving gender value to database:', gender);

    // Log the user ID to help with debugging
    console.log('Updating profile for user ID:', userId);
    
    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, phone = $2, first_name = $3, last_name = $4, age = $5, gender = $6 
       WHERE id = $7
       RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, profile_completed, google_id`,
      [username, phone, first_name, last_name, age, gender, userId]
    );

    if (result.rows.length === 0) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log successful update
    console.log(`Successfully updated profile for user ID: ${userId}, username: ${username}`);
    if (result.rows[0].google_id) {
      console.log('This is a Google-authenticated user with google_id:', result.rows[0].google_id);
    }

    // Return updated user data
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

// Get user profile completion status
router.get('/profile-status', authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT profile_completed FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ profileCompleted: result.rows[0].profile_completed });
  } catch (error) {
    console.error('Error checking profile status:', error);
    res.status(500).json({ message: "Server error while checking profile status" });
  }
});

// One-time: sync current profile contact info to all user's cars
router.post('/sync-contact-to-cars', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { syncName = false, syncPhone = false } = req.body || {};

    if (!syncName && !syncPhone) {
      return res.status(400).json({ message: 'No fields selected to sync' });
    }

    // Fetch current user profile values
    const userResult = await pool.query(
      `SELECT first_name, last_name, phone FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { first_name, last_name, phone } = userResult.rows[0];
    const authorName = `${first_name || ''} ${last_name || ''}`.trim();

    const updates = [];
    const params = [];

    if (syncName) {
      if (!authorName) {
        return res.status(400).json({ message: 'Profile name is empty, cannot sync' });
      }
      updates.push(`author_name = $${params.length + 1}`);
      params.push(authorName);
    }

    if (syncPhone) {
      if (!phone) {
        return res.status(400).json({ message: 'Profile phone is empty, cannot sync' });
      }
      updates.push(`author_phone = $${params.length + 1}`);
      params.push(phone);
    }

    params.push(userId);
    const sql = `UPDATE cars SET ${updates.join(', ')} WHERE seller_id = $${params.length}`;
    const result = await pool.query(sql, params);

    return res.json({ message: 'Contact info synced successfully', updated: result.rowCount || 0 });
  } catch (error) {
    console.error('Error syncing contact info to cars:', error);
    return res.status(500).json({ message: 'Server error while syncing contact info' });
  }
});

module.exports = router;
