const DealerProfile = require('./dealer.model');
const User = require('../user.model');
const { Op } = require('sequelize');

async function createDealerProfile(userId, dealerData) {
  try {
    // Verify user exists and has dealer role
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role !== 'dealer') {
      throw new Error('User must have dealer role to create dealer profile');
    }
    
    // Check if dealer profile already exists
    const existingProfile = await DealerProfile.findOne({
      where: { user_id: userId }
    });
    
    if (existingProfile) {
      throw new Error('Dealer profile already exists for this user');
    }
    
    // Create dealer profile
    const dealerProfile = await DealerProfile.create({
      user_id: userId,
      company_name: dealerData.company_name,
      logo_url: dealerData.logo_url || null,
      established_year: dealerData.established_year || null,
      website_url: dealerData.website_url || null,
      social_media_url: dealerData.social_media_url || null,
      address: dealerData.address || null
    });
    
    return dealerProfile;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createDealerProfile
};