import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SVG } from '@svgdotjs/svg.js';

const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 600, h: 450 };

const sanitiseSvg = (raw = '') =>
  raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=/gi, 'data-removed=')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');

const normaliseSvgLabels = (raw = '') =>
  raw
    .replace(/\$\\vec\{([^}]+)\}\$/g, '$1')
    .replace(/\\vec\{([^}]+)\}/g, '$1')
    .replace(/\\hat\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$\\theta\$/g, 'theta')
    .replace(/\\theta/g, 'theta')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\Delta/g, 'Delta')
    .replace(/\\circ/g, ' deg')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/\_{([^}]+)\}/g, '_$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\$/g, '')
    .replace(/font-size=["'](?:[0-9]|1[0-1])["']/gi, 'font-size="13"')
    .replace(/font-family=["'][^"']*["']/gi, 'font-family="Inter, system-ui, sans-serif"')
    .replace(/<text\b(?![^>]*\bfont-family=)/gi, '<text font-family="Inter, system-ui, sans-serif"');

const cleanSvg = (raw = '') => normaliseSvgLabels(sanitiseSvg(raw));

const simplifyVectorComponentText = (text = '') =>
  text
    .replace(/\bA[_\s-]?x\s*(?:i|\u00ee|i\u0302)?\b/gi, 'x part of A')
    .replace(/\bA[_\s-]?y\s*(?:j|\u0135|j\u0302)?\b/gi, 'y part of A')
    .replace(/\bA[_\s-]?z\s*(?:k|k\u0302|ha\w*)?\b/gi, 'z part of A')
    .replace(/\bA[_\s-]?x\b/gi, 'x part of A')
    .replace(/\bA[_\s-]?y\b/gi, 'y part of A')
    .replace(/\bA[_\s-]?z\b/gi, 'z part of A')
    .replace(/\bAx\b/g, 'x part of A')
    .replace(/\bAy\b/g, 'y part of A')
    .replace(/\bAz\b/g, 'z part of A');

const normaliseTextNode = (text = '') => {
  let cleaned = text
    .replace(/\$\\vec\{([^}]+)\}\$/g, '$1')
    .replace(/\\vec\{([^}]+)\}/g, '$1')
    .replace(/\\hat\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\theta/g, 'theta')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\circ/g, ' deg')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bA_x\b/g, 'Ax')
    .replace(/\bA_y\b/g, 'Ay')
    .replace(/\bA_z\b/g, 'Az')
    .replace(/\bA[_\s-]?x\s*(?:i|î|î)?\b/gi, 'x part of A')
    .replace(/\bA[_\s-]?y\s*(?:j|ĵ|ĵ)?\b/gi, 'y part of A')
    .replace(/\bA[_\s-]?z\s*(?:k|k̂)?\b/gi, 'z part of A')
    .replace(/\bA[_\s-]?x\b/gi, 'x part of A')
    .replace(/\bA[_\s-]?y\b/gi, 'y part of A')
    .replace(/\bA[_\s-]?z\b/gi, 'z part of A')
    .trim();

  cleaned = simplifyVectorComponentText(cleaned);

  cleaned = cleaned
    .replace(/\bA\s*=\s*x part of A\s*\+\s*y part of A\s*\+\s*z part of A\b/i, 'Vector A = x part + y part + z part')
    .replace(/\|\s*A\s*\|\s*=\s*sqrt\(([^)]+)\)/gi, 'Length of A = sqrt($1)')
    .replace(/\btheta\b/gi, 'angle');

  if (/^A\s*=/.test(cleaned) && /x part of A/.test(cleaned) && /y part of A/.test(cleaned)) {
    cleaned = 'Vector A = x part + y part + z part';
  }

  if (/part of A.*part of A.*part of A/.test(cleaned)) {
    cleaned = /^A\s*=/.test(cleaned) ? 'Vector A = x part + y part + z part' : 'Vector A components';
  }

  if (cleaned.length > 80 && /part of A|sqrt|Length of A|Vector/.test(cleaned)) {
    cleaned = cleaned
      .replace(/Length of A = sqrt\(([^)]+)\).*/i, 'Length of A = sqrt(x^2 + y^2 + z^2)')
      .replace(/Vector A = .*/i, 'Vector A = x part + y part + z part');
  }

  return cleaned;
};

const parseDimension = (value, fallback = 0) => {
  if (!value) return fallback;
  if (value === '100%') return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isDarkFill = (fill = '') => {
  const normalized = fill.trim().toLowerCase();
  return ['#000', '#000000', '#020617', '#030712', '#080711', '#0b0f19', '#0f1117', '#111827', 'black', 'rgb(0,0,0)', 'rgb(0, 0, 0)'].includes(normalized);
};

const isLightFill = (fill = '') => {
  const normalized = fill.trim().toLowerCase();
  return ['#fff', '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#dbe3ec', 'white', 'rgb(255,255,255)', 'rgb(255, 255, 255)'].includes(normalized);
};

const DISPLAY_PALETTE = {
  '#a78bfa': '#7c3aed',
  '#8b5cf6': '#7c3aed',
  '#c4b5fd': '#6d28d9',
  '#60a5fa': '#2563eb',
  '#93c5fd': '#1d4ed8',
  '#34d399': '#059669',
  '#10b981': '#047857',
  '#6ee7b7': '#047857',
  '#f87171': '#dc2626',
  '#fb7185': '#be123c',
  '#fbbf24': '#b45309',
  '#fde68a': '#92400e',
};

const normalizePaintColor = (value = '') => {
  const normalized = value.trim().toLowerCase();
  return DISPLAY_PALETTE[normalized] || value;
};

const isPanelLikeFill = (fill = '') => {
  const normalized = fill.trim().toLowerCase();
  if (!normalized || normalized === 'none' || normalized === 'transparent') return false;
  if (isLightFill(normalized)) return false;
  return (
    isDarkFill(normalized) ||
    /^#[0-9a-f]{6}$/i.test(normalized) ||
    ['#94a3b8', '#9ca3af', '#a1a1aa', '#8b8aa0', '#64748b', '#475569'].includes(normalized) ||
    normalized.startsWith('rgb(')
  );
};

const isNeutralPanelFill = (fill = '') => {
  const normalized = fill.trim().toLowerCase();
  return (
    isDarkFill(normalized) ||
    ['#94a3b8', '#9ca3af', '#a1a1aa', '#8b8aa0', '#64748b', '#475569'].includes(normalized) ||
    normalized.startsWith('rgb(')
  );
};

const getPaintValue = (node, property) => {
  const attr = node.getAttribute(property) || '';
  if (attr) return attr;
  const style = node.getAttribute('style') || '';
  const match = style.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : '';
};

const stripDarkBackgroundStyles = (node) => {
  const style = node.getAttribute('style') || '';
  if (!style) return;
  const cleaned = style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const [rawKey, rawValue = ''] = part.split(':');
      const key = rawKey.trim().toLowerCase();
      const value = rawValue.trim();
      return !(key === 'background' || key === 'background-color') || !isDarkFill(value);
    })
    .join('; ');

  if (cleaned) {
    node.setAttribute('style', cleaned);
  } else {
    node.removeAttribute('style');
  }
};

const rectContainsBoxCenter = (rectNode, box) => {
  try {
    const rectBox = rectNode.getBBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    return cx >= rectBox.x && cx <= rectBox.x + rectBox.width && cy >= rectBox.y && cy <= rectBox.y + rectBox.height;
  } catch {
    return false;
  }
};

const textSitsOnDarkPanel = (root, textNode) => {
  try {
    const textBox = textNode.getBBox();
    return Array.from(root.querySelectorAll('rect')).some((rect) => {
      const fill = getPaintValue(rect, 'fill');
      return isDarkFill(fill) && rectContainsBoxCenter(rect, textBox);
    });
  } catch {
    return false;
  }
};

const textSitsOnPanel = (root, textNode) => {
  try {
    const textBox = textNode.getBBox();
    return Array.from(root.querySelectorAll('rect')).some((rect) => {
      const fill = getPaintValue(rect, 'fill');
      const width = parseDimension(rect.getAttribute('width'), 0);
      const height = parseDimension(rect.getAttribute('height'), 0);
      const looksLikePanel =
        rect.getAttribute('data-lw-panel') === 'true' ||
        (width >= 120 && height >= 52 && isLightFill(fill) && !isLargeBackgroundRect(rect, root));
      return looksLikePanel && rectContainsBoxCenter(rect, textBox);
    });
  } catch {
    return false;
  }
};

const compactFormulaLabel = (text = '') => {
  let compact = text
    .replace(/x part of A/g, 'x')
    .replace(/y part of A/g, 'y')
    .replace(/z part of A/g, 'z')
    .replace(/\s+/g, ' ')
    .trim();

  compact = compact
    .replace(/^A:\s*x\s*=\s*([^,]+),\s*y.*$/i, 'A: x = $1, y = 0')
    .replace(/^B:\s*\(?B_?x\s*=\s*([^,]+),\s*B_?y\s*=\s*([^)]+)\)?.*$/i, 'B: x = $1, y = $2')
    .replace(/^R_?x\s*=\s*([^,]+),\s*R_?y\s*=\s*(.+)$/i, 'Result: x = $1, y = $2')
    .replace(/^R\s*=\s*sqrt\(244\)\s*=\s*(.+)$/i, 'Length = $1')
    .replace(/^R\s*=\s*sqrt\(([^)]+)\).*$/i, 'Length = sqrt($1)')
    .replace(/^R\s*=\s*sqrt\(244\)\s*=\s*(.+)$/i, 'R = $1')
    .replace(/theta[_\s-]?R|theta|angle_R/gi, 'angle')
    .replace(/\^?deg\b/gi, 'deg')
    .replace(/\s*,\s*/g, ', ');

  if (/angle/i.test(compact) && /26\.?4/.test(compact)) return 'angle = 26.4 deg';
  if (compact.length > 38 && /^(R|Length|Result)\b/i.test(compact)) return compact.slice(0, 35).trim() + '...';
  if (compact.length > 46) return compact.slice(0, 43).trim() + '...';
  return compact;
};

const isLargeBackgroundRect = (rect, root) => {
  const vb = root.viewBox?.baseVal || DEFAULT_VIEWBOX;
  const canvasW = vb?.width || DEFAULT_VIEWBOX.w;
  const canvasH = vb?.height || DEFAULT_VIEWBOX.h;
  const width = parseDimension(rect.getAttribute('width'), canvasW);
  const height = parseDimension(rect.getAttribute('height'), canvasH);
  const x = parseDimension(rect.getAttribute('x'), 0);
  const y = parseDimension(rect.getAttribute('y'), 0);
  return width >= canvasW * 0.86 && height >= canvasH * 0.86 && x <= canvasW * 0.08 && y <= canvasH * 0.08;
};

const getNodeBox = (node) => {
  try {
    return node.getBBox();
  } catch {
    return null;
  }
};

const boxCenterInside = (box, containerBox) => {
  if (!box || !containerBox) return false;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return cx >= containerBox.x && cx <= containerBox.x + containerBox.width && cy >= containerBox.y && cy <= containerBox.y + containerBox.height;
};

const moveElementBy = (node, dx, dy) => {
  if (!node || (!dx && !dy)) return;
  const previous = node.getAttribute('transform') || '';
  node.setAttribute('transform', `translate(${dx} ${dy}) ${previous}`.trim());
};

const setTextPosition = (textNode, x, y) => {
  textNode.removeAttribute('transform');
  textNode.setAttribute('x', String(x));
  textNode.setAttribute('y', String(y));
  textNode.querySelectorAll('tspan').forEach((tspan, index) => {
    tspan.setAttribute('x', String(x));
    if (index === 0) {
      tspan.setAttribute('dy', '0');
    }
  });
};

const getDiagramZones = (root) => {
  const vb = root.viewBox?.baseVal || DEFAULT_VIEWBOX;
  const width = vb?.width || DEFAULT_VIEWBOX.w;
  const height = vb?.height || DEFAULT_VIEWBOX.h;
  const large = width >= 760 || height >= 620;

  if (large) {
    return {
      legend: { x: 48, y: 72, w: 210, h: 132, line: 17, max: 6 },
      calc: { x: width - 292, y: 72, w: 244, h: 132, line: 16, max: 6 },
      footer: { x: 96, y: height - 62, w: width - 192, h: 38, line: 16, max: 2 },
    };
  }

  return {
    legend: { x: 58, y: 68, w: 178, h: 104, line: 15, max: 5 },
    calc: { x: width - 246, y: 68, w: 188, h: 112, line: 14, max: 5 },
    footer: { x: 90, y: height - 54, w: width - 180, h: 34, line: 14, max: 2 },
  };
};

const classifyPanel = (text = '', box, root) => {
  const joined = text.toLowerCase();
  const vb = root.viewBox?.baseVal || DEFAULT_VIEWBOX;
  const height = vb?.height || DEFAULT_VIEWBOX.h;
  const isFooter = box && box.y > height * 0.68;
  const hasLegend = /legend|লিজেন্ড|লেজেন্ড|लेजेंड/.test(joined);
  const hasFormula = /sqrt|angle|theta|r_x|r_y|উপাংশ|পদ্ধতি|সূত্র|formula|component|part of|x =|y =|length|result/.test(joined);

  if (isFooter && hasFormula) return 'remove';
  if (hasLegend) return 'legend';
  if (hasFormula) return 'calc';
  return null;
};

const enforceSvgLayoutGrid = (svgNode) => {
  if (!svgNode) return;
  const root = svgNode.querySelector('svg') || svgNode;
  const zones = getDiagramZones(root);

  Array.from(root.querySelectorAll('rect')).forEach((rect) => {
    const fill = getPaintValue(rect, 'fill');
    const width = parseDimension(rect.getAttribute('width'), 0);
    const height = parseDimension(rect.getAttribute('height'), 0);
    const isPanel =
      rect.getAttribute('data-lw-panel') === 'true' ||
      (width >= 120 && height >= 44 && isLightFill(fill) && !isLargeBackgroundRect(rect, root));
    if (!isPanel) return;

    const originalBox = getNodeBox(rect);
    if (!originalBox) return;

    const texts = Array.from(root.querySelectorAll('text')).filter((text) => boxCenterInside(getNodeBox(text), originalBox));
    const decorations = Array.from(root.querySelectorAll('line, path, polyline, polygon, circle, ellipse')).filter((node) => boxCenterInside(getNodeBox(node), originalBox));
    const panelText = texts.map((text) => text.textContent || '').join(' ');
    const panelType = classifyPanel(panelText, originalBox, root);
    if (!panelType) return;

    if (panelType === 'remove') {
      texts.forEach((text) => text.remove());
      decorations.forEach((node) => node.remove());
      rect.remove();
      return;
    }

    const zone = zones[panelType];
    const dx = zone.x - originalBox.x;
    const dy = zone.y - originalBox.y;

    rect.setAttribute('x', String(zone.x));
    rect.setAttribute('y', String(zone.y));
    rect.setAttribute('width', String(zone.w));
    rect.setAttribute('height', String(zone.h));
    rect.setAttribute('rx', rect.getAttribute('rx') || '8');
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('fill-opacity', '0.98');
    rect.setAttribute('stroke', '#cbd5e1');
    rect.setAttribute('stroke-width', '1.5');

    decorations.forEach((node) => moveElementBy(node, dx, dy));
    texts.forEach((text, index) => {
      if (index >= zone.max) {
        text.remove();
        return;
      }

      text.setAttribute('fill', '#111827');
      text.setAttribute('font-size', index === 0 ? '11' : '10');
      text.setAttribute('font-weight', index === 0 ? '800' : '600');
      setTextPosition(text, zone.x + 12, zone.y + 22 + index * zone.line);
    });
  });
};

const improveSvgPalette = (svgNode) => {
  if (!svgNode) return;
  const root = svgNode.querySelector('svg') || svgNode;
  svgNode.querySelectorAll('line, path, polyline, polygon, circle, ellipse, rect').forEach((node) => {
    ['fill', 'stroke'].forEach((prop) => {
      const value = node.getAttribute(prop);
      if (!value || value === 'none' || value === 'transparent') return;
      if (isDarkFill(value) || isLightFill(value)) return;
      const normalized = normalizePaintColor(value);
      if (normalized !== value) node.setAttribute(prop, normalized);
    });
  });

  svgNode.querySelectorAll('rect').forEach((rect) => {
    const fill = getPaintValue(rect, 'fill');
    const width = parseDimension(rect.getAttribute('width'), 0);
    const height = parseDimension(rect.getAttribute('height'), 0);
    const opacity = Number.parseFloat(rect.getAttribute('fill-opacity') || rect.style?.fillOpacity || '1');
    const solidEnough = !Number.isFinite(opacity) || opacity >= 0.34;
    const looksLikePanel =
      width >= 120 &&
      height >= 52 &&
      isPanelLikeFill(fill) &&
      (solidEnough || isNeutralPanelFill(fill)) &&
      !isLargeBackgroundRect(rect, root);
    if (!looksLikePanel) return;

    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('fill-opacity', '0.98');
    rect.setAttribute('stroke', '#cbd5e1');
    rect.setAttribute('stroke-width', rect.getAttribute('stroke-width') || '1.5');
    rect.setAttribute('data-lw-panel', 'true');
  });
};

const removeDiagramBackdrops = (svgNode) => {
  if (!svgNode) return;
  const root = svgNode.querySelector('svg') || svgNode;
  stripDarkBackgroundStyles(root);
  root.style.background = '#ffffff';

  const vb = root.viewBox?.baseVal || DEFAULT_VIEWBOX;
  const canvasW = vb?.width || DEFAULT_VIEWBOX.w;
  const canvasH = vb?.height || DEFAULT_VIEWBOX.h;

  root.querySelectorAll('rect').forEach((rect) => {
    const fill = getPaintValue(rect, 'fill');
    if (!isDarkFill(fill)) return;

    const width = parseDimension(rect.getAttribute('width'), canvasW);
    const height = parseDimension(rect.getAttribute('height'), canvasH);
    const x = parseDimension(rect.getAttribute('x'), 0);
    const y = parseDimension(rect.getAttribute('y'), 0);
    const coversCanvas = width >= canvasW * 0.86 && height >= canvasH * 0.86 && x <= canvasW * 0.08 && y <= canvasH * 0.08;

    if (coversCanvas) {
      rect.setAttribute('fill', 'transparent');
      rect.setAttribute('stroke', 'none');
      rect.removeAttribute('style');
    }
  });
};

const splitLabel = (text, maxChars = 30) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
};

const improveSvgText = (svgNode) => {
  if (!svgNode) return;
  const root = svgNode.querySelector('svg') || svgNode;
  svgNode.querySelectorAll('text').forEach((textNode) => {
    const original = textNode.textContent || '';
    const cleaned = normaliseTextNode(original);
    if (!cleaned) return;

    textNode.textContent = '';
    textNode.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    if (!textNode.getAttribute('font-size')) textNode.setAttribute('font-size', '13');
    const currentFill = textNode.getAttribute('fill') || '';
    const onPanel = textSitsOnPanel(root, textNode);
    const onDarkPanel = !onPanel && textSitsOnDarkPanel(root, textNode);
    const displayText = onPanel ? compactFormulaLabel(cleaned) : cleaned;
    if (onPanel) {
      textNode.setAttribute('fill', '#111827');
    } else if (onDarkPanel) {
      textNode.setAttribute('fill', '#f8fafc');
    } else if (!currentFill || currentFill === 'currentColor' || isLightFill(currentFill)) {
      textNode.setAttribute('fill', '#111827');
    } else {
      textNode.setAttribute('fill', normalizePaintColor(currentFill));
    }
    textNode.setAttribute('stroke', 'none');
    textNode.setAttribute('paint-order', 'normal');
    if (onPanel) {
      textNode.setAttribute('font-size', '10');
      textNode.setAttribute('font-weight', textNode.getAttribute('font-weight') || '600');
    }

    const maxChars = onPanel ? 20 : displayText.length > 54 ? 28 : 34;
    const lines = splitLabel(displayText, maxChars);
    const x = textNode.getAttribute('x') || '0';
    lines.forEach((line, index) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', x);
      if (index === 0) {
        tspan.setAttribute('dy', '0');
      } else {
        tspan.setAttribute('dy', '1.25em');
      }
      tspan.textContent = line;
      textNode.appendChild(tspan);
    });
  });
};

const parseViewBox = (svgStr = '') => {
  const match = svgStr.match(/viewBox=["']([^"']+)["']/i);
  if (match) {
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
  }

  const width = svgStr.match(/\bwidth=["'](\d+)/i);
  const height = svgStr.match(/\bheight=["'](\d+)/i);
  return {
    ...DEFAULT_VIEWBOX,
    w: width ? Number(width[1]) : DEFAULT_VIEWBOX.w,
    h: height ? Number(height[1]) : DEFAULT_VIEWBOX.h,
  };
};

const extractSvgInner = (svgStr = '') =>
  svgStr
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');

const SVGFigure = ({ svgContent, title }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawRef = useRef(null);
  const panStart = useRef({ x: 0, y: 0 });
  const viewBox = useRef(DEFAULT_VIEWBOX);
  const origViewBox = useRef(DEFAULT_VIEWBOX);
  const [error, setError] = useState(null);
  const [isPanning, setIsPanning] = useState(false);

  const applyViewBox = useCallback(({ x, y, w, h }) => {
    drawRef.current?.viewbox(x, y, w, h);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgContent?.trim()) return;

    const cleaned = sanitiseSvg(svgContent);
    if (!cleaned.trim()) return;

    try {
      containerRef.current.innerHTML = '';
      const vb = parseViewBox(cleaned);
      viewBox.current = { ...vb };
      origViewBox.current = { ...vb };

      const draw = SVG().addTo(containerRef.current).size('100%', '100%');
      drawRef.current = draw;
      draw.viewbox(vb.x, vb.y, vb.w, vb.h);
      draw.attr({
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img',
        'aria-label': title || 'Generated study diagram',
      });
      draw.node.classList.add('svg-figure-surface');
      draw.svg(extractSvgInner(cleaned));
      setError(null);
    } catch (err) {
      console.error('[SVGFigure] Render error:', err);
      setError('Could not render figure');
      if (containerRef.current) containerRef.current.innerHTML = cleaned;
    }
  }, [svgContent, title]);

  const zoomStep = useCallback((factor, center = null) => {
    const vb = viewBox.current;
    const ovb = origViewBox.current;
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    if (newW < ovb.w * 0.25 || newW > ovb.w * 3) return;

    const cx = center?.x ?? vb.x + vb.w / 2;
    const cy = center?.y ?? vb.y + vb.h / 2;
    viewBox.current = {
      x: cx - (cx - vb.x) * factor,
      y: cy - (cy - vb.y) * factor,
      w: newW,
      h: newH,
    };
    applyViewBox(viewBox.current);
  }, [applyViewBox]);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vb = viewBox.current;
    const center = {
      x: ((event.clientX - rect.left) / rect.width) * vb.w + vb.x,
      y: ((event.clientY - rect.top) / rect.height) * vb.h + vb.y,
    };
    zoomStep(event.deltaY < 0 ? 0.94 : 1.06, center);
  }, [zoomStep]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return undefined;
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((event) => {
    if (event.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!isPanning) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const vb = viewBox.current;
    const dx = (event.clientX - panStart.current.x) * (vb.w / rect.width);
    const dy = (event.clientY - panStart.current.y) * (vb.h / rect.height);
    panStart.current = { x: event.clientX, y: event.clientY };
    viewBox.current = { ...vb, x: vb.x - dx, y: vb.y - dy };
    applyViewBox(viewBox.current);
  }, [applyViewBox, isPanning]);

  const stopPan = useCallback(() => setIsPanning(false), []);

  const resetView = useCallback(() => {
    viewBox.current = { ...origViewBox.current };
    applyViewBox(viewBox.current);
  }, [applyViewBox]);

  const downloadSVG = () => {
    const blob = new Blob([sanitiseSvg(svgContent || '')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'figure').replace(/[^a-z0-9]/gi, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!svgContent?.trim()) return null;

  return (
    <div className="svg-figure">
      <div className="svg-figure-header">
        {title && <span className="svg-figure-title">{title}</span>}
        <div className="svg-figure-toolbar">
          <button type="button" className="svg-figure-tool" onClick={() => zoomStep(1.3)} title="Zoom out">-</button>
          <button type="button" className="svg-figure-tool" onClick={() => zoomStep(0.77)} title="Zoom in">+</button>
          <button type="button" className="svg-figure-tool" onClick={resetView} title="Fit to view">Fit</button>
          <button type="button" className="svg-figure-tool" onClick={downloadSVG} title="Download SVG">SVG</button>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className={`svg-figure-canvas ${isPanning ? 'is-panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onDoubleClick={resetView}
      >
        <div ref={containerRef} className="svg-figure-mount" />
      </div>

      {error && <p className="svg-figure-error">{error}</p>}
    </div>
  );
};

export default SVGFigure;
