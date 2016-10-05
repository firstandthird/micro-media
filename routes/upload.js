
module.exports.upload = {
  path: '/api/media',
  method: 'POST',
  config: {
    payload: {
      output: 'stream',
      parse: true
    }
  },
  handler: (request, reply) => {
    request.payload.file.path = request.payload.file.hapi.filename
    request.server.methods.upload(request.payload.file, (err, result) => {
      if (err) {
        request.server.log(['error'], err);
        // todo: smarter error code?
        return reply(err);
      }
      return reply(result);
    });
  }
};
