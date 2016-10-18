module.exports.modify = {
  path: '/modify/{image}',
  method: 'GET',
  handler: (request, reply) => {
    const s3Host = request.server.settings.app.s3Host;
    const s3Bucket = request.server.settings.app.s3.bucket;
    reply.view('modify_image', {
      image_base: encodeURIComponent(request.params.image),
      image_url: `${s3Host}/${s3Bucket}/${request.params.image}`
    });
  }
};
