import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ChatInterface from './ChatInterface';
import PDFNoteEditor from './PDFNoteEditor';
import { updatePDFProgress, addPDFBookmark, removePDFBookmark, getPDFResource } from '../appwrite/pdfResources';
import { getPageNotes } from '../appwrite/pdfNotes';
import { createPDFHighlight, getPageHighlights, deletePDFHighlight, getPDFHighlights } from '../appwrite/pdfHighlights';
import { extractText } from '../utils/pdfProcessor';
import { clampTooltipX, TOOLTIP_OFFSET_ABOVE } from '../utils/studyUtils';
import useGemini from '../hooks/useGemini';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../styles/StudyInterface.css';

// Configure PDF.js worker - use the worker from public folder
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

const PRESETS = [30, 50, 70];
const SNAP_THRESHOLD = 3;

function snapRatio(raw) {
  for (const preset of PRESETS) {
    if (Math.abs(raw - preset) <= SNAP_THRESHOLD) return preset;
  }
  return raw;
}

const StudyInterface = ({ 
  resource, 
  onClose, 
  messages, 
  onSendMessage, 
  isLoading, 
  mode, 
  userId, 
  sessionId, 
  subject 
}) => {
  const { processImage } = useGemini();

  // PDF State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(resource.currentPage || 1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isScannedPDF, setIsScannedPDF] = useState(false);
  // Live extracted text - fallback if resource.extractedText is missing
  const [liveExtractedText, setLiveExtractedText] = useState(resource.extractedText || '');
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [extractionPct, setExtractionPct] = useState(0);
  const [extractionError, setExtractionError] = useState(null); // string | null
  
  // Notes & Highlights State
  const [pageNotes, setPageNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [savedHighlights, setSavedHighlights] = useState([]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // UI State
  const [showNotes, setShowNotes] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pdfWidth, setPdfWidth] = useState(() => {
    const stored = localStorage.getItem('study-split-ratio');
    const parsed = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) && parsed >= 20 && parsed <= 80 ? parsed : 50;
  }); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [selectedText, setSelectedText] = useState(''); // Text selected in PDF
  const [selectionTip, setSelectionTip] = useState(null); // { x, y, text }
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState('pdf'); // 'pdf' | 'chat'
  
  const containerRef = useRef(null);
  const resizeRef = useRef(null);
  const pdfViewerRef = useRef(null);
  const touchStartRef = useRef(null);
  const progressTimerRef = useRef(null);
  const [pdfViewerWidth, setPdfViewerWidth] = useState(null);

  // TOC state
  const [showTOC, setShowTOC] = useState(false);
  const [tocItems, setTocItems] = useState([]);

  // Build PDF URL early so it can be used in effects
  const pdfUrl = resource.storageFileId 
    ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${resource.storageFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
    : null;

  console.log('[StudyInterface] Resource loaded:', {
    fileName: resource.fileName,
    storageFileId: resource.storageFileId,
    pageCount: resource.pageCount,
    hasExtractedText: !!resource.extractedText,
    extractedTextLength: resource.extractedText?.length || 0,
    pdfUrl: !!pdfUrl,
  });

  useEffect(() => {
    // Parse bookmarks
    try {
      const parsed = JSON.parse(resource.bookmarks || '[]');
      setBookmarks(parsed);
    } catch (e) {
      setBookmarks([]);
    }
  }, [resource]);

  // If extractedText is missing, extract it live from the PDF URL
  useEffect(() => {
    if (!resource.extractedText && pdfUrl) {
      setExtracting(true);
      setExtractionProgress('Starting extraction…');
      fetch(pdfUrl)
        .then(r => r.arrayBuffer())
        .then(arrayBuffer => {
          return extractText(arrayBuffer, {
            processImage,
            onProgress: ({ pageNum, totalPages }) => {
              const pct = totalPages ? Math.round((pageNum / totalPages) * 100) : 0;
              setExtractionPct(pct);
              setExtractionProgress(
                totalPages
                  ? `Extracting page ${pageNum} of ${totalPages}…`
                  : 'Extracting…'
              );
            },
          });
        })
        .then(text => {
          if (text && text.length > 50) {
            setLiveExtractedText(text);
          }
        })
        .catch(err => {
          console.warn('[StudyInterface] Live extraction failed:', err.message);
          setExtractionError(err.message || 'Unknown error');
        })
        .finally(() => {
          setExtracting(false);
          setExtractionProgress('');
          setExtractionPct(0);
        });
    }
  }, [resource.$id, pdfUrl]);

  useEffect(() => {
    loadPageNotes();
    // Load highlights for current page only (all highlights loaded on mount)
  }, [pageNumber, resource.$id]);

  // Load ALL highlights when PDF opens
  useEffect(() => {
    const loadAllHighlights = async () => {
      try {
        const allHighlights = await getPDFHighlights(resource.$id);
        console.log(`[StudyInterface] Loaded ${allHighlights.length} total highlights for PDF:`, allHighlights);
        const formattedHighlights = allHighlights.map(h => ({
          id: h.$id,
          page: h.pageNumber,
          text: h.highlightedText,
          color: h.color,
          rect: h.position && h.position !== '{}' ? (() => {
            try {
              const parsed = JSON.parse(h.position);
              return parsed;
            } catch { 
              console.warn(`[StudyInterface] Failed to parse position for highlight ${h.$id}`);
              return null; 
            }
          })() : null,
          timestamp: h.createdAt,
          saved: true
        }));
        setSavedHighlights(formattedHighlights);
        console.log(`[StudyInterface] Set ${formattedHighlights.length} highlights in state`);
      } catch (error) {
        console.error('Failed to load all highlights:', error);
      }
    };
    loadAllHighlights();
  }, [resource.$id]);

  // Capture text selection from PDF viewer
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 2) {
        setSelectedText(text);
        try {
          const range = selection.getRangeAt(0);
          // Only show Ask AI tip if selection is inside the PDF viewer
          const isInPDF = pdfViewerRef.current?.contains(range.commonAncestorContainer);
          if (isInPDF) {
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const rawX = rect.left - containerRect.left + rect.width / 2;
              const rawY = rect.top - containerRect.top - TOOLTIP_OFFSET_ABOVE;
              const flipped = rawY < 8;
              setSelectionTip({
                x: clampTooltipX(rawX, window.innerWidth),
                y: flipped ? rect.bottom - containerRect.top + 8 : rawY,
                text
              });
            }
          } else {
            setSelectionTip(null);
          }
        } catch (e) {}

        // Auto-save highlight when highlight mode is active and selection is inside PDF viewer
        if (highlightMode && pdfViewerRef.current) {
          try {
            const range = selection.getRangeAt(0);
            if (pdfViewerRef.current.contains(range.commonAncestorContainer)) {
              // Small delay to let the selection settle
              setTimeout(() => saveHighlight(), 50);
            }
          } catch (e) {}
        }
      } else if (!text) {
        setSelectionTip(null);
      }
    };

    // Handle mobile resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  const loadPageNotes = async () => {
    try {
      const notes = await getPageNotes(resource.$id, pageNumber);
      setPageNotes(notes);
    } catch (error) {
      console.error('Failed to load page notes:', error);
    }
  };

  const onDocumentLoadSuccess = async ({ numPages, _pdfInfo }) => {
    setNumPages(numPages);
    setLoading(false);
    // Detect scanned PDF: check if first page has any text content
    try {
      const page = await _pdfInfo?.getPage?.(1);
      if (page) {
        const textContent = await page.getTextContent();
        setIsScannedPDF(!textContent?.items?.length);
      }
    } catch (e) {
      // Can't detect, assume text-based
    }
  };

  // Flag to suppress IntersectionObserver during programmatic scrolls
  const isProgrammaticScrollRef = useRef(false);

  const goToPage = async (page) => {
    if (page >= 1 && page <= numPages) {
      // Suppress observer during programmatic scroll to prevent fighting
      isProgrammaticScrollRef.current = true;
      setPageNumber(page);
      pageNumberRef.current = page;
      const el = pdfViewerRef.current?.querySelector(`[data-page-number="${page}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Re-enable observer after scroll animation completes (~600ms)
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 600);
      await updatePDFProgress(resource.$id, page);
    }
  };

  const changePage = (offset) => {
    goToPage(pageNumber + offset);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.0);

  const toggleBookmark = async () => {
    const isBookmarked = bookmarks.some(b => b.page === pageNumber);
    try {
      if (isBookmarked) {
        await removePDFBookmark(resource.$id, pageNumber);
        setBookmarks(bookmarks.filter(b => b.page !== pageNumber));
      } else {
        const title = `Page ${pageNumber}`;
        await addPDFBookmark(resource.$id, pageNumber, title);
        setBookmarks([...bookmarks, { page: pageNumber, title, timestamp: new Date().toISOString() }]);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Rubber-band selection state for highlight mode
  const [dragRect, setDragRect] = useState(null); // { x, y, w, h } in px relative to pdfViewerRef
  const dragStartRef = useRef(null); // { x, y, pageEl, pageNum }

  // Mouse handlers for rubber-band selection in highlight mode
  const handlePDFMouseDown = (e) => {
    if (!highlightMode) return;
    // Only left button, not on toolbar buttons
    if (e.button !== 0) return;
    e.preventDefault();
    const viewerRect = pdfViewerRef.current?.getBoundingClientRect();
    if (!viewerRect) return;
    const x = e.clientX - viewerRect.left + pdfViewerRef.current.scrollLeft;
    const y = e.clientY - viewerRect.top  + pdfViewerRef.current.scrollTop;
    dragStartRef.current = { x, y };
    setDragRect({ x, y, w: 0, h: 0 });
  };

  const handlePDFMouseMove = (e) => {
    if (!highlightMode || !dragStartRef.current) return;
    const viewerRect = pdfViewerRef.current?.getBoundingClientRect();
    if (!viewerRect) return;
    const curX = e.clientX - viewerRect.left + pdfViewerRef.current.scrollLeft;
    const curY = e.clientY - viewerRect.top  + pdfViewerRef.current.scrollTop;
    const { x: sx, y: sy } = dragStartRef.current;
    setDragRect({
      x: Math.min(sx, curX),
      y: Math.min(sy, curY),
      w: Math.abs(curX - sx),
      h: Math.abs(curY - sy),
    });
  };

  const handlePDFMouseUp = (e) => {
    if (!highlightMode || !dragStartRef.current || !dragRect) {
      dragStartRef.current = null;
      setDragRect(null);
      return;
    }
    const finalRect = dragRect;
    dragStartRef.current = null;
    setDragRect(null);

    // Minimum drag size to count as intentional
    if (finalRect.w < 5 || finalRect.h < 5) return;

    // Find which page wrapper the drag rect overlaps
    const pageWrappers = pdfViewerRef.current?.querySelectorAll('.pdf-page-wrapper') || [];
    let capturedPage = pageNumber;
    let pageRelRect = null;

    for (const wrapper of pageWrappers) {
      const viewerRect = pdfViewerRef.current.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      // Convert wrapper rect to scroll-adjusted viewer-relative coords
      const wTop  = wrapperRect.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
      const wLeft = wrapperRect.left - viewerRect.left + pdfViewerRef.current.scrollLeft;
      const wBot  = wTop  + wrapperRect.height;
      const wRight = wLeft + wrapperRect.width;

      // Check overlap
      const overlapTop  = Math.max(finalRect.y, wTop);
      const overlapLeft = Math.max(finalRect.x, wLeft);
      const overlapBot  = Math.min(finalRect.y + finalRect.h, wBot);
      const overlapRight = Math.min(finalRect.x + finalRect.w, wRight);

      if (overlapBot > overlapTop && overlapRight > overlapLeft) {
        capturedPage = parseInt(wrapper.dataset.pageNumber) || pageNumber;

        // Calculate percentages relative to the CANVAS element, not the wrapper,
        // so the overlay stays aligned regardless of wrapper padding/min-height
        const canvas = wrapper.querySelector('canvas');
        const refEl = canvas || wrapper;
        const refRect = refEl.getBoundingClientRect();
        const refTop  = refRect.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
        const refLeft = refRect.left - viewerRect.left + pdfViewerRef.current.scrollLeft;

        pageRelRect = {
          topPct:    ((overlapTop  - refTop)  / refRect.height) * 100,
          leftPct:   ((overlapLeft - refLeft) / refRect.width)  * 100,
          widthPct:  ((overlapRight - overlapLeft) / refRect.width)  * 100,
          heightPct: ((overlapBot  - overlapTop)   / refRect.height) * 100,
        };
        break;
      }
    }

    if (!pageRelRect) return;

    // Extract text from spans that fall within the drag rectangle
    const pageWrapper = pdfViewerRef.current?.querySelector(`[data-page-number="${capturedPage}"]`);
    const spans = pageWrapper?.querySelectorAll('.react-pdf__Page__textContent span') || [];
    const viewerRect = pdfViewerRef.current.getBoundingClientRect();
    const selectedSpans = [];

    spans.forEach(span => {
      const sr = span.getBoundingClientRect();
      const spanTop  = sr.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
      const spanLeft = sr.left - viewerRect.left + pdfViewerRef.current.scrollLeft;
      const spanBot  = spanTop  + sr.height;
      const spanRight = spanLeft + sr.width;

      // Check if span overlaps the drag rect
      if (
        spanBot  > finalRect.y &&
        spanTop  < finalRect.y + finalRect.h &&
        spanRight > finalRect.x &&
        spanLeft  < finalRect.x + finalRect.w
      ) {
        selectedSpans.push(span.textContent || '');
      }
    });

    const highlightedText = selectedSpans.join(' ').trim().replace(/\s+/g, ' ');
    if (!highlightedText) return;

    // Save the highlight
    const highlight = {
      id: `highlight-${Date.now()}`,
      page: capturedPage,
      text: highlightedText,
      color: highlightColor,
      rect: pageRelRect,
      timestamp: new Date().toISOString(),
      saved: false,
    };

    setSavedHighlights(prev => [...prev, highlight]);

    createPDFHighlight(
      resource.userId,
      resource.$id,
      capturedPage,
      highlightedText,
      pageRelRect,
      highlightColor
    ).then(savedHighlight => {
      if (savedHighlight) {
        setSavedHighlights(prev => prev.map(h =>
          h.id === highlight.id
            ? { ...h, id: savedHighlight.$id, saved: true, rect: h.rect || pageRelRect }
            : h
        ));
      }
    }).catch(err => console.error('Failed to save highlight:', err));
  };

  const highlightColorMap = {
    yellow: '#ffeb3b',
    green:  '#4caf50',
    blue:   '#2196f3',
    pink:   '#e91e63',
    orange: '#ff9800',
    purple: '#9c27b0',
  };

  // Touch handlers for mobile/tablet highlight support
  const handlePDFTouchStart = (e) => {
    if (!highlightMode) return;
    if (e.touches.length !== 1) return; // Only single touch
    e.preventDefault();
    const touch = e.touches[0];
    const viewerRect = pdfViewerRef.current?.getBoundingClientRect();
    if (!viewerRect) return;
    const x = touch.clientX - viewerRect.left + pdfViewerRef.current.scrollLeft;
    const y = touch.clientY - viewerRect.top  + pdfViewerRef.current.scrollTop;
    dragStartRef.current = { x, y };
    setDragRect({ x, y, w: 0, h: 0 });
  };

  const handlePDFTouchMove = (e) => {
    if (!highlightMode || !dragStartRef.current) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const viewerRect = pdfViewerRef.current?.getBoundingClientRect();
    if (!viewerRect) return;
    const curX = touch.clientX - viewerRect.left + pdfViewerRef.current.scrollLeft;
    const curY = touch.clientY - viewerRect.top  + pdfViewerRef.current.scrollTop;
    const { x: sx, y: sy } = dragStartRef.current;
    setDragRect({
      x: Math.min(sx, curX),
      y: Math.min(sy, curY),
      w: Math.abs(curX - sx),
      h: Math.abs(curY - sy),
    });
  };

  const handlePDFTouchEnd = (e) => {
    // Reuse the same logic as mouse up
    if (!highlightMode || !dragStartRef.current || !dragRect) {
      dragStartRef.current = null;
      setDragRect(null);
      return;
    }
    const finalRect = dragRect;
    dragStartRef.current = null;
    setDragRect(null);

    // Minimum drag size to count as intentional
    if (finalRect.w < 5 || finalRect.h < 5) return;

    // Find which page wrapper the drag rect overlaps
    const pageWrappers = pdfViewerRef.current?.querySelectorAll('.pdf-page-wrapper') || [];
    let capturedPage = pageNumber;
    let pageRelRect = null;

    for (const wrapper of pageWrappers) {
      const viewerRect = pdfViewerRef.current.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const wTop  = wrapperRect.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
      const wLeft = wrapperRect.left - viewerRect.left + pdfViewerRef.current.scrollLeft;
      const wBot  = wTop  + wrapperRect.height;
      const wRight = wLeft + wrapperRect.width;

      const overlapTop  = Math.max(finalRect.y, wTop);
      const overlapLeft = Math.max(finalRect.x, wLeft);
      const overlapBot  = Math.min(finalRect.y + finalRect.h, wBot);
      const overlapRight = Math.min(finalRect.x + finalRect.w, wRight);

      if (overlapBot > overlapTop && overlapRight > overlapLeft) {
        capturedPage = parseInt(wrapper.dataset.pageNumber) || pageNumber;

        const canvas = wrapper.querySelector('canvas');
        const refEl = canvas || wrapper;
        const refRect = refEl.getBoundingClientRect();
        const refTop  = refRect.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
        const refLeft = refRect.left - viewerRect.left + pdfViewerRef.current.scrollLeft;

        pageRelRect = {
          topPct:    ((overlapTop  - refTop)  / refRect.height) * 100,
          leftPct:   ((overlapLeft - refLeft) / refRect.width)  * 100,
          widthPct:  ((overlapRight - overlapLeft) / refRect.width)  * 100,
          heightPct: ((overlapBot  - overlapTop)   / refRect.height) * 100,
        };
        break;
      }
    }

    if (!pageRelRect) return;

    // Extract text from spans
    const pageWrapper = pdfViewerRef.current?.querySelector(`[data-page-number="${capturedPage}"]`);
    const spans = pageWrapper?.querySelectorAll('.react-pdf__Page__textContent span') || [];
    const viewerRect = pdfViewerRef.current.getBoundingClientRect();
    const selectedSpans = [];

    spans.forEach(span => {
      const sr = span.getBoundingClientRect();
      const spanTop  = sr.top  - viewerRect.top  + pdfViewerRef.current.scrollTop;
      const spanLeft = sr.left - viewerRect.left + pdfViewerRef.current.scrollLeft;
      const spanBot  = spanTop  + sr.height;
      const spanRight = spanLeft + sr.width;

      if (
        spanBot  > finalRect.y &&
        spanTop  < finalRect.y + finalRect.h &&
        spanRight > finalRect.x &&
        spanLeft  < finalRect.x + finalRect.w
      ) {
        selectedSpans.push(span.textContent || '');
      }
    });

    const highlightedText = selectedSpans.join(' ').trim().replace(/\s+/g, ' ');
    if (!highlightedText) return;

    // Save the highlight
    const highlight = {
      id: `highlight-${Date.now()}`,
      page: capturedPage,
      text: highlightedText,
      color: highlightColor,
      rect: pageRelRect,
      timestamp: new Date().toISOString(),
      saved: false,
    };

    setSavedHighlights(prev => [...prev, highlight]);

    createPDFHighlight(
      resource.userId,
      resource.$id,
      capturedPage,
      highlightedText,
      pageRelRect,
      highlightColor
    ).then(savedHighlight => {
      if (savedHighlight) {
        setSavedHighlights(prev => prev.map(h =>
          h.id === highlight.id
            ? { ...h, id: savedHighlight.$id, saved: true, rect: h.rect || pageRelRect }
            : h
        ));
      }
    }).catch(err => console.error('Failed to save highlight:', err));
  };

  // Keep saveHighlight as manual fallback (💾 button)
  const saveHighlight = async () => {
    // Manual save is now handled by the rubber-band drag (handlePDFMouseUp)
    // This button is kept as a no-op fallback
  };

  const removeHighlight = async (highlightId) => {
    setSavedHighlights(savedHighlights.filter(h => h.id !== highlightId));
    try {
      await deletePDFHighlight(highlightId);
    } catch (error) {
      console.error('Failed to remove highlight:', error);
    }
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: '#ffeb3b' },
    { name: 'Green', value: 'green', color: '#4caf50' },
    { name: 'Blue', value: 'blue', color: '#2196f3' },
    { name: 'Pink', value: 'pink', color: '#e91e63' },
    { name: 'Orange', value: 'orange', color: '#ff9800' },
    { name: 'Purple', value: 'purple', color: '#9c27b0' }
  ];

  // Handle resize
  const startResize = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const raw = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clamped = Math.min(80, Math.max(20, raw));
      setPdfWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setPdfWidth(prev => {
        const snapped = snapRatio(prev);
        localStorage.setItem('study-split-ratio', String(snapped));
        return snapped;
      });
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Keyboard shortcuts: Alt+[ / Alt+] to cycle through preset split ratios
  useEffect(() => {
    if (isMobile) return; // No shortcuts on mobile (no split layout)

    const handleKeyDown = (e) => {
      if (!e.altKey) return;
      if (e.key !== '[' && e.key !== ']') return;
      e.preventDefault();

      setPdfWidth(prev => {
        const currentIndex = PRESETS.indexOf(snapRatio(prev));
        const base = currentIndex === -1 ? 1 : currentIndex; // default to middle (50%)
        const nextIndex = e.key === '['
          ? (base - 1 + PRESETS.length) % PRESETS.length
          : (base + 1) % PRESETS.length;
        const next = PRESETS[nextIndex];
        localStorage.setItem('study-split-ratio', String(next));
        return next;
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  // Swipe gesture to switch between PDF and Chat tabs on mobile
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = (e) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Require |dx| >= 50 and |dx|/|dy| > 1.5 (more horizontal than vertical)
      if (Math.abs(dx) < 50) return;
      if (Math.abs(dy) > 0 && Math.abs(dx) / Math.abs(dy) <= 1.5) return;

      if (dx < 0) {
        setMobileTab('chat'); // swipe left → show chat
      } else {
        setMobileTab('pdf');  // swipe right → show pdf
      }
    };

    const el = containerRef.current;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  // Track the PDF viewer container width so <Page> can fill it correctly
  useEffect(() => {
    if (!pdfViewerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Subtract padding (2 × 24px = 48px)
        const w = entry.contentRect.width - 48;
        if (w > 0) setPdfViewerWidth(w);
      }
    });
    observer.observe(pdfViewerRef.current);
    return () => observer.disconnect();
  }, []);

  // IntersectionObserver: update pageNumber as user scrolls through pages
  // Uses a ref for pageNumber to avoid re-creating the observer on every page change
  const pageNumberRef = useRef(pageNumber);
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

  useEffect(() => {
    if (!pdfViewerRef.current || !numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Build a map of all currently-visible pages with their ratios
        entries.forEach(entry => {
          const pg = parseInt(entry.target.dataset.pageNumber);
          if (!isNaN(pg)) {
            entry.target._visibilityRatio = entry.intersectionRatio;
          }
        });

        // Find the page with the highest visibility ratio among ALL observed pages
        const allWrappers = pdfViewerRef.current?.querySelectorAll('.pdf-page-wrapper') || [];
        let maxRatio = 0;
        let visiblePage = null;
        allWrappers.forEach(el => {
          const ratio = el._visibilityRatio ?? 0;
          const pg = parseInt(el.dataset.pageNumber);
          if (ratio > maxRatio && !isNaN(pg)) {
            maxRatio = ratio;
            visiblePage = pg;
          }
        });

        if (visiblePage && visiblePage !== pageNumberRef.current && maxRatio > 0.1) {
          // Don't fight programmatic scrolls (goToPage)
          if (isProgrammaticScrollRef.current) return;
          pageNumberRef.current = visiblePage;
          setPageNumber(visiblePage);
          // Debounce the Appwrite progress save
          if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
          progressTimerRef.current = setTimeout(() => {
            updatePDFProgress(resource.$id, visiblePage);
          }, 1500);
        }
      },
      {
        root: pdfViewerRef.current,
        // Use multiple thresholds for smoother detection
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
      }
    );

    const pages = pdfViewerRef.current.querySelectorAll('.pdf-page-wrapper');
    pages.forEach(p => {
      p._visibilityRatio = 0;
      observer.observe(p);
    });

    return () => {
      observer.disconnect();
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
    // Only re-create observer when numPages changes (not on every pageNumber change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, resource.$id]);

  // Load TOC from PDF outline
  useEffect(() => {
    if (!pdfUrl || !numPages) return;
    const loadTOC = async () => {
      try {
        const { pdfjs: pdfjsLib } = await import('react-pdf');
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();
        if (outline && outline.length > 0) {
          const flatItems = [];
          const flatten = async (items, depth = 0) => {
            for (const item of items) {
              let pageNum = null;
              try {
                if (item.dest) {
                  const dest = typeof item.dest === 'string'
                    ? await pdf.getDestination(item.dest)
                    : item.dest;
                  if (dest) {
                    const ref = dest[0];
                    pageNum = await pdf.getPageIndex(ref) + 1;
                  }
                }
              } catch (e) {}
              flatItems.push({ title: item.title, page: pageNum, depth });
              if (item.items?.length) await flatten(item.items, depth + 1);
            }
          };
          await flatten(outline);
          setTocItems(flatItems);
        }
      } catch (e) {
        console.warn('[StudyInterface] Could not load TOC:', e.message);
      }
    };
    loadTOC();
  }, [pdfUrl, numPages]);

  // Keyboard navigation: arrow keys / Page Up / Page Down
  useEffect(() => {
    const handleKeyNav = (e) => {
      // Don't intercept when typing in inputs/textareas
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      // Don't intercept Alt+[ / Alt+] (handled by split ratio effect)
      if (e.altKey) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        changePage(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        changePage(-1);
      }
    };

    document.addEventListener('keydown', handleKeyNav);
    return () => document.removeEventListener('keydown', handleKeyNav);
  }, [pageNumber, numPages]); // depends on pageNumber/numPages via changePage closure

  const isBookmarked = bookmarks.some(b => b.page === pageNumber);

  // Only show text-only view if PDF viewer truly cannot load
  // (no pdfUrl or no numPages after attempting to load)
  const shouldShowTextOnly = !pdfUrl || (loading === false && !numPages);

  if (shouldShowTextOnly) {
    // File cannot be previewed directly, but extracted text is available.
    // Show a text-only study interface instead of a broken PDF viewer.
    const hasExtractedText = resource.extractedText && resource.extractedText.length > 50;
    return (
      <div className="study-interface">
        <div className="study-error">
          <h3>📄 {resource.fileName}</h3>
          {hasExtractedText ? (
            <>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                The PDF preview is unavailable, but the full text has been extracted and the AI can answer questions about it.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Use the chat on the right to ask questions about the content. The AI has access to all extracted text.
              </p>
            </>
          ) : (
            <p>This file could not be stored or previewed. Please re-upload a smaller version (under 10 MB).</p>
          )}
          <button onClick={onClose} className="btn-primary" style={{ marginTop: '1.5rem' }}>Close</button>
        </div>
      </div>
    );
  }

  // Ask AI about selected text - fires immediately
  const handleAskAI = (text) => {
    if (!text?.trim()) return;
    setSelectionTip(null);
    window.getSelection()?.removeAllRanges();
    const question = `From PDF (page ${pageNumber}): "${text}"`;
    handleSendWithContext(question);
    if (isMobile) setMobileTab('chat');
  };

  // Handle sending message with full resource context
  const handleSendWithContext = async (userMessage, aiContextMessage = null, fileAttachment = null) => {
    if (isMobile) setMobileTab('chat');

    const pageHighlights = savedHighlights.filter(h => h.page === pageNumber);
    const highlightsText = pageHighlights.length > 0 
      ? `\nHighlights on page ${pageNumber}:\n${pageHighlights.map((h, i) => `${i + 1}. "${h.text}"`).join('\n')}`
      : '';
    
    const notesText = pageNotes.length > 0
      ? `\nNotes on page ${pageNumber}:\n${pageNotes.map((n, i) => `${i + 1}. ${n.noteText}`).join('\n')}`
      : '';

    const selectionText = selectedText
      ? `\nUser selected this text: "${selectedText}"\n`
      : '';

    const pageRequest = (aiContextMessage || userMessage).match(/page\s+(\d+)/i);
    if (pageRequest) {
      const requestedPage = parseInt(pageRequest[1]);
      if (requestedPage >= 1 && requestedPage <= numPages) {
        goToPage(requestedPage);
      }
    }

    const extractedText = resource.extractedText || liveExtractedText;

    if (!extractedText || extractedText.length < 50) {
      const noTextMessage = `I can see you have "${resource.fileName}" open, but the text content is not available. This could be because:

1. The PDF is a scanned image (not searchable text)
2. Text extraction is still in progress (wait a moment and try again)
3. The PDF failed to extract during upload

To fix this:
- If it's a scanned PDF, you'll need to use OCR software first
- Try closing and reopening the PDF
- Or re-upload the PDF to trigger extraction again

For now, I can only help with general questions about the PDF structure, but cannot answer specific content questions.`;

      await onSendMessage(userMessage, `[NO PDF TEXT AVAILABLE]\n${noTextMessage}\n\nUser asked: ${userMessage}`);
      return;
    }

    let focusedContext = '';
    if (pageRequest && extractedText) {
      const requestedPage = parseInt(pageRequest[1]);
      const pagePattern = new RegExp(`=== PAGE ${requestedPage} ===([\\s\\S]*?)=== END PAGE ${requestedPage} ===`, 'i');
      const pageMatch = extractedText.match(pagePattern);
      if (pageMatch) {
        focusedContext = `\n\nREQUESTED PAGE ${requestedPage} CONTENT:\n${pageMatch[1].trim()}\n`;
      }
    }

    const resourceContext = extractedText
      ? `\n\n[LOCKED PDF CONTEXT - ONLY USE THIS PDF]
PDF Name: "${resource.fileName}"
Total Pages: ${numPages}
Current Page: ${pageNumber}

CRITICAL INSTRUCTION: You are viewing "${resource.fileName}". 
- If the user mentions ANY other PDF name, respond: "I can only access ${resource.fileName} which is currently open. To view other PDFs, please close this one and open the other from Resources."
- ONLY answer questions about "${resource.fileName}"
- DO NOT search for or reference other PDFs
- If asked to compare with another PDF, say: "I can see ${resource.fileName} is open. To compare with another PDF, you'll need to provide its content separately or reference it from your previous messages."

${focusedContext}

COMPLETE DOCUMENT TEXT:
${extractedText}`
      : '';

    const fullContext = `[STUDY MODE: Reading "${resource.fileName}", currently on page ${pageNumber}/${numPages || '?'}]${selectionText}${highlightsText}${notesText}${resourceContext}

User Question: ${aiContextMessage || userMessage}`;
    
    setSelectedText('');
    
    try {
      await onSendMessage(userMessage, fullContext, fileAttachment);
    } catch (error) {
      console.error('[StudyInterface] Error sending message:', error);
    }
  };

  return (
    <div className="study-interface" ref={containerRef}>
      {/* Floating Ask AI Tip */}
      {selectionTip && (
        <div
          className="ask-ai-tip"
          style={{ left: selectionTip.x, top: selectionTip.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="ask-ai-btn"
            onClick={() => handleAskAI(selectionTip.text)}
          >
            ✨ Ask AI
          </button>
          <button
            className="ask-ai-dismiss"
            onClick={() => { setSelectionTip(null); window.getSelection()?.removeAllRanges(); }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="study-header">
        <div className="study-title">
          <span className="study-icon">📚</span>
          <h3>{resource.fileName}</h3>
          <span className="study-page-info">Page {pageNumber} of {numPages || '?'}</span>
        </div>
        
        {/* Mobile tab switcher */}
        {isMobile && (
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${mobileTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setMobileTab('pdf')}
            >
              📄 PDF
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'chat' ? 'active' : ''}`}
              onClick={() => setMobileTab('chat')}
            >
              💬 Chat
            </button>
          </div>
        )}

        <div className="study-actions">
          {!isMobile && (
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-icon"
              title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            >
              {showSidebar ? '◧' : '◨'}
            </button>
          )}
          <button 
            onClick={onClose}
            className="btn-icon btn-close"
            title="Close study mode"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="study-content">
        {/* PDF Section */}
        <div
          className={`study-pdf-section ${isMobile && mobileTab !== 'pdf' ? 'pane-hidden' : ''} ${extracting ? 'is-extracting' : ''}`}
          style={{ width: isMobile ? '100%' : `${pdfWidth}%` }}
        >
          {/* Reading progress bar */}
          {numPages && (
            <div className="reading-progress-bar-wrap">
              <div
                className="reading-progress-bar"
                style={{ width: `${Math.round((pageNumber / numPages) * 100)}%` }}
              />
            </div>
          )}

          {/* Extraction progress bar — non-blocking, sits above toolbar */}
          {extracting && (
            <div className="extraction-progress-bar-wrap">
              <div
                className="extraction-progress-bar"
                style={{ width: `${extractionPct}%` }}
              />
            </div>
          )}
          {extracting && extractionProgress && (
            <div className="extraction-caption">{extractionProgress}</div>
          )}

          {/* Inline extraction error — replaces alert() */}
          {extractionError && (
            <div className="extraction-error">
              <span>⚠️ Text extraction failed. AI answers may be limited.</span>
              <button
                className="extraction-error-dismiss"
                onClick={() => setExtractionError(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* PDF Toolbar */}
          <div className="pdf-toolbar">
            <div className="toolbar-group">
              <button onClick={handleZoomOut} className="btn-toolbar">−</button>
              <span className="zoom-level-small">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} className="btn-toolbar">+</button>
            </div>

            <div className="toolbar-group">
              <button 
                onClick={toggleBookmark}
                className={`btn-toolbar ${isBookmarked ? 'active' : ''}`}
                title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? '⭐' : '☆'}
              </button>
              
              <button 
                onClick={() => setHighlightMode(!highlightMode)}
                className={`btn-toolbar ${highlightMode ? 'active' : ''}`}
                title="Highlight mode"
              >
                🖍️
              </button>
              
              {highlightMode && (
                <>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="btn-toolbar btn-color"
                    style={{ backgroundColor: highlightColors.find(c => c.value === highlightColor)?.color }}
                  >
                    🎨
                  </button>
                  
                  <button
                    onClick={saveHighlight}
                    className="btn-toolbar"
                    title="Save highlight"
                  >
                    💾
                  </button>
                  
                  {showColorPicker && (
                    <div className="color-picker-mini">
                      {highlightColors.map((color) => (
                        <button
                          key={color.value}
                          className={`color-btn ${highlightColor === color.value ? 'active' : ''}`}
                          style={{ backgroundColor: color.color }}
                          onClick={() => {
                            setHighlightColor(color.value);
                            setShowColorPicker(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className={`btn-toolbar ${showNotes ? 'active' : ''}`}
                title="Notes"
              >
                📝 {pageNotes.length > 0 && `(${pageNotes.length})`}
              </button>

              {isMobile && (bookmarks.length > 0 || savedHighlights.length > 0) && (
                <button 
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`btn-toolbar ${showSidebar ? 'active' : ''}`}
                  title="View bookmarks & highlights"
                >
                  📑 {bookmarks.length + savedHighlights.length}
                </button>
              )}

              {tocItems.length > 0 && (
                <button
                  onClick={() => setShowTOC(!showTOC)}
                  className={`btn-toolbar ${showTOC ? 'active' : ''}`}
                  title="Table of contents"
                >
                  ☰
                </button>
              )}
            </div>
          </div>

          {/* PDF section body: TOC panel + viewer + sidebar */}
          <div className="pdf-section-body">
            {/* Table of Contents panel */}
            {showTOC && tocItems.length > 0 && (
              <div className="pdf-toc-panel">
                <div className="pdf-toc-header">
                  <span>Contents</span>
                  <button className="mini-remove-btn" onClick={() => setShowTOC(false)}>✕</button>
                </div>
                <div className="pdf-toc-list">
                  {tocItems.map((item, i) => (
                    <button
                      key={i}
                      className={`pdf-toc-item ${item.page === pageNumber ? 'active' : ''}`}
                      style={{ paddingLeft: `${8 + item.depth * 12}px` }}
                      onClick={() => item.page && goToPage(item.page)}
                      disabled={!item.page}
                      title={item.page ? `Go to page ${item.page}` : item.title}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Viewer */}
            <div
              className={`pdf-viewer-area ${highlightMode ? 'highlight-mode' : ''}`}
              ref={pdfViewerRef}
              onMouseDown={handlePDFMouseDown}
              onMouseMove={handlePDFMouseMove}
              onMouseUp={handlePDFMouseUp}
              onTouchStart={handlePDFTouchStart}
              onTouchMove={handlePDFTouchMove}
              onTouchEnd={handlePDFTouchEnd}
              onMouseLeave={() => { dragStartRef.current = null; setDragRect(null); }}
              onTouchCancel={() => { dragStartRef.current = null; setDragRect(null); }}
            >
              {loading && (
                <div className="pdf-loading-small">
                  <div className="spinner"></div>
                  <p>Loading PDF...</p>
                </div>
              )}
              
              {highlightMode && (
                <div className="highlight-hint">
                  🖍️ Highlight mode — select text to highlight, or click ✨ Ask AI
                </div>
              )}

              {!loading && numPages && savedHighlights.length > 0 && (
                <button
                  className="clear-highlights-btn"
                  onClick={() => setSavedHighlights([])}
                  title="Clear all highlights from view"
                >
                  🗑️ Clear highlights
                </button>
              )}

              {isScannedPDF && !loading && (
                <div className="scanned-pdf-warning">
                  ⚠️ This PDF may not support text selection. Try uploading a text-based PDF for best results.
                </div>
              )}
              
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="pdf-loading-small"><div className="spinner"></div></div>}
                error={<div className="pdf-error-small">Failed to load PDF</div>}
              >
                {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                  <div
                    key={n}
                    data-page-number={n}
                    className="pdf-page-wrapper"
                  >
                    <Page
                      pageNumber={n}
                      width={pdfViewerWidth ? pdfViewerWidth * scale : undefined}
                      scale={pdfViewerWidth ? 1 : scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                    {/* Highlight overlay — positioned relative to the canvas */}
                    <div className="pdf-highlight-overlay-layer">
                      {savedHighlights
                        .filter(h => h.page === n && h.rect)
                        .map(h => (
                          <div
                            key={h.id}
                            className="pdf-highlight-mark"
                            style={{
                              top:    `${h.rect.topPct}%`,
                              left:   `${h.rect.leftPct}%`,
                              width:  `${h.rect.widthPct}%`,
                              height: `${h.rect.heightPct}%`,
                              backgroundColor: highlightColorMap[h.color] || highlightColorMap.yellow,
                            }}
                            title={h.text}
                            onClick={() => {
                              if (isMobile && (bookmarks.length > 0 || savedHighlights.length > 0)) {
                                setShowSidebar(true);
                              }
                            }}
                          />
                        ))
                      }
                    </div>
                  </div>
                ))}
              </Document>

              {/* Floating page navigation — bottom center of PDF area */}
              {numPages && (
                <div className="pdf-float-nav">
                  <button
                    className="pdf-float-btn"
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    title="Previous page"
                  >
                    ‹
                  </button>
                  <span className="pdf-float-page">
                    {pageNumber} / {numPages}
                  </span>
                  <button
                    className="pdf-float-btn"
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    title="Next page"
                  >
                    ›
                  </button>
                </div>
              )}

              {/* Rubber-band selection rectangle shown during drag in highlight mode */}
              {highlightMode && dragRect && dragRect.w > 3 && dragRect.h > 3 && (
                <div
                  className="pdf-selection-rect"
                  style={{
                    top:    dragRect.y,
                    left:   dragRect.x,
                    width:  dragRect.w,
                    height: dragRect.h,
                  }}
                />
              )}
            </div>

            {/* Sidebar for Bookmarks & Highlights */}
            {showSidebar && (
              <>
                {/* Backdrop for mobile sidebar */}
                {isMobile && (bookmarks.length > 0 || savedHighlights.length > 0) && (
                  <div 
                    className="sidebar-backdrop"
                    onClick={() => setShowSidebar(false)}
                  />
                )}
                
                <div className={`pdf-mini-sidebar ${(bookmarks.length === 0 && savedHighlights.length === 0) ? 'empty' : ''}`}>
                  {/* Close button for mobile */}
                  {isMobile && (
                    <button 
                      className="sidebar-close-mobile"
                      onClick={() => setShowSidebar(false)}
                      title="Close"
                    >
                      ✕
                    </button>
                  )}

                  {bookmarks.length > 0 && (
                    <div className="mini-sidebar-section">
                      <h5>📑 Bookmarks</h5>
                      {bookmarks.map((bookmark, index) => (
                        <div 
                          key={index}
                          className={`mini-bookmark ${bookmark.page === pageNumber ? 'active' : ''}`}
                          onClick={() => {
                            goToPage(bookmark.page);
                            if (isMobile) setShowSidebar(false);
                          }}
                        >
                          <span>p.{bookmark.page}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {savedHighlights.length > 0 && (
                    <div className="mini-sidebar-section">
                      <h5>🖍️ Highlights ({savedHighlights.length})</h5>
                      {savedHighlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="mini-highlight"
                          style={{
                            cursor: 'pointer',
                            opacity: highlight.page === pageNumber ? 1 : 0.6,
                          }}
                          onClick={() => {
                            goToPage(highlight.page);
                            if (isMobile) setShowSidebar(false);
                          }}
                          title={`Page ${highlight.page} — click to jump`}
                        >
                          <div
                            className="mini-highlight-color"
                            style={{ backgroundColor: highlightColorMap[highlight.color] || highlightColorMap.yellow }}
                          />
                          <div className="mini-highlight-text">
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>p.{highlight.page}</span>
                            {highlight.text.substring(0, 45)}{highlight.text.length > 45 ? '…' : ''}
                          </div>
                          <button
                            className="mini-remove-btn"
                            onClick={(e) => { e.stopPropagation(); removeHighlight(highlight.id); }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookmarks.length === 0 && savedHighlights.length === 0 && (
                    <div className="mini-sidebar-section">
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '1rem', textAlign: 'center' }}>
                        No bookmarks or highlights yet. Use the toolbar to add them!
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className={`resize-handle ${isResizing ? 'is-resizing' : ''}`}
          onMouseDown={startResize}
          ref={resizeRef}
        >
          <div className="resize-grip"><span /><span /><span /></div>
        </div>

        {/* Chat Section */}
        <div
          className={`study-chat-section ${isMobile && mobileTab !== 'chat' ? 'pane-hidden' : ''}`}
          style={{ width: isMobile ? '100%' : `${100 - pdfWidth}%` }}
        >
          <div className="chat-context-banner">
            <div className="context-main">
              💬 Page {pageNumber} • {resource.fileName}
            </div>
            <div className="context-details">
              {selectedText && (
                <span className="context-badge context-selection" title={selectedText}>
                  <span className="selection-text">✏️ "{selectedText.substring(0, 60)}{selectedText.length > 60 ? '…' : ''}"</span>
                  <button 
                    className="clear-selection-btn"
                    onClick={() => setSelectedText('')}
                  >✕</button>
                </span>
              )}
              {savedHighlights.filter(h => h.page === pageNumber).length > 0 && (
                <span className="context-badge">
                  🖍️ {savedHighlights.filter(h => h.page === pageNumber).length} highlight{savedHighlights.filter(h => h.page === pageNumber).length > 1 ? 's' : ''}
                </span>
              )}
              {pageNotes.length > 0 && (
                <span className="context-badge">
                  📝 {pageNotes.length} note{pageNotes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="quick-study-actions">
              <button 
                className="quick-study-btn"
                onClick={() => handleSendWithContext("Explain the key concepts on this page")}
                disabled={isLoading}
              >
                Explain page {pageNumber}
              </button>
              {selectedText && (
                <button 
                  className="quick-study-btn highlight-btn"
                  onClick={() => handleSendWithContext(`Explain this: "${selectedText}"`)}
                  disabled={isLoading}
                >
                  Explain selection
                </button>
              )}
              {savedHighlights.filter(h => h.page === pageNumber).length > 0 && (
                <button 
                  className="quick-study-btn"
                  onClick={() => handleSendWithContext("Explain my highlights on this page")}
                  disabled={isLoading}
                >
                  Explain highlights
                </button>
              )}
              <button 
                className="quick-study-btn"
                onClick={() => handleSendWithContext("Quiz me on this page")}
                disabled={isLoading}
              >
                Quiz me
              </button>
            </div>
          </div>
          <ChatInterface
            messages={messages}
            onSend={handleSendWithContext}
            isLoading={isLoading}
            mode={mode}
            userId={userId}
            sessionId={sessionId}
            subject={subject}
            insideStudyMode={true}
          />
        </div>
      </div>

      {/* Notes Editor Modal */}
      {showNotes && (
        <PDFNoteEditor
          pdfResource={resource}
          pageNumber={pageNumber}
          userId={userId}
          onClose={() => {
            setShowNotes(false);
            loadPageNotes();
          }}
        />
      )}
    </div>
  );
};

export default StudyInterface;
