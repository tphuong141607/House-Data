/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const extractData = function (dataObj) {
  const cityName = dataObj.name;

  const yearPopulation = Object.keys(dataObj.totalPopulation);
  const totalPopulation = Object.values(dataObj.totalPopulation);
  
  const yearMedianAge = Object.keys(dataObj.medianAge);
  const medianAge = Object.values(dataObj.medianAge);

  const yearMedianEarnings = Object.keys(dataObj.medianEarnings);
  const medianEarnings = Object.values(dataObj.medianEarnings);

  const yearEmployment = Object.keys(dataObj.employment);
  const employment = Object.values(dataObj.employment);

  const yearUnemploymentRate  = Object.keys(dataObj.unemploymentRate);
  const unemploymentRate = Object.values(dataObj.unemploymentRate);

  const yearPoverty = Object.keys(dataObj.poverty);
  const poverty = Object.values(dataObj.poverty);
  
  const yearCrime = Object.keys(dataObj.crime);
  const crime = Object.values(dataObj.crime);
  // const malePopulation = Object.values(dataObj.malePopulation);
  // const femalePopulation = Object.values(dataObj.femalePopulation);
  // const moveInto = Object.values(dataObj.moveInto);
  return {
    cityName,
    yearPopulation,
    totalPopulation,
    yearMedianAge,
    medianAge,
    yearMedianEarnings,
    medianEarnings,
    yearEmployment,
    employment,
    yearUnemploymentRate,
    unemploymentRate,
    yearPoverty,
    poverty,
    yearCrime,
    crime,
  };
};

const prepGraphData = function (xData, yData, traceName) {
  return {
    x: xData,
    y: yData,
    type: 'scatter',
    name: traceName,
  };
};

const drawGraph = function (xData, yData, layout, config, graphName, traceName) {
  Plotly.newPlot(graphName, [prepGraphData(xData, yData, traceName)], layout, config);
};

const addTracesToGraph = function (xData, yData, graphName, traceName) {
  Plotly.addTraces(graphName, prepGraphData(xData, yData, traceName));
};
