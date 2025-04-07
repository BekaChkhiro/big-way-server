const request = require('supertest');
const app = require('../../index');
const { setupTestDb, teardownTestDb } = require('./setup');
const UserModel = require('../../models/user.model');
const CarModel = require('../../models/car.model');

describe('Cars Routes', () => {
  let authToken;
  let testUser;

  const testCar = {
    brand_id: 1, // Test Brand 1
    category_id: 1, // Test Category 1
    model: 'Test Model',
    year: 2023,
    price: 50000,
    description: 'Test car description',
    engine_type: 'V6',
    transmission: 'automatic',
    fuel_type: 'ბენზინი',
    mileage: 0,
    engine_size: 2,
    horsepower: 200,
    doors: 4,
    color: 'Black',

    city: 'Test City',
    state: 'Test State',
    country: 'Test Country'
  };

  beforeAll(async () => {
    await setupTestDb();

    // Create test user
    testUser = await UserModel.create({
      username: 'cardealer',
      email: 'dealer@test.com',
      password: 'password123'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dealer@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await CarModel.deleteAll();
  });

  describe('GET /api/cars', () => {
    beforeEach(async () => {
      await CarModel.create(testCar, testUser.id);
    });

    it('should return list of cars with pagination', async () => {
      const response = await request(app)
        .get('/api/cars')
        .expect(200);

      expect(response.body).toHaveProperty('cars');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.cars).toBeInstanceOf(Array);
      expect(response.body.cars.length).toBeGreaterThan(0);
    });

    it('should filter cars by brand', async () => {
      const response = await request(app)
        .get('/api/cars')
        .query({ brand_id: 1 })
        .expect(200);

      expect(response.body.cars).toBeInstanceOf(Array);
      expect(response.body.cars[0].brand_id).toBe(1);
    });
  });

  describe('POST /api/cars', () => {
    it('should create new car listing with auth', async () => {
      const response = await request(app)
        .post('/api/cars')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCar)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('model', testCar.model);
    });

    it('should reject car creation without auth', async () => {
      const response = await request(app)
        .post('/api/cars')
        .send(testCar)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authorization header missing');
    });
  });

  describe('GET /api/cars/:id', () => {
    let createdCar;

    beforeEach(async () => {
      createdCar = await CarModel.create(testCar, testUser.id);
    });

    it('should return car details by ID', async () => {
      const response = await request(app)
        .get(`/api/cars/${createdCar.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdCar.id);
      expect(response.body).toHaveProperty('model', testCar.model);
    });

    it('should return 404 for non-existent car', async () => {
      const response = await request(app)
        .get('/api/cars/99999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Car not found');
    });
  });
});