const mongoose = require('mongoose');

// Mongoose use native javascript datatype
const stateSchema = new mongoose.Schema(
  {
    // Should be capital: MA, LA, etc.
    name: {
      type: String,
      required: [true, 'A state must have a name'],
      unique: true,
    },
    shortName: {
      type: String,
    },
    FBI_stateCode: {
      type: String,
    },
    CENSUS_stateCode: {
      type: String,
    },
    BLS_stateCode: {
      type: String,
    },
    // CHILD REFERENCING -- only includes the ObjectId of the parent object in the Database
    county: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'CountyCode',
      },
    ],

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
// stateSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'county',
//     select: '-state',
//   }); // populate = summon the real object in the QUERY.. The databse remains intact.
//   next();
// });

stateSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

// stateSchema.post(/^find/, function (docs, next) {
//   console.log(`StateCode: Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// 5. Create and export an instance
const State = mongoose.model('StateCode', stateSchema); // model-name, schema-name
module.exports = State;
