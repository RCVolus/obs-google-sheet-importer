const {default: OBSWebSocket} = require('obs-websocket-js');

const sheetLoader = require('./sheet-loader');
const config = require('./config.json');

const update = async (obs) => {
	const data = await sheetLoader.loadData();
  
  	const { readFileSync } = await require('fs');
	json = readFileSync('./data.json', 'utf8');
	if (json == undefined){
		json = [];
	}
	json = JSON.parse(json);
	
		//check if sheets is same as json
	if ( data.toString() != json.toString()) {
		
		console.log("Sheets Updated");		
		
		// Write data.json to check if sheets been changed
		const fs = await require('fs');
		const jsonContent = await JSON.stringify(data);
		await fs.writeFile("./data.json", jsonContent, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
			console.log("The file was saved!");
		});
    
		const range = config.range;
		const startcell = range.split(":")[0].trim();

		const startrow = startcell.match("[0-9]+");

		const rowoffset = startrow[0];

		const sceneList = await obs.call('GetSceneList');
		await sceneList.scenes.forEach(async scene => {
			// unfold group children
			const allSources = await obs.call('GetSceneItemList', {sceneName: scene.sceneName});
			//const allSources = getChildren(allSourcesNGroups);
			await allSources.sceneItems.forEach(async source => {
			if (source.sourceName.includes('|sheet')) {
				const reference = source.sourceName.split('|sheet')[1].trim();
			
				let row = reference.match("[0-9]+");
				let rownumber = row[0] - rowoffset;

				let cellvalue = data[1][rownumber];
				let sourcetype = data[0][rownumber];
			
					// If Cell is empty skip
					if (cellvalue != undefined) {
						// If Source type is Text
						if (sourcetype == "Text"){
							let color = null;
							//check if ?color tag is present
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
							//check if ?hide/?show tag is present
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
							//get settings of source from OBS
							let textsettings = await obs.call("GetInputSettings", {
								inputName: source.sourceName
							});
							let oldfile = await textsettings['inputSettings']['text']
							let oldcolor = await textsettings['inputSettings']['color']
							//check if current OBS settings is different
							if (cellvalue != oldfile){
								if (color == null){
									color = oldcolor
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
								console.log('text is the same');
							}
							
						}
						// If Source type is Color
						if (sourcetype == "Color"){
							let color = null;
							color = cellvalue
							color = color.replace('#', '');
							const color1 = color.substring(0, 2);
							const color2 = color.substring(2, 4);
							const color3 = color.substring(4, 6);
							color = parseInt('ff' + color3 + color2 + color1, 16);
							//get settings of source from OBS
							let colorsettings = await obs.call("GetInputSettings", {
								inputName: source.sourceName,
							});
							let oldfile = await colorsettings['inputSettings']['color']
							//check if current OBS settings is different
							if (color != oldfile){
								console.log(`Updated: ${reference} to OBS: ${source.sourceName}`);
								await obs.call("SetInputSettings", {
									inputName: source.sourceName,
									inputSettings: {
										color: color
									}
								});	
							} else {
								console.log('Color is the same');
							}
						}
						// If Source type is Image
						if (sourcetype == "Image"){
							//get settings of source from OBS
							let imagesettings = await obs.call("GetInputSettings", {
								inputName: source.sourceName,
							});	
							let oldfile = await imagesettings['inputSettings']['file']
							//check if current OBS settings is different
							if (cellvalue != oldfile){
								console.log(`Updated: ${reference} to OBS: ${source.sourceName}`);
								await obs.call("SetInputSettings", {
									inputName: source.sourceName,
									inputSettings: {
										file: cellvalue
									}
								});	
							} else {
								console.log('Image is the same');
							}
						}
						// If Source type is Browser
						if (sourcetype == "Browser"){
							//get settings of source from OBS
							let browsersettings = await obs.call("GetInputSettings", {
								inputName: source.sourceName
							});
							let oldfile = await browsersettings['inputSettings']['url']
							//check if current OBS settings is different
							if (cellvalue != oldfile){
								console.log(`Updated: ${reference} to OBS: ${source.sourceName}`);
								await obs.call("SetInputSettings", {
									inputName: source.sourceName,
									inputSettings: {
										url: cellvalue
									}
								});
							} else {
								console.log('Browser is the same');
							}
						}
						// If Source type is HS
						if (sourcetype == "HS"){
							if (cellvalue.startsWith('hide')) {
								await obs.call("SetSceneItemEnabled", {
									sceneName: scene.sceneName,
									sceneItemId: source.sceneItemId,
									sceneItemEnabled: false
								});
							} else if (cellvalue.startsWith('show')) {
								await obs.call("SetSceneItemEnabled", {
									sceneName: scene.sceneName,
									sceneItemId: source.sceneItemId,
									sceneItemEnabled: true
								});
							}
							console.log(`Updated: ${reference} to OBS: ${source.sourceName}`);
						}
					}
				}
			});  
		});
	}
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
