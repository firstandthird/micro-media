const http = require('http');
const s3put = require('s3put');
const path = require('path');

module.exports = function(imageKey, options, callback) {
  const s3 = this.settings.app.s3;
  options.public = true;
  options.bucket = s3.bucket;
  options.profile = s3.profile;
  // get the file as a stream from the server:
  const filename = `${path.basename(imageKey)}-${options.size[0]}x${options.size[1]}${path.extname(imageKey)}`;
  http.get(`${this.settings.app.s3Host}/${s3.bucket}/${imageKey}`, (response) => {
    // set the name you want and then send it to s3:
    response.path = filename;
    s3put(response, options, callback);
  });
};
