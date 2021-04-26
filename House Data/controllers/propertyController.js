/* eslint-disable dot-notation */
/* --------------------- */
/*  ROUTE HANDLERS       */
/* --------------------- */
const catchAsync = require('../utils/catchAsync');
const Property = require('../models/propertyModel');
const factory = require('./handlerFactory');

exports.createProperty = factory.createOne(Property);
exports.updateProperty = factory.updateOne(Property);
exports.deleteProperty = factory.deleteOne(Property);
exports.getProperty = factory.getOne(Property);
exports.getAllProperties = factory.getAll(Property);

exports.getPriceStats = catchAsync(async (req, res, next) => {
  const { query } = req;
  query.properDate = { $ne: null };

  const stats = await Property.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: {
          city: '$city',
          year: { $year: '$properDate' },
          month: { $month: '$properDate' },
        },
        count: { $sum: 1 },
        average: { $avg: '$historyListing.lastKnownPrice' },
        priceList: { $push: '$historyListing.lastKnownPrice' },
      },
    },
    {
      $group: {
        _id: { city: '$_id.city', year: '$_id.year' },
        value: {
          $push: {
            month: '$_id.month',
            price: '$priceList',
            mean: '$average',
            numProperties: '$count',
          },
        },
      },
    },
    {
      $group: {
        _id: { city: '$_id.city' },
        data: { $push: { year: '$_id.year', monthly: '$value' } },
      },
    },
    {
      $addFields: {
        city: '$_id.city',
      },
    },

    { $sort: { year: 1, month: 1 } },
    { $project: { _id: 0 } },
  ]);

  const result = {};

  stats.forEach((city, index, arr) => {
    const cityName = city.city;
    const cityYear = city.data;
    const yearObj = {};

    cityYear.forEach((year, index, arr) => {
      const cityMonth = year.monthly;
      const monthObj = {};

      cityMonth.forEach((month, index, arr) => {
        monthObj[`${month.month}`] = {
          numProperties: month.numProperties,
          mean: month.mean,
          median:getMedian(month.price),
        };
      });
      yearObj[`${year.year}`] = { month: monthObj };
    });

    result[`${cityName}`] = { year: yearObj };
  });

  res.status(200).json({
    status: 'success',
    city: result,
  });
});

const getMedian = function (arr) {
  const filterArr = arr.filter((val) => !!val);
  const len = filterArr.length;
  const arrSort = filterArr.sort();

  const mid = Math.ceil(len / 2);
  const median =
    len % 2 === 0 ? (arrSort[mid] + arrSort[mid - 1]) / 2 : arrSort[mid - 1];
  return median;
};
