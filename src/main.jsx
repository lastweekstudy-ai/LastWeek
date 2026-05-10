import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pdfjs } from 'react-pdf'

// Configure PDF.js worker globally - MUST be set before any PDF components load
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)