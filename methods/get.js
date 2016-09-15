const AWS = require('aws-sdk');
const s3Interface = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = function(key, callback) {
  const s3Options = this.settings.app.s3;
  const s3Params = {
    Bucket: s3Options.bucket,
    Key: key
  };
  s3Interface.getObject(s3Params, (err, data) => {
    callback(err, err ? undefined : data.Body);
  });
};
