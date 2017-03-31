/* eslint-env browser */
import Dropzone from 'dropzone';
import { findOne, on, show, hide, styles } from 'domassist';

const opts = window.uploaderSetup;

const sendMessage = function(event) {
  if (!window.parent) {
    return;
  }
  window.parent.postMessage(JSON.stringify(event), '*');
};

let dropzone;

Dropzone.options.uploader = {
  init() {
    dropzone = this;
  },
  uploadMultiple: false,
  maxFiles: 1,
  uploadprogress(file, progress) {
    hide('#uploader');
    show(['#progress', '#status']);
    if (progress > 97) {
      findOne('#status').innerHTML = 'Optimizing Image...';
    }
    styles('#progress .bar', {
      width: `${progress}%`
    });
  },
  complete(file) {
    const event = {};
    if (file.status !== 'success') {
      findOne('#status').innerHTML = 'There was an error.';
      event.type = 'error';
      event.data = {
        status: file.xhr.status,
        message: file.xhr.statusText
      };

      return sendMessage(event);
    }

    const response = file.xhr.response;
    const obj = JSON.parse(response);
    const imageUrl = obj.location;

    hide(['#uploader', '#progress', '#status']);
    styles('#results', {
      backgroundImage: `url(${imageUrl})`,
      display: 'block'
    });
    show('#clear');

    event.type = 'complete';
    event.data = obj;

    if (opts.inputId) {
      event.inputId = opts.inputId;
    }
    sendMessage(event);
  }
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
