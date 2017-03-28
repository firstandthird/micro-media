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

exports.uploadSingle = {
  path: '/upload-single',
  method: 'GET',
  handler(request, reply) {
    const options = Object.assign({}, request.query);
    const inputId = options.inputId;
    delete options.inputId;
    
    reply.view('upload-single', {
      options: querystring.stringify(options),
      inputId
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
