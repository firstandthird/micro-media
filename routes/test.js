module.exports.dummy = {
  path: '/test',
  method: 'GET',
  handler: (request, reply) => {
    reply(`
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dropzone/4.3.0/dropzone.js"/> </script>
    <style>
    </style>
  </head>
  <body>
    <form action="/api/media" class="dropzone dz-clickable">
      <div class="dz-default dz-message">
        Click here to test mediamanager's upload!
      </div>
    </form>
  </body>
</html>`);
  }
};
