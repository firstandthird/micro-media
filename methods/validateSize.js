const boom = require('boom');
const sizeOf = require('image-size');

module.exports = {
  method(request, settings, buffer) {
    // see if there are image dimension requirements coming from settings or query:
    const minSize = { width: settings.minimumImageSize.width, height: settings.minimumImageSize.height };
    minSize.width = Number(request.query.minwidth || minSize.width);
    minSize.height = Number(request.query.minheight || minSize.height);
    // skip if minimumImageSize dimensions are not set, image can be any size:
    const size = sizeOf(buffer);
    if (typeof minSize.width === 'number' && size.width < minSize.width) {
      throw boom.badRequest(`Image must be at least ${minSize.width} pixels wide`);
    }
    if (typeof minSize.height === 'number' && size.height < minSize.height) {
      throw boom.badRequest(`Image must be at least ${minSize.height} pixels tall`);
    }
    return size;
  }
};
