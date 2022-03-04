const axios = require('axios');

const config = require('./config.json');

// new v4 API link structure https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
// range is a string consisting of {tabname}!{cells} with cells in A1 notation (e.g. "H2:R7")
const getSpreadsheetLink = (id, tabname, range, apikey) => `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${tabname}!${range}?key=${apikey}`;

const loadData = async () => {
  const pages = {};

  const page = await loadPage();

  const title = page.feed.title.$t;
  const entries = page.feed.entry;
  pages[title] = entries;
  
  console.log(`============= Pages loaded: ${Object.keys(pages).join(', ')}`);
  return pages;
}

const loadPage = async () => {
  console.log(getSpreadsheetLink(config.sheetId, config.range, config.apikey));
  const response = await axios(getSpreadsheetLink(config.sheetId, config.tabname, config.range, config.apikey));
  return response.data;
}

module.exports = {
  loadData,
  loadPage
}