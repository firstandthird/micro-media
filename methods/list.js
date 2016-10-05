const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = function(callback) {
  const options = {
    Bucket: this.settings.app.s3.bucket
  };
  s3.listObjectsV2(options, (err, data) => {
    callback(err, err ? undefined : data.Contents.map((imageOnS3) => {
      return `${this.settings.app.s3Host}/${ options.Bucket }/${imageOnS3.Key}`;
    }));
  });
};
