const OBSWebSocket = require('obs-websocket-js');

const sheetLoader = require('./sheet-loader');
const config = require('./config.json');

const update = async (obs) => {
  const data = await sheetLoader.loadData();

  const sceneList = await obs.send('GetSceneList');
  sceneList.scenes.forEach(scene => {
    scene.sources.forEach(source => {
      if (source.name.includes('|sheet')) {
        const reference = source.name.split('|sheet')[1].trim();

        if (reference.includes('/')) {
          const pageTitle = reference.split('/')[0].trim();
          const fieldTitle = reference.split('/')[1].trim();

          const pageData = data[pageTitle];
          
          if (pageData) {
            const filteredFields = pageData.filter(entry => entry.title.$t === fieldTitle);

            if (filteredFields.length > 0) {
              const field = filteredFields[0];
              const fieldContent = field.content.$t;
              
              // Update to OBS
              obs.send("SetTextGDIPlusProperties", {
                source: source.name,
                text: fieldContent
              });
              console.log(`Updated: ${reference} to OBS: ${source.name}`);
            } else {
              console.log(`Unable to find field: ${fieldTitle} in ${pageTitle}`)
            }
          } else {
            console.log(`Unable to find page: ${pageTitle}`);
          }
        } else {
          console.log(`Missed the / in the reference: ${reference}`);
        }
      }
    });
  });
}

const main = async () => {
  const obs = new OBSWebSocket();
  await obs.connect({ address: 'localhost:4444' });
  console.log('Connected to OBS!');

  const updateWrapped = () => update(obs);

  setInterval(updateWrapped, config.polling);
  updateWrapped();
}

main();