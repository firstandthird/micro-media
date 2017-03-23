'use strict';
const http = require('http');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');
const Jimp = require('jimp');
const TinyColor = require('tinycolor2');
const sizeOf = require('image-size');
const os = require('os');
const Stream = require('stream').Transform;
const path = require('path');
const mime = require('mime-types');
const boom = require('boom');

exports.upload = {
  method: 'POST',
  path: 'upload',
  config: {
    payload: {
      output: 'file',
      maxBytes: 10 * (1024 * 1024), // convert to bytes for hapi
      parse: true
    }
  },
  handler: {
    autoInject: {
      saveUrl(request, done) {
        // if it's just a file upload then skip this step:
        if (!request.query.url) {
          return done();
        }
        // fetch the url and write it as a temp file:
        http.get(request.query.url, (response) => {
          if (response.statusCode !== 200) {
            return done(boom.create(response.statusCode, `URL ${request.query.url} returned HTTP status code ${response.statusCode}`));
          }
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
      filename(request, saveUrl, done) {
        if (!request.query.url) {
          return done(null, request.payload.file.filename);
        }
        return done(null, path.basename(saveUrl));
      },
      filepath(request, saveUrl, done) {
        if (!request.query.url) {
          return done(null, request.payload.file.path);
        }
        return done(null, saveUrl);
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

        jimpImage[resize](parseInt(width, 10), parseInt(height, 10));
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
            imageminPngquant({ quality })
          ]
        }).then(out => {
          done(null, out);
        }, (err) => {
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
        const size = sizeOf(minBuffer);
        done(null, size);
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
