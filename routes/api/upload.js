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
const Stream = require('stream').Transform;
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
  handler: {
    autoInject: {
      saveUrl(request, settings, done) {
        // if it's just a file upload then skip this step:
        if (!request.query.url) {
          return done();
        }
        // fetch the file from url:
        wreck.get(request.query.url, (err, response, payload) => {
          if (err) {
            return done(err);
          }
          if (response.statusCode !== 200) {
            return done(boom.create(response.statusCode, `URL ${request.query.url} returned HTTP status code ${response.statusCode}`));
          }
          // abort if that file extension is not allowed:
          const ext = mime.extension(response.headers['content-type']);
          const filename = path.join(os.tmpdir(), `${Math.random()}.${ext}`);
          fs.writeFile(filename, payload, (buffError) => {
            if (buffError) {
              return done(buffError);
            }
            return done(null, filename);
          });
        });
      },
      filepath(request, saveUrl, done) {
        if (!request.query.url) {
          return done(null, request.payload.file.path);
        }
        return done(null, saveUrl);
      },
      filename(request, settings, filepath, saveUrl, done) {
        const filename = request.query.url ? path.basename(saveUrl) : request.payload.file.filename.replace(/[\(\)\/\?<>\\:\*\|":]/g, '').replace(/\s/g, '_');
        const ext = path.extname(filename).toLowerCase();
        const allowedExtensions = settings.allowedExtensions.split(',');
        if (allowedExtensions.indexOf(ext) === -1) {
          return fs.unlink(filepath, () => done(boom.forbidden(`Type ${ext} is not allowed`)));
        }
        return done(null, filename);
      },
      quality(request, settings, done) {
        const quality = request.query.quality || settings.quality;
        done(null, quality);
      },
      buffer(filepath, done) {
        fs.readFile(filepath, done);
      },
      verifyMinimumSize(buffer, settings, done) {
        // skip if minimumImageSize dimensions are not set, image can be any size:
        if (!settings.minimumImageSize.width || !settings.minimumImageSize.height) {
          return done();
        }
        const size = sizeOf(buffer);
        if (size.width >= settings.minimumImageSize.width && size.height >= settings.minimumImageSize.height) {
          return done();
        }
        return done(boom.badRequest(`Image size must be at least ${settings.minimumImageSize.width}x${settings.minimumImageSize.height}`));
      },
      jimpImage(verifyMinimumSize, buffer, request, done) {
        if (!request.query.resize) {
          return done();
        }
        Jimp.read(buffer, done);
      },
      resizeBuffer(request, buffer, jimpImage, done) {
        if (!jimpImage) {
          return done(null, buffer);
        }
        const { resize, width, height, background } = request.query;
        jimpImage[resize](width, height);
        if (background) {
          const color = new TinyColor(background);
          jimpImage.background(parseInt(color.toHex8(), 16));
        }
        jimpImage.getBuffer(Jimp.AUTO, done);
      },
      minBuffer(resizeBuffer, quality, done) {
        imagemin.buffer(resizeBuffer, {
          plugins: [
            imageminMozjpeg({ quality }),
            imageminPngquant({ quality }),
            imageminSvgo({ quality })
          ]
        }).then(out => {
          done(null, out);
        }, (err) => {
          if (err.code === 99) {
            return done(null, resizeBuffer);
          }
          done(err);
        });
      },
      s3Options(request, filename, settings, done) {
        done(null, {
          folder: request.query.folder || settings.folder,
          public: request.query.public || settings.public,
          path: filename,
          host: settings.s3Host,
          maxAge: settings.maxAge
        });
      },
      s3(server, minBuffer, filename, s3Options, done) {
        server.uploadToS3(minBuffer, s3Options, done);
      },
      size(minBuffer, done) {
        try {
          const size = sizeOf(minBuffer);
          return done(null, size);
        } catch (e) {
          return done(null, { width: 'unknown', height: 'unknown' });
        }
      },
      clean(minBuffer, filepath, done) {
        fs.unlink(filepath, done);
      },
      reply(size, s3, done) {
        done(null, {
          location: s3.Location,
          key: s3.Key,
          width: size.width,
          height: size.height,
          expiration: s3.Expiration
        });
      }
    }
  }
};
