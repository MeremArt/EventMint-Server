const CustomAPIError = require(`./custom-error.js`);
const { StatusCodes } = require(`http-status-codes`);
class ExistingUserError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.CONFLICT;
  }
}

module.exports = ExistingUserError;
