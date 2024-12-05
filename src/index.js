import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux'; // Importa el Provider de Redux
import store from './redux/store'; // Importa el store de Redux
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'; // Importa reCAPTCHA v3

const RECAPTCHA_SITE_KEY = "6Ld2sF0qAAAAAJfILEyxp--mTR9bYrn64uoG__Jy"; // Añade tu clave del sitio aquí

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}> {/* Envolvemos la App con Provider */}
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <App />
      </GoogleReCaptchaProvider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
