module.exports = [
  {
    brand_id: 3, // BMW
    category_id: 3, // Coupe
    model: 'M4',
    year: 2023,
    price: 74900,
    description: 'BMW M4 Competition with M xDrive. Pristine condition, fully loaded with premium features.',
    status: 'available',
    featured: true,
    seller_id: 4, // dealer1
    specifications: {
      engine_type: 'Twin-Turbo Inline-6',
      transmission: 'Automatic',
      fuel_type: 'Gasoline',
      mileage: 1500,
      engine_size: 3.0,
      horsepower: 503,
      doors: 2,
      color: 'Frozen Brilliant White',
      body_type: 'Coupe'
    },
    location: {
      city: 'Los Angeles',
      state: 'California',
      country: 'USA'
    },
    images: [
      {
        url: 'https://bigway-cars.s3.amazonaws.com/m4-1.jpg',
        thumbnail_url: 'https://bigway-cars.s3.amazonaws.com/thumbnails/m4-1.jpg',
        medium_url: 'https://bigway-cars.s3.amazonaws.com/medium/m4-1.jpg',
        large_url: 'https://bigway-cars.s3.amazonaws.com/large/m4-1.jpg'
      }
    ]
  },
  {
    brand_id: 15, // Tesla
    category_id: 10, // Electric
    model: 'Model S',
    year: 2023,
    price: 89990,
    description: 'Tesla Model S Plaid. Incredible performance with latest tech features.',
    status: 'available',
    featured: true,
    seller_id: 4, // dealer1
    specifications: {
      engine_type: 'Electric',
      transmission: 'Automatic',
      fuel_type: 'Electric',
      mileage: 500,
      engine_size: null,
      horsepower: 1020,
      doors: 4,
      color: 'Deep Blue Metallic',
      body_type: 'Sedan'
    },
    location: {
      city: 'San Francisco',
      state: 'California',
      country: 'USA'
    },
    images: [
      {
        url: 'https://bigway-cars.s3.amazonaws.com/tesla-s-1.jpg',
        thumbnail_url: 'https://bigway-cars.s3.amazonaws.com/thumbnails/tesla-s-1.jpg',
        medium_url: 'https://bigway-cars.s3.amazonaws.com/medium/tesla-s-1.jpg',
        large_url: 'https://bigway-cars.s3.amazonaws.com/large/tesla-s-1.jpg'
      }
    ]
  },
  {
    brand_id: 14, // Porsche
    category_id: 7, // Sports Car
    model: '911 GT3',
    year: 2023,
    price: 169700,
    description: 'Porsche 911 GT3 with Touring Package. Track-ready performance.',
    status: 'available',
    featured: true,
    seller_id: 5, // dealer2
    specifications: {
      engine_type: 'Naturally Aspirated Flat-6',
      transmission: 'Manual',
      fuel_type: 'Premium Gasoline',
      mileage: 250,
      engine_size: 4.0,
      horsepower: 502,
      doors: 2,
      color: 'GT Silver Metallic',
      body_type: 'Coupe'
    },
    location: {
      city: 'Miami',
      state: 'Florida',
      country: 'USA'
    },
    images: [
      {
        url: 'https://bigway-cars.s3.amazonaws.com/911-gt3-1.jpg',
        thumbnail_url: 'https://bigway-cars.s3.amazonaws.com/thumbnails/911-gt3-1.jpg',
        medium_url: 'https://bigway-cars.s3.amazonaws.com/medium/911-gt3-1.jpg',
        large_url: 'https://bigway-cars.s3.amazonaws.com/large/911-gt3-1.jpg'
      }
    ]
  },
  {
    brand_id: 1, // Toyota
    category_id: 2, // SUV
    model: 'RAV4 Hybrid',
    year: 2023,
    price: 34900,
    description: 'Toyota RAV4 Hybrid XSE. Perfect blend of efficiency and versatility.',
    status: 'available',
    featured: false,
    seller_id: 5, // dealer2
    specifications: {
      engine_type: 'Hybrid',
      transmission: 'CVT',
      fuel_type: 'Hybrid',
      mileage: 3500,
      engine_size: 2.5,
      horsepower: 219,
      doors: 5,
      color: 'Blueprint',
      body_type: 'SUV'
    },
    location: {
      city: 'Seattle',
      state: 'Washington',
      country: 'USA'
    },
    images: [
      {
        url: 'https://bigway-cars.s3.amazonaws.com/rav4-1.jpg',
        thumbnail_url: 'https://bigway-cars.s3.amazonaws.com/thumbnails/rav4-1.jpg',
        medium_url: 'https://bigway-cars.s3.amazonaws.com/medium/rav4-1.jpg',
        large_url: 'https://bigway-cars.s3.amazonaws.com/large/rav4-1.jpg'
      }
    ]
  }
];