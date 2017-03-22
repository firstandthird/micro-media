'use strict';
const http = require('http');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');
const Jimp = require('jimp');
const TinyColor = require('tinycolor2');
const sizeOf = require('image-size');
const imghdr = require('imghdr');

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
        if (!request.query.url) {
          return done(null, request.payload);
        }
        // const filename = URL.pathname(request.query.url);
        const file1 = fs.createWriteStream(request.payload.path);
        http.get(request.query.url, (response) => {
          // response.on('data', (chunk) => {
          //   console.log('chunk!')
          //   body.write(chunk);
          //
          // });
          response.on('end', () => {
            const body = new Buffer(response.read());
            console.log('done so:')
            console.log(body)
            // console.log(body.length)
            const r = imghdr.what(body);
            console.log('hey')
            console.log(r)
            done();
          });
          // response.pipe(file1);
          // response.on('end', (err) => {
          //   const buffer = data.read();
          //   const exts = imghdr.what(buffer);
          //   if (exts.length === 0) {
          //     return done(new Error('could not recognize mime type for ${request.query.url}'));
          //   }
          //   console.log('it is:')
          //   console.log(buffer)
          //   console.log(exts)
          //   const newFile = `${request.payload.path}.${exts[0]}`
          //   fs.writeFile()
          // })
            // done(err, {
            //   file: {
            //     path: request.payload.path,
            //     filename
            //   }
          // }));
          // response.pipe(file1);
        });
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
