const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  DEALER: 'dealer'
};

const isDealer = (role) => role === USER_ROLES.DEALER;
const isAdmin = (role) => role === USER_ROLES.ADMIN;
const isUser = (role) => role === USER_ROLES.USER;

module.exports = {
  USER_ROLES,
  isDealer,
  isAdmin,
  isUser
};