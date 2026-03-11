import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
const baseName = '/' + window.location.pathname.split('/')[1];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <BrowserRouter basename={baseName === '/' ? '/' : baseName}>
            <App />
        </BrowserRouter>
  </StrictMode>,
)
