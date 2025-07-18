const {
  getDealerProfile,
  getAllDealers,
  getDealerCars,
  updateDealerProfile
} = require('../models/dealer');
const { uploadToS3, processAndUpload } = require('../middlewares/upload.middleware');
const { USER_ROLES } = require('../constants/roles');

// Get single dealer profile with cars
exports.getDealerProfile = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealerProfile = await getDealerProfile(dealerId);
    
    if (!dealerProfile) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    
    // Get dealer cars if profile exists
    try {
      const dealerCars = await getDealerCars(dealerId, { limit: 12 });
      dealerProfile.cars = dealerCars.cars;
      dealerProfile.car_count = dealerCars.total;
    } catch (carError) {
      console.error('Error fetching dealer cars:', carError);
      dealerProfile.cars = [];
      dealerProfile.car_count = 0;
    }
    
    res.json(dealerProfile);
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    res.status(500).json({ message: 'Error fetching dealer profile' });
  }
};

// Get all dealers with pagination
exports.getAllDealers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const result = await getAllDealers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ message: 'Error fetching dealers' });
  }
};

// Get dealer's cars with filters
exports.getDealerCars = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const filters = req.query;
    
    const result = await getDealerCars(dealerId, filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching dealer cars:', error);
    res.status(500).json({ message: 'Error fetching dealer cars' });
  }
};

// Update dealer profile (dealer only)
exports.updateDealerProfile = async (req, res) => {
  try {
    // Check if user is dealer and updating their own profile
    if (req.user.role !== USER_ROLES.DEALER || req.user.id !== parseInt(req.params.dealerId)) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    
    const updateData = req.body;
    
    // Handle logo upload if provided
    if (req.files && req.files.logo) {
      try {
        const logoUrl = await uploadToS3(req.files.logo, 'dealers');
        updateData.logo_url = logoUrl;
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return res.status(400).json({ message: 'Error uploading logo' });
      }
    }
    
    const updatedProfile = await updateDealerProfile(req.user.id, updateData);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating dealer profile:', error);
    res.status(500).json({ message: 'Error updating dealer profile' });
  }
};

// Get current dealer's own profile
exports.getMyDealerProfile = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.DEALER) {
      return res.status(403).json({ message: 'Not a dealer account' });
    }
    
    const dealerProfile = await getDealerProfile(req.user.id);
    
    if (!dealerProfile) {
      return res.status(404).json({ message: 'Dealer profile not found' });
    }
    
    res.json(dealerProfile);
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    res.status(500).json({ message: 'Error fetching dealer profile' });
  }
};