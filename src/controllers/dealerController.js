const {
  getDealerProfile,
  getAllDealers,
  getDealerCars,
  updateDealerProfile,
  createDealerProfile
} = require('../models/dealer');
const { uploadToS3, processAndUpload } = require('../middlewares/upload.middleware');
const { USER_ROLES } = require('../constants/roles');
const { pg: pool } = require('../../config/db.config');
const DealerService = require('../services/dealerService');

// Get single dealer profile with cars
exports.getDealerProfile = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealerProfile = await DealerService.getDealerById(dealerId);
    
    if (!dealerProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'დილერი ვერ მოიძებნა' 
      });
    }
    
    // Get dealer cars if profile exists
    try {
      const dealerCars = await DealerService.getDealerCars(dealerId, { limit: 12 });
      dealerProfile.cars = dealerCars.cars;
      dealerProfile.car_count = dealerCars.total;
    } catch (carError) {
      console.error('Error fetching dealer cars:', carError);
      dealerProfile.cars = [];
      dealerProfile.car_count = 0;
    }
    
    res.json({
      success: true,
      data: dealerProfile
    });
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'დილერის პროფილის ჩამოტვირთვისას მოხდა შეცდომა' 
    });
  }
};

// Get all dealers with pagination (Admin only)
exports.getAllDealersAdmin = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'წვდომა აკრძალულია' 
      });
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const result = await DealerService.getAllDealers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'დილერების ჩამოტვირთვისას მოხდა შეცდომა' 
    });
  }
};

// Get all dealers with pagination (public access)
exports.getAllDealers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const result = await DealerService.getAllDealers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dealers' 
    });
  }
};

// Get dealer's cars with filters
exports.getDealerCars = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const filters = req.query;
    
    const result = await DealerService.getDealerCars(dealerId, filters);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching dealer cars:', error);
    res.status(500).json({ 
      success: false, 
      message: 'დილერის მანქანების ჩამოტვირთვისას მოხდა შეცდომა' 
    });
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

// Admin-only: Create new dealer (Admin only)
exports.createDealer = async (req, res) => {
  try {
    console.log('Creating dealer - request body:', req.body);
    const { userData, dealerData } = req.body;
    
    // Check if user making request is admin
    if (req.user.role !== USER_ROLES.ADMIN) {
      console.log('User role check failed:', req.user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'მხოლოდ ადმინისტრატორს შეუძლია დილერის შექმნა' 
      });
    }

    const result = await DealerService.createDealer(userData, dealerData);

    res.status(201).json({
      success: true,
      message: 'დილერი წარმატებით შეიქმნა',
      data: result
    });

  } catch (error) {
    console.error('Error creating dealer:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'დილერის შექმნისას მოხდა შეცდომა',
      details: error.message
    });
  }
};

// Admin-only: Update dealer (Admin only)
exports.updateDealerAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'მხოლოდ ადმინისტრატორს შეუძლია დილერის რედაქტირება' 
      });
    }

    const result = await DealerService.updateDealer(id, updateData);

    res.json({
      success: true,
      message: 'დილერი წარმატებით განახლდა',
      data: result
    });

  } catch (error) {
    console.error('Error updating dealer:', error);
    res.status(500).json({
      success: false,
      message: 'დილერის განახლებისას მოხდა შეცდომა'
    });
  }
};

// Admin-only: Delete dealer (Admin only)
exports.deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'მხოლოდ ადმინისტრატორს შეუძლია დილერის წაშლა' 
      });
    }

    const result = await DealerService.deleteDealer(id);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error deleting dealer:', error);
    res.status(500).json({
      success: false,
      message: 'დილერის წაშლისას მოხდა შეცდომა'
    });
  }
};

// Admin-only: Upload dealer logo (Admin only)
exports.uploadDealerLogo = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'წვდომა აკრძალულია' 
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ფაილი არ არის მიღებული'
      });
    }

    const result = await DealerService.uploadLogo(id, req.file);

    res.json({
      success: true,
      message: 'ლოგო წარმატებით აიტვირთა',
      data: result
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'ლოგოს ატვირთვისას მოხდა შეცდომა'
    });
  }
};