import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/authContext.jsx";

import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';



createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    
    <AuthProvider>
    <App />
    </AuthProvider>
   
  </StrictMode>
  </BrowserRouter>
)
