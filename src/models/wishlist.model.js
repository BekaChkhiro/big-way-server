const { findUserWishlist, exists } = require('./wishlist/index');
const { add, remove, clear } = require('./wishlist/operations');

class WishlistModel {
  static async findUserWishlist(userId) {
    return findUserWishlist(userId);
  }

  static async exists(userId, carId) {
    return exists(userId, carId);
  }

  static async addToWishlist(userId, carId) {
    return add(userId, carId);
  }

  static async removeFromWishlist(userId, carId) {
    return remove(userId, carId);
  }

  static async isInWishlist(userId, carId) {
    return exists(userId, carId);
  }

  static async deleteAll(userId) {
    return clear(userId);
  }
}

module.exports = WishlistModel;