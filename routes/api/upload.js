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
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = settings.allowedExtensions.split(',');
    if (allowedExtensions.indexOf(ext) === -1) {
      fs.unlinkSync(filepath);
      throw boom.forbidden(`Type ${ext} is not allowed`);
    }

    // if minimum image dimensions are specified, make sure this is above that size:
    const quality = request.query.quality || settings.quality;
    const buffer = fs.readFileSync(filepath);
    // see if there are image dimension requirements coming from settings or query:
    const minSize = { width: settings.minimumImageSize.width, height: settings.minimumImageSize.height };
    minSize.width = Number(request.query.minwidth || minSize.width);
    minSize.height = Number(request.query.minheight || minSize.height);
    // skip if minimumImageSize dimensions are not set, image can be any size:
    const size = sizeOf(buffer);
    if (typeof minSize.width === 'number' && size.width < minSize.width) {
      throw boom.badRequest(`Image must be at least ${minSize.width} pixels wide`);
    }
    if (typeof minSize.height === 'number' && size.height < minSize.height) {
      throw boom.badRequest(`Image must be at least ${minSize.height} pixels tall`);
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
      // getBuffer requires a callback and doesn't work with util.promisify:
      resizeBuffer = await new Promise((resolve, reject) => {
        jimpImage.getBuffer(Jimp.AUTO, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
      });
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
      // anything other than error 99 is considered an unrecoverable error:
      if (err.code !== 99) {
        throw err;
      }
    }
    const s3Options = {
      folder: request.query.folder || settings.folder,
      public: request.query.public || settings.public,
      path: filename,
      host: settings.s3Host,
      maxAge: settings.maxAge
    };
    // upload the image
    const s3 = await request.server.uploadToS3(minBuffer, s3Options);
    // create an upload a thumbnail if requested:
    let s3Thumb;

    if (request.query.thumb) {
      const dims = request.query.thumb.toLowerCase().split('x');
      const width = parseInt(dims[0], 10);
      const height = parseInt(dims[1], 10);
      const thumbJimp = await Jimp.read(buffer);

      if (request.query.thumbResize) {
        thumbJimp[request.query.thumbResize](width, height);
      } else {
        thumbJimp.resize(width, height);
      }

      // getBuffer requires a callback and doesn't work with util.promisify:
      const thumbBuffer = await new Promise((resolve, reject) => {
        thumbJimp.getBuffer(Jimp.AUTO, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
      });

      s3Options.path = `thumbnail_${filename}`;
      s3Thumb = await request.server.uploadToS3(thumbBuffer, s3Options);
    }

    // try to get the final size of the image:
    let finalSize;
    try {
      finalSize = sizeOf(minBuffer);
    } catch (e) {
      finalSize = { width: 'unknown', height: 'unknown' };
    }

    // clean up the file from disk:
    fs.unlinkSync(filepath);
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
