/* eslint-disable dot-notation */
/* --------------------- */
/*  ROUTE HANDLERS       */
/* --------------------- */
const StateCode = require('../models/Code/stateCodeModel');
const factory = require('./handlerFactory');

exports.createStateCode = factory.createOne(StateCode);
exports.updateStateCode = factory.updateOne(StateCode);
exports.deleteStateCode = factory.deleteOne(StateCode);
exports.getStateCode = factory.getOne(StateCode);
exports.getAllStateCodes = factory.getAll(StateCode);
