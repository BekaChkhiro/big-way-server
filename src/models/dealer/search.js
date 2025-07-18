const DealerProfile = require('./dealer.model');
const User = require('../user.model');
const Car = require('../car.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/db.config');

async function getDealerProfile(userId) {
  try {
    const dealerProfile = await DealerProfile.findOne({
      where: { user_id: userId }
    });
    
    if (dealerProfile) {
      // Get user data separately
      const userQuery = `
        SELECT id, username as name, email, phone, role 
        FROM users 
        WHERE id = $1
      `;
      const userResult = await sequelize.query(userQuery, {
        bind: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get dealer's cars
      const carsQuery = `
        SELECT 
          c.*,
          b.name as make
        FROM cars c
        LEFT JOIN brands b ON c.brand_id = b.id
        WHERE c.seller_id = $1 
        ORDER BY c.created_at DESC
        LIMIT 12
      `;
      const carsResult = await sequelize.query(carsQuery, {
        bind: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get car count for pagination
      const countQuery = `SELECT COUNT(*) FROM cars WHERE seller_id = $1`;
      const countResult = await sequelize.query(countQuery, {
        bind: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Format cars to match DealerCar interface
      const formattedCars = carsResult.map(car => ({
        id: car.id,
        make: car.make || 'Unknown',
        model: car.model,
        year: car.year,
        price: parseFloat(car.price),
        mileage: 0, // Default for now
        engine_size: 0, // Default for now
        fuel_type: 'Unknown', // Default for now
        transmission: 'Unknown', // Default for now
        body_type: 'Unknown', // Default for now
        featured_image: null,
        images: [],
        is_vip: car.vip_status !== 'none',
        vip_type: car.vip_status !== 'none' ? car.vip_status : null,
        vip_expires_at: car.vip_expiration_date,
        created_at: car.created_at,
        updated_at: car.updated_at
      }));
      
      const dealerData = dealerProfile.toJSON();
      dealerData.user = userResult[0] || null;
      dealerData.cars = formattedCars;
      dealerData.car_count = parseInt(countResult[0].count);
      // Combined dealer profile with cars
      
      return dealerData;
    }
    
    return dealerProfile;
  } catch (error) {
    throw error;
  }
}

async function getDealerByCompanyName(companyName) {
  try {
    const dealerProfile = await DealerProfile.findOne({
      where: { 
        company_name: {
          [Op.iLike]: companyName
        }
      }
    });
    
    if (dealerProfile) {
      // Get user data separately
      const userQuery = `
        SELECT id, username as name, email, phone, role 
        FROM users 
        WHERE id = $1
      `;
      const userResult = await sequelize.query(userQuery, {
        bind: [dealerProfile.user_id],
        type: sequelize.QueryTypes.SELECT
      });
      
      const dealerData = dealerProfile.toJSON();
      dealerData.user = userResult[0] || null;
      return dealerData;
    }
    
    return dealerProfile;
  } catch (error) {
    throw error;
  }
}

async function getAllDealers(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { company_name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: dealers } = await DealerProfile.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]]
    });
    
    // Get user information for each dealer
    const dealerIds = dealers.map(d => d.user_id);
    
    // Get user data for all dealers
    let usersMap = {};
    if (dealerIds.length > 0) {
      const userQuery = `
        SELECT id, username as name, email, phone 
        FROM users 
        WHERE id = ANY($1::int[])
      `;
      const userResult = await sequelize.query(userQuery, {
        bind: [dealerIds],
        type: sequelize.QueryTypes.SELECT
      });
      
      usersMap = userResult.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});
    }
    
    // Get car count for each dealer using raw SQL
    let carCounts = [];
    if (dealerIds.length > 0) {
      const carCountQuery = `
        SELECT seller_id, COUNT(id) as car_count
        FROM cars
        WHERE seller_id = ANY($1::int[])
        GROUP BY seller_id
      `;
      const carCountResult = await sequelize.query(carCountQuery, {
        bind: [dealerIds],
        type: sequelize.QueryTypes.SELECT
      });
      carCounts = carCountResult;
    }
    
    const carCountMap = carCounts.reduce((map, item) => {
      map[item.seller_id] = parseInt(item.car_count);
      return map;
    }, {});
    
    const dealersWithCarCount = dealers.map(dealer => {
      const dealerData = dealer.toJSON();
      dealerData.car_count = carCountMap[dealer.user_id] || 0;
      dealerData.user = usersMap[dealer.user_id] || null;
      return dealerData;
    });
    
    return {
      dealers: dealersWithCarCount,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    throw error;
  }
}

async function getDealerCars(userId, options = {}) {
  try {
    console.log('getDealerCars called with userId:', userId, 'options:', options);
    
    // Verify dealer exists
    const dealerProfile = await DealerProfile.findOne({
      where: { user_id: userId }
    });
    
    console.log('Dealer profile found:', dealerProfile);
    
    if (!dealerProfile) {
      throw new Error('Dealer not found');
    }
    
    // Simple query to get dealer cars
    const carsQuery = `
      SELECT 
        c.*,
        b.name as make
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE c.seller_id = $1 
      ORDER BY c.created_at DESC
      LIMIT 12
    `;
    const cars = await sequelize.query(carsQuery, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Cars found:', cars);
    
    // Format cars to match DealerCar interface
    const formattedCars = cars.map(car => ({
      id: car.id,
      make: car.make || 'Unknown',
      model: car.model,
      year: car.year,
      price: parseFloat(car.price),
      mileage: 0,
      engine_size: 0,
      fuel_type: 'Unknown',
      transmission: 'Unknown',
      body_type: 'Unknown',
      featured_image: null,
      images: [],
      is_vip: car.vip_status !== 'none',
      vip_type: car.vip_status !== 'none' ? car.vip_status : null,
      vip_expires_at: car.vip_expiration_date,
      created_at: car.created_at,
      updated_at: car.updated_at
    }));
    
    return {
      cars: formattedCars,
      total: cars.length,
      page: 1,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error in getDealerCars:', error);
    throw error;
  }
}

module.exports = {
  getDealerProfile,
  getDealerByCompanyName,
  getAllDealers,
  getDealerCars
};