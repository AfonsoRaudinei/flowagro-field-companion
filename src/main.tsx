import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadSystem } from './lib/preloadSystem'
import { SecurityService } from '@/lib/securityService'

// Import FlowAgro Brand System
import './lib/brand-system'
import { initializeSecurity } from './lib/cspConfig'

// Initialize preload system and Service Worker
preloadSystem

// Initialize security hardening
initializeSecurity()

// Register Service Worker for caching optimization
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then((registration) => {
      console.log('SW registered: ', registration)
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError)
    })
  })
}

// Initialize security monitoring
SecurityService.initializeDOMMonitoring()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
