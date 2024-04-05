const multer = require("multer");

const PhotoMiddleware = multer({ dest: "controller/uploads/" });

module.exports = PhotoMiddleware;

console.log({ __dirname });
