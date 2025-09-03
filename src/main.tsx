import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SecurityService } from '@/lib/securityService';

// Inicializar monitoramento de segurança
SecurityService.initializeDOMMonitoring();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
