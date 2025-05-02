// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Compute 1% of the *actual* window.innerHeight
 * and store it into the --vh custom property.
 */
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// run once
setVh();

// update on normal resizes (Chrome, Edge, desktop Safari…)
window.addEventListener('resize', setVh);

// update when iOS Safari’s “visual viewport” resizes (URL bar show/hide)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setVh);
}

// hack for on‑screen keyboard (iOS Safari won’t fire resize)
window.addEventListener('focusin', setVh);
window.addEventListener('focusout', setVh);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
