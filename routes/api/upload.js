exports.upload = {
  method: 'POST',
  path: 'upload',
  config: {
    payload: {
      output: 'stream'
    }
  },
  handler(request, reply) {
    const server = request.server;
    const options = {
      folder: request.query.folder
    };
    const file = request.payload.file;
    file.path = file.hapi.filename;
    server.uploadToS3(file, options, reply);
  }
};
