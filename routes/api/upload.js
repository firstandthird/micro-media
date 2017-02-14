const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');

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
        done(null, request.payload);
      },
      filepath(payload, done) {
        done(null, payload.file.path);
      },
      filename(payload, done) {
        done(null, payload.file.filename);
      },
      quality(request, settings, done) {
        const quality = request.query.quality || settings.quality;
        done(null, quality);
      },
      minBuffer(filepath, quality, done) {
        imagemin([filepath], {
          plugins: [
            imageminMozjpeg({ quality }),
            imageminPngquant({ quality })
          ]
        }).then(out => {
          done(null, out[0].data);
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
      clean(minBuffer, filepath, done) {
        fs.unlink(filepath, done);
      },
      reply(s3, done) {
        done(null, s3);
      }
    }
  }
};
