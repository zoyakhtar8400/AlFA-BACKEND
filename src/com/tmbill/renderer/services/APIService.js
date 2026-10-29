/* eslint-disable no-console */
const { default: axios } = require('axios');
const { getLocalStorage } = require('../../storage');
const { APP_TYPE } = require('../../constant');

const authToken = getLocalStorage('TOKEN');
const username = getLocalStorage('X_USERNAME');

const isterminal = !window.__IS_MASTER_POS__;

const terminalType = isterminal ? APP_TYPE.TERMINAL : APP_TYPE.MASTER_POS;

let baseURL = `http://localhost:8000/`;

if (isterminal) {
  // Overrite the master POS address
  const masterPOSURL = getLocalStorage('MASTER_POS_URL');
  if (masterPOSURL) {
    baseURL = masterPOSURL;
  }
  console.log(`Message="Running as terminal"`);
} else {
  console.log(`Message="Running as Master"`);
}

const TIME_OUT_FOR_RENDERER_APIS = 10000;
const api = axios.create({
  baseURL,
});

api.defaults.headers['content-type'] = 'application/json';
api.defaults.headers['x-terminal-type'] = terminalType;
api.defaults.headers['x-api-key'] = authToken;
api.defaults.headers['x-api-user'] = username;
api.defaults.timeout = TIME_OUT_FOR_RENDERER_APIS;

api.interceptors.response.use(
  (response) => {
    if (response.status === 401) {
      console.log('error', 'Token expired.. You are logged out !');
      if (process.type === 'browser') {
        global.reloginfromremote();
      } else if (process.type === 'renderer') {
        window.reloginfromremote();
      }
    }
    return response;
  },
  (error) => {
    console.log(`In interceptor`);
    // Do something with request error
    const { response } = error;
    if (response) {
      //   console.log('response:', response);
      if (response.status === 500 || response.status === 502) {
        console.log('error', '500 error...');
      } else if (response.status === 401) {
        console.log('error', 'Token expired.. You are logged out !');
        if (process.type === 'browser') {
          global.reloginfromremote();
        } else if (process.type === 'renderer') {
          window.reloginfromremote();
        }
      } else if (response.data && response.status === 400) {
        console.log(
          'error',
          response.data.message || response.data.response || 'No data found !',
        );
      } else if (response.data && response.status === 402) {
        console.log(
          'error',
          response.data.message || response.data.response || 'No data found !',
        );
      }
      //   return response;
    }

    return Promise.reject(error);
  },
);

module.exports = { localapiCall: api };
