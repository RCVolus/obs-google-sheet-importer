const axios = require('axios');

const config = require('./config.json');

const getSpreadsheetLink = (id, page) => `https://spreadsheets.google.com/feeds/cells/${id}/${page}/public/values?alt=json`;

const loadData = async () => {
  const pages = {};

  for (let i = 0; i < config.numPages; i++) {
    const page = await loadPage(i + 1);

    const title = page.feed.title.$t;
    const entries = page.feed.entry;
    pages[title] = entries;
  }
  
  console.log(`============= Pages loaded: ${Object.keys(pages).join(', ')}`);
  return pages;
}

const loadPage = async (pageIndex) => {
  const response = await axios(getSpreadsheetLink(config.sheetId, pageIndex));
  return response.data;
}

module.exports = {
  loadData,
  loadPage
}