const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');
const Jimp = require('jimp');
const TinyColor = require('tinycolor2');
const sizeOf = require('image-size');

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
      payload(request, done) {
        console.log('pay')
        console.log(request.payload)
        done(null, request.payload);
      },
      filepath(payload, done) {
        console.log('===')
        done(null, payload.file.path);
      },
      filename(payload, done) {
        console.log('_')
        console.log(payload.file.filename)
        done(null, payload.file.filename);
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
