const path = require('path');
const fs = require('fs');
const boom = require('boom');

module.exports = {
  method(request, fileInfo, settings) {
    // make sure we accept images with that extension:
    const ext = path.extname(fileInfo.filename).toLowerCase();
    const allowedExtensions = settings.allowedExtensions.split(',');
    if (allowedExtensions.indexOf(ext) === -1) {
      fs.unlinkSync(fileInfo.filepath);
      throw boom.forbidden(`Type ${ext} is not allowed`);
    }
    return fs.readFileSync(fileInfo.filepath);
  }
}
