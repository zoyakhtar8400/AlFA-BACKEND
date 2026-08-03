const { ipcMain, BrowserWindow, Menu } = require('electron');

// Parse menu to send it to the title bar
const parseMenu = () => {
  const menu = new WeakSet();
  return (key, value) => {
    if (key === 'commandsMap') return;
    if (typeof value === 'object' && value !== null) {
      if (menu.has(value)) return;
      menu.add(value);
    }
  };
};

// Gets the menu item on click
const getMenuItemByCommandId = (
  commandId,
  menu = Menu.getApplicationMenu(),
) => {
  let menuItem;
  menu.items.forEach((item) => {
    if (item.submenu) {
      const submenuItem = getMenuItemByCommandId(commandId, item.submenu);
      if (submenuItem) menuItem = submenuItem;
    }
    if (item.commandId === commandId) menuItem = item;
  });

  return menuItem;
};

if (ipcMain) {
  ipcMain.on('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender).minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.on('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender).close();
  });

  ipcMain.on('window-is-maximized', (event) => {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = BrowserWindow.fromWebContents(event.sender).isMaximized();
  });

  ipcMain.on('request-application-menu', (event) => {
    const menu = Menu.getApplicationMenu();
    const jsonMenu = JSON.parse(JSON.stringify(menu, parseMenu()));
    event.sender.send('titlebar-menu', jsonMenu);
  });

  ipcMain.on('menu-event', (event, commandId) => {
    const menu = Menu.getApplicationMenu();
    const item = getMenuItemByCommandId(commandId, menu);
    item?.click(
      undefined,
      BrowserWindow.fromWebContents(event.sender),
      event.sender,
    );
  });
}
