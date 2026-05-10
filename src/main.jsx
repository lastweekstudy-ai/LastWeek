import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pdfjs } from 'react-pdf'

// Configure PDF.js worker globally using unpkg CDN with exact version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)