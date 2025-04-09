import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import statement for index.css removed as the file was empty and has been deleted
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
