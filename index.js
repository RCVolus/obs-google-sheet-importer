const OBSWebSocket = require('obs-websocket-js');

const sheetLoader = require('./sheet-loader');
const config = require('./config.json');

const getChildren = sources => {
  let items = sources;
  sources.forEach(source => {
    if (source.type === 'group') {
      items = items.concat(getChildren(source.groupChildren));
    }
  });
  return items;
}

const update = async (obs) => {
  const data = await sheetLoader.loadData();

  const sceneList = await obs.send('GetSceneList');
  await sceneList.scenes.forEach(async scene => {
    // unfold group children
    const allSources = getChildren(scene.sources);
    console.log(allSources);
    // console.log(scene);
    await allSources.forEach(async source => {
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
              let fieldContent = field.content.$t;
              let color = null;

              if (fieldContent.startsWith('?color')) {
                const split = fieldContent.split(';');
                fieldContent = split[1];
                color = split[0].split('=')[1];
                color = color.replace('#', '');
                const color1 = color.substring(0, 2);
                const color2 = color.substring(2, 4);
                const color3 = color.substring(4, 6);
                color = parseInt('ff' + color3 + color2 + color1, 16);
              }

              if (fieldContent.startsWith('?hide')) {
                await obs.send("SetSceneItemRender", {
                  'scene-name': scene.name,
                  source: source.name,
                  render: false
                });
              } else if (fieldContent.startsWith('?show')) {
                await obs.send("SetSceneItemRender", {
                  'scene-name': scene.name,
                  source: source.name,
                  render: true
                });
              }
              
              
              // Update to OBS
              await obs.send("SetTextGDIPlusProperties", {
                source: source.name,
                text: fieldContent,
                color: color
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

  const updateWrapped = () => update(obs).catch(e => {
    console.log("EXECUTION ERROR IN MAIN LOOP:");
    console.log(e);
  });

  setInterval(updateWrapped, config.polling);
  updateWrapped();
}

main().catch(e => {
  console.log("EXECUTION ERROR:");
  console.log(e);
});