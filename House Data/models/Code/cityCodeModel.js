const mongoose = require('mongoose');

// Mongoose use native javascript datatype
const citySchema = new mongoose.Schema(
  {
    // Should be capital: MA, LA, etc.
    name: {
      type: String,
      required: [true, 'A city must have a name'],
    },
    FBI_cityCode: {
      type: String,
    },
    CENSUS_cityCode: {
      type: String,
    },
    BLS_cityCode: {
      type: String,
    },
    // CHILD REFERENCING -- only includes the ObjectId of the parent object in the Database
    state: {
      type: mongoose.Schema.ObjectId,
      ref: 'StateCode',
    },
    // CHILD REFERENCING -- only includes the ObjectId of the parent object in the Database
    county: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'CountyCode',
        },
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2. INDEXING (improve performance)

// 3. VIRTUAL PROPERTIES:

// 4. MONGOOSE MIDDLEWARES: document, query, aggregate, and model middlewares
citySchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

// citySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'state',
//     select: ['shortName'],
//   }); // populate = summon the real object in the QUERY.. The databse remains intact.
//   next();
// });

citySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'county',
    select: 'name',
  });
  next();
});

// citySchema.post(/^find/, function (docs, next) {
//   console.log(`cityCode: Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// 5. Create and export an instance
const CityCode = mongoose.model('CityCode', citySchema); // model-name, schema-name
module.exports = CityCode;
