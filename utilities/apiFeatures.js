class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // 1A- filtering
    const queryObj = { ...this.queryStr };
    const excludedQueryEle = ['sort', 'page', 'fields', 'limit'];
    excludedQueryEle.forEach(el => delete queryObj[el]);

    // 1B- Advanced filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(lte|lt|gte|gt)\b/g,
      match => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  // 2- Sorting
  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('ratingsAverage');
    }

    return this;
  }

  // 3- Fields
  fields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // 4- pagination
  paginate() {
    const limit = this.queryStr.limit * 1 || 100;
    const page = this.queryStr.page * 1 || 1;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
