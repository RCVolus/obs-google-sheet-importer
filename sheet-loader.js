const axios = require('axios');

const config = require('./config.json');

// new v4 API link structure https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
// range is a string consisting of {tabname}!{cells} with cells in A1 notation (e.g. "H2:R7")
const getSpreadsheetLink = (id, tabname, range, apikey, dimension) => `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${tabname}!${range}?key=${apikey}&majorDimension=${dimension}`;

const loadData = async () => {
  const page = await loadPage();
  console.log(page);
  
  console.log(`============= Values loaded: ${page.values}`);
  return page.values;
}

const loadPage = async () => {
  console.log(getSpreadsheetLink(config.sheetId, config.range, config.apikey, config.dimension));
  const response = await axios(getSpreadsheetLink(config.sheetId, config.tabname, config.range, config.apikey, config.dimension));
  return response.data;
}

module.exports = {
  loadData,
  loadPage
}