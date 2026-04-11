import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './Components/Router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router/>
  </StrictMode>,
)
