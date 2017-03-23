'use strict';
const wreck = require('wreck');
wreck.post('http://localhost:8080/api/upload?url=http://vignette1.wikia.nocookie.net/sonnywithachance/images/d/d9/So_Random.png/revision/latest?cb=20110226213549', {
}, (err, response) => {
  console.log(err);
  console.log(Object.keys(response));
  console.log(response.statusCode);
  console.log(response.statusMessage);
  console.log(response.payload)
});
