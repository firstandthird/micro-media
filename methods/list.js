const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = function(callback) {
  const options = this.registrations['hapi-upload-s3'].options;
  const s3Options = {};
  s3Options.Bucket = options.s3Bucket;
  s3.listObjectsV2(s3Options, (err, data) => {
    const imageUrlList = [];
    data.Contents.forEach((imageOnS3) => {
      imageUrlList.push(`${this.settings.app.s3Host}/${options.s3Bucket}/${imageOnS3.Key}`)
    });
    callback(err, err ? undefined : imageUrlList);
  });
};
