const wreck = require('wreck');
const os = require('os');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');
const boom = require('boom');

module.exports = {
  async method(request) {
    let filepath;
    // if it's a URL you have to fetch the file and write it to disk first:
    if (request.query.url) {
      const { res, payload } = await wreck.get(request.query.url);
      if (res.statusCode !== 200) {
        throw boom.create(res.statusCode, `URL ${request.query.url} returned HTTP status code ${res.statusCode}`);
      }
      // abort if that file extension is not allowed:
      const ext = mime.extension(res.headers['content-type']);
      filepath = path.join(os.tmpdir(), `${Math.random()}.${ext}`);
      fs.writeFileSync(filepath, payload);
    } else {
      filepath = request.payload.file.path;
    }
    const filename = request.query.url ? path.basename(filepath) : request.payload.file.filename.replace(/[()/?<>\\:*|":]/g, '').replace(/\s/g, '_');
    return { filename, filepath };
  }
};
