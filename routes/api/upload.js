'use strict';
const wreck = require('wreck');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const fs = require('fs');
const Jimp = require('jimp');
const TinyColor = require('tinycolor2');
const sizeOf = require('image-size');
const path = require('path');
const Joi = require('joi');
const os = require('os');
const mime = require('mime-types');
const boom = require('boom');

exports.upload = {
  method: 'POST',
  path: 'upload',
  config: {
    validate: {
      query: {
        resize: Joi.string(),
        width: Joi.number(),
        height: Joi.number(),
        background: Joi.string(),
        quality: Joi.number(),
        folder: Joi.string(),
        public: Joi.string(),
        url: Joi.string()
      }
    },
    payload: {
      output: 'file',
      maxBytes: 10 * (1024 * 1024), // convert to bytes for hapi
      parse: true
    }
  },
  async handler(request, h) {
    const settings = request.server.settings.app;
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
    const filename = request.query.url ? path.basename(filepath) : request.payload.file.filename.replace(/[\(\)\/\?<>\\:\*\|":]/g, '').replace(/\s/g, '_');

    // make sure we accept images with that extension:
    const ext = path.extname(filepath).toLowerCase();
    const allowedExtensions = settings.allowedExtensions.split(',');
    if (allowedExtensions.indexOf(ext) === -1) {
      fs.unlinkSync(filepath);
      throw boom.forbidden(`Type ${ext} is not allowed`);
    }

    // if minimum image dimensions are specified, make sure this is above that size:
    const quality = request.query.quality || settings.quality;
    const buffer = fs.readFileSync(filepath);
    // skip if minimumImageSize dimensions are not set, image can be any size:
    if (settings.minimumImageSize.width || !settings.minimumImageSize.height) {
      const size = sizeOf(buffer);
      if (size.width <= settings.minimumImageSize.width || size.height <= settings.minimumImageSize.height) {
        throw boom.badRequest(`Image size must be at least ${settings.minimumImageSize.width}x${settings.minimumImageSize.height}`);
      }
    }
    // if we need to resize the image before processing:
    let resizeBuffer;
    if (request.query.resize) {
      const jimpImage = await Jimp.read(buffer);
      const { resize, width, height, background } = request.query;
      jimpImage[resize](width, height);
      if (background) {
        const color = new TinyColor(background);
        jimpImage.background(parseInt(color.toHex8(), 16));
      }
      resizeBuffer = await jimpImage.getBuffer(Jimp.AUTO);
    } else {
      resizeBuffer = buffer;
    }

    // try to compress the image data before uploading:
    let minBuffer;
    try {
      minBuffer = await imagemin.buffer(resizeBuffer, {
        plugins: [
          imageminMozjpeg({ quality }),
          imageminPngquant({ quality }),
          imageminSvgo({ quality })
        ]
      });
    } catch (err) {
      // error 99 is ok:
      if (err.code === 99) {
        return resizeBuffer;
      }
      // anything else is an error:
      throw err;
    }
    const s3Options = {
      folder: request.query.folder || settings.folder,
      public: request.query.public || settings.public,
      path: filename,
      host: settings.s3Host,
      maxAge: settings.maxAge
    };
    const s3 = await request.server.uploadToS3(minBuffer, s3Options);

    // try to get the final size of the image:
    let size;
    try {
      size = sizeOf(minBuffer);
    } catch (e) {
      size = { width: 'unknown', height: 'unknown' };
    }

    // clean up the file from disk:
    fs.unlinkSync(filepath);

    return {
      location: s3.Location,
      key: s3.Key,
      width: size.width,
      height: size.height,
      expiration: s3.Expiration
    };
  }
};
