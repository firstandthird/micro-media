/* eslint-env browser */
import Dropzone from 'dropzone';
import { addClass, findOne, on, show, hide, styles } from 'domassist';

const opts = window.uploaderSetup;

const sendMessage = function(event) {
  if (!window.parent) {
    return;
  }
  window.parent.postMessage(JSON.stringify(event), '*');
};

let dropzone;

const isImageFile = function(imgSrc) {
  return (/\.(gif|jpg|jpeg|tiff|png|svg)$/i).test(imgSrc);
};

const handleImage = function(imgSrc) {
  hide(['#uploader', '#progress', '#status']);

  if (isImageFile(imgSrc)) {
    styles('#results', {
      backgroundImage: `url(${imgSrc})`,
      display: 'block'
    });
  } else {
    styles('#results', { display: 'block' });
    addClass('#results', 'default-image');
  }

  show('#clear');
};

Dropzone.options.uploader = {
  init() {
    dropzone = this;
    if (opts.defaultImage) {
      handleImage(opts.defaultImage);
    }
  },
  uploadMultiple: false,
  maxFiles: 1,
  uploadprogress(file, progress) {
    hide('#uploader');
    show(['#progress', '#status']);
    if (progress > 97) {
      findOne('#status').innerHTML = 'Optimizing...';
    }
    styles('#progress .bar', {
      width: `${progress}%`
    });
  },
  complete(file) {
    const event = {};
    if (file.status !== 'success') {
      const resp = JSON.parse(file.xhr.response);
      findOne('#status').innerHTML = resp.message || 'There was an error.';
      event.type = 'error';
      event.data = {
        status: file.xhr.status,
        message: file.xhr.statusText
      };

      show('#clear');
      return sendMessage(event);
    }

    const response = file.xhr.response;
    const obj = JSON.parse(response);
    const imageUrl = obj.location;
    handleImage(imageUrl);

    event.type = 'complete';
    event.data = obj;

    if (opts.inputId) {
      event.inputId = opts.inputId;
    }
    sendMessage(event);
  },
  dictDefaultMessage: window.uploaderSetup.defaultText
};

on('#clear', 'click', () => {
  dropzone.removeAllFiles();
  show('#uploader');
  hide(['#results', '#clear']);
  const event = {
    type: 'clear'
  };
  sendMessage(event);
});
