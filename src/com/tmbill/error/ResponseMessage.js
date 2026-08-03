class ResponseMessage {
  constructor(status, message) {
    this.status = status;
    this.message = message;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    this.status = status;
  }

  setMessage(message) {
    this.message = message;
  }
}

module.exports = {
  ResponseMessage,
};
