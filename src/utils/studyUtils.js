/**
 * studyUtils.js — Pure utility functions for StudyInterface.
 * Exported separately so they can be unit/property tested without mounting React.
 */

export const TOOLTIP_WIDTH = 120;  // px, approximate rendered width of the Ask AI tooltip
export const TOOLTIP_MARGIN = 8;   // px, minimum distance from viewport edge
export const TOOLTIP_OFFSET_ABOVE = 44; // px, how far above the selection the tooltip appears

/**
 * Clamp the tooltip centre X so the tooltip stays within the viewport.
 * @param {number} centreX - Raw centre X position (container-relative)
 * @param {number} viewportWidth - Current window.innerWidth
 * @returns {number} Clamped centre X
 */
export function clampTooltipX(centreX, viewportWidth) {
  const halfW = TOOLTIP_WIDTH / 2;
  const minX = halfW + TOOLTIP_MARGIN;
  const maxX = viewportWidth - halfW - TOOLTIP_MARGIN;
  return Math.min(maxX, Math.max(minX, centreX));
}

/**
 * Determine whether a touch delta qualifies as a horizontal swipe.
 * A swipe requires |dx| >= 50 px and |dx|/|dy| > 1.5 (more horizontal than vertical).
 * @param {number} dx - Horizontal delta (positive = right, negative = left)
 * @param {number} dy - Vertical delta
 * @returns {boolean}
 */
export function isSwipeGesture(dx, dy) {
  if (Math.abs(dx) < 50) return false;
  if (dy !== 0 && Math.abs(dx) / Math.abs(dy) <= 1.5) return false;
  return true;
}
