const detect = require('detect-port');

async function checkPortinuse(port) {
  let response = { portOccupied: false };
  try {
    let _port = await detect(port);
    if (port == _port) {
      console.log(`port: ${port} was not occupied`);
    } else {
      console.log(`port: ${port} was occupied, try port: ${_port}`);
      response.portOccupied = true;
    }
  } catch (error) {
    console.log(error);
  }
  return response;
}

module.exports = {
  checkPortinuse,
};
