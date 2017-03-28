const querystring = require('querystring');
const hoek = require('hoek');
exports.uploadMulti = {
  path: '/upload-multi',
  method: 'GET',
  handler(request, reply) {
    reply.view('upload-multi', {
      options: querystring.stringify(request.query)
    });
  }
};

exports.uploadSingle = {
  path: '/upload-single',
  method: 'GET',
  handler(request, reply) {
    const fullOptions = hoek.clone(request.query);
    const uploadOptions = hoek.clone(request.query);
    if (uploadOptions.inputId) {
      delete uploadOptions.inputId;
    }
    
    reply.view('upload-single', {
      options: querystring.stringify(uploadOptions),
      opts: fullOptions
    });
  }
};

exports.test = {
  path: '/embed-test',
  method: 'GET',
  handler(request, reply) {
    reply.view('embed-test', {
      options: querystring.stringify(request.query)
    });
  }
};
