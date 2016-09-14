const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = function(key, callback) {
  const options = this.settings.app.s3;
  options.Key = key;
  s3.getObject(options, (err, data) => {
    callback(err, err ? undefined : data.Body);
  });
};
