import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register service worker for offline + background sync
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/src/sw.ts').catch(() => {})
}
