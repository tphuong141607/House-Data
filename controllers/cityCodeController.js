/* eslint-disable dot-notation */
/* --------------------- */
/*  ROUTE HANDLERS       */
/* --------------------- */
const CityCode = require('../models/Code/cityCodeModel');
const factory = require('./handlerFactory');

exports.createCityCode = factory.createOne(CityCode);
exports.updateCityCode = factory.updateOne(CityCode);
exports.deleteCityCode = factory.deleteOne(CityCode);
exports.getCityCode = factory.getOne(CityCode);
exports.getAllCityCodes = factory.getAll(CityCode);
