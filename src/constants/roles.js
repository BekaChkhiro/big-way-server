const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  DEALER: 'dealer',
  AUTOSALON: 'autosalon'
};

const isDealer = (role) => role === USER_ROLES.DEALER;
const isAdmin = (role) => role === USER_ROLES.ADMIN;
const isUser = (role) => role === USER_ROLES.USER;
const isAutosalon = (role) => role === USER_ROLES.AUTOSALON;

module.exports = {
  USER_ROLES,
  isDealer,
  isAdmin,
  isUser,
  isAutosalon
};