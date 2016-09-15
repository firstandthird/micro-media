module.exports.list = {
  path: '/api/media',
  method: 'GET',
  handler: (request, response) => {
    request.server.methods.list((err, result) => {
      if (err) {
        request.server.log(err);
        return response('Error').code(500);
      }
      return response(result);
    });
  }
};
