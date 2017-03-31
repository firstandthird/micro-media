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
    const barColor = options.barColor;
    const bgColor = options.bgColor;

    delete options.inputId;
    delete options.barColor;
    delete options.bgColor;

    reply.view('upload-single', {
      options: querystring.stringify(options),
      inputId,
      barColor,
      bgColor
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
