const DealerProfile = require('./dealer.model');

async function updateDealerProfile(userId, updateData) {
  try {
    const dealerProfile = await DealerProfile.findOne({
      where: { user_id: userId }
    });
    
    if (!dealerProfile) {
      throw new Error('Dealer profile not found');
    }
    
    // Update allowed fields
    const allowedFields = [
      'company_name',
      'logo_url',
      'established_year',
      'website_url',
      'social_media_url',
      'address'
    ];
    
    const updateFields = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });
    
    await dealerProfile.update(updateFields);
    
    return dealerProfile;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  updateDealerProfile
};