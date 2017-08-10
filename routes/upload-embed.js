const querystring = require('querystring');
exports.uploadMulti = {
  path: '/upload-multi',
  method: 'GET',
  handler(request, reply) {
    const settings = request.server.settings.app;
    reply.view('upload-multi', {
      options: querystring.stringify(request.query),
      routePrefix: settings.routePrefix
    });
  }
};

exports.uploadSingle = {
  path: '/upload-single',
  method: 'GET',
  handler(request, reply) {
    const settings = request.server.settings.app;
    const allowedFiles = request.server.settings.app.allowedExtensions;
    const options = Object.assign({}, request.query);

    const inputId = options.inputId;
    const barColor = options.barColor;
    const bgColor = options.bgColor;
    const defaultImage = (options.defaultImage) ? options.defaultImage : false;
    const defaultText = (options.defaultText) ? options.defaultText : 'Drop files here or click to upload.';

    delete options.inputId;
    delete options.barColor;
    delete options.bgColor;
    delete options.defaultImage;
    delete options.defaultText;

    reply.view('upload-single', {
      options: querystring.stringify(options),
      inputId,
      barColor,
      bgColor,
      defaultImage,
      defaultText,
      allowedFiles,
      routePrefix: settings.routePrefix
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
