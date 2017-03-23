'use strict';
const tap = require('tap');
const Rapptor = require('rapptor');
const fs = require('fs');
const path = require('path');
const wreck = require('wreck');

let rapptor;
tap.beforeEach((done) => {
  rapptor = new Rapptor({ env: 'dev' });
  rapptor.start((err, returned) => {
    if (err) {
      return done(err);
    }
    done();
  });
});

tap.afterEach((done) => {
  rapptor.stop(() => {
    done();
  });
});
tap.test('can POST to /upload', (assert) => {
  // const file = fs.readFileSync(path.join(__dirname, 'RandomBitmap.png'));
  const fileStream = fs.createReadStream(path.join(__dirname, 'RandomBitmap.png'));
  wreck.post('http://localhost:8080/upload', { payload: fileStream }, (err, response) => {
    // assert.equal(err, null, 'does not error');
    assert.end();
  });
});
