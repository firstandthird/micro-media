'use strict';
const fs = require('fs');
const Joi = require('joi');
const optimiz = require('optimiz');

exports.upload = {
  method: 'POST',
  path: 'upload',
  config: {
    validate: {
      query: {
        thumb: Joi.string(),
        thumbResize: Joi.string().optional(),
        resize: Joi.string(),
        width: Joi.number(),
        height: Joi.number(),
        minwidth: Joi.number(),
        minheight: Joi.number(),
        background: Joi.string(),
        quality: Joi.number(),
        folder: Joi.string(),
        public: Joi.string(),
        url: Joi.string()
      }
    },
    payload: {
      output: 'file',
      // set by env variable or default to 1 mb (hapi default anyway)
      maxBytes: process.env.UPLOAD_SIZE_MB ? parseInt(process.env.UPLOAD_SIZE_MB * 1024000, 10) : 10485760,
      parse: true
    }
  },
  async handler(request, h) {
    const settings = request.server.settings.app;
    const { getImage, getBuffer, validateSize } = request.server.methods;
    const { resize, optimize, thumbnail } = optimiz;
    // get image as a file on disc or forward the HTTP error if it was a URL that couldn't be fetched:
    const fileInfo = await getImage(request);

    // get it as a buffer or throw an HTTP Forbidden err if it's not a valid file ext:
    const buffer = getBuffer(request, fileInfo, settings);

    // make sure image dims are above any specified minimums and throw HTTP Bad Request if not:
    const size = validateSize(request, settings, buffer);

    // if we need to resize the image before processing:
    let resizeBuffer = buffer;
    if (request.query.resize) {
      resizeBuffer = await resize({
        width: request.query.width,
        height: request.query.height,
        background: request.query.background
      }, buffer);
    }
    // try to compress the image data before uploading:
    const quality = request.query.quality || settings.quality;
    const minBuffer = await optimize({ quality }, resizeBuffer);

    // upload the image:
    const s3Options = {
      folder: request.query.folder || settings.folder,
      public: request.query.public || settings.public,
      path: fileInfo.filename,
      host: settings.s3Host,
      maxAge: settings.maxAge
    };
    const s3 = await request.server.uploadToS3(minBuffer, s3Options);

    // create an upload a thumbnail if requested:
    let s3Thumb = false;
    if (request.query.thumb) {
      const dims = request.query.thumb.toLowerCase().split('x');
      const width = parseInt(dims[0], 10);
      const height = parseInt(dims[1], 10);
      const thumbBuffer = await thumbnail({ width, height }, minBuffer);
      s3Options.path = `thumbnail_${fileInfo.filename}`;
      s3Thumb = await request.server.uploadToS3(thumbBuffer, s3Options);
    }

    // clean up the file from disk and return image/thumbnail info:
    fs.unlinkSync(fileInfo.filepath);
    const returnVal = {
      location: s3.Location,
      key: s3.Key,
      width: size.width,
      height: size.height,
      expiration: s3.Expiration
    };
    if (s3Thumb) {
      returnVal.thumbLocation = s3Thumb.Location;
      returnVal.thumbKey = s3Thumb.Key;
    }
    return returnVal;
  }
};
