import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

registerSW({ immediate: true })

// ponytail: sem StrictMode — o duplo-mount de dev criaria dois workers Pyodide (~60 MB cada).
createRoot(document.getElementById('root')!).render(<App />)
