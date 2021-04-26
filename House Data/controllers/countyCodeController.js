/* eslint-disable dot-notation */
/* --------------------- */
/*  ROUTE HANDLERS       */
/* --------------------- */
const CountyCode = require('../models/Code/countyCodeModel');
const factory = require('./handlerFactory');

exports.createCountyCode = factory.createOne(CountyCode);
exports.updateCountyCode = factory.updateOne(CountyCode);
exports.deleteCountyCode = factory.deleteOne(CountyCode);
exports.getCountyCode = factory.getOne(CountyCode);
exports.getAllCountyCodes = factory.getAll(CountyCode);
