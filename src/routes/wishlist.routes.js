const router = require('express').Router();
const WishlistModel = require('../models/wishlist.model');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of cars in user's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wishlist = await WishlistModel.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
});

/**
 * @swagger
 * /api/wishlist/{carId}:
 *   post:
 *     summary: Add car to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Car added to wishlist successfully
 *       400:
 *         description: Car is already in wishlist
 *       404:
 *         description: Car not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:carId', authMiddleware, async (req, res) => {
  try {
    await WishlistModel.addToWishlist(req.user.id, req.params.carId);
    res.json({ message: 'Car added to wishlist successfully' });
  } catch (error) {
    if (error.message === 'Car is already in wishlist') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Car not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding car to wishlist', error: error.message });
  }
});

/**
 * @swagger
 * /api/wishlist/{carId}:
 *   delete:
 *     summary: Remove car from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Car removed from wishlist successfully
 *       404:
 *         description: Car not found in wishlist
 *       401:
 *         description: Unauthorized
 */
router.delete('/:carId', authMiddleware, async (req, res) => {
  try {
    await WishlistModel.removeFromWishlist(req.user.id, req.params.carId);
    res.json({ message: 'Car removed from wishlist successfully' });
  } catch (error) {
    if (error.message === 'Car not found in wishlist') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error removing car from wishlist', error: error.message });
  }
});

/**
 * @swagger
 * /api/wishlist/{carId}/check:
 *   get:
 *     summary: Check if car is in user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isInWishlist:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/:carId/check', authMiddleware, async (req, res) => {
  try {
    const isInWishlist = await WishlistModel.isInWishlist(req.user.id, req.params.carId);
    res.json({ isInWishlist });
  } catch (error) {
    res.status(500).json({ message: 'Error checking wishlist status', error: error.message });
  }
});

module.exports = router;