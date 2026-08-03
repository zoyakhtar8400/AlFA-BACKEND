const { SerialPort } = require('serialport');
const { ipcMain } = require('electron');
const { Settings } = require('../../js/database');
const { SHOW_NOTIFICATION } = require('../../util/IPC_Messages');

const DISPLAY_AMOUNT = 'IPC_EVENT:SERIAL_PORT:DISPLAY_AMOUNT';
const INIT_SERIALPORT = 'IPC_EVENT:SERIAL_PORT:INIT_SERIALPORT';
const CLEAR_DISPLAY = 'IPC_EVENT:SERIAL_PORT:CLEAR_DISPLAY';
const GET_PORTS = 'IPC_EVENT:SERIAL_PORT:GET_PORTS';
const ADD_PORT = 'IPC_EVENT:SERIAL_PORT:ADD_PORT';

const WRITE_CMD = `\x1B\x51\x41{{amount}}\x0D`;

const DEFAULT_OPTIONS = {
  path: 'COM2',
  baudRate: 2400,
  dataBits: 8,
  parity: 'mark',
  stopBits: 1,
};

let serialPortinstance;
let isPortopen = false;
let isPosytudeSystem = false;

async function initSerialport() {
  try {
    // const list = await SerialPort.list();
    const portSetting = await Settings.findOne({
      raw: true,
      where: { id: 135 },
    });
    if (
      portSetting &&
      ![undefined, '0', null, ''].includes(portSetting.value)
    ) {
      let options = JSON.parse(portSetting.value);
      if (
        options.path &&
        options.baudRate &&
        options.dataBits &&
        options.stopBits
      ) {
        if (serialPortinstance && serialPortinstance.isOpen) {
          serialPortinstance.close();
        }
        if (Option.baudRate == 2400) {
          isPosytudeSystem = true;
        }
        serialPortinstance = new SerialPort(options);
        serialPortinstance.on('error', errorHandler);
        serialPortinstance.on('open', openHandler);
        serialPortinstance.on('close', closeHandler);
      } else {
        console.error(
          `Context="Posytude" Message="Wrong SerialPort Config Provided"`,
        );
      }
    }
  } catch (error) {
    console.error(
      `Context="Posytude" Message="Error Setting up Posytude PORT"`,
      error,
    );
  }
}

function sendNotificationtouser(title, message) {
  if (global.mainWindow && global.mainWindow.webContents) {
    global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
      issystemNotification: true,
      data: {
        notification: {
          body: {
            msg: message,
          },
          title: title,
        },
      },
    });
  }
}

function errorHandler(err) {
  isPortopen = false;
  let message = err?.message || 'Error Occured on Serial Port';
  console.error(
    `Context="Posytude"  Message="Error Occured on Serial Port"`,
    err?.message,
  );
  sendNotificationtouser('Customer Display', message);
}

function closeHandler() {
  isPortopen = false;
  console.log(`Context="Posytude" Message="Customer Display Port is closed"`);
}

function openHandler() {
  console.log(`Context="Posytude" Message="Serial Port Opened"`);
  isPortopen = true;

  if (serialPortinstance) {
    if (isPosytudeSystem) {
      serialPortinstance.write('\x1B\x40'); // Initialize
    } else {
      serialPortinstance.write(Buffer.from([0x1b, 0x4e])); // Initialize
    }
    serialPortinstance.write('\x0c'); // Clear Display
  }
}

function convertToHex(amount) {
  let finalValue;
  try {
    if (!isNaN(amount)) {
      finalValue = String(WRITE_CMD).replace(
        `{{amount}}`,
        Number(amount).toFixed(2),
      );
    }
  } catch (error) {
    console.error(error);
  }

  return finalValue;
}

function sendWriteCommand(text) {
  serialPortinstance.write(text, function (err) {
    if (err) {
      sendNotificationtouser(
        'Customer Display',
        'Error occured while writing on port',
      );
      return console.error(
        `Context="Posytude" Message="Error occured while writing on port"`,
        err.message,
      );
    }
    //console.log(`Context="Posytude" Message="Message Written." Amount="${text}"`);
  });
}

// Show Text event handler
function showText(payload) {
  if (!payload) return;
  if (isPortopen && serialPortinstance && serialPortinstance.isOpen) {
    if (payload.constructor === 'test'.constructor) {
      payload = JSON.parse(payload);
    }
    let text = '';
    if (isPosytudeSystem) {
      text = convertToHex(payload.amount || 0);
    } else {
      const hexValues = Buffer.from(payload.amount.toString(), 'utf8').toString(
        'hex',
      );

      // Create a Buffer with the EN command (Escape N) followed by the converted hex values
      text = Buffer.from([0x1b, 0x4e, ...Buffer.from(hexValues, 'hex')]);
      sendWriteCommand(Buffer.from([0x0c]));
    }
    if (text) {
      sendWriteCommand(text);
      // serialPortinstance.write(text, function (err) {
      //   if (err) {
      //     sendNotificationtouser(
      //       'Customer Display',
      //       'Error occured while writing on port',
      //     );
      //     return console.error(
      //       `Context="Posytude" Message="Error occured while writing on port"`,
      //       err.message,
      //     );
      //   }
      //   //console.log(`Context="Posytude" Message="Message Written." Amount="${text}"`);
      // });
    }
  } else {
    console.log(`Context="Posytude" Message="Port is closed."`);
  }
}

function clearDisplay(_event, _payload) {
  if (isPortopen && serialPortinstance && serialPortinstance.isOpen) {
    serialPortinstance.write('\x1B\x40'); // Initialize
    serialPortinstance.write('\x0c'); // Clear Display
  } else {
    console.log(`Context="Posytude" Message="Port is closed."`);
  }
}

betteripcMain.answerRenderer(DISPLAY_AMOUNT, async (orderDetails) => {
  showText(orderDetails);
  return;
});

betteripcMain.answerRenderer(CLEAR_DISPLAY, async () => {
  clearDisplay();
  return;
});

// This should be called from rendere when the setting is on for customer display
betteripcMain.answerRenderer(INIT_SERIALPORT, async () => {
  initSerialport();
  return;
});

betteripcMain.answerRenderer(GET_PORTS, async () => {
  const ports = await SerialPort.list();
  return { ports };
});

betteripcMain.answerRenderer(ADD_PORT, async (options) => {
  if (
    options.path &&
    options.baudRate &&
    options.dataBits &&
    options.stopBits
  ) {
    await Settings.update(
      { value: JSON.stringify(options) },
      {
        where: {
          id: 135,
        },
      },
    );
    const portSetting = await Settings.findOne({
      raw: true,
      where: { id: 135 },
    });
    initSerialport();
    return { portSetting };
  }
  return;
});

setTimeout(() => {
  initSerialport();
}, 10000);
