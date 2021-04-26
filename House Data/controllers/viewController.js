const catchAsync = require('../utils/catchAsync');

// Default page, When we enter the city in, the front-end should handle the rendering -- get data from back-end via socket io
// Creat our own API -- faster...
exports.getOverview = catchAsync(async (req, res, next) => {
  const allGraphs = [
    'graph-Population',
    'graph-Median-Age',
    'graph-Median-Earnings',
    'graph-Employment',
    'graph-Unemployment-Rate',
    'graph-Poverty',
    'graph-Crime',
  ];

  res.status(200).render('index', {
    title: 'Area Data',
    graphs: allGraphs,
  });
});
