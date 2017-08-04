'use strict';
const http = require('http');
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
        http.get(request.query.url, (response) => {
          if (response.statusCode !== 200) {
            return done(boom.create(response.statusCode, `URL ${request.query.url} returned HTTP status code ${response.statusCode}`));
          }
          // abort if that file extension is not allowed:
          const ext = mime.extension(response.headers['content-type']);
          const filename = path.join(os.tmpdir(), `${Math.random()}.${ext}`);
          const dataStream = new Stream();
          response.on('data', (chunk) => {
            dataStream.push(chunk);
          });
          response.on('end', () => {
            fs.writeFile(filename, dataStream.read(), (err) => {
              if (err) {
                return done(err);
              }
              return done(null, filename);
            });
          });
        });
      },
      filepath(request, saveUrl, done) {
        if (!request.query.url) {
          return done(null, request.payload.file.path);
        }
        return done(null, saveUrl);
      },
      verifyMinimumSize(request, settings, filepath, done) {
        if (settings.app.minimumUploadSize) {
          return fs.stat(filepath, (err, stats) => {
            if (err) {
              return done(err);
            }
            if (stats.size < settings.app.minimumUploadSize) {
              return done(boom.badRequest('400', `You cannot upload a file of size smaller than ${settings.app.minimumUploadSize}`));
            }
            return done();
          });
        }
        return done();
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
      jimpImage(buffer, request, done) {
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
