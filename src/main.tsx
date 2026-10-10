import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { instalarNavegacionTablas } from './utils/navegacionTeclado';
import { cargarYAplicarTema } from './services/temaApiService';

instalarNavegacionTablas();
// Paleta de colores del laboratorio (Ajustes → Paleta del sistema).
void cargarYAplicarTema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
