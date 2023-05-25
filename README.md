# OBS Google Sheet Importer
This tool allows you to dynamically update content, color and visibility of text sources in OBS through a google sheet.

# Prerequisites
- [Node.js (tested on 18.16)](https://nodejs.org/en/download)
- [Google Sheets API Key](https://developers.google.com/sheets/api/guides/authorizing#APIKey)
- [Google sheet (example)](https://docs.google.com/spreadsheets/d/1Z1MlruzHm0UYCNO4cTlcDtUdWrMaRB5gwkVy7Zthl8c/)
- [OBS Asynchronous image source Plugin (recommended if updating image sources)](https://obsproject.com/forum/resources/xobsasyncimagesource-asynchronous-image-source.1681/)

# Installation
- Download the source
- Download and Install Node.js
- Run install.bat

# Usage
## Spreadsheet
The source spreadsheet needs to be set to allow anyone with the link to view, otherwise the API connection doesn't work.

## Configuration
Open `config-dist.json` and set the following values:
- sheetId: The ID of the google sheet (you can copy this from the sheets link, e.g. `https://docs.google.com/spreadsheets/d/this-bit-here-is-the-sheet-id/edit#gid=0`)
- tabname: The tab name where you need data from
- range: The range of Rows you need data from, must be column C through D (in A1 notation, e.g. `C1:D50`)
- apikey: Your Google Sheets API Key
- obsaddress: The address of your OBS Websocket, default is ws://localhost:4455 for local OBS instance
- obsauth: The password configured in your OBS Websocket, leave empty for no authentication
- polling: The frequency of updates in ms, defaults to 2000 (the google API maxes out at 1 request per second)
- dimension: controls the major dimension in the API query, don't touch unless you know what you are doing

Save the file as `config.json`

## OBS Setup
To enable an OBS source to be controlled via the sheet, name the source in this format: `[Arbitrary Source Name] |sheet [Row #]`

For example, `Text Source 1 |sheet 5` would be controlled by the contents of Row 5.

## Controlling Text Sources
### Setting Text
Any text in a cell is set as the text in the source. Empty cells are not updated.
### Hiding/Showing a Text Source
Change the cell text to begin with `?hide;Any text here` or `?show;Any text here` to disable/enable the text source (with the last text that was set)
### Changing Text Color
Change the cell text to `?color=000000;Any text here` to set the text color in OBS with hex colors.

## Controlling Image Sources
Any image URL in a cell is set as the image in the source. Empty cells are not updated.

## Controlling Color Sources
Any #hexcode in a cell is set as the color in the source. Empty cells are not updated.

## Controlling Browser Sources
Any URL in a cell is set as the webpage in the source. Empty cells are not updated.

## Controlling Visability Only
Any "hide"/"show" in a cell is set as the sources visability. Empty cells are not updated.