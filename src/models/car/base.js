const pool = require('../../../config/db.config');

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
      SELECT c.*, 
        json_build_object(
          'id', s.id,
          'engine_type', s.engine_type,
          'transmission', s.transmission,
          'fuel_type', s.fuel_type,
          'mileage', s.mileage,
          'engine_size', s.engine_size,
          'doors', s.doors,
          'color', s.color,

          'has_hydraulics', s.has_hydraulics,
          'has_board_computer', s.has_board_computer,
          'has_air_conditioning', s.has_air_conditioning,
          'has_parking_control', s.has_parking_control,
          'has_rear_view_camera', s.has_rear_view_camera,
          'has_electric_windows', s.has_electric_windows,
          'has_climate_control', s.has_climate_control,
          'has_cruise_control', s.has_cruise_control,
          'has_start_stop', s.has_start_stop,
          'has_sunroof', s.has_sunroof,
          'has_seat_heating', s.has_seat_heating,
          'has_seat_memory', s.has_seat_memory,
          'has_abs', s.has_abs,
          'has_traction_control', s.has_traction_control,
          'has_central_locking', s.has_central_locking,
          'has_alarm', s.has_alarm,
          'has_fog_lights', s.has_fog_lights,
          'has_navigation', s.has_navigation,
          'has_aux', s.has_aux,
          'has_bluetooth', s.has_bluetooth,
          'has_multifunction_steering_wheel', s.has_multifunction_steering_wheel,
          'has_alloy_wheels', s.has_alloy_wheels,
          'has_spare_tire', s.has_spare_tire,
          'is_disability_adapted', s.is_disability_adapted
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'state', l.state,
          'country', l.country
        ) as location,
        json_agg(DISTINCT ci.*) as images,
        b.name as brand_name,
        cat.name as category_name
      FROM cars c
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN car_images ci ON c.id = ci.car_id
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
  BRAND_MODELS
};