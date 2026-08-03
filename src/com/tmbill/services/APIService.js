/* eslint-disable no-console */
const { default: axios } = require('axios');
// const https = require('https');

const api = axios.create({
  //   httpsAgent: new https.Agent({
  //     rejectUnauthorized: false,
  //   }),
});

api.defaults.headers['content-type'] = 'application/json';

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

module.exports = { apiCall: api };
