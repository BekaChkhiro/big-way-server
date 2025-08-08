const express = require('express');
const router = express.Router();
const { pg: pool } = require('../../config/db.config');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload } = require('../middlewares/upload.middleware');
const { USER_ROLES } = require('../constants/roles');
const dealerController = require('../controllers/dealerController');

// Get all dealers (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'წვდომა აკრძალულია' 
      });
    }
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        dp.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.gender,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM dealer_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (dp.company_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY dp.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.gender, u.created_at`;
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    console.log('Admin dealers query:', query);
    console.log('Query params:', queryParams);

    const result = await pool.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT dp.id) as total
      FROM dealer_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE 1=1 ${search ? `AND (dp.company_name ILIKE $1 OR u.username ILIKE $1)` : ''}
    `;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    console.log('Dealers found:', result.rows.length);
    console.log('Total count:', countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        company_name: row.company_name,
        logo_url: row.logo_url,
        established_year: row.established_year,
        website_url: row.website_url,
        social_media_url: row.social_media_url,
        address: row.address,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          role: row.role,
          gender: row.gender,
          created_at: row.user_created_at
        },
        car_count: parseInt(row.car_count) || 0
      })),
      meta: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dealers' 
    });
  }
});

// Get all dealers (Public access)
router.get('/public', async (req, res) => {
  try {
    console.log('Public dealers endpoint hit with query:', req.query);
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        dp.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.gender,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM dealer_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (dp.company_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY dp.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.gender, u.created_at`;
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    console.log('Public dealers query:', query);
    console.log('Public dealers params:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log('Public dealers result count:', result.rows.length);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT dp.id) as total
      FROM dealer_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE 1=1 ${search ? `AND (dp.company_name ILIKE $1 OR u.username ILIKE $1)` : ''}
    `;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    console.log('Public dealers total count:', countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        company_name: row.company_name,
        logo_url: row.logo_url,
        established_year: row.established_year,
        website_url: row.website_url,
        social_media_url: row.social_media_url,
        address: row.address,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          role: row.role,
          gender: row.gender,
          created_at: row.user_created_at
        },
        car_count: parseInt(row.car_count) || 0
      })),
      meta: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dealers' 
    });
  }
});

// Get dealer by user ID (Public access)
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        dp.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.gender,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM dealer_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE u.id = $1
      GROUP BY dp.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.gender, u.created_at
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found' 
      });
    }
    
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        user_id: row.user_id,
        company_name: row.company_name,
        logo_url: row.logo_url,
        established_year: row.established_year,
        website_url: row.website_url,
        social_media_url: row.social_media_url,
        address: row.address,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          role: row.role,
          gender: row.gender,
          created_at: row.user_created_at
        },
        car_count: parseInt(row.car_count) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dealer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dealer' 
    });
  }
});

// Test endpoint to check if upload middleware works
router.post('/test-upload', upload.single('logo'), async (req, res) => {
  try {
    console.log('Test upload endpoint hit');
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file received' });
    }
    
    console.log('File details:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Try to upload to S3
    try {
      const processedImages = await processAndUpload([req.file]);
      console.log('Test upload successful:', processedImages);
      
      res.json({
        success: true,
        message: 'Test upload successful',
        url: processedImages[0].original
      });
    } catch (uploadError) {
      console.error('Test upload failed:', uploadError);
      res.status(500).json({
        success: false,
        error: 'Test upload failed',
        details: uploadError.message
      });
    }
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ message: 'Test upload failed' });
  }
});

// Upload dealer logo (requires authentication)
router.post('/:dealerId/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    console.log('Logo upload request for dealer:', dealerId);
    console.log('Authenticated user:', req.user);
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    // Check if user owns this dealer profile
    const checkQuery = 'SELECT user_id FROM dealer_profiles WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [dealerId]);
    console.log('Dealer profile check result:', checkResult.rows);
    
    if (checkResult.rows.length === 0) {
      console.log('Dealer profile not found for ID:', dealerId);
      return res.status(404).json({ message: 'Dealer profile not found' });
    }
    
    if (checkResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      console.log('Authorization failed. Profile owner:', checkResult.rows[0].user_id, 'Request user:', req.user.id);
      return res.status(403).json({ message: 'Unauthorized to update this dealer profile' });
    }
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Process and upload logo to AWS S3
    let logoUrl;
    try {
      console.log('Starting S3 upload process for file:', req.file.originalname);
      const processedImages = await processAndUpload([req.file]);
      console.log('Logo processed and uploaded to S3 successfully:', processedImages);
      
      // Use the original image URL as the logo
      logoUrl = processedImages[0].original;
      console.log('Logo URL to save in database:', logoUrl);
    } catch (uploadError) {
      console.error('Error uploading logo to S3:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Logo upload failed. S3 storage is required.',
        details: uploadError.message
      });
    }
    
    // Update dealer profile with logo URL
    console.log('Updating dealer profile with logo URL:', logoUrl);
    const updateQuery = `
      UPDATE dealer_profiles 
      SET logo_url = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [logoUrl, dealerId]);
    console.log('Database update result:', updateResult.rows[0]);
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: logoUrl,
      dealer: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error uploading dealer logo:', error);
    res.status(500).json({ message: 'Failed to upload logo' });
  }
});

// Get dealer's cars
router.get('/:userId/cars', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        c.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ci.id,
            'url', ci.url,
            'is_featured', ci.is_featured
          ) ORDER BY ci.is_featured DESC, ci.id)
          FROM car_images ci
          WHERE ci.car_id = c.id
          ), '[]'::json
        ) as images
      FROM cars c
      WHERE c.seller_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM cars WHERE seller_id = $1',
      [userId]
    );
    
    res.json({
      cars: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    });
  } catch (error) {
    console.error('Error fetching dealer cars:', error);
    res.status(500).json({ message: 'Failed to fetch dealer cars' });
  }
});

// Admin-only routes using controller functions
router.post('/', authMiddleware, dealerController.createDealer);
router.put('/:id', authMiddleware, dealerController.updateDealerAdmin);
router.delete('/:id', authMiddleware, dealerController.deleteDealer);
router.post('/:id/logo', authMiddleware, upload.single('logo'), dealerController.uploadDealerLogo);

module.exports = router;