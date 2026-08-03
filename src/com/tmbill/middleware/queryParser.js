const convertQueryParams = (req, res, next) => {
  for (let key in req.query) {
    if (req.query[key] === 'true') req.query[key] = true;
    else if (req.query[key] === 'false') req.query[key] = false;
    else if (!isNaN(req.query[key])) req.query[key] = Number(req.query[key]);
  }
  next();
};

module.exports = {
  convertQueryParams,
};
