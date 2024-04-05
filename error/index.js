const CustomAPIError = require(`./custom-error`);
const BadRequestError = require(`./bad-request`);
const UnauthenticatedError = require(`./unauthenticated`);
const ExistingUserError = require(`./existing-user`);

module.exports = {
  CustomAPIError,
  BadRequestError,
  UnauthenticatedError,
  ExistingUserError,
};
