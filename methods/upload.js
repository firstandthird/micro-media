const s3put = require('s3put');
module.exports = function(file, callback) {
  const s3 = this.settings.app.s3;
  const options = {
    public: true,
    bucket: s3.bucket,
    profile: s3.profile
  };
  s3put(file, options, callback);
};
