/* eslint-disable import/prefer-default-export */
const { io } = require('socket.io-client');
const { getLocalStorage } = require('../../storage');
const { localapiCall } = require('../services/APIService');

let socketInstance;
let connectcheckInterval = 0;

const checkIfMasterisreachable = async () => {
  try {
    await localapiCall.get(`/api/health`, {
      https: {
        rejectUnauthorized: false,
      },
      timeout: 2000,
    });
  } catch {
    return false;
  }

  return true;
};

function setMasterconnectionstatus(status) {
  window.__MASTERPOS_CONNECTED__ = status;

  if (!status) {
    // verify with health api call
    console.warn(
      `Message="Socket Connection With Master POS Is Closed. Verifying With Health Endpoint"`,
    );
    checkIfMasterisreachable()
      .then((apistatus) => {
        if (!status && !apistatus) {
          console.warn(`Message="Looks Like Master POS Is Not Live."`);
          // We can show some ui here and set the UI flag
          $('#posDisconnectedModalid').modal('show');
        } else {
          $('#posDisconnectedModalid').modal('hide');
        }
      })
      .catch((e) => console.error(e));
  }
}

function startCheckconnectionjob() {
  if (connectcheckInterval) {
    clearInterval(connectcheckInterval);
  }

  connectcheckInterval = setInterval(() => {
    const status = socketInstance.connected && !socketInstance.disconnected;
    setMasterconnectionstatus(status);
    console.debug(`Socket connection is ${status ? 'up' : 'down'}`);
  }, 60000);
}

function setSocketconnectionhandlers() {
  if (socketInstance) {
    socketInstance.on('connect', () => {
      console.debug(`Server Connected`);
      setMasterconnectionstatus(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.debug(`Server disconnected`, reason);
      setMasterconnectionstatus(false);
    });
  }
}

function initSocket(url) {
  if (url) {
    if (socketInstance) {
      if (socketInstance.disconnected || !socketInstance.connected) {
        console.log(`Socket connection is not active. Trying again...`);
        socketInstance.connect();
      }
      return socketInstance;
    }
    socketInstance = io.connect(url);
    setMasterconnectionstatus(true);
    startCheckconnectionjob();

    setTimeout(() => {
      setSocketconnectionhandlers();
    }, 5000);
    return socketInstance;
  }
  return undefined;
}

function setupSocketforrenderer() {
  const authToken = getLocalStorage('JWT_TOKEN');
  const masterPOSURL = getLocalStorage('MASTER_POS_URL');

  if (authToken && masterPOSURL) {
    return initSocket(`${masterPOSURL}?token=${authToken}`);
  }
  return undefined;
}

module.exports = {
  setupSocketforrenderer,
  socketInstance,
  checkIfMasterisreachable,
};
