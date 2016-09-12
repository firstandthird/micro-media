module.exports.get = {
  path: '/api/media/{imageKey}',
  method: 'GET',
  handler: (request, response) => {
    request.server.methods.get(request.params.imageKey, (err, result) => {
      if (err) {
        request.server.log(err);
        // todo: smarter error code?
        return response('Not Found').code(500);
      }
      return response(result);
    });
  }
};
