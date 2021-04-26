// The this keyword: https://mongoosejs.com/docs/middleware.html#types-of-middleware

const mongoose = require('mongoose');
const slugify = require('slugify'); // url-name
const AppError = require('../utils/appError');
const City = require('./cityModel');

// Supporting functions
const getMedian = function (arr) {
  const filterArr = arr.filter((val) => !!val);
  const len = filterArr.length;
  const arrSort = filterArr.sort();

  const mid = Math.ceil(len / 2);
  const median =
    len % 2 === 0 ? (arrSort[mid] + arrSort[mid - 1]) / 2 : arrSort[mid - 1];
  return median;
};

// 🔥 1. CREATE THE SCHEMA
// Mongoose use native javascript datatype
const propertySchema = new mongoose.Schema(
  {
    mls: {
      type: Number,
      required: [true, 'A property must have a MLS #'],
      unique: true,
    },
    type: {
      // Single Family, Condo, Multi Family, Townhouse, etc.
      type: String,
      required: [true, 'A property must have a type'],
    },
    status: {
      type: String,
      required: [true, 'A property must have a status'],
      enum: {
        values: ['active', 'contingent', 'sold'],
        message: 'Status is either: active, contingent, or sold',
      },
    },
    address: {
      type: String,
      required: [true, 'A property must have a valid address'],
    },
    slug: String,
    city: {
      type: String,
      required: [true, 'A property must belong to a valid city'],
    },
    // PARENT REFERENCING -- only includes the ObjectId of the parent object in the Database
    cityId: {
      type: mongoose.Schema.ObjectId,
      ref: 'City',
    },
    county: {
      type: String,
      required: [true, 'A property must belong to a valid county'],
    },
    squareFeet: {
      type: Number,
      required: [true, 'A property must have a valid squareFeet value'],
    },
    lotSizeInSquareFeet: {
      type: Number,
    },
    totalRooms: {
      type: Number,
      required: [true, 'A property must have totalRooms value'],
    },
    bed: {
      type: String,
      required: [true, 'A property must have a number of beds'],
    },
    bath: {
      type: Number,
      required: [true, 'A property must have a number of baths'],
    },
    halfBath: Number,
    yearBuilt: {
      type: Number,
      required: [true, 'A property must have a year built'],
    },
    historyListing: {
      type: Object,
      required: [true, 'A property must have a historyListing'],
    },
    properDate: Date,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    agent: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔥 2. INDEXING (improve performance)
// We shouldn't index everything, we should understand the read pattern and select what fields needed to be indexed
// propertySchema.index({ slug: 1 });

// 🔥 3. STATIC FUNCTIONS / CLASS FUNCTIONS = call on the model
propertySchema.statics.updatePriceStatsOnCityModel = async function (id) {
  // this = current model = Property model
  const stats = await this.aggregate([
    {
      // get all properties with that cityId
      $match: {
        cityId: id,
        properDate: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$properDate' },
          month: { $month: '$properDate' },
        },
        nProperty: { $sum: 1 },
        mean: { $avg: '$historyListing.lastKnownPrice' },
        priceWithin1Month: { $push: '$historyListing.lastKnownPrice' },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
        },
        month: { $push: '$_id.month' },
        value: {
          $push: {
            nProperty: '$nProperty',
            mean: '$mean',
            priceWithin1Month: '$priceWithin1Month',
          },
        },
      },
    },
    { $sort: { year: 1 } },
  ]);

  if (stats.length > 0) {
    const result = {};

    stats.forEach((eachYear, i) => {
      const monthData = {};
      const { year } = eachYear._id;

      eachYear.month.forEach((_elem, index, arr) => {
        const eachMonthData = eachYear.value[index];
        eachMonthData.median = getMedian(eachMonthData.priceWithin1Month);

        monthData[arr[index]] = eachMonthData;
      });

      result[`${year}`] = monthData;
    });

    // console.log(result);
    await City.findByIdAndUpdate(id, {
      priceStats: result,
    });
  } else {
    console.log("The selected city doesn't have any properties");
  }
};

// 🔥 4. VIRTUAL PROPERTIES:
// This virtual propery isn't a part of the database...
propertySchema.virtual('dom').get(function () {
  const properDate = new Date(this.properDate);
  const listingDate = new Date(this.historyListing.listed.date);
  const ms = properDate - listingDate;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
});

// 🔥 5. MONGOOSE MIDDLEWARES
propertySchema.pre('save', async function (next) {
  // a) Slug name
  this.slug = slugify(this.address, { lower: true });

  // b) properDate: ContractDate for sold || listedDate for active
  if (this.status === 'sold') {
    this.properDate = this.historyListing.closed.date;
  } else {
    this.properDate = this.historyListing.listed.date;
  }

  // c) cityID
  const cityName = this.city.trim().toLowerCase();
  const cityDocument = await City.find({ name: cityName });

  if (cityDocument.length !== 0) {
    this.cityId = cityDocument[0]._id;
  } else {
    return next(
      new AppError(
        'Invalid city: The city you entered is not supported by this app',
        404
      )
    );
  }
  next();
});

propertySchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

propertySchema.pre(/^findOneAndUpdate/, async function (next) {
  const update = this._update; // We need this, because we don't have access to the query directly
  // a) update properDate if user change historyListing property
  // ContractDate for sold || listedDate for active
  if (update.historyListing) {
    if (update.status === 'sold') {
      this._update.properDate = update.historyListing.closed.date;
    } else {
      this._update.properDate = update.historyListing.listed.date;
    }
  }

  // b) update cityID if usser change the city
  if (update.city) {
    const cityName = update.city.trim().toLowerCase();
    const cityDocument = await City.find({ name: cityName });

    if (cityDocument.length !== 0) {
      this._update.cityId = cityDocument[0]._id;
    } else {
      return next(
        new AppError(
          'Invalid city: The city you entered is not supported by this app',
          404
        )
      );
    }
  }

  next();
});

propertySchema.pre(/^findOneAnd/, async function (next) {
  // pass the document of this property before the update
  this.property = await this.findOne();
});

propertySchema.post(/^findOneAnd/, async function () {
  // this.property = document before update, added in the pre hook
  // this.property.constructor = the property model
  await this.property.constructor.updatePriceStatsOnCityModel( this.property.cityId );
});

// update the average rating whenenver a new property is created
propertySchema.post('save', function () {
  // this points to the current document
  // this.constructor points to the current model
  this.constructor.updatePriceStatsOnCityModel(this.cityId);
});

propertySchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// 🔥 6. CREATE AND EXPORT AN INSTANCE (aka: model)
const Property = mongoose.model('Property', propertySchema); // model-name, schema-name
module.exports = Property;
