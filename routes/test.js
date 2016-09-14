module.exports.dummy = {
  path: '/test',
  method: 'GET',
  handler: (request, reply) => {
    reply.view('test', {});
  }
};
