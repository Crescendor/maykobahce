import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Silence all console logs and network debugging in client DevTools
if (typeof window !== 'undefined') {
  window.console.log = () => {};
  window.console.info = () => {};
  window.console.warn = () => {};
  window.console.debug = () => {};
  window.console.error = () => {};
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
