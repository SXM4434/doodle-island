import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'

const bootFallback = document.getElementById('boot-fallback')
if (bootFallback) bootFallback.remove()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
