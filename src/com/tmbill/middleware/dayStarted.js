const { ResponseMessage } = require('../error/ResponseMessage');
const { StartcloseDay } = require('../js/database');

async function isDayStarted(req, res, next) {
  try {
    const response = new ResponseMessage(200, '');
    const result = await StartcloseDay.checkforStartday();

    if (result && result.askforStartday) {
      response.setStatus(409);
      response.setMessage('Day not started');
      return res.json(response);
    }
    console.log('calling next');
    next();
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  isDayStarted,
};
