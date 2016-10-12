const Joi = require('joi');

module.exports.crop = {
  path: '/api/crop/{imageKey}/{width}/{height}/{x}/{y}',
  method: 'POST',
  config: {
    validate: {
      params: {
        width: Joi.number(),
        height: Joi.number(),
        x: Joi.number().default(0),
        y: Joi.number().default(0),
        imageKey: Joi.string()
      }
    },
    payload: {
      output: 'stream',
      parse: true
    }
  },
  handler: (request, reply) => {
    request.server.methods.crop(request.params.imageKey, {
      imagemagick: request.server.settings.app.useImagemagick,
      position: [request.params.x, request.params.y],
      size: [request.params.width, request.params.height]
    }, (err, result) => {
      if (err) {
        request.server.log(err);
        return reply(err.toString()).code(500);
      }
      return reply(result);
    });
  }
};
