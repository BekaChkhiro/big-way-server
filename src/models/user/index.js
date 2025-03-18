const UserModel = require('./base');
const UserAuth = require('./auth');
const UserUpdate = require('./update');

module.exports = {
  // Base operations
  findById: UserModel.findById,
  findByEmail: UserModel.findByEmail,
  findByUsername: UserModel.findByUsername,
  generateToken: UserModel.generateToken,
  validateUser: UserModel.validateUser,

  // Authentication operations
  register: UserAuth.register,
  login: UserAuth.login,
  changePassword: UserAuth.changePassword,
  resetPassword: UserAuth.resetPassword,
  verifyResetToken: UserAuth.verifyResetToken,
  setNewPassword: UserAuth.setNewPassword,

  // Profile update operations
  updateProfile: UserUpdate.updateProfile,
  updateRole: UserUpdate.updateRole,
  delete: UserUpdate.delete
};