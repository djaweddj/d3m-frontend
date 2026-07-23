import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/authContext.jsx";
import { LanguageProvider } from './context/LanguageContext.jsx';
import App from './App.jsx'
import './index.css'
import "./i18n";
import { BrowserRouter } from 'react-router-dom';



createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    
   
      <LanguageProvider> <AuthProvider> <App /></AuthProvider> </LanguageProvider>
   
    
   
  </StrictMode>
  </BrowserRouter>
)
