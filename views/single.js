/* eslint-env browser */
import Dropzone from 'dropzone';
import { on, show, hide, styles } from 'domassist';

const opts = window.uploaderSetup;

const sendMessage = function(event) {
  if (!window.parent) {
    return;
  }
  window.parent.postMessage(JSON.stringify(event), '*');
};

Dropzone.options.uploader = {
  uploadMultiple: false,
  maxFiles: 1,
  uploadprogress(file, progress) {
    hide('#uploader');
    show('#progress');
    styles('#progress .bar', {
      width: `${progress}%`
    });
  },
  complete(file) {
    if (file.status !== 'success') {
      return alert('there was an error'); // eslint-disable-line no-alert
    }

    const response = file.xhr.response;
    const obj = JSON.parse(response);
    const imageUrl = obj.location;

    hide(['#uploader', '#progress']);
    styles('#results', {
      backgroundImage: `url(${imageUrl})`,
      display: 'block'
    });
    show('#clear');
    const event = {
      type: 'complete',
      data: obj
    };
    if (opts.inputId) {
      event.inputId = opts.inputId;
    }
    sendMessage(event);
  }
};

on('#clear', 'click', () => {
  show('#uploader');
  hide(['#results', '#clear']);
  const event = {
    type: 'clear'
  };
  sendMessage(event);
});
