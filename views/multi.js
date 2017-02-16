/* eslint-env browser */
import Dropzone from 'dropzone';
import { findOne, hide } from 'domassist';

Dropzone.options.uploader = {
  complete(file) {
    if (file.status !== 'success') {
      return alert('there was an error'); // eslint-disable-line no-alert
    }

    const response = file.xhr.response;
    const obj = JSON.parse(response);
    const imageUrl = obj.Location;

    hide(findOne('#uploader'));

    const img = `
      <div class="image-container">
        <div class="image" style="background-image: url(${imageUrl});"></div>
        <input readonly value="${imageUrl}" onfocus="this.select();"/>
      </div>
    `;

    findOne('#results').insertAdjacentHTML('beforeend', img);
    if (window.parent) {
      window.parent.postMessage(imageUrl, '*');
    }
  }
};
