const { shell } = require('electron');
let path = require('path');
const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

let preorderDirectorypath = remote.app.getPath('home') + `/Database/preorder`;

async function selectmediaFileforpreorder(title = 'Select file', filters) {
  let fileMoved;
  if (!filters) {
    filters = [
      {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mov', 'wmv'],
      },
    ];
  }
  let options = {
    title,
    filters,
  };
  let openFilereply = await remote.dialog.showOpenDialog(
    remote.getCurrentWindow(),
    options,
  );
  if (
    openFilereply &&
    !openFilereply.canceled &&
    openFilereply.filePaths.length > 0
  ) {
    try {
      if (!fs.existsSync(preorderDirectorypath)) {
        fs.mkdirSync(preorderDirectorypath);
      }
      let srcfile = openFilereply.filePaths[0];
      let fileName = uniqid();
      fileName = path.basename(srcfile);
      let folderPath = `${preorderDirectorypath}/${fileName}`;
      let distFile = folderPath;
      // let distFile = folderPath + path.extname(srcfile);
      let result = fs.copyFileSync(srcfile, distFile);
      // fs.copyFile(srcfile, distFile, (err) => {
      //     if (err) throw err;
      //     console.log('moved...');
      fileMoved = distFile;
      return { fileMoved, srcfile };
      // });
    } catch (error) {
      console.log(error);
    }
  }
  $('#hotelLogoid').prop('disabled', false);
}

function openFile(path) {
  if (path) {
    shell.openPath(path);
  }
}

module.exports = {
  selectmediaFileforpreorder,
  openFile,
};
