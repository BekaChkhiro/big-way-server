const advertisementModel = require('../models/advertisement/advertisement.model');
const { uploadToS3 } = require('../middlewares/upload.middleware');

// Get all advertisements for admin
async function getAdvertisements(req, res) {
  try {
    const advertisements = await advertisementModel.getAllAdvertisements();
    res.json(advertisements);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Get active advertisements by placement
async function getActiveAdvertisementsByPlacement(req, res) {
  try {
    const { placement } = req.params;
    const advertisements = await advertisementModel.getActiveAdvertisementsByPlacement(placement);
    res.json(advertisements);
  } catch (error) {
    console.error('Error fetching advertisements by placement:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Get single advertisement by ID
async function getAdvertisementById(req, res) {
  try {
    const { id } = req.params;
    const advertisement = await advertisementModel.getAdvertisementById(id);
    
    if (!advertisement) {
      return res.status(404).json({ 
        success: false,
        error: 'Advertisement not found' 
      });
    }
    
    res.json(advertisement);
  } catch (error) {
    console.error('Error fetching advertisement by ID:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Create new advertisement
async function createAdvertisement(req, res) {
  try {
    const advertisementData = req.body;
    
    // Handle image upload if provided
    if (req.file) {
      const result = await uploadToS3(req.file);
      advertisementData.image_url = result.Location;
    }
    
    const newAdvertisement = await advertisementModel.createAdvertisement(advertisementData);
    res.status(201).json({
      success: true,
      data: newAdvertisement
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Update advertisement
async function updateAdvertisement(req, res) {
  try {
    const { id } = req.params;
    const advertisementData = { ...req.body };
    
    console.log(`Updating advertisement ${id} with data:`, advertisementData);
    
    // Check if advertisement exists
    const existingAd = await advertisementModel.getAdvertisementById(id);
    if (!existingAd) {
      return res.status(404).json({ 
        success: false,
        error: 'Advertisement not found' 
      });
    }
    
    // Handle image upload if provided
    if (req.file) {
      console.log('Image file provided for update. Processing...');
      try {
        const result = await uploadToS3(req.file);
        advertisementData.image_url = result.Location;
        console.log('Successfully uploaded new image:', result.Location);
      } catch (uploadError) {
        console.error('Error uploading image during update:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image: ' + uploadError.message
        });
      }
    } else {
      // If no new image is provided, keep the existing image URL
      console.log('No new image provided, keeping existing image URL');
      if (!advertisementData.image_url && existingAd.image_url) {
        advertisementData.image_url = existingAd.image_url;
      }
    }
    
    // Handle boolean conversion for is_active
    if (typeof advertisementData.is_active === 'string') {
      advertisementData.is_active = advertisementData.is_active.toLowerCase() === 'true';
    }
    
    console.log('Final advertisement data for update:', advertisementData);
    const updatedAdvertisement = await advertisementModel.updateAdvertisement(id, advertisementData);
    console.log('Successfully updated advertisement:', updatedAdvertisement);
    
    res.json({
      success: true,
      data: updatedAdvertisement
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Delete advertisement
async function deleteAdvertisement(req, res) {
  try {
    const { id } = req.params;
    
    // Check if advertisement exists
    const existingAd = await advertisementModel.getAdvertisementById(id);
    if (!existingAd) {
      return res.status(404).json({ 
        success: false,
        error: 'Advertisement not found' 
      });
    }
    
    await advertisementModel.deleteAdvertisement(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Record advertisement impression
async function recordImpression(req, res) {
  try {
    const { id } = req.params;
    await advertisementModel.recordImpression(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Record advertisement click
async function recordClick(req, res) {
  try {
    const { id } = req.params;
    await advertisementModel.recordClick(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Get advertisement analytics by ID
async function getAdvertisementAnalytics(req, res) {
  try {
    const { id } = req.params;
    const analytics = await advertisementModel.getAdvertisementAnalytics(id);
    
    if (!analytics) {
      return res.status(404).json({ 
        success: false,
        error: 'Advertisement not found' 
      });
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching advertisement analytics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Get all advertisements with analytics
async function getAllAdvertisementsAnalytics(req, res) {
  try {
    const analytics = await advertisementModel.getAllAdvertisementsAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching all advertisement analytics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

module.exports = {
  getAdvertisements,
  getActiveAdvertisementsByPlacement,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  recordImpression,
  recordClick,
  getAdvertisementAnalytics,
  getAllAdvertisementsAnalytics
};
