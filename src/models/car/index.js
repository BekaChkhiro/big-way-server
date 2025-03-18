const { CarModel } = require('./base');
const CarCreate = require('./create');
const CarUpdate = require('./update');
const CarSearch = require('./search');
const CarValidation = require('./validation');

module.exports = {
  create: CarCreate.create,
  update: CarUpdate.update,
  delete: CarUpdate.delete,
  addImages: CarCreate.addImages,
  findById: CarModel.findById,
  findAll: CarSearch.findAll,
  searchCars: CarSearch.searchCars,
  findSimilarCars: CarSearch.findSimilarCars,
  getBrands: CarModel.getBrands,
  getModelsByBrand: CarModel.getModelsByBrand,
  incrementViews: CarModel.incrementViews,
  validateLocation: CarValidation.validateLocation
};