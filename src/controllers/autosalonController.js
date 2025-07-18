const AutosalonModel = require('../models/autosalon/autosalon.model');
const { pg: pool } = require('../../config/db.config');
const { USER_ROLES } = require('../constants/roles');

class AutosalonController {
  // Create new autosalon (Admin only)
  static async createAutosalon(req, res) {
    try {
      console.log('Creating autosalon - request body:', req.body);
      const { userData, autosalonData } = req.body;
      
      // Check if user making request is admin
      if (req.user.role !== USER_ROLES.ADMIN) {
        console.log('User role check failed:', req.user.role);
        return res.status(403).json({ 
          success: false, 
          message: 'მხოლოდ ადმინისტრატორს შეუძლია ავტოსალონის შექმნა' 
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if email already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [userData.email]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს'
          });
        }

        // Create user account (need to hash password)
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const userResult = await client.query(
          `INSERT INTO users (username, email, password, first_name, last_name, phone, role, age, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, username, email, first_name, last_name, phone, role, created_at`,
          [
            userData.username,
            userData.email,
            hashedPassword,
            userData.first_name,
            userData.last_name,
            userData.phone || null,
            USER_ROLES.AUTOSALON,
            30, // Default age for autosalon users
            userData.gender || 'other' // Use gender from form data
          ]
        );

        const user = userResult.rows[0];

        // Create autosalon profile
        const autosalonResult = await client.query(
          `INSERT INTO autosalon_profiles 
           (user_id, company_name, logo_url, established_year, website_url, address, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            user.id,
            autosalonData.company_name,
            autosalonData.logo_url || null,
            autosalonData.established_year || null,
            autosalonData.website_url || null,
            autosalonData.address || null
          ]
        );

        const autosalon = autosalonResult.rows[0];

        // Update user with autosalon_id
        await client.query(
          'UPDATE users SET autosalon_id = $1 WHERE id = $2',
          [autosalon.id, user.id]
        );

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'ავტოსალონი წარმატებით შეიქმნა',
          data: {
            id: autosalon.id,
            user_id: user.id,
            company_name: autosalon.company_name,
            logo_url: autosalon.logo_url,
            phone: userData.phone || null,
            established_year: autosalon.established_year,
            website_url: autosalon.website_url,
            address: autosalon.address,
            created_at: autosalon.created_at,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              role: user.role,
              created_at: user.created_at
            }
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error creating autosalon:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონის შექმნისას მოხდა შეცდომა',
        details: error.message
      });
    }
  }

  // Get all autosalons (Admin only or public access)
  static async getAllAutosalons(req, res) {
    try {
      // Check if this is a public request (no authentication) or admin request
      const isPublicRequest = !req.user;
      const isAdminRequest = req.user && req.user.role === USER_ROLES.ADMIN;
      
      if (!isPublicRequest && !isAdminRequest) {
        return res.status(403).json({ 
          success: false, 
          message: 'წვდომა აკრძალულია' 
        });
      }

      const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

      const result = await AutosalonModel.getAll({
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
      console.error('Error fetching autosalons:', error);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონების ჩამოტვირთვისას მოხდა შეცდომა'
      });
    }
  }

  // Get autosalon by ID (public access or admin)
  static async getAutosalonById(req, res) {
    try {
      const { id } = req.params;
      
      // Allow public access or admin access
      const isPublicRequest = !req.user;
      const isAdminRequest = req.user && req.user.role === USER_ROLES.ADMIN;
      
      if (!isPublicRequest && !isAdminRequest) {
        return res.status(403).json({ 
          success: false, 
          message: 'წვდომა აკრძალულია' 
        });
      }
      
      const autosalon = await AutosalonModel.getById(id);

      if (!autosalon) {
        return res.status(404).json({
          success: false,
          message: 'ავტოსალონი ვერ მოიძებნა'
        });
      }

      // Updated to return structured data with user object
      res.json({
        success: true,
        data: autosalon
      });

    } catch (error) {
      console.error('Error fetching autosalon:', error);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონის ჩამოტვირთვისას მოხდა შეცდომა'
      });
    }
  }

  // Get autosalon's cars (public access)  
  static async getAutosalonCars(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;
      
      // First get the autosalon to get the user_id
      const autosalon = await AutosalonModel.getById(id);
      if (!autosalon) {
        return res.status(404).json({
          success: false,
          message: 'ავტოსალონი ვერ მოიძებნა'
        });
      }
      
      // Query to get cars with proper images structure (similar to main cars API)
      const query = `
        SELECT 
          c.*,
          b.name as brand,
          cat.name as category_name,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', ci.id,
              'url', ci.url,
              'thumbnail_url', ci.thumbnail_url,
              'medium_url', ci.medium_url,
              'large_url', ci.large_url,
              'is_featured', ci.is_featured
            ) ORDER BY ci.is_featured DESC, ci.id)
            FROM car_images ci
            WHERE ci.car_id = c.id
            ), '[]'::json
          ) as images,
          COALESCE(
            (SELECT json_build_object(
              'engine_type', cs.engine_type,
              'transmission', cs.transmission,
              'fuel_type', cs.fuel_type,
              'mileage', cs.mileage,
              'engine_size', cs.engine_size,
              'steering_wheel', cs.steering_wheel,
              'drive_type', cs.drive_type,
              'interior_material', cs.interior_material,
              'interior_color', cs.interior_color
            )
            FROM car_specifications cs
            WHERE cs.id = c.specification_id
            ), '{}'::json
          ) as specifications,
          COALESCE(
            (SELECT json_build_object(
              'city', l.city,
              'country', l.country
            )
            FROM locations l
            WHERE l.id = c.location_id
            ), '{}'::json
          ) as location
        FROM cars c
        LEFT JOIN brands b ON c.brand_id = b.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.seller_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [autosalon.user_id, limit, offset]);
      
      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM cars WHERE seller_id = $1',
        [autosalon.user_id]
      );
      
      res.json({
        success: true,
        cars: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      });
    } catch (error) {
      console.error('Error fetching autosalon cars:', error);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონის მანქანების ჩამოტვირთვისას მოხდა შეცდომა'
      });
    }
  }

  // Update autosalon (Admin only)
  static async updateAutosalon(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({ 
          success: false, 
          message: 'მხოლოდ ადმინისტრატორს შეუძლია ავტოსალონის რედაქტირება' 
        });
      }

      const autosalon = await AutosalonModel.update(id, updateData);

      if (!autosalon) {
        return res.status(404).json({
          success: false,
          message: 'ავტოსალონი ვერ მოიძებნა'
        });
      }

      res.json({
        success: true,
        message: 'ავტოსალონი წარმატებით განახლდა',
        data: autosalon
      });

    } catch (error) {
      console.error('Error updating autosalon:', error);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონის განახლებისას მოხდა შეცდომა'
      });
    }
  }

  // Delete autosalon (Admin only)
  static async deleteAutosalon(req, res) {
    try {
      const { id } = req.params;

      if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({ 
          success: false, 
          message: 'მხოლოდ ადმინისტრატორს შეუძლია ავტოსალონის წაშლა' 
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get autosalon info to get user_id
        const autosalonResult = await client.query(
          'SELECT user_id FROM autosalon_profiles WHERE id = $1',
          [id]
        );

        if (autosalonResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'ავტოსალონი ვერ მოიძებნა'
          });
        }

        const userId = autosalonResult.rows[0].user_id;

        // Delete autosalon profile
        await client.query('DELETE FROM autosalon_profiles WHERE id = $1', [id]);

        // Delete user account
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'ავტოსალონი წარმატებით წაიშალა'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error deleting autosalon:', error);
      res.status(500).json({
        success: false,
        message: 'ავტოსალონის წაშლისას მოხდა შეცდომა'
      });
    }
  }

  // Upload autosalon logo (Admin only)
  static async uploadLogo(req, res) {
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

      // Process and upload logo to AWS S3
      const { processAndUpload } = require('../middlewares/upload.middleware');
      const processedImages = await processAndUpload([req.file]);
      const logoUrl = processedImages[0].original;

      // Update autosalon with logo URL
      const autosalon = await AutosalonModel.update(id, { logo_url: logoUrl });

      res.json({
        success: true,
        message: 'ლოგო წარმატებით აიტვირთა',
        data: {
          logo_url: logoUrl,
          autosalon
        }
      });

    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        success: false,
        message: 'ლოგოს ატვირთვისას მოხდა შეცდომა'
      });
    }
  }
}

module.exports = AutosalonController;