/* eslint-disable dot-notation */
/* eslint-disable prettier/prettier */
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Property = require('../../models/propertyModel');

/* Done: 
Goals 
•   Figure out "market price" range 
•   Figure out the price trend -- Appriciation area (https://datacommons.org/place/geoId/2537875?utm_medium=explore&mprop=count&popt=Person&hl=en)
*/

let totalProperties = 0;

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

const savePropertyDB = async (Model, data) => {
  try {
    const document = await Model.find({ mls: data.mls });
    // If new, create and save
    if (document.length === 0) {
      await Model.create(data);
      totalProperties += 1;
      console.log('Successfully added a property', totalProperties);
    } else {
      // Otherwise, update existing data
      await Model.updateOne(data, { new: true });
      totalProperties += 1;
      console.log('Successfully updated a property', totalProperties);
    }
  } catch (err) {
    console.log(data.mls);
    console.error(`savePropertyDB ERROR: ${err}`);
    process.exit();
  }
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Property.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// ----- Get data from html format --------

const saveProperty = async (url) => {
  try {
    const response = await axios.request(url);

    // 1. Extract data from compass.com site
    const $ = cheerio.load(response.data);
    const dataStr = $('script')[7].children[0].data; // If the html format change, we can use data from the script tage
    const dataFiltered = dataStr
      .substr(dataStr.indexOf('{'))
      .replace(/\\x/g, '');
    const dataJSON = JSON.parse(dataFiltered.substr(dataFiltered.indexOf('{')))
      .props.listingRelation.listing;

    // listing info
    const mls = $('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(2) > td').text();
    const currentStatus = $('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(1) > td')
      .text()
      .trim()
      .toLowerCase();
    const type = $('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(7) > td').text();
    const address = $('[data-tn="listing-page-address"]').text();
    const addressArea = $('[data-tn="listing-page-address-subtitle"]').text();
    const fullAddress = `${address} ${addressArea}`;
    const city = $('#root > div > main > div.app__StyledLeftColumn-sc-1qqu9tk-15.jUjqah > div.app__StyledRegionKeyDetails-sc-1qqu9tk-20.BAWvH.section-padding > div.region-key-details__RegionDetailsWrapper-sc-18j92vj-0.fhwIMw > span:nth-child(1) > div').text();
    const county = $('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(9) > td').text();
    const yearBuilt = Number.isNaN($('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(8) > td').text() * 1) ? 0 : $('#root > div > main > div.app__StyledRightColumn-sc-1qqu9tk-9.hKcGwI > div.app__StyledKeyDetails-sc-1qqu9tk-11.fYdHqD > table > tbody > tr:nth-child(8) > td').text() * 1;
    const squareFeet = !dataJSON.size.squareFeet ? 0 : dataJSON.size.squareFeet;
    const {lotSizeInSquareFeet} = dataJSON.size;
    const bed = $('[data-tn="listing-page-summary-beds"], [data-tn="listing-page-summary-bed"]')
      .find('.textIntent-title2')
      .text();
    const bath =$('[data-tn="listing-page-summary-baths"], [data-tn="listing-page-summary-bath"]')
        .find('.textIntent-title2')
        .text() * 1;
    const halfBath =$('[data-tn="listing-page-summary-1/2bath"]')
        .find('.textIntent-title2')
        .text() * 1;
    const {totalRooms} = dataJSON.size;
    // agent info
    const agentName = $('[data-tn="fullContactsAction-contact-information"]')
      .find('.textIntent-body')
      .text();
    const agentCompany = $('[data-tn="fullContactsAction-contact-information"]')
      .find('.contact-agent__StyledCompanyText-aj3bbe-2')
      .text();
    const agent = `${agentName}, ${agentCompany}`;

    // history listing info
    const historyListing = {};
    if (currentStatus === 'sold') {
      historyListing['listed'] = {
        date: new Date(dataJSON.date.listed),
        price: dataJSON.price.listed,
      };
      historyListing['contractDate'] = new Date(dataJSON.date.contract);
      historyListing['closed'] = {
        date: new Date(dataJSON.date.closed),
        price: dataJSON.price.closed,
      };
      historyListing['lastKnownPrice'] = dataJSON.price.lastKnown;
    } else if (currentStatus === 'active') {
      historyListing['listed'] = {
        date: new Date(dataJSON.date.listed),
        price: dataJSON.price.listed,
      };
      historyListing['lastKnownPrice'] = dataJSON.price.lastKnown; // In case of price change
    } else if (currentStatus === 'contingent') {
      historyListing['listed'] = {
        date: new Date(dataJSON.date.listed),
        price: dataJSON.price.listed,
      };
      historyListing['contractDate'] = new Date(dataJSON.date.contract);
      historyListing['lastKnownPrice'] = dataJSON.price.lastKnown;
    } else {
      console.error('The status is not either sold | active | contigent.');
    }

    if (!Number.isNaN(mls)) {
      // Build the json database format
      const property = {
        mls: mls * 1,
        type,
        status: currentStatus,
        address: fullAddress,
        city,
        county,
        squareFeet,
        lotSizeInSquareFeet,
        totalRooms,
        bed,
        bath,
        halfBath,
        yearBuilt: yearBuilt,
        historyListing,
        agent,
      };
      await savePropertyDB(Property, property);
    }
  } catch (err) {
    console.log(`saveProperty ERROR: ${url}`);
    console.log(`saveProperty ERROR: ${err.stack}`);
  }
};

// Loop through all link and apply saveProperty to each link
const saveProperties1Page = async (url) => {
  try {
    const response = await axios.request(url);
    const $ = cheerio.load(response.data);
    await $('div.uc-lolCardView > div.uc-lolCardView-cardsContainer')
      .find('a')
      .each(async function () {
        const link = `${$(this).attr('href')}`;
        if (link.includes('listing')) {
          // console.log(`https://www.compass.com${link}`);
          await saveProperty(`https://www.compass.com${link}`);
        }
      });
  } catch (err) {
    console.log(`saveProperties1Page ERROR: ${url}`);
    console.error(`saveProperties1Page ERROR: ${err}`);
  }
};

// We don't need to loop over pages, we only need to put in the right url
// So properly we don't need this function, only need SaveProperties1Page -- looping thorugh items, with the different of 21 or 20
const savePropertiesAllPage = async (url) => {
  try {
    for (let i = 0; i < totalPage; i++) {
      if (i === 0) {
        await saveProperties1Page(url);
      } else {
        const itemsEachPage = 21;
        const pagation = itemsEachPage * i;
        await saveProperties1Page(`${url}start=${pagation}/`);
      }
    }
    // const response = await axios.request(url);
    // const $ = cheerio.load(response.data);
    // const totalPage = $('[data-tn="arrowButtonRight"]').prev().text() * 1;
    // console.log('Total Pages: ' + totalPage);
    // if (totalPage === 0) {
    //   await saveProperties1Page(url);
    // }
  } catch (err) {
    console.log(`savePropertiesAllPage ERROR: ${url}`);
    console.error(`savePropertiesAllPage ERROR: ${err}`);
  }
};

if (process.argv[2] === '--import') {
  const url =
    'https://www.compass.com/homes-for-sale/medford-ma/property-type=Single%20Family,Condo,Townhouse,Co-op,Multi%20Family/status=active,contract-out,contract-signed/';
  savePropertiesAllPage(url);
} else if (process.argv[2] === '--delete') {
  deleteData();
}
