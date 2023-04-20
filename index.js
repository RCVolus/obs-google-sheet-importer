const {default: OBSWebSocket} = require('obs-websocket-js');

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

  const range = config.range;
  const startcell = range.split(":")[0].trim();

  const startcol = startcell.match("[a-zA-Z]+");
  const startrow = startcell.match("[0-9]+");

  const rowoffset = startrow[0];
  const coloffset = columnToNumber(startcol[0]);

  const sceneList = await obs.call('GetSceneList');
  await sceneList.scenes.forEach(async scene => {
    // unfold group children
    const allSources = await obs.call('GetSceneItemList', {sceneName: scene.sceneName});
    await allSources.sceneItems.forEach(async source => {
      if (source.sourceName.includes('|sheet') && source.inputKind.includes('gdiplus')) {
        const reference = source.sourceName.split('|sheet')[1].trim();

        let col = reference.match("[a-zA-Z]+");
        let colnumber = columnToNumber(col[0]) - coloffset;
        
        let row = reference.match("[0-9]+");
        let rownumber = row[0] - rowoffset;

        let cellvalue = data[colnumber][rownumber];

            if (cellvalue !== 'undefined') {
              let color = null;

              if (cellvalue.startsWith('?color')) {
                const split = cellvalue.split(';');
                cellvalue = split[1];
                color = split[0].split('=')[1];
                color = color.replace('#', '');
                const color1 = color.substring(0, 2);
                const color2 = color.substring(2, 4);
                const color3 = color.substring(4, 6);
                color = parseInt('ff' + color3 + color2 + color1, 16);
              }

              if (cellvalue.startsWith('?hide')) {
                const split = cellvalue.split(';');
                cellvalue = split[1];
                await obs.call("SetSceneItemEnabled", {
                  sceneName: scene.sceneName,
                  sceneItemId: source.sceneItemId,
                  sceneItemEnabled: false
                });
              } else if (cellvalue.startsWith('?show')) {
                const split = cellvalue.split(';');
                cellvalue = split[1];
                await obs.call("SetSceneItemEnabled", {
                  sceneName: scene.sceneName,
                  sceneItemId: source.sceneItemId,
                  sceneItemEnabled: true
                });
              }
              
              // Update to OBS
              await obs.call("SetInputSettings", {
                inputName: source.sourceName,
                inputSettings: {
                  text: cellvalue,
                  color: color
                }
              });
              console.log(`Updated: ${reference} to OBS: ${source.sourceName}`);
            } else {
              console.log(`Field ${reference} is empty`)
        }
      }
    });  
  });
}

const main = async () => {
  const obs = new OBSWebSocket();
  if (config.obsauth != "") {
    await obs.connect(config.obsaddress, config.obsauth);
  }
  else {
    await obs.connect(config.obsaddress);
  }
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

function columnToNumber(str) {
  var out = 0, len = str.length;
  for (pos = 0; pos < len; pos++) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
  }
  return out-1;
}
