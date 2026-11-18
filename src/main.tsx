import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { wendeFarbschemaAn } from './hooks/useFarbschema'
import { ladeFarbschema } from './utils/storage'

// Farbschema VOR dem ersten Rendern setzen, damit es nicht kurz aufblitzt.
wendeFarbschemaAn(ladeFarbschema())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
