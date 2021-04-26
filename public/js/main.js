/* eslint-disable prefer-arrow-callback */
/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */

/*-------------------*/
/* Global variables
/*-------------------*/
const traceIndex = [];
const cities = ['boston', 'cambridge', 'malden', 'melrose', 'medford', 'somerville', 'arlington', 
'everett', 'revere', 'chelsea', 'belmont', 'newton', 'lynn', 'woburn', 'burlington', 'lawrence', 
'lowell', 'methuen', 'andover', 'quincy', 'waltham', 'saugus', 'stoneham', 'watertown'];

/*-------------------*/
/* Default graph
/*-------------------*/
const defaultLink = 'http://localhost:4000/api/city?name=malden';
axios.get(defaultLink).then((res) => {
    // Layout
  const layout = {
    colorway: ['#01c8ee', '#eb2f64', '#f6d51f', '#fa8925', '#fa5457', '#5dd3e9', '#46899b', '#2b4046', '#01b4bc', '#777', '#5fa55a'],
    margin: { 
      l: 100, 
      pad: 10, 
    },
    width: 800,
    hovermode: 'x',
    legend: {
      font: {
        family: 'sans-serif',
        size: 13,
        color: '#777',
      },
    },
    xaxis: {
      linecolor: '#777',
      color: '#333',
      title: {
        text: 'Year',
        font: {
          family: 'sans-serif',
          size: 15,
          color: '#777',
        },
        tickcolor: '#228DFF',
      },
      rangemode: 'nonnegative',
      showgrid: false,
    },
    yaxis: {
      linecolor: '#777',
      color: '#333',
      tickformat: ',d',
      title: {
        text: 'Number of people',
        font: {
          family: 'sans-serif',
          size: 15,
          color: '#777',
        },
      },
    },

    paper_bgcolor: '#ccc;',
    plot_bgcolor: '#ccc;',
  };

  const config = {
    scrollZoom: true,
    responsive: true,
  };

  // Extract data
  const data = extractData(res.data.data.data[0]);
  // Draw graph
  drawGraph(data.yearPopulation, data.totalPopulation, layout, config,'graph-Population', data.cityName);
  drawGraph(data.yearMedianAge, data.medianAge, layout, config, 'graph-Median-Age', data.cityName);
  drawGraph(data.yearMedianEarnings, data.medianEarnings, layout, config,'graph-Median-Earnings', data.cityName);
  drawGraph(data.yearEmployment, data.employment, layout, config,'graph-Employment', data.cityName);
  drawGraph(data.yearUnemploymentRate, data.unemploymentRate, layout, config,'graph-Unemployment-Rate', data.cityName);
  drawGraph(data.yearPoverty, data.poverty, layout, config,'graph-Poverty', data.cityName);
  drawGraph(data.yearCrime, data.crime, layout, config,'graph-Crime', data.cityName);

  // Update traceIndex
  traceIndex.push(`${data.cityName.toLowerCase()}`);
})
.catch((errors) => {
  console.log(errors);
});

/*---------------------------------------------------------------*/
/* Dynamic updates (graphs and selected citites from user inputs
/*---------------------------------------------------------------*/
$(document).ready(() => { 
    const form = $('form');
    const input = $('.search__input');
    const ul = $('.selectedCities > .list');
    const li = $('.list__item');

    // 1. Add new data to graph and selected lists as requested by user
    form.submit((e) => {
        const city = `${input.val()}`.trim().toLowerCase();
        e.preventDefault();

        // Only accept cities available in the database
        if ((cities.indexOf(city) > -1) && (traceIndex.indexOf(city) < 0)) {  
          // Add City name to the selectedCities section
          ul.append(`<li class="list__item" id="${city.toLowerCase()}">${city.charAt(0).toUpperCase() + city.slice(1)}</li>`);
            // Get data from API via axios get request
          const link = `http://localhost:4000/api/city?name=${city}`;

          axios.get(link).then((res) => {
            const cityData = extractData(res.data.data.data[0]);
            addTracesToGraph(cityData.yearPopulation, cityData.totalPopulation, 'graph-Population', cityData.cityName);
            addTracesToGraph(cityData.yearMedianAge, cityData.medianAge, 'graph-Median-Age', cityData.cityName);
            addTracesToGraph(cityData.yearMedianEarnings, cityData.medianEarnings, 'graph-Median-Earnings', cityData.cityName);
            addTracesToGraph(cityData.yearEmployment, cityData.employment, 'graph-Employment', cityData.cityName);
            addTracesToGraph(cityData.yearUnemploymentRate, cityData.unemploymentRate, 'graph-Unemployment-Rate', cityData.cityName);
            addTracesToGraph(cityData.yearPoverty, cityData.poverty, 'graph-Poverty', cityData.cityName);
            addTracesToGraph(cityData.yearCrime, cityData.crime, 'graph-Crime', cityData.cityName);
            traceIndex.push(`${cityData.cityName.toLowerCase()}`);
          });
        }  else {
          alert('Sorry, the city you entered was either not in our database or has already selected!');
        }
    });

    // 2. Remove data from selectedCities and graph
    ul.on('click', li, function(e) {
      const targetId = e.target.id; 
      if (targetId) {
          // Remove from the selectedCities
        $(`#${targetId}`).remove();
        // Remove from the traceIndex & from graph
        const index = traceIndex.indexOf(targetId);
        if (index !== -1) {
          traceIndex.splice(index, 1);
          Plotly.deleteTraces('graph-Population', index);
        }
      }
    });
  });

     
     
    

  