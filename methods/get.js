const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = function(key, callback) {
  const options = this.registrations['hapi-upload-s3'].options;
  const s3Options = {};
  s3Options.Bucket = options.s3Bucket;
  s3Options.Key = key;
  s3.getObject(s3Options, (err, data) => {
    callback(err, err ? undefined : data.Body);
  });
};
