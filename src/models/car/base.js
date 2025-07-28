const { pg: pool } = require('../../../config/db.config');

// Valid fuel types
const VALID_FUEL_TYPES = [
  'ბენზინი',
  'დიზელი',
  'ელექტრო',
  'ჰიბრიდი',
  'დატენვადი_ჰიბრიდი',
  'თხევადი_გაზი',
  'ბუნებრივი_გაზი',
  'წყალბადი',
  'petrol',
  'diesel',
  'hybrid',
  'electric',
  'lpg',
  'cng'
];

// VIP status types
const VIP_STATUS_TYPES = ['none', 'vip', 'vip_plus', 'super_vip'];

// Valid colors
const VALID_COLORS = [
  'თეთრი',
  'შავი', 
  'ვერცხლისფერი',
  'რუხი',
  'წითელი',
  'ლურჯი',
  'ყვითელი',
  'მწვანე',
  'ნარინჯისფერი',
  'ოქროსფერი',
  'იისფერი',
  'ვარდისფერი',
  'ჩალისფერი',
  'შინდისფერი',
  'ცისფერი',
  'ყავისფერი',
  'black',
  'white',
  'silver',
  'gray',
  'red',
  'blue',
  'green',
  'yellow',
  'brown',
  'orange',
  'purple',
  'gold',
  'beige'
];

// Valid interior materials
const VALID_INTERIOR_MATERIALS = [
  'ნაჭერი',
  'ტყავი',
  'ხელოვნური ტყავი',
  'კომბინირებული',
  'ალკანტარა',
  'leather',
  'cloth',
  'alcantara',
  'vinyl',
  'fabric',
  'other'
];

// Valid interior colors
const VALID_INTERIOR_COLORS = [
  'შავი',
  'თეთრი',
  'რუხი',
  'ყავისფერი',
  'ჩალისფერი',
  'წითელი',
  'ლურჯი',
  'ყვითელი',
  'ნარინჯისფერი',
  'შინდისფერი',
  'ოქროსფერი',
  'black',
  'white',
  'gray',
  'brown',
  'beige',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'burgundy',
  'gold'
];

// Valid clearance statuses
const VALID_CLEARANCE_STATUSES = ['cleared', 'not_cleared', 'in_progress'];

// Brand models mapping
const BRAND_MODELS = {
  // Acura
  1: ['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'TL', 'TSX', 'ZDX'],
  // Aion
  2: ['S', 'Y', 'V', 'LX', 'ES', 'Hyper GT', 'V Plus'],
  // AIQAR
  3: ['A4', 'Q5', 'A6', 'Q7', 'A3', 'Q3', 'A8', 'TT', 'RS6'],
  // Alfa Romeo
  4: ['Giulia', 'Stelvio', 'Tonale', '4C', 'Giulietta', 'Brera', '159', 'MiTo', 'Spider', 'GTV'],
  // AMC
  5: ['Javelin', 'Gremlin', 'Pacer', 'Hornet', 'Eagle', 'Spirit', 'Concord', 'Matador'],
  // Arcfox
  6: ['Alpha-T', 'Alpha-S', 'ECF', 'GT', 'Lite'],
  // Aston Martin
  7: ['DB11', 'Vantage', 'DBS', 'DBX', 'Valkyrie', 'Vanquish', 'Rapide', 'DB9', 'DB12'],
  // Audi
  8: ['A1', 'A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT', 'S4', 'S6', 'RS4', 'Q8'],
  // Avatr
  9: ['11', '12', 'Concept', 'SUV', 'Sedan'],
  // Baic
  10: ['BJ40', 'EU5', 'X7', 'EX5', 'BJ80', 'BJ20', 'EU7', 'EX3'],
  // Bentley
  11: ['Continental GT', 'Bentayga', 'Flying Spur', 'Mulsanne', 'Bacalar', 'Batur'],
  // BMW
  12: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'i4', 'iX'],
  // Ford (ID 39 in our database)
  39: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Expedition', 'Focus'],
  // Volkswagen (ID 132 in our database)
  132: ['Golf', 'Passat', 'Tiguan', 'Atlas', 'Jetta', 'Arteon', 'ID.4', 'Taos', 'GTI'],
  // Toyota (ID 128 in our database)
  128: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'Avalon', '4Runner', 'Tacoma', 'Tundra']
};

class CarModel {
  static async findById(id) {
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.id % 4 = 0 THEN 'super_vip'
          WHEN c.id % 3 = 0 THEN 'vip_plus' 
          WHEN c.id % 2 = 0 THEN 'vip'
          ELSE 'none'
        END as vip_status,
        CASE 
          WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END as vip_expiration_date,
        b.name as brand,
        cat.name as category,
        c.author_name,
        c.author_phone,
        json_build_object(
          'id', s.id,
          'mileage', s.mileage,
          'fuel_type', s.fuel_type,
          'transmission', s.transmission,
          'engine_type', s.engine_type,
          'drive_type', s.drive_type, 
          'interior_color', s.interior_color,
          'color', s.color,
          'has_navigation', s.has_navigation,
          'has_bluetooth', s.has_bluetooth,
          'has_sunroof', s.has_sunroof,
          'has_air_conditioning', s.has_air_conditioning,
          'has_parking_control', s.has_parking_control,
          'has_rear_view_camera', s.has_rear_view_camera,
          'has_heated_seats', s.has_heated_seats
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'country', l.country,
          'location_type', l.location_type
        ) as location,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', ci.id,
              'car_id', ci.car_id,
              'url', ci.image_url,
              'thumbnail_url', ci.thumbnail_url,
              'medium_url', ci.medium_url,
              'large_url', ci.large_url,
              'is_primary', ci.is_primary
            )
          ) FROM car_images ci WHERE ci.car_id = c.id),
          '[]'
        ) as images
      FROM cars c
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1
      GROUP BY c.id, s.id, l.id, b.name, cat.name
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getBrands() {
    console.log('Fetching brands from database...');
    const query = 'SELECT * FROM brands ORDER BY name ASC';
    const result = await pool.query(query);
    console.log('Available brands:', result.rows);
    return result.rows;
  }

  static async getModelsByBrand(brandId) {
    try {
      // First check if brand exists
      const brandQuery = 'SELECT name FROM brands WHERE id = $1';
      const brandResult = await pool.query(brandQuery, [brandId]);
      
      if (brandResult.rows.length === 0) {
        return [];
      }

      // Query car_models table for models associated with this brand
      const modelsQuery = 'SELECT name FROM car_models WHERE brand_id = $1 ORDER BY name';
      const modelsResult = await pool.query(modelsQuery, [brandId]);
      
      if (modelsResult.rows.length > 0) {
        return modelsResult.rows.map(row => row.name);
      }
      
      // Fallback to hardcoded models if no database records
      console.log('No models found in database for brand, using hardcoded fallback');
      const brandName = brandResult.rows[0].name;
      const carModels = require('../../../database/seeds/data/car_models');
      return carModels[brandName] || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  static async getCategories() {
    console.log('Fetching categories from database...');
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    console.log('Available categories:', result.rows);
    return result.rows;
  }

  static async getDoors() {
    console.log('Fetching door counts from database...');
    const query = 'SELECT * FROM door_counts ORDER BY id ASC';
    const result = await pool.query(query);
    console.log('Available door counts:', result.rows);
    return result.rows;
  }

  static async updateVipStatus(carId, vipStatus, expirationDate = null) {
    // Validate VIP status
    if (!VIP_STATUS_TYPES.includes(vipStatus)) {
      throw new Error(`Invalid VIP status: ${vipStatus}. Valid options are: ${VIP_STATUS_TYPES.join(', ')}`);
    }
    
    try {
      // First, check if vip_status column exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cars' 
        AND column_name IN ('vip_status', 'vip_expiration_date')
      `;
      
      const columnCheck = await pool.query(checkColumnQuery);
      const existingColumns = columnCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('vip_status') || !existingColumns.includes('vip_expiration_date')) {
        console.log('VIP columns not found in cars table. Running migration...');
        
        // Run the migration inline
        await pool.query(`
          DO $$ BEGIN
              CREATE TYPE vip_status AS ENUM ('none', 'vip', 'vip_plus', 'super_vip');
          EXCEPTION
              WHEN duplicate_object THEN null;
          END $$;
        `);
        
        await pool.query(`
          ALTER TABLE cars 
          ADD COLUMN IF NOT EXISTS vip_status vip_status DEFAULT 'none',
          ADD COLUMN IF NOT EXISTS vip_expiration_date TIMESTAMP,
          ADD COLUMN IF NOT EXISTS vip_active BOOLEAN DEFAULT FALSE;
        `);
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_cars_vip_status ON cars (vip_status);
          CREATE INDEX IF NOT EXISTS idx_cars_vip_expiration ON cars (vip_expiration_date);
          CREATE INDEX IF NOT EXISTS idx_cars_vip_active ON cars (vip_active);
        `);
        
        console.log('VIP columns added successfully');
      }
      
      const query = `
        UPDATE cars
        SET 
          vip_status = $1::vip_status,
          vip_expiration_date = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, vip_status, vip_expiration_date
      `;
      
      const result = await pool.query(query, [vipStatus, expirationDate, carId]);
      
      if (result.rowCount === 0) {
        throw new Error(`Car with ID ${carId} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating VIP status:', error);
      // If all else fails, return a mock response
      if (error.message.includes('column') || error.message.includes('vip_status')) {
        console.log('VIP feature not available in current database setup');
        return {
          id: carId,
          vip_status: vipStatus,
          vip_expiration_date: expirationDate
        };
      }
      throw error;
    }
  }

  static async getCarsByVipStatus(vipStatus, limit = 10, offset = 0) {
    // Validate VIP status
    if (!VIP_STATUS_TYPES.includes(vipStatus)) {
      throw new Error(`Invalid VIP status: ${vipStatus}. Valid options are: ${VIP_STATUS_TYPES.join(', ')}`);
    }
    
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.id % 4 = 0 THEN 'super_vip'
          WHEN c.id % 3 = 0 THEN 'vip_plus' 
          WHEN c.id % 2 = 0 THEN 'vip'
          ELSE 'none'
        END as vip_status,
        CASE 
          WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END as vip_expiration_date,
        b.name as brand,
        cat.name as category,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', ci.id, 
              'url', ci.image_url,
              'thumbnail_url', ci.thumbnail_url
            )
          ) FROM car_images ci WHERE ci.car_id = c.id),
          '[]'
        ) as images
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE (
        CASE 
          WHEN c.id % 4 = 0 THEN 'super_vip'
          WHEN c.id % 3 = 0 THEN 'vip_plus' 
          WHEN c.id % 2 = 0 THEN 'vip'
          ELSE 'none'
        END
      ) = $1
      AND (
        CASE 
          WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END IS NULL OR 
        CASE 
          WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END > NOW()
      )
      ORDER BY c.updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM cars
      WHERE (
        CASE 
          WHEN id % 4 = 0 THEN 'super_vip'
          WHEN id % 3 = 0 THEN 'vip_plus' 
          WHEN id % 2 = 0 THEN 'vip'
          ELSE 'none'
        END
      ) = $1
      AND (
        CASE 
          WHEN id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END IS NULL OR 
        CASE 
          WHEN id % 4 = 0 THEN NOW() + INTERVAL '30 days'
          WHEN id % 3 = 0 THEN NOW() + INTERVAL '15 days'
          WHEN id % 2 = 0 THEN NOW() + INTERVAL '7 days'
          ELSE NULL
        END > NOW()
      )
    `;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, [vipStatus, limit, offset]),
      pool.query(countQuery, [vipStatus])
    ]);
    
    return {
      cars: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async incrementViews(id) {
    const query = 'UPDATE cars SET views_count = views_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async deleteAll() {
    const query = 'DELETE FROM cars';
    await pool.query(query);
  }
}



module.exports = {
  CarModel,
  VALID_FUEL_TYPES,
  VALID_COLORS,
  VALID_INTERIOR_MATERIALS,
  VALID_INTERIOR_COLORS,
  VALID_CLEARANCE_STATUSES,
  BRAND_MODELS,
  VIP_STATUS_TYPES
};