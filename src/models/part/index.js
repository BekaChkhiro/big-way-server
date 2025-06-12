const { PartModel } = require('./base');
const PartCreate = require('./create');
const PartSearch = require('./search');
const PartUpdate = require('./update');
const PartValidation = require('./validation');

module.exports = {
  PartModel,
  PartCreate,
  PartSearch,
  PartUpdate,
  PartValidation
};
