const mongoose = require('mongoose');
const slugify = require('slugify'); // url-name

// Mongoose use native javascript datatype
const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A city must have a name'],
    },
    cityCode: {
      type: String,
      required: [true, 'A city must have a cityCode UNIQUE'],
      unique: true,
    },
    county: {
      type: [String],
      required: [true, 'A city must have a county'],
    },
    state: {
      type: String,
      required: [true, 'A city must have a state'],
    },
    zillowEstimate: {
      type: Object,
    },
    slug: String,
    totalPopulation: {
      type: Object,
    },
    malePopulation: {
      type: Object,
    },
    femalePopulation: {
      type: Object,
    },
    moveInto: {
      type: Object,
    },
    medianAge: {
      type: Object,
    },
    medianEarnings: {
      type: Object,
    },
    poverty: {
      type: Object,
    },
    unemploymentRate: {
      type: Object,
    },
    employment: {
      type: Object,
    },
    crime: {
      type: Object,
    },
    priceStats: {
      type: Object,
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
// We shouldn't index everything, we should understand the read pattern and select what fields needed to be indexed
citySchema.index({ slug: 1 });

// 3. VIRTUAL PROPERTIES:
// This virtual propery isn't a part of the database...
// So we can't do any query operation on the 'durationWeeks' field.

// 4. MONGOOSE MIDDLEWARES: document, query, aggregate, and model middlewares
// this keyword refers to the current document
citySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

citySchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

citySchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// 5. Create and export an instance
const City = mongoose.model('City', citySchema); // model-name, schema-name
module.exports = City;
