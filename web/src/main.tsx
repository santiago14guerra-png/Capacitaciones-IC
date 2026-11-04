import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { crearAutenticador } from './lib/sesion';
import './estilos/base.css';

const autenticador = await crearAutenticador();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App autenticador={autenticador} />
  </StrictMode>,
);
