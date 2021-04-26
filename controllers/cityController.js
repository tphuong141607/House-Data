/* --------------------- */
/*  ROUTE HANDLERS       */
/* --------------------- */
const City = require('../models/cityModel');
const factory = require('./handlerFactory');

exports.createCity     = factory.createOne(City);
exports.updateCity    = factory.updateOne(City);
exports.deleteCity    = factory.deleteOne(City);
exports.getCity       = factory.getOne(City);
exports.getAllCities  = factory.getAll(City);
