# OBS Google Sheet Importer
This tool allows you to dynamically update content, color and visibility of text sources in OBS through a google sheet.

# Prerequisites
- Node.js (tested on 16.7)
- Google Sheets API Key
- OBS Websocket

# Installation
- Download the source
- Open PowerShell/cmd in the source directory
- Run `npm install`

# Usage
## Spreadsheet
The source spreadsheet needs to be set to allow anyone with the link to view, otherwise the API connection doesn't work.

## Configuration
Open `config-dist.json` and set the following values:
- sheetId: The ID of the google sheet (you can copy this from the sheets link, e.g. `https://docs.google.com/spreadsheets/d/this-bit-here-is-the-sheet-id/edit#gid=0`)
- tabname: The tab name where you need data from
- range: The range of cells you need data from (in A1 notation, e.g. `D2:G7`)
- apikey: Your Google Sheets API Key
- polling: The frequency of updates in ms, defaults to once a second
- dimension: controls the major dimension in the API query, don't touch unless you know what you are doing

Save the file as `config.json`

## OBS Setup
To enable an OBS source to be controlled via the sheet, name the source in this format: `[Arbitrary Source Name] |sheet [Cell]`

For example, `Text Source 1 |sheet C5` would be controlled by the contents of cell C5.

## Controlling Text Sources
### Setting Text
Any text in a cell is set as the text in the source. Empty cells are not updated.
### Hiding/Showing a source
Change the cell text to begin with `?hide` or `?show` to disable/enable the text source (with the last text that was set)
### Changing text color
Change the cell text to `?color=000000;Any text here` to set the text color in OBS with hex colors.