const { ipcMain, dialog } = require('electron');
let fs = require('graceful-fs');
const { EXPORT_IMPORT_MSG, SHOW_NOTIFICATION } = require('../util/IPC_Messages');
let Papa = require('papaparse');
let connection = require('../js/database');

//DB Connection object


let filters = [{ name: 'CSV File', extensions: ['csv'] }]


ipcMain.on(EXPORT_IMPORT_MSG.EXPORT_SETTINGS, async (event, content) => {
    exportSettings();
});

ipcMain.on(EXPORT_IMPORT_MSG.IMPORT_SETTINGS, async (event, content) => {
    importSettings();
});

/**
 * Imports settings from csv file
 */
async function importSettings() {
    try {
        let options = {
            title: 'Open File',
            filters
        }
        let openFilereply = await dialog.showOpenDialog(options);
        if (openFilereply) {
            if (openFilereply.canceled) {

            } else {
                if (openFilereply.filePaths.length > 0) {
                    let fileName = openFilereply.filePaths.shift();
                    // let fileContent = Papa.parse(fileName);
                    let fileContent = fs.readFileSync(fileName, 'utf-8');
                    let parsedData = Papa.parse(fileContent);
                    if (parsedData && parsedData.data) {

                        let rawSettings = parsedData.data;
                        if (rawSettings.length > 0) {
                            rawSettings.shift();
                            global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
                                promptTitle: 'Settings',
                                promptText: "Importing settings",
                                showLoader: true,
                                showPrompt: true
                            });
                            for (const currentsetting of rawSettings) {
                                try {
                                    if (currentsetting[0]) {
                                        await connection.Settings.update(
                                            {
                                                value: currentsetting[2]
                                            },
                                            {
                                                where: {
                                                    id: currentsetting[0]
                                                }
                                            });
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                            console.log('imported...');
                            global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
                                type: 'success',
                                message: 'Settings imported.Please restart the application.'
                            });
                        }
                    }

                }
            }
        }

    } catch (error) {
        console.log(error);

    }

}
function toObj(arr) {
    return arr.reduce(function (p, c, i) {
        p[names[i]] = c;
        return p;
    }, {});
}

/**
 * Exports settings to csv
 */
async function exportSettings() {
    if (connection) {
        try {
            let settings = await connection.Settings.findAll({
                raw: true,
                order: [
                    ['id', 'ASC']
                ]
            });
            let csv = Papa.unparse(settings);

            let fileName = global.storeDetails.store_name;
            fileName = fileName + '-Settings-CSV.csv';

            let options = {
                title: 'Save File',
                filters
            }
            savetoFile(options, csv)


        } catch (error) {
            console.log(error);

        }
    }
}
/**
 * Save File
 */
async function savetoFile(options, fileData) {
    try {
        let saveFilereply = await dialog.showSaveDialog(options);
        console.log(saveFilereply);
        if (saveFilereply) {
            if (saveFilereply.canceled) {

            } else {
                if (saveFilereply.filePath) {
                    fs.writeFile(saveFilereply.filePath, fileData, (err) => {
                        if (err) {
                            console.log("An error ocurred creating the file " + err.message)
                        }
                        console.log("The file has been succesfully saved");
                        global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
                            type: 'success',
                            message: 'Settings has been exported succesfully.'
                        });
                    });

                }
            }
        }
    } catch (error) {
        console.log(error);

    }

}
