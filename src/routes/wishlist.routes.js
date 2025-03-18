const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const Wishlist = require('../models/wishlist');

// Get user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findUserWishlist(req.user.id);
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if car is in wishlist
router.get('/check/:carId', authMiddleware, async (req, res) => {
  try {
    const exists = await Wishlist.exists(req.user.id, parseInt(req.params.carId));
    res.json({ exists });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add to wishlist
router.post('/:carId', authMiddleware, async (req, res) => {
  try {
    const wishlistItem = await Wishlist.add(req.user.id, parseInt(req.params.carId));
    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error.message.includes('already in wishlist')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove from wishlist
router.delete('/:carId', authMiddleware, async (req, res) => {
  try {
    await Wishlist.remove(req.user.id, parseInt(req.params.carId));
    res.status(204).send();
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear wishlist
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Wishlist.clear(req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;