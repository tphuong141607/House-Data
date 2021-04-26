/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const City = require('../../models/cityModel');
const StateCode = require('../../models/Code/stateCodeModel');
const CityCode = require('../../models/Code/cityCodeModel');
const CountyCode = require('../../models/Code/countyCodeModel');

const startYear = 2010;

const filePath = path.join(__dirname, '/invalidCities.txt');

// ----- DB interaction --------
dotenv.config({ path: './config.env' }); // Read variables from this file and store them to nodejs environment.
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log('DB connection successful');
  });

// SAVE
const saveDB = async (Model, data, uniqueQuery) => {
  try {
    const document = await Model.find(uniqueQuery);
    let savedDoc;
    if (document.length === 0) {
      savedDoc = await Model.create(data);
      console.log(
        `Successfully added ${Object.keys(uniqueQuery)}: ${Object.values(
          uniqueQuery
        )}`
      );
    } else {
      savedDoc = await Model.findByIdAndUpdate(document[0]._id, data, {
        new: true,
        runValidators: true,
      });
      console.log(
        `Successfully updated ${Object.keys(uniqueQuery)}: ${Object.values(
          uniqueQuery
        )}`
      );
    }
    return savedDoc;
  } catch (err) {
    console.error(`savePropertyDB ERROR: ${err.stack}`);
    process.exit();
  }
};

// DELETE ALL DATA FROM DB
const deleteAllCitiesDB = async (Model) => {
  try {
    await Model.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// Population related, median earnings, poverty data
// 1 city
const getDataFromCensus = async (stateCode, censusCityCode) => {
  try {
    const resData = {
      totalPopulation: {},
      malePopulation: {},
      femalePopulation: {},
      moveInto: {},
      medianAge: {},
      medianEarnings: {},
      poverty: {},
      medianMonthlyCostsMortgage: {},
      medianMonthlyCosts: {},
      medianMonthlyGrossRent: {},
    };

    // 1) Construct the API link
    let censusUrl = process.env.CENSUS.replace(
      '<YOUR_KEY>',
      process.env.CENSUS_KEY
    );
    censusUrl = censusUrl.replace('<STATE>', stateCode);
    censusUrl = censusUrl.replace('<CITY>', censusCityCode);
    censusUrl = censusUrl.replace(
      '<FIELDS>',
      `${process.env.TOTAL_POPULATION},${process.env.MALE_POPULATION},${process.env.FEMALE_POPULATION},${process.env.MOVE_FROM_DIFFERENT_STATE},${process.env.MEDIAN_AGE},${process.env.MEDIAN_EARNINGS},${process.env.PEOPLE_IN_POVERTY},${process.env.MEDIAN_MONTHLY_OWNER_COSTS_MORTGAGE},${process.env.MEDIAN_MONTHLY_OWNER_COSTS},${process.env.MEDIAN_GROSS_RENT}`
    );

    // 2) Get Data, data is currently only avaliable from 2010 to 2019
    for (let i = 0; i < 10; i++) {
      const year = startYear + i;
      const currentCensusURL = censusUrl.replace('<YEAR>', year);
      const reqData = await axios.request(currentCensusURL);

      if (reqData.data === '' || reqData.statusText === 'No Content') {
        resData.totalPopulation[`${year}`] = null;
        resData.malePopulation[`${year}`] = null;
        resData.femalePopulation[`${year}`] = null;
        resData.moveInto[`${year}`] = null;
        resData.medianAge[`${year}`] = null;
        resData.medianEarnings[`${year}`] = null;
        resData.poverty[`${year}`] = null;
        resData.medianMonthlyCostsMortgage[`${year}`] = null;
        resData.medianMonthlyCosts[`${year}`] = null;
        resData.medianMonthlyGrossRent[`${year}`] = null;
      } else {
        resData.totalPopulation[`${year}`] = reqData.data[1][1];
        resData.malePopulation[`${year}`] = reqData.data[1][2];
        resData.femalePopulation[`${year}`] = reqData.data[1][3];
        resData.moveInto[`${year}`] = reqData.data[1][4];
        resData.medianAge[`${year}`] = reqData.data[1][5];
        resData.medianEarnings[`${year}`] = reqData.data[1][6];
        resData.poverty[`${year}`] = reqData.data[1][7];
        resData.medianMonthlyCostsMortgage[`${year}`] = reqData.data[1][8];
        resData.medianMonthlyCosts[`${year}`] = reqData.data[1][9];
        resData.medianMonthlyGrossRent[`${year}`] = reqData.data[1][10];
      }
    }

    // 3) Return data
    return resData;
  } catch (err) {
    console.log('getDataFromCensus', err.stack);
  }
};

// Unemployment & employment data
const getDataFromBLS = async (blsCityCode) => {
  try {
    const resData = {
      unemploymentRate: {},
      employment: {},
    };

    // 1) Construct payload
    // eslint-disable-next-line prettier/prettier
    const seriesCode_unemploymentRate = process.env.SERIES_DATA
      .replace( '<MEASURE_CODE>', process.env.unemployment_rate)
      .replace('<AREA_CODE>', blsCityCode);

    // eslint-disable-next-line prettier/prettier
    const seriesCode_employment = process.env.SERIES_DATA
      .replace('<MEASURE_CODE>',process.env.employment)
      .replace('<AREA_CODE>', blsCityCode);

    const payload = {
      seriesid: [seriesCode_unemploymentRate, seriesCode_employment],
      startyear: `${startYear}`,
      endyear: `${new Date().getFullYear()}`,
      registrationkey: `${process.env.BLS_KEY}`,
    };

    // 2) Get Data, data is currently only avaliable from 2010 to 2019
    const options = {
      method: 'post',
      url: `${process.env.BLS}`,
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    };

    let reqData = await axios(options);
    reqData = reqData.data.Results.series;

    if (reqData !== undefined) {
      const unemploymentRate = reqData[0].data;
      const employment = reqData[1].data;
      for (let i = 0; i < unemploymentRate.length; i++) {
        resData.unemploymentRate[unemploymentRate[i].year] =
          unemploymentRate[i].value;
      }
      for (let i = 0; i < employment.length; i++) {
        resData.employment[employment[i].year] = employment[i].value;
      }
    } else {
      return {};
    }

    // 3) Return data
    return resData;
  } catch (err) {
    console.log('getDataFromBLS', err.stack);
  }
};

// Crime data
const getDataFromFBI = async (fbiCityCode) => {
  try {
    let resData = { crime: {} };

    // 1) Construct the API link
    let fbiURL = process.env.FBI.replace('<YOUR_KEY>', process.env.FBI_KEY)
      .replace('<SINCE>', startYear)
      .replace('<UNTIL>', 2019);
    fbiURL = fbiURL.replace('<CITY_ORI>', fbiCityCode);

    // console.log(fbiURL);
    // 2) Get Data, data is currently only avaliable from 2010 to 2019
    let crimeRes = await axios.request(fbiURL);
    crimeRes = crimeRes.data.results;
    if (crimeRes.length === 0) {
      resData = {};
    } else {
      let totalCrime = 0;
      let tempYear = crimeRes[0].data_year;
      for (let i = 0; i < crimeRes.length; i++) {
        if (crimeRes[i].data_year === tempYear) {
          totalCrime += crimeRes[i].actual;
          // console.log(tempYear, crimeRes[i].offense ,crimeRes[i].actual);
        } else {
          resData.crime[tempYear] = totalCrime;
          totalCrime = crimeRes[i].actual;
          tempYear = crimeRes[i].data_year;
        }
      }
    }

    // 3) Return data
    return resData;
  } catch (err) {
    console.log('getDataFromFBI', err.stack);
  }
};

// Save all data 1 city
const saveDataPerState = async (
  stateId,
  name,
  county,
  censusCityCode,
  fbiCityCode,
  blsCityCode
) => {
  try {
    const state = await StateCode.find({ _id: stateId });
    const stateCode = state[0].CENSUS_stateCode;
    const abbrName = state[0].shortName;

    const censusAPIData =
      censusCityCode === undefined
        ? {}
        : await getDataFromCensus(stateCode, censusCityCode);

    const fbiAPIData =
      fbiCityCode === undefined ? {} : await getDataFromFBI(fbiCityCode);

    const blsAPIData =
      blsCityCode === undefined ? {} : await getDataFromBLS(blsCityCode);

    const uniqueString = `${name}, ${abbrName}`;
    const resData = {
      name: name,
      state: abbrName,
      county: county,
      cityCode: uniqueString,
      ...censusAPIData,
      ...fbiAPIData,
      ...blsAPIData,
    };
    // console.log(resData);

    saveDB(City, resData, { cityCode: uniqueString });
  } catch (err) {
    console.log('saveDataPerState', err.stack);
  }
};

const getInput = async (stateId, cityName) => {
  const city = cityName.toLowerCase().trim();
  const cityReg = `^${cityName}\\b|^${cityName}ugh\\b`;

  const cityDoc = await CityCode.find({
    state: stateId,
    name: { $regex: cityReg, $options: 'im' },
  });

  let text = ``;
  if (cityDoc.length === 0) {
    console.log(`Sorry, \u{1F625} We don't have the entered city ${cityName}, ${stateId}`);
    // eslint-disable-next-line prefer-arrow-callback
    text += `We don't have the city in our database: --- ${city}\n`;
    fs.appendFile(filePath, text, (err) => {
      if (err) return console.log(err);
      console.log('Added text!');
    });
  } else {
    let censusCityCode = cityDoc[0].CENSUS_cityCode; // unique identifier
    if (!censusCityCode) {
      console.log(`🔥 The selected city doesn't have CENSUS data.`);
      censusCityCode = undefined;
      text += `No CENSUS data for: --- ${city}\n`;
    } else {
      censusCityCode = censusCityCode.split('-')[1];
    }

    let fbiCityCode = cityDoc[0].FBI_cityCode;
    if (!fbiCityCode) {
      console.log(`🔥 The selected city doesn't have FBI data.`);
      fbiCityCode = undefined;
      text += `No FBI data for: --- ${city}\n`;
    }

    let blsCityCode = cityDoc[0].BLS_cityCode;
    if (!fbiCityCode) {
      console.log(`🔥 The selected city doesn't have BLS data.`);
      text += `No BLS data for: --- ${city}\n`;
      blsCityCode = undefined;
    }

    const name = cityDoc[0].name.toLowerCase().trim();

    const county = [];
    for (let i = 0; i < cityDoc[0].county.length; i++) {
      county.push(cityDoc[0].county[i].name);
    }

    fs.appendFile(filePath, text, (err) => {
      if (err) return console.log(err);
      console.log('Added text!');
    });

    await saveDataPerState(
      stateId,
      name,
      county,
      censusCityCode,
      fbiCityCode,
      blsCityCode
    );
  }
};

// Script to implement either delete or insert data
const massCities = [
  // 'Barnstable',
  // 'Barre',
  // 'Becket',
  // 'Bedford',
  // 'Belchertown',
  // 'Bellingham',
  // 'Belmont',
  // 'Berkley',
  // 'Berlin',
  // 'Bernardston',
  // 'Beverly',
  // 'Billerica',
  // 'Blackstone',
  // 'Blandford',
  // 'Bolton',
  // 'Boston',
  // 'Bourne',
  // 'Boxborough',
  // 'Boxford',
  // 'Boylston',
  // 'Braintree',
  // 'Brewster',
  // 'Bridgewater',
  // 'Brimfield',
  // 'Brockton',
  // 'Brookfield',
  // 'Brookline',
  // 'Buckland',
  // 'Burlington',

  // 'Cambridge',
  // 'Canton',
  // 'Carlisle',
  // 'Carver',
  // 'Charlemont',
  // 'Charlton',
  // 'Chatham',
  // 'Chelmsford',
  // 'Chelsea',
  // 'Cheshire',
  // 'Chester',
  // 'Chesterfield',
  // 'Chicopee',
  // 'Chilmark',
  // 'Clarksburg',
  // 'Clinton',
  // 'Cohasset',
  // 'Colrain',
  // 'Concord',
  // 'Conway',
  // 'Cummington',

  // 'Dalton',
  // 'Danvers',
  // 'Dartmouth',
  // 'Dedham',
  // 'Deerfield',
  // 'Dennis',
  // 'Dighton',
  // 'Douglas',
  // 'Dover',
  // 'Dracut',
  // 'Dudley',
  // 'Dunstable',
  // 'Duxbury',

  // 'East Bridgewater',
  // 'East Brookfield',
  // 'East Longmeadow',
  // 'Eastham',
  // 'Easthampton',
  // 'Easton',
  // 'Edgartown',
  // 'Egremont',
  // 'Erving',
  // 'Essex',
  // 'Everett',

  // 'Fairhaven',
  // 'Fall River',
  // 'Falmouth',
  // 'Fitchburg',
  // 'Florida',
  // 'Foxborough',
  // 'Framingham',
  // 'Franklin',
  // 'Freetown',

  // 'Gardner',
  // 'Georgetown',
  // 'Gill',
  // 'Gloucester',
  // 'Goshen',
  // 'Gosnold',
  // 'Grafton',
  // 'Granby',
  // 'Granville',
  // 'Great Barrington',
  // 'Greenfield',
  // 'Groton',
  // 'Groveland',

  // 'Hadley',
  // 'Halifax',
  // 'Hamilton',
  // 'Hampden',
  // 'Hancock',
  // 'Hanover',
  // 'Hanson',
  // 'Hardwick',
  // 'Harvard',
  // 'Harwich',
  // 'Hatfield',
  // 'Haverhill',
  // 'Hawley',
  // 'Heath',
  // 'Hingham',
  // 'Hinsdale',
  // 'Holbrook',
  // 'Holden',
  // 'Holland',
  // 'Holliston',
  // 'Holyoke',
  // 'Hopedale',
  // 'Hopkinton',
  // 'Hubbardston',
  // 'Hudson',
  // 'Hull',
  // 'Huntington',

  // 'Ipswich',
  // 'Kingston',

  // 'Lakeville',
  // 'Lancaster',
  // 'Lanesborough',
  // 'Lawrence',
  // 'Lee',
  // 'Leicester',
  // 'Lenox',
  // 'Leominster',
  // 'Leverett',
  // 'Lexington',
  // 'Leyden',
  // 'Lincoln',
  // 'Littleton',
  // 'Longmeadow',
  // 'Lowell',
  // 'Ludlow',
  // 'Lunenburg',
  // 'Lynn',
  // 'Lynnfield',

  // 'Malden',
  // 'Manchester-by-the-Sea',
  // 'Mansfield',
  // 'Marblehead',
  // 'Marion',
  // 'Marlborough',
  // 'Marshfield',
  // 'Mashpee',
  // 'Mattapoisett',
  // 'Maynard',
  // 'Medfield',
  // 'Medford',
  // 'Medway',
  // 'Melrose',
  // 'Mendon',
  // 'Merrimac',
  // 'Methuen',
  // 'Middleborough',
  // 'Middlefield',
  // 'Middleton',
  // 'Milford',
  // 'Millbury',
  // 'Millis',
  // 'Millville',
  // 'Milton',
  // 'Monroe',
  // 'Monson',
  // 'Montague',
  // 'Monterey',
  // 'Montgomery',
  // 'Mount Washington',

  // 'Nahant',
  // 'Nantucket',
  // 'Natick',
  // 'Needham',
  // 'New Ashford',
  // 'New Bedford',
  // 'New Braintree',
  // 'New Marlborough',
  // 'New Salem',
  // 'Newbury',
  // 'Newburyport',
  // 'Newton',
  // 'Norfolk',
  // 'North Adams',
  // 'North Andover',
  // 'North Attleboro',
  // 'North Brookfield',
  // 'North Reading',
  // 'Northampton',
  // 'Northborough',
  // 'Northbridge',
  // 'Northfield',
  // 'Norton',
  // 'Norwell',
  // 'Norwood',

  // 'Oak Bluffs',
  // 'Oakham',
  // 'Orange',
  // 'Orleans',
  // 'Otis',
  // 'Oxford',

  // 'Palmer',
  // 'Paxton',
  // 'Peabody',
  // 'Pelham',
  // 'Pembroke',
  // 'Pepperell',
  // 'Peru',
  // 'Petersham',
  // 'Phillipston',
  // 'Pittsfield',
  // 'Plainfield',
  // 'Plainville',
  // 'Plymouth',
  // 'Plympton',
  // 'Princeton',
  // 'Provincetown',

  // 'Quincy',

  // 'Randolph',
  // 'Raynham',
  // 'Reading',
  // 'Rehoboth',
  // 'Revere',
  // 'Richmond',
  // 'Rochester',
  // 'Rockland',
  // 'Rockport',
  // 'Rowe',
  // 'Rowley',
  // 'Royalston',
  // 'Russell',
  // 'Rutland',

  // 'Salem',
  // 'Salisbury',
  // 'Sandisfield',
  // 'Sandwich',
  // 'Saugus',
  // 'Savoy',
  // 'Scituate',
  // 'Seekonk',
  // 'Sharon',
  // 'Sheffield',
  // 'Shelburne',
  // 'Sherborn',
  // 'Shirley',
  // 'Shrewsbury',
  // 'Shutesbury',
  // 'Somerset',
  // 'Somerville',
  // 'South Hadley',
  // 'Southampton',
  // 'Southborough',
  // 'Southbridge',
  // 'Southwick',
  // 'Spencer',
  // 'Springfield',
  // 'Sterling',
  // 'Stockbridge',
  // 'Stoneham',
  // 'Stoughton',
  // 'Stow',
  // 'Sturbridge',
  // 'Sudbury',
  // 'Sunderland',
  // 'Sutton',
  // 'Swampscott',
  // 'Swansea',

  // 'Taunton',
  // 'Templeton',
  // 'Tewksbury',
  // 'Tisbury',
  // 'Tolland',
  // 'Topsfield',
  // 'Townsend',
  // 'Truro',
  // 'Tyngsborough',
  // 'Tyringham',

  // 'Upton',
  // 'Uxbridge',

  // 'Wakefield',
  // 'Wales',
  // 'Walpole',
  // 'Waltham',
  // 'Ware',
  // 'Wareham',
  // 'Warren',
  // 'Warwick',
  // 'Washington',
  // 'Watertown',
  // 'Wayland',
  // 'Webster',
  // 'Wellesley',
  // 'Wellfleet',
  // 'Wendell',
  // 'Wenham',
  // 'West Boylston',
  // 'West Bridgewater',
  // 'West Brookfield',
  // 'West Newbury',
  // 'West Springfield',
  // 'West Stockbridge',
  // 'West Tisbury',
  // 'Westborough',
  // 'Westfield',
  // 'Westford',
  // 'Westhampton',
  // 'Westminster',
  // 'Weston',
  // 'Westport',
  // 'Westwood',
  // 'Weymouth',
  // 'Whately',
  // 'Whitman',
  // 'Wilbraham',
  // 'Williamsburg',
  // 'Williamstown',
  // 'Wilmington',
  // 'Winchendon',
  // 'Winchester',
  // 'Windsor',
  // 'Winthrop',
  // 'Woburn',
  // 'Worcester',
  // 'Worthington',
  // 'Wrentham',

  // 'Yarmouth',
];

const automateProcess = async () => {
  const stateId = '6085bccf29e9dd373b18216e';
  for (let i = 0; i < massCities.length; i++) {
    await getInput(stateId, `${massCities[i]}`);
    console.log(`Worked on: ${massCities[i]}\n`);
  }
};

if (process.argv[2] === '--import') {
  automateProcess();
} else if (process.argv[2] === '--delete') {
  // deleteAllCitiesDB(City);
}
