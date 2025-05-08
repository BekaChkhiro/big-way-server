const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const WishlistModel = require('../models/wishlist.model');
const winston = require('winston');
const logger = require('../utils/logger');

// Get user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    logger.info(`Fetching wishlist for user ${req.user.id}`);
    
    if (!req.user || !req.user.id) {
      logger.error('No user ID found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const wishlist = await WishlistModel.findUserWishlist(req.user.id);
    logger.info(`Successfully fetched ${wishlist.length} wishlist items for user ${req.user.id}`);
    res.json(wishlist || []);
  } catch (error) {
    logger.error('Error fetching wishlist:', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack 
    });

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(500).json({ 
      message: 'Failed to fetch wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check if car is in wishlist
router.get('/check/:carId', authMiddleware, async (req, res) => {
  try {
    if (!req.params.carId || isNaN(parseInt(req.params.carId))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    const exists = await WishlistModel.isInWishlist(req.user.id, parseInt(req.params.carId));
    res.json({ exists });
  } catch (error) {
    logger.error('Error checking wishlist:', {
      userId: req.user?.id,
      carId: req.params.carId,
      error: error.message
    });
    res.status(500).json({ 
      message: 'Failed to check wishlist status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Alternative endpoint for compatibility with tests
router.get('/:carId/check', authMiddleware, async (req, res) => {
  try {
    if (!req.params.carId || isNaN(parseInt(req.params.carId))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    const exists = await WishlistModel.isInWishlist(req.user.id, parseInt(req.params.carId));
    res.json({ isInWishlist: exists });
  } catch (error) {
    logger.error('Error checking wishlist:', {
      userId: req.user?.id,
      carId: req.params.carId,
      error: error.message
    });
    res.status(500).json({ 
      message: 'Failed to check wishlist status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add to wishlist
router.post('/:carId', authMiddleware, async (req, res) => {
  try {
    if (!req.params.carId || isNaN(parseInt(req.params.carId))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    // Check if car is already in wishlist
    const isInWishlist = await WishlistModel.isInWishlist(req.user.id, parseInt(req.params.carId));
    if (isInWishlist) {
      return res.status(400).json({ message: 'Car is already in wishlist' });
    }

    logger.info(`Adding car ${req.params.carId} to wishlist for user ${req.user.id}`);
    const wishlistItem = await WishlistModel.addToWishlist(req.user.id, parseInt(req.params.carId));
    res.status(200).json({ 
      message: 'Car added to wishlist successfully',
      wishlistItem: wishlistItem
    });
  } catch (error) {
    logger.error('Error adding to wishlist:', {
      userId: req.user?.id,
      carId: req.params.carId,
      error: error.message
    });
    if (error.message.includes('already in wishlist')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Car not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Failed to add to wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove from wishlist
router.delete('/:carId', authMiddleware, async (req, res) => {
  try {
    if (!req.params.carId || isNaN(parseInt(req.params.carId))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    // Check if car is in wishlist first
    const isInWishlist = await WishlistModel.isInWishlist(req.user.id, parseInt(req.params.carId));
    if (!isInWishlist) {
      return res.status(404).json({ message: 'Car not found in wishlist' });
    }

    logger.info(`Removing car ${req.params.carId} from wishlist for user ${req.user.id}`);
    await WishlistModel.removeFromWishlist(req.user.id, parseInt(req.params.carId));
    res.status(200).json({ message: 'Car removed from wishlist successfully' });
  } catch (error) {
    logger.error('Error removing from wishlist:', {
      userId: req.user?.id,
      carId: req.params.carId,
      error: error.message
    });
    if (error.message.includes('not found in wishlist')) {
      return res.status(404).json({ message: 'Car not found in wishlist' });
    }
    res.status(500).json({ 
      message: 'Failed to remove from wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Clear wishlist
router.delete('/', authMiddleware, async (req, res) => {
  try {
    logger.info(`Clearing wishlist for user ${req.user.id}`);
    await WishlistModel.deleteAll(req.user.id);
    res.status(200).json({ message: 'Wishlist cleared successfully' });
  } catch (error) {
    logger.error('Error clearing wishlist:', {
      userId: req.user?.id,
      error: error.message
    });
    res.status(500).json({ 
      message: 'Failed to clear wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;