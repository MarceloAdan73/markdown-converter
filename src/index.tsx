import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';  // Corregido: usa App.css en lugar de index.css
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('‚úÖ Service Worker registrado:', registration.scope);
        
        // Escuchar evento de instalaci√≥n PWA
        window.addEventListener('beforeinstallprompt', (e: Event) => {
          e.preventDefault();
          // Usar tipo any temporalmente para evitar error TypeScript
          (window as any).deferredPrompt = e;
          console.log('Ì≥± PWA lista para instalaci√≥n');
        });
      })
      .catch(error => {
        console.log('‚ùå Error registrando Service Worker:', error);
      });
  });
}

// Detectar si ya est√° instalado como PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('ÔøΩÔøΩ Ejecutando como PWA instalada');
}
