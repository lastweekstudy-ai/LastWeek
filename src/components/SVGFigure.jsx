import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SVG } from '@svgdotjs/svg.js';

/**
 * SVGFigure — renders AI-generated SVG figures with smooth pan/zoom.
 *
 * Controls:
 *   Scroll wheel  — gentle zoom (8% per tick, clamped)
 *   Click + drag  — pan (1:1 pixel mapping)
 *   + / −         — zoom buttons (centered)
 *   ⊡ Fit         — reset to original view
 *   ↓ SVG         — download raw SVG
 *   Double-click  — reset view
 */
const SVGFigure = ({ svgContent, title }) => {
  const containerRef = useRef(null);
  const wrapperRef   = useRef(null);
  const drawRef      = useRef(null);
  const [error, setError]       = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart  = useRef({ x: 0, y: 0 });
  const viewBox   = useRef({ x: 0, y: 0, w: 600, h: 450 });
  const origVB    = useRef({ x: 0, y: 0, w: 600, h: 450 });

  // ── Sanitise ──────────────────────────────────────────────────────────────
  const sanitise = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\bon\w+\s*=/gi, 'data-removed=')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
  };

  // ── Parse viewBox from SVG string ─────────────────────────────────────────
  const parseVB = (svgStr) => {
    const m = svgStr?.match(/viewBox=["']([^"']+)["']/i);
    if (m) {
      const p = m[1].trim().split(/[\s,]+/).map(Number);
      if (p.length === 4 && p.every(n => !isNaN(n)))
        return { x: p[0], y: p[1], w: p[2], h: p[3] };
    }
    const wm = svgStr?.match(/\bwidth=["'](\d+)/i);
    const hm = svgStr?.match(/\bheight=["'](\d+)/i);
    return { x: 0, y: 0, w: wm ? +wm[1] : 600, h: hm ? +hm[1] : 450 };
  };

  // ── Apply viewBox to svg.js drawing ──────────────────────────────────────
  const applyVB = useCallback(({ x, y, w, h }) => {
    drawRef.current?.viewbox(x, y, w, h);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !svgContent) {
      console.log('[SVGFigure] Skipping render - no container or content');
      return;
    }
    const clean = sanitise(svgContent);
    if (!clean.trim()) {
      console.log('[SVGFigure] Skipping render - empty after sanitization');
      return;
    }

    console.log('[SVGFigure] Attempting to render');
    console.log('  Title:', title);
    console.log('  Content length:', clean.length);
    console.log('  Content preview:', clean.substring(0, 100));

    try {
      containerRef.current.innerHTML = '';
      const vb = parseVB(clean);
      viewBox.current = { ...vb };
      origVB.current  = { ...vb };

      const draw = SVG().addTo(containerRef.current).size('100%', '100%');
      drawRef.current = draw;
      draw.viewbox(vb.x, vb.y, vb.w, vb.h);
      draw.attr('preserveAspectRatio', 'xMidYMid meet');

      const inner = clean
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>\s*$/i, '');
      draw.svg(inner);
      console.log('[SVGFigure] ✅ Render successful');
      setError(null);
    } catch (err) {
      console.error('[SVGFigure] ❌ Render error:', err);
      console.error('[SVGFigure] Error details:', err.message, err.stack);
      setError('Could not render figure');
      if (containerRef.current) containerRef.current.innerHTML = sanitise(svgContent);
    }
  }, [svgContent]);

  // ── Wheel zoom (non-passive) ──────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    // 6% per tick — gentle enough to feel precise
    const factor = e.deltaY < 0 ? 0.94 : 1.06;
    const vb  = viewBox.current;
    const ovb = origVB.current;
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    // Clamp: 25% to 300% of original
    if (newW < ovb.w * 0.25 || newW > ovb.w * 3) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Zoom toward cursor
    const mx = ((e.clientX - rect.left) / rect.width)  * vb.w + vb.x;
    const my = ((e.clientY - rect.top)  / rect.height) * vb.h + vb.y;
    const nx = mx - (mx - vb.x) * factor;
    const ny = my - (my - vb.y) * factor;
    viewBox.current = { x: nx, y: ny, w: newW, h: newH };
    applyVB(viewBox.current);
  }, [applyVB]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan ───────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vb = viewBox.current;
    // 1:1 mapping — figure moves exactly as far as the cursor
    const dx = (e.clientX - panStart.current.x) * (vb.w / rect.width);
    const dy = (e.clientY - panStart.current.y) * (vb.h / rect.height);
    panStart.current = { x: e.clientX, y: e.clientY };
    viewBox.current = { ...vb, x: vb.x - dx, y: vb.y - dy };
    applyVB(viewBox.current);
  }, [isPanning, applyVB]);

  const stopPan = useCallback(() => setIsPanning(false), []);

  // ── Touch pan/pinch ───────────────────────────────────────────────────────
  const lastTouch = useRef(null);
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: null };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = { dist: Math.hypot(dx, dy) };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vb = viewBox.current;

    if (e.touches.length === 1 && lastTouch.current && lastTouch.current.dist === null) {
      const dx = (e.touches[0].clientX - lastTouch.current.x) * (vb.w / rect.width);
      const dy = (e.touches[0].clientY - lastTouch.current.y) * (vb.h / rect.height);
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: null };
      viewBox.current = { ...vb, x: vb.x - dx, y: vb.y - dy };
      applyVB(viewBox.current);
    } else if (e.touches.length === 2 && lastTouch.current?.dist != null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = lastTouch.current.dist / newDist;
      const ovb = origVB.current;
      const newW = vb.w * factor;
      if (newW < ovb.w * 0.25 || newW > ovb.w * 3) return;
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      viewBox.current = { x: cx - newW / 2, y: cy - (vb.h * factor) / 2, w: newW, h: vb.h * factor };
      applyVB(viewBox.current);
      lastTouch.current = { dist: newDist };
    }
  }, [applyVB]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  // ── Zoom buttons (centered) ───────────────────────────────────────────────
  const zoomStep = useCallback((factor) => {
    const vb  = viewBox.current;
    const ovb = origVB.current;
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    if (newW < ovb.w * 0.25 || newW > ovb.w * 3) return;
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    viewBox.current = { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    applyVB(viewBox.current);
  }, [applyVB]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetView = useCallback(() => {
    viewBox.current = { ...origVB.current };
    applyVB(viewBox.current);
  }, [applyVB]);

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadSVG = () => {
    const clean = sanitise(svgContent || '');
    const blob = new Blob([clean], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'figure').replace(/[^a-z0-9]/gi, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!svgContent?.trim()) return null;

  return (
    <div style={{ margin: '1.25rem 0' }}>

      {/* ── Title + toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px', gap: '8px',
      }}>
        {title && (
          <span style={{
            fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--color-text-muted)',
            fontStyle: 'italic', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}

        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
          {[
            { label: '−', title: 'Zoom out', onClick: () => zoomStep(1.3) },
            { label: '+', title: 'Zoom in',  onClick: () => zoomStep(0.77) },
            { label: '⊡', title: 'Fit to view', onClick: resetView },
            { label: '↓', title: 'Download SVG', onClick: downloadSVG },
          ].map(({ label, title: t, onClick }) => (
            <button key={label} onClick={onClick} title={t} style={tbBtn}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onDoubleClick={resetView}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          backgroundColor: '#0d0f14',
          borderRadius: '10px',
          border: '1px solid rgba(var(--color-accent-rgb),0.18)',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          /* Aspect ratio: 4:3 */
          aspectRatio: '4 / 3',
          maxHeight: '480px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}
      >
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Hint overlay — fades out */}
        <div style={{
          position: 'absolute', bottom: '7px', right: '10px',
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)',
          pointerEvents: 'none', letterSpacing: '0.02em',
        }}>
          scroll · drag · pinch · dbl-click to reset
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

/* Toolbar button style */
const tbBtn = {
  width: '26px', height: '26px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem', fontWeight: 600,
  borderRadius: '5px',
  border: '1px solid rgba(var(--color-accent-rgb),0.25)',
  backgroundColor: 'rgba(var(--color-accent-rgb),0.08)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  lineHeight: 1,
  padding: 0,
};

export default SVGFigure;
