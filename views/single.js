/* eslint-env browser */
import Dropzone from 'dropzone';
import { findOne, hide, styles } from 'domassist';

Dropzone.options.uploader = {
  uploadMultiple: false,
  maxFiles: 1,
  complete(file) {
    if (file.status !== 'success') {
      return alert('there was an error'); // eslint-disable-line no-alert
    }

    const response = file.xhr.response;
    const obj = JSON.parse(response);
    const imageUrl = obj.Location;

    hide(findOne('#uploader'));
    styles(findOne('#results'), {
      backgroundImage: `url(${imageUrl})`,
      display: 'block'
    });
    if (window.parent) {
      window.parent.postMessage(imageUrl, '*');
    }
  }
};
