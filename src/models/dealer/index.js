const DealerProfile = require('./dealer.model');
const { createDealerProfile } = require('./create');
const { updateDealerProfile } = require('./update');
const {
  getDealerProfile,
  getDealerByCompanyName,
  getAllDealers,
  getDealerCars
} = require('./search');

module.exports = {
  DealerProfile,
  createDealerProfile,
  updateDealerProfile,
  getDealerProfile,
  getDealerByCompanyName,
  getAllDealers,
  getDealerCars
};