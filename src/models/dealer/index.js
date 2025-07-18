const DealerProfile = require('./dealer.model');
const { createDealerProfile, createDealerProfileAdmin } = require('./create');
const { updateDealerProfile, updateDealerProfileAdmin, deleteDealerProfile } = require('./update');
const {
  getDealerProfile,
  getDealerByCompanyName,
  getAllDealers,
  getDealerCars
} = require('./search');

module.exports = {
  DealerProfile,
  createDealerProfile,
  createDealerProfileAdmin,
  updateDealerProfile,
  updateDealerProfileAdmin,
  deleteDealerProfile,
  getDealerProfile,
  getDealerByCompanyName,
  getAllDealers,
  getDealerCars
};