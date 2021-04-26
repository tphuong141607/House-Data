/* eslint-disable no-plusplus */
/* eslint-disable prettier/prettier */
/* eslint-disable no-await-in-loop */
/* eslint-disable dot-notation */
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const CityCode = require('../../models/Code/cityCodeModel');
const CountyCode = require('../../models/Code/countyCodeModel');
const StateCode = require('../../models/Code/stateCodeModel');

// -----------------------------------
// ----- 🔥  DB interaction 🔥 --------
// -----------------------------------

// DB connection
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

// SAVE TO DB
const saveDB = async (Model, data, uniqueQuery) => {
  try {
    const document = await Model.find(uniqueQuery);
    let savedDoc;
    if (document.length === 0) {
      savedDoc = await Model.create(data);
      console.log(`Successfully added ${Object.keys(uniqueQuery)}: ${Object.values(uniqueQuery)}`);
    } else {
      savedDoc = await Model.findByIdAndUpdate(document[0]._id, data, {
        new: true,
        runValidators: true,
      });
      console.log(`Successfully updated ${Object.keys(uniqueQuery)}: ${Object.values(uniqueQuery)}`);
    }
    return savedDoc;
  } catch (err) {
    console.error(`savePropertyDB ERROR: ${err.stack}`);
    process.exit();
  }
};

// DELETE ALL DATA FROM DB
const deleteAllDB = async (Model) => {
  try {
    await Model.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// -------------------------------------
// ----- 🔥   DATA EXTRACTION 🔥 --------
// -------------------------------------
// ----------
// 🥠 CENSUS 🥠 (STATE, COUNTY, CITY)
// ----------
// --- state
// Save CENSUS STATE code
const censusSaveAllStates = async () => {
  try {
    // 1) Get state data
    const stateLink =
      'https://api.census.gov/data/2019/acs/acs5?get=NAME&for=state:*&key=ad00ffeb49bdb9f32299b199c65c6c3c5b9aa727';
    let reqData = await axios.request(stateLink);
    reqData = reqData.data;

    // 2) Save to DB
    reqData.forEach((state, index, arr) => {
      const result = {
        name: state[0].trim().toLowerCase(),
        CENSUS_stateCode: state[1],
      };
      if (result.name !== 'name') {
        saveDB(StateCode, result, { name: result.name });
      }
    });
  } catch (err) {
    console.log('censusSaveState', err.stack);
  }
};


// --- all cities in 1 state
// Save CENSUS CITY code 
// Add new city if non existed & its associated state
const censusSaveCity1State = async (stateCode, stateId) => {
  try {
    // 1) Get all citites within 1 state data
    const cityLink = `https://api.census.gov/data/2019/acs/acs5?get=NAME&for=place:*&in=state:${stateCode}&key=ad00ffeb49bdb9f32299b199c65c6c3c5b9aa727`;
    let reqData = await axios.request(cityLink);
    reqData = reqData.data;

    // 2) process & save data 
    // For each city, we will save { CENSUS_cityCode: stateCode-cityCode }
    for (let i = 0; i < reqData.length; i++) {
      const result = {};
      const cityName = reqData[i][0].split(/cdp|city/i)[0].trim().toLowerCase();
      if (cityName !== 'name') {
        const cityDoc = await CityCode.find({
          state: stateId,
          name: cityName,
        });
        // console.log(cityDoc);

        if (cityDoc.length !== 0) {
          result['CENSUS_cityCode'] = `${stateCode}-${reqData[i][2]}`; // stateCode-cityCode
          await saveDB(CityCode, result, { _id: cityDoc[0]._id });
        } else {
          result['CENSUS_cityCode'] = `${stateCode}-${reqData[i][2]}`; // stateCode-cityCode
          result['name'] = cityName;
          result['state'] = stateId;
          await saveDB(CityCode, result, { name: cityName });
          console.log('added new city: ', result);
        }
      }
    }
  } catch (err) {
    console.log('censusSaveCity1State', err.stack);
  }
};

// --- all counties in 1 state
// Save CENSUS COUNTY code and name & associated state
// Add [counties] to stateCode REF
const censusSaveCounty1State = async (stateCode, stateId) => {
  try {
    // 1) Get County data
    const countyLink = `https://api.census.gov/data/2019/acs/acs5?get=NAME&for=county:*&in=state:${stateCode}&key=ad00ffeb49bdb9f32299b199c65c6c3c5b9aa727`;
    let reqData = await axios.request(countyLink);
    reqData = reqData.data;
    let countiesId = [];
    // 2) Save to DB
    // eslint-disable-next-line prettier/prettier
    for (let i = 0; i < reqData.length; i++) {
      const result = {};
      result['name'] = reqData[i][0].split(',')[0].trim().toLowerCase();
      result['state'] = stateId;
      result['CENSUS_countyCode'] = `${stateCode}-${reqData[i][2]}`;
      if (result.name !== 'name') {
        // eslint-disable-next-line no-await-in-loop
        const savedCounty = await saveDB(CountyCode, result, {
          CENSUS_countyCode: result.CENSUS_countyCode,
        });
        countiesId.push(savedCounty._id);
        countiesId = countiesId.filter((item, pos) => countiesId.indexOf(item) === pos);
      }
    }
    // Added all counties to the stateCode
    await saveDB(StateCode, { county: countiesId}, { _id: stateId });
  } catch (err) {
    console.log('censusSaveCounty1State', err.stack);
  }
};

// --- all cities or all counties in all U.S. states
const censusSaveModelAllStates = async (model) => {
  try {
    const states = await StateCode.find();

    // 2) Save to DB
    states.forEach((state, index, arr) => {
      const stateCode = state.CENSUS_stateCode;
      const stateId = state._id;
      if (model.toLowerCase() === 'city')
        censusSaveCity1State(stateCode, stateId);
      else if (model.toLowerCase() === 'county')
        censusSaveCounty1State(stateCode, stateId);
    });
  } catch (err) {
    console.log(`censusSave${model}AllStates`, err.stack);
  }
};

// ----------
//  🥠 FBI 🥠 (STATE, CITY)
// ----------
// --- state
// Save STATE shortName and FBI_stateCode
const fbiSaveAllStates = async () => {
  try {
    // 1) Get state data
    const stateLink =
      'https://api.usa.gov/crime/fbi/sapi/api/states?API_KEY=IoCxthbdSts2ukz8TCf5RVrs1EiR26StE7jxKCXL';
    let reqData = await axios.request(stateLink);
    reqData = reqData.data;
    const nPage = reqData.pagination.pages;
    const allReqData = [];

    // Because it return data into different pages, we need to loop through all pages to get all data
    for (let i = 0; i <= nPage; i++) {
      // eslint-disable-next-line no-await-in-loop
      let reqDataPerPage = await axios.request(`${stateLink}&page=${i}`);
      reqDataPerPage = reqDataPerPage.data.results;
      allReqData.push(...reqDataPerPage);
    }

    //   2) Save to DB
    allReqData.forEach(async (state, index, arr) => {
      const result = {
        shortName: state.state_abbr.trim().toLowerCase(),
        FBI_stateCode: state.state_id,
      };
      const name = state.state_name.trim().toLowerCase();

      const validState = await StateCode.find({
        name: name,
      });

      if (validState.length !== 0) {
        saveDB(StateCode, result, { name: name });
      } else {
        console.log('No State founded with this name: ', name);
      }
    });
  } catch (err) {
    console.log('censusSaveState', err.stack);
  }
};

// --- all cities in 1 state
// Save FBI_cityCode
// Add new city if nonexistent, add associated county to citites
// Add [Citites] to County REF
const fbiSaveAllCities1State = async (stateAbbrName, stateId) => {
  try {
    // 1) Get state data
    const cityLink = `https://api.usa.gov/crime/fbi/sapi/api/agencies/byStateAbbr/${stateAbbrName
      .trim()
      .toUpperCase()}?api_key=IoCxthbdSts2ukz8TCf5RVrs1EiR26StE7jxKCXL`;
    let reqData = await axios.request(cityLink);
    reqData = reqData.data;
    const nPage = reqData.pagination.pages;
    const allReqData = [];

    // Because it return data into different pages, we need to loop through all pages to get all data
    for (let i = 0; i < nPage; i++) {
      // eslint-disable-next-line no-await-in-loop
      let reqDataPerPage = await axios.request(`${cityLink}&page=${i}`);
      reqDataPerPage = reqDataPerPage.data.results;
      allReqData.push(...reqDataPerPage);
    }

    let savedCity;
    //   2) Save to DB
    for (let i = 0; i < allReqData.length; i++) {
      if (allReqData[i].agency_type_name === 'City') {
        const cityName = allReqData[i].agency_name
          .split('Police')[0]
          .trim()
          .toLowerCase();
        
        // Save FBI City Code
        const cityReg = `^${cityName}\\b|^${cityName}ugh\\b`;
        const cityDoc = await CityCode.find({
          state: stateId,
          name: { $regex: cityReg, $options: 'im' },
        });
    
        // Save all citites within a county to CountyCode (ref)
        const countyName = allReqData[i].county_name.toLowerCase().trim();
        const countyReg = `^${countyName}\\b`;
        
        const countyDoc = await CountyCode.find({
          state: stateId,
          name: { $regex: countyReg, $options: 'im' },
        });


        if (countyDoc.length !== 0) {
          // Update or Save FBI_cityCode
          if (cityDoc.length !== 0) {
            let countiesList = cityDoc[0].county;
            countiesList.push(countyDoc[0]._id);       
            countiesList = countiesList.filter((item, pos) => countiesList.indexOf(item) === pos);
            savedCity = await saveDB(CityCode, { FBI_cityCode: allReqData[i].ori, county: countiesList, state: stateId,  }, { _id: cityDoc[0]._id });
          } else {
            savedCity = await saveDB(CityCode, { 
              name: cityName, 
              FBI_cityCode: allReqData[i].ori, 
              county: [countyDoc[0]._id],
              state: stateId, 
            }, { name: cityName });
            console.log('added new city: ', savedCity);
          }

          let cititesWithinCounty = countyDoc[0].city;
          cititesWithinCounty.push(savedCity._id);       
          cititesWithinCounty = cititesWithinCounty.filter((item, pos) => cititesWithinCounty.indexOf(item) === pos);
          await saveDB(CountyCode, { city: cititesWithinCounty }, { _id: countyDoc[0]._id });

        } else if (countyName.includes(';')) { // Possibly the city belongs to multiple counties
            console.log('2 or more countites: ', [cityName, countyName, stateAbbrName]);
            const counties = countyName.split(';');
            for (let index = 0; index < counties.length; index++) {
              const countyNameMulti = counties[index].trim().toLowerCase();
              const countyRegMulti = `^${countyNameMulti}\\b`;
              const countyDocMulti = await CountyCode.find({
                state: stateId,
                name: { $regex: countyRegMulti, $options: 'im' },
              });
             
              if (countyDocMulti.length !== 0) {
                if (cityDoc.length !== 0) {
                  let countiesList = cityDoc[0].county;
                  countiesList.push(countyDocMulti[0]._id);       
                  countiesList = countiesList.filter((item, pos) => countiesList.indexOf(item) === pos);
                  savedCity = await saveDB(CityCode, { 
                    FBI_cityCode: allReqData[i].ori,
                    county: countiesList,
                    state: stateId
                  }, { _id: cityDoc[0]._id });
                } else {  
                  savedCity = await saveDB(CityCode, { 
                    name: cityName, 
                    FBI_cityCode: allReqData[i].ori, 
                    county: [countyDocMulti[0]._id],
                    state: stateId,
                  }, { name: cityName });
                  console.log('added new city: ', savedCity);
                }

                let cititesWithinCounty = countyDocMulti[0].city;
                cititesWithinCounty.push(savedCity._id);       
                cititesWithinCounty = cititesWithinCounty.filter((item, pos) => cititesWithinCounty.indexOf(item) === pos);
                await saveDB(CountyCode, { city: cititesWithinCounty }, { _id: countyDocMulti[0]._id });
              } 
            }
        } else {
          console.log('invalid county name: city, county, state : ', [cityName, countyName, stateAbbrName]);
        }
      }
    }
  } catch (err) {
    console.log('fbiSaveAllCities1State', err.stack);
  }
};

// --- all cities in all the U.S. states
const fbiSaveCititesAllStates = async () => {
  try {
    const states = await StateCode.find();

    // 2) Save to DB
    states.forEach((state, index, arr) => {
      const stateAbbrName = state.shortName;
      const stateId = state._id;
      fbiSaveAllCities1State(stateAbbrName, stateId);
    });
  } catch (err) {
    console.log(`fbiSaveCititesAllStates`, err.stack);
  }
};

// ----------
//  🥠 BLS 🥠 (CITY)
// ----------
// Save city code & associated state
const blsSaveCititesAllStates = async () => {
  try {
    const filePath = path.join(__dirname, '/bls.txt');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const eachLine = data.split('\n');
      eachLine.forEach(async (line, index) => {
        line = line.replace(/  +/g, ' ').split(' ');
        line.splice(-3);
        line.splice(0, 1);

        // Prepare data
        const state = line.splice(-1)[0].trim().toLowerCase();
        const areaCode = line.splice(0, 1)[0];
        let areaName = '';
        line.forEach(async (value, i) => {
          // eslint-disable-next-line prettier/prettier
          if (!/city,|town,|borough,|unorganized,|plantation,|Reservation,|\),|township,|municipality,|charter township,|\(|village,|county,|\//i.test(value)) {
            areaName = areaName.concat(`${value} `);
          }
        });
        areaName = areaName.trim().toLowerCase();

        // Find document
        const stateDoc = await StateCode.find({
          shortName: state,
        });

        const result = {
          name: areaName,
          BLS_cityCode: areaCode,
          state: stateDoc[0]._id
        }
       
        saveDB(
          CityCode,
          result,
          { BLS_cityCode: areaCode }
        );
      });
    });
  } catch (err) {
    console.log(`fbiSaveCititesAllStates`, err.stack);
  }
};


const saveAllData = async () => {
  // ** Production

  // -- states (DONE -- don't touch state)
  // await censusSaveAllStates();
  // await fbiSaveAllStates();

  // -- counties (DONE -- don't touch county)
  // await censusSaveModelAllStates('county');

  // -- citites
  // await blsSaveCititesAllStates(); 
  // await fbiSaveCititesAllStates();
  // await censusSaveModelAllStates('city');


  // ** testing 
  // -- counties
  // await censusSaveCounty1State(25, '6085bccf29e9dd373b18216e');

  // -- citites
  // await blsSaveCititesAllStates();
  // await fbiSaveAllCities1State('MA', '6085bccf29e9dd373b18216e');
  // await censusSaveCity1State(25, '6085bccf29e9dd373b18216e');
}


// ---------------------------
// ----- 🔥   SCRIPT  --------
// ---------------------------
if (process.argv[2] === '--import') {
  saveAllData();
} else if (process.argv[2] === '--delete') {
  // deleteAllDB(StateCode);
  // deleteAllDB(CountyCode);
  // deleteAllDB(CityCode);
}
