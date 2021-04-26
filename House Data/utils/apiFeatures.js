class APIFeatures {
  // .find() is a query object, thus, we can use all query methods
  // With await, the query object will execute and return found objects.
  // Thus, all query must be taken care of before we await for final results.
  // This class will accept: the query object and the req.query
  // We can then apply filter, sort, fields, page to this alter the query object.

  constructor(query, queryString) {
    this.query = query; // The query object. Example: Tour.find()
    this.queryString = queryString; // req.query
  }

  filter() {
    //  a) Filtering: ignore sort, fields, page, limit
    const queryObj = { ...this.queryString }; // We are creating a copy by creating a new object from the old object instead of pointing to the original object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //  b) Advanced filtering: Handle gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne|exists|regex)\b/g, (match) => `$${match}`); // Adding the $ in front of gte, gt, lte, lt
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // SORT: To sort multiple fields: sort('price ratingsAverage')
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // FIELDS: only return these fields. (Not the whole documents)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // by default, send back all fields except __v
      this.query = this.query.select('-__v'); // - means exclude this field
    }
    return this;
  }

  // PAGINATION: PAGE and LIMIT
  paginate() {
    // page=2&lmit=10, meaning each page has 10 documents.
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 500;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
