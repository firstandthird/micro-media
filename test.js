'use strict';
const wreck = require('wreck');
const f = async () => {
  try {
   const { res, payload } = await wreck.post('http://localhost:8080/api/upload?url=http://vignette1.wikia.nocookie.net/sonnywithachance/images/d/d9/So_Random.png/revision/latest?cb=20110226213549');
   console.log(Object.keys(res));
   console.log(res.statusCode);
   console.log(res.statusMessage);
   console.log(res.payload)
  } catch (e) {
    console.log(e);
  }
};
f();
