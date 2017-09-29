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
    const imageUrl = obj.location;

    hide(findOne('#uploader'));

    const divStyle = (obj.isImage) ? `background-image: url(${imageUrl});` : '';
    const img = `
      <div class="image-container">
        <div class="image" style="${divStyle}"></div>
        <input readonly value="${imageUrl}" onfocus="this.select();"/>
      </div>
    `;

    findOne('#results').insertAdjacentHTML('beforeend', img);
    if (window.parent) {
      window.parent.postMessage(imageUrl, '*');
    }
  }
};
