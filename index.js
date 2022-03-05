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

  const range = config.range;
  const startcell = range.split(":")[0].trim();

  const startcol = startcell.match("[a-zA-Z]+");
  console.log("starting column is " + startcol);
  const startrow = startcell.match("[0-9]+");
  console.log("starting row is " + startrow);

  const rowoffset = startrow[0];
  console.log("row offset to array is " + rowoffset);
  const coloffset = columnToNumber(startcol[0]);
  console.log("colum offset to array is " + coloffset);

  const sceneList = await obs.send('GetSceneList');
  await sceneList.scenes.forEach(async scene => {
    // unfold group children
    const allSources = getChildren(scene.sources);

    // console.log(scene);
    await allSources.forEach(async source => {
      if (source.name.includes('|sheet')) {
        const reference = source.name.split('|sheet')[1].trim();

        let col = reference.match("[a-zA-Z]+");
        let colnumber = columnToNumber(col[0]) - coloffset;
        
        let row = reference.match("[0-9]+");
        let rownumber = row[0] - rowoffset;

        let cellvalue = data[colnumber][rownumber];
        console.log("Value for cell in source is " + cellvalue)

            if (cellvalue.length > 0) {
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
                await obs.send("SetSceneItemRender", {
                  'scene-name': scene.name,
                  source: source.name,
                  render: false
                });
              } else if (cellvalue.startsWith('?show')) {
                await obs.send("SetSceneItemRender", {
                  'scene-name': scene.name,
                  source: source.name,
                  render: true
                });
              }
              
              
              // Update to OBS
              await obs.send("SetTextGDIPlusProperties", {
                source: source.name,
                text: cellvalue,
                color: color
              });
              console.log(`Updated: ${reference} to OBS: ${source.name}`);
            } else {
              console.log(`Field is empty idk`)
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

function columnToNumber(str) {
  var out = 0, len = str.length;
  for (pos = 0; pos < len; pos++) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
  }
  return out-1;
}