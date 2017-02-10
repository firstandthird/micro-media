const querystring = require('querystring');
exports.uploadMulti = {
  path: '/upload-multi',
  method: 'GET',
  handler(request, reply) {
    reply.view('upload-multi', {
      options: querystring.stringify(request.query)
    });
  }
};
