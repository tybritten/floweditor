import './global.module.scss';

import FlowEditor from 'components';
import React from 'react';
import ReactDOM from 'react-dom';

import * as serviceWorker from './serviceWorker';
import { setHTTPTimeout } from 'external';
import { loadStore } from 'store';

window.unmountEditor = ele => {
  if (ele) {
    ReactDOM.unmountComponentAtNode(ele);
    if (window.editor) {
      window.editor.reset();
    }
  }
};

window.showFlowEditor = (ele, config) => {
  if (config.httpTimeout) {
    setHTTPTimeout(config.httpTimeout);
  }

  loadStore();

  ReactDOM.unmountComponentAtNode(ele);
  ReactDOM.render(<FlowEditor config={config} />, ele);
};

// let our document know we are ready to go
document.dispatchEvent(new CustomEvent('temba-floweditor-loaded'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

export const showError = (error = null) => {
  if (window.showErrorDialog) {
    window.showErrorDialog(error);
  } else {
    console.error(error);
  }
};
