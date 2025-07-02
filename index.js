import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css'; // Ensure styles from App.css are applied
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="page-container">
      <div className="overlay">
        <App />
      </div>
    </div>
  </React.StrictMode>
);

reportWebVitals();
