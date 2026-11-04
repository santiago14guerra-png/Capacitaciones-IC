import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { crearAutenticador } from './lib/sesion';
// Fuentes servidas por el propio sitio: la CSP solo permite recursos del mismo origen.
import '@fontsource-variable/albert-sans';
import '@fontsource-variable/source-serif-4';
import './estilos/base.css';

const autenticador = await crearAutenticador();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App autenticador={autenticador} />
  </StrictMode>,
);
