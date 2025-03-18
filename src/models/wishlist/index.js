const WishlistModel = require('./base');
const WishlistOperations = require('./operations');

module.exports = {
  // Query operations
  findUserWishlist: WishlistModel.findUserWishlist,
  exists: WishlistModel.exists,

  // Modification operations
  add: WishlistOperations.add,
  remove: WishlistOperations.remove,
  clear: WishlistOperations.clear
};