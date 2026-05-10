import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pdfjs } from 'react-pdf'

// Configure PDF.js worker globally - version must match react-pdf's pdfjs version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)