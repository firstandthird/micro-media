// 'use strict';
// const os = require('os');
// const path = require('path');
// const Stream = require('stream').Transform;
// const wreck = require('wreck');
// const fs = require('fs');
// const FormData = require('form-data');
//
// exports.uploadFromURL = {
//   method: 'POST',
//   path: 'upload-url',
//   handler: {
//     autoInject: {
//       fileName(request, done) {
//         return done(null, path.join(os.tmpdir(), request.payload.filename));
//       },
//       getImage(request, fileName, done) {
//         const file = fs.createWriteStream(fileName);
//         http.get(request.payload.url, (response) => {
//           response.on('end', (err, res) => done(err));
//           response.pipe(file);
//         });
//       },
//       injectPayload(server, getImage, done) {
//         server.inject({
//           method: 'POST',
//           url: '/api/upload',
//           payload: {
//           }
//         }, (err, response) => {
//           done(err, response);
//         });
//         // wreck.post('http://localhost:8080/api/upload', {
//         //   payload: {
//         //     file: getImage.read()
//         //   }
//         // }, (response) => {
//         //   console.log(response.statusCode)
//         //   // console.log(response.payload)
//         // });
//       },
//       reply(injectPayload, done) {
//         done();
//       }
//     }
//   }
// };
