const querystring = require('querystring');

exports.uploadMulti = {
  path: '/upload-multi',
  method: 'GET',
  // leave plenty of time for the upload to go through:
  config: {
    timeout: 120 * 1000
  },
  handler(request, h) {
    const settings = request.server.settings.app;
    return h.view('upload-multi', {
      options: querystring.stringify(request.query),
      routePrefix: settings.routePrefix
    });
  }
};

exports.uploadSingle = {
  path: '/upload-single',
  method: 'GET',
  // leave plenty of time for the upload to go through:
  config: {
    timeout: 120 * 1000
  },
  handler(request, h) {
    const settings = request.server.settings.app;
    const allowedFiles = request.server.settings.app.allowedExtensions;
    const options = Object.assign({}, request.query);

    const inputId = options.inputId;
    const barColor = options.barColor;
    const bgColor = options.bgColor;
    const defaultImage = (options.defaultImage) ? options.defaultImage : false;
    const defaultText = (options.defaultText) ? options.defaultText.replace(/[<>/?=@(){};]/g, '') : 'Drop a file here or click to upload.';
    const showNotice = (options.showNotice === '1');
    let noticeText = '';
    if (showNotice) {
      const noticeArray = [];
      if (allowedFiles) {
        noticeArray.push(`Allowed: ${allowedFiles}`);
      }
      if (options.minheight) {
        noticeArray.push(`Minimum Height: ${options.minheight}px`);
      }
      if (options.minwidth) {
        noticeArray.push(`Minimum Width: ${options.minwidth}px`);
      }
      noticeText = noticeArray.join(', ');
    }

    delete options.inputId;
    delete options.barColor;
    delete options.bgColor;
    delete options.defaultImage;
    delete options.defaultText;

    return h.view('upload-single', {
      options: querystring.stringify(options),
      inputId,
      barColor,
      bgColor,
      defaultImage,
      defaultText,
      noticeText,
      allowedFiles,
      routePrefix: settings.routePrefix
    });
  }
};

exports.test = {
  path: '/embed-test',
  method: 'GET',
  handler(request, h) {
    return h.view('embed-test', {
      options: querystring.stringify(request.query)
    });
  }
};
