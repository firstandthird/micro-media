'use strict';
const wreck = require('wreck');

wreck.post('http://localhost:8080/api/upload?url=https://httpsimage.com/lock.png', {
}, (err, response) => {
  console.log(err);
  console.log(Object.keys(response));
  console.log(response.statusCode);
  console.log(response.statusMessage);
  console.log(response.payload)
});
