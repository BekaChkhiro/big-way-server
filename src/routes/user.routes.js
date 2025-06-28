const express = require('express');
const router = express.Router();
const pool = require('../../config/db.config');
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

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, phone = $2, first_name = $3, last_name = $4, age = $5, gender = $6 
       WHERE id = $7
       RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at, profile_completed`,
      [username, phone, first_name, last_name, age, gender, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
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

module.exports = router;
