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

const getBaseUrl = () => {
    if ((window as any).__BASE_HREF__) return (window as any).__BASE_HREF__;
    const path = window.location.pathname;
    const firstSegment = path.split('/').filter(Boolean)[0];
    return firstSegment ? `/${firstSegment}/` : '/';
};

const baseName = getBaseUrl();



createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <BrowserRouter basename={baseName}>
            <App />
        </BrowserRouter>
  </StrictMode>,
)
