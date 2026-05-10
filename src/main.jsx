import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pdfjs } from 'react-pdf'

// Configure PDF.js worker - use version 5.4.296 to match react-pdf 10.4.1
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)