const mongoose = require('mongoose');

// Mongoose use native javascript datatype
const countySchema = new mongoose.Schema(
  {
    // Should be capital: MA, LA, etc.
    name: {
      type: String,
      required: [true, 'A county must have a name'],
    },
    CENSUS_countyCode: {
      type: String,
    },
    // CHILD REFERENCING -- only includes the ObjectId of the parent object in the Database
    state: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'StateCode',
      },
    ],
    city: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'CityCode',
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
countySchema.pre('save', function (next) {
  this.city = [...new Set(this.city)];
  next();
});

countySchema.pre('/^findOneAndUpdate|^findByIdAndUpdate/', function (next) {
  if (this._update.city) {
    this._update.city = [...new Set(this._update.city)];
    console.log(this._update.city);
  }
  next();
});

countySchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

// countySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'state',
//     select: ['name'],
//   }); // populate = summon the real object in the QUERY.. The databse remains intact.
//   next();
// });

// countySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'city',
//     select: ['name'],
//   }); // populate = summon the real object in the QUERY.. The databse remains intact.
//   next();
// });

// countySchema.post(/^find/, function (docs, next) {
//   console.log(`CountyCode: Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// 5. Create and export an instance
const CountyCode = mongoose.model('CountyCode', countySchema); // model-name, schema-name
module.exports = CountyCode;
