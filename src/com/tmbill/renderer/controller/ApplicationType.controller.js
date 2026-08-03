const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const { APP_TYPE } = require('../../constant');

let apptitleBar;

function applicationtypeSetupdone() {
  console.log(`applicationtypeSetupdone`);
  setTimeout(() => {
    ipcRenderer.send('SET_APPLICATION_TYPE_DONE');
  }, 300);
}

function createtitleBar() {
  try {
    const menu = new remote.Menu();
    menu.append(new remote.MenuItem({}));
    apptitleBar = new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#fff'),
      icon: '../assets/logo.ico',
      // menu: menu
    });
    if (apptitleBar) {
      // dummy
    }
    // }
  } catch (error) {
    console.error(error);
  }
}

function addListeners() {
  console.log(`addListeners`);
  document
    .getElementById('masterposSelection')
    .addEventListener('click', () => {
      console.log('Master was clicked');
      ipcRenderer.send('SET_APPLICATION_TYPE', {
        type: APP_TYPE.MASTER_POS,
      });
      applicationtypeSetupdone();
    });

  document.getElementById('terminalSelection').addEventListener('click', () => {
    console.log('terminal was clicked');
    ipcRenderer.send('SET_APPLICATION_TYPE', {
      type: APP_TYPE.TERMINAL,
    });
    applicationtypeSetupdone();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  createtitleBar();
  addListeners();
});
