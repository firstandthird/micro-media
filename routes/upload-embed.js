const querystring = require('querystring');
const pick = require('lodash.pick');
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
    const fullOptions = request.query;
    const uploadOptions = pick(request.query, ['resize', 'width', 'height', 'background', 'quality', 'folder', 'public', 'url']);
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
