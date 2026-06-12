import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './index.css'

// Configure PDF.js worker - use the worker from public folder
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const theme = localStorage.getItem('lastweek-theme') || 'dark';
document.documentElement.classList.toggle('dark', theme === 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
