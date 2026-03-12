import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
// baseName = '/' + window.location.pathname.split('/')[1];

//<BrowserRouter basename={baseName === '/' ? '/' : baseName}>
//    <App />
//</BrowserRouter>

const base =
    window.location.pathname.split('/')[1]
        ? '/' + window.location.pathname.split('/')[1]
        : '/'

console.log("Base is:", base);



createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <BrowserRouter basename={base}>
            <App />
        </BrowserRouter>
  </StrictMode>,
)
