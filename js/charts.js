/* ============================================================
   WEATHER APP — Canvas Chart Engine
   ============================================================ */

const ChartEngine = (() => {
  let canvas, ctx;
  let currentData = null;
  let currentType = 'temperature';
  let tooltipIndex = -1;
  let animationProgress = 0;
  let animationFrame = null;
  let resizeObserver = null;

  const CHART_CONFIG = {
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 55,
    paddingRight: 25,
    pointRadius: 5,
    pointHoverRadius: 7,
    lineWidth: 2.5,
    gridLineColor: 'rgba(255, 255, 255, 0.06)',
    gridLineColorLight: 'rgba(26, 26, 46, 0.06)',
    fontFamily: 'Inter, sans-serif',
    animationDuration: 800,
  };

  /* ──────────────────────────────────────────
     INITIALIZATION
     ────────────────────────────────────────── */

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    _setupCanvas();
    _addEventListeners();

    resizeObserver = new ResizeObserver(() => {
      _setupCanvas();
      if (currentData) _draw();
    });
    resizeObserver.observe(canvas.parentElement);
  }

  function _setupCanvas() {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = (Math.min(280, rect.width * 0.45)) * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = Math.min(280, rect.width * 0.45) + 'px';
    ctx.scale(dpr, dpr);
  }

  function _addEventListeners() {
    canvas.addEventListener('mousemove', _handleMouseMove);
    canvas.addEventListener('mouseleave', _handleMouseLeave);
    canvas.addEventListener('touchmove', _handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', _handleMouseLeave);
  }

  /* ──────────────────────────────────────────
     DATA SETTERS
     ────────────────────────────────────────── */

  function setData(hourlyData, unit = 'C') {
    currentData = hourlyData.slice(0, 24).map((h, i) => ({
      label: i === 0 ? 'Now' : Utils.formatTimeShort(h.time),
      temperature: unit === 'F' ? Utils.celsiusToFahrenheit(h.temp) : h.temp,
      precipitation: h.rainChance,
      wind: h.windSpeed,
    }));
    tooltipIndex = -1;
    _animate();
  }

  function setType(type) {
    currentType = type;
    tooltipIndex = -1;
    _animate();
  }

  /* ──────────────────────────────────────────
     ANIMATION
     ────────────────────────────────────────── */

  function _animate() {
    animationProgress = 0;
    if (animationFrame) cancelAnimationFrame(animationFrame);

    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      animationProgress = Math.min(1, elapsed / CHART_CONFIG.animationDuration);
      // Ease out cubic
      animationProgress = 1 - Math.pow(1 - animationProgress, 3);
      _draw();
      if (animationProgress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    }
    animationFrame = requestAnimationFrame(step);
  }

  /* ──────────────────────────────────────────
     DRAWING
     ────────────────────────────────────────── */

  function _draw() {
    if (!ctx || !currentData || currentData.length === 0) return;

    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    const { paddingTop, paddingBottom, paddingLeft, paddingRight } = CHART_CONFIG;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? 'rgba(241, 245, 249, 0.5)' : 'rgba(26, 26, 46, 0.5)';
    const gridColor = isDark ? CHART_CONFIG.gridLineColor : CHART_CONFIG.gridLineColorLight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Get data values
    const values = currentData.map((d) => d[currentType]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    const yMin = minVal - padding;
    const yMax = maxVal + padding;

    // Calculate points
    const points = currentData.map((d, i) => ({
      x: paddingLeft + (i / (currentData.length - 1)) * chartW,
      y: paddingTop + chartH - ((d[currentType] - yMin) / (yMax - yMin)) * chartH,
      value: d[currentType],
      label: d.label,
    }));

    // Draw grid
    _drawGrid(w, h, yMin, yMax, gridColor, textColor, chartH);

    // Draw X labels (every 3rd)
    _drawXLabels(points, h, textColor);

    // Draw gradient fill
    _drawGradientFill(points, chartH + paddingTop, isDark);

    // Draw line
    _drawLine(points, isDark);

    // Draw points
    _drawPoints(points, isDark);

    // Draw tooltip
    if (tooltipIndex >= 0 && tooltipIndex < points.length) {
      _drawTooltip(points[tooltipIndex], isDark, h);
    }
  }

  function _drawGrid(w, h, yMin, yMax, gridColor, textColor, chartH) {
    const { paddingTop, paddingLeft, paddingRight } = CHART_CONFIG;
    const steps = 5;
    const range = yMax - yMin;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = `11px ${CHART_CONFIG.fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const y = paddingTop + chartH - ratio * chartH;
      const value = yMin + ratio * range;

      // Grid line
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      let label = Math.round(value);
      if (currentType === 'temperature') label += '°';
      else if (currentType === 'precipitation') label += '%';
      else if (currentType === 'wind') label += '';
      ctx.fillText(label, paddingLeft - 10, y);
    }
  }

  function _drawXLabels(points, h, textColor) {
    ctx.font = `11px ${CHART_CONFIG.fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const step = Math.max(1, Math.floor(points.length / 8));
    points.forEach((p, i) => {
      if (i % step === 0 || i === 0) {
        ctx.fillText(p.label, p.x, h - CHART_CONFIG.paddingBottom + 12);
      }
    });
  }

  function _drawGradientFill(points, bottomY, isDark) {
    if (points.length < 2) return;

    const gradient = ctx.createLinearGradient(0, Math.min(...points.map(p => p.y)), 0, bottomY);

    if (currentType === 'temperature') {
      gradient.addColorStop(0, isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.2)');
      gradient.addColorStop(1, isDark ? 'rgba(251, 191, 36, 0.0)' : 'rgba(251, 191, 36, 0.0)');
    } else if (currentType === 'precipitation') {
      gradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(1, isDark ? 'rgba(59, 130, 246, 0.0)' : 'rgba(59, 130, 246, 0.0)');
    } else {
      gradient.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)');
      gradient.addColorStop(1, isDark ? 'rgba(16, 185, 129, 0.0)' : 'rgba(16, 185, 129, 0.0)');
    }

    ctx.beginPath();
    _drawSmoothCurve(points, true);
    ctx.lineTo(points[points.length - 1].x, bottomY);
    ctx.lineTo(points[0].x, bottomY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function _drawLine(points, isDark) {
    if (points.length < 2) return;

    let color;
    if (currentType === 'temperature') {
      color = isDark ? '#FBBF24' : '#F59E0B';
    } else if (currentType === 'precipitation') {
      color = isDark ? '#60A5FA' : '#3B82F6';
    } else {
      color = isDark ? '#34D399' : '#10B981';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = CHART_CONFIG.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Animate: only draw up to animation progress
    const endIndex = Math.floor((points.length - 1) * animationProgress);
    const partialPoints = points.slice(0, endIndex + 1);

    _drawSmoothCurve(partialPoints, false);
    ctx.stroke();
  }

  function _drawSmoothCurve(points, forFill) {
    if (points.length < 2) return;

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  function _drawPoints(points, isDark) {
    const endIndex = Math.floor((points.length - 1) * animationProgress);

    let color, bgColor;
    if (currentType === 'temperature') {
      color = isDark ? '#FBBF24' : '#F59E0B';
      bgColor = isDark ? '#1a1d3a' : '#f0f3fa';
    } else if (currentType === 'precipitation') {
      color = isDark ? '#60A5FA' : '#3B82F6';
      bgColor = isDark ? '#1a1d3a' : '#f0f3fa';
    } else {
      color = isDark ? '#34D399' : '#10B981';
      bgColor = isDark ? '#1a1d3a' : '#f0f3fa';
    }

    // Draw every 3rd point (or hovered point)
    for (let i = 0; i <= endIndex; i++) {
      const isHovered = i === tooltipIndex;
      if (i % 3 !== 0 && !isHovered && i !== 0 && i !== points.length - 1) continue;

      const p = points[i];
      const r = isHovered ? CHART_CONFIG.pointHoverRadius : CHART_CONFIG.pointRadius;

      // Outer glow for hover
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', '');
        // Use hex to rgba
        const glowColor = _hexToRGBA(color, 0.2);
        ctx.fillStyle = glowColor;
        ctx.fill();
      }

      // Background circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  function _drawTooltip(point, isDark, canvasH) {
    const { value, label } = point;

    let suffix = '';
    let typeLabel = '';
    if (currentType === 'temperature') { suffix = '°'; typeLabel = 'Temp'; }
    else if (currentType === 'precipitation') { suffix = '%'; typeLabel = 'Rain'; }
    else { suffix = ' km/h'; typeLabel = 'Wind'; }

    const text = `${typeLabel}: ${Math.round(value)}${suffix}`;
    const timeText = label;

    ctx.font = `600 12px ${CHART_CONFIG.fontFamily}`;
    const textW = Math.max(ctx.measureText(text).width, ctx.measureText(timeText).width);
    const boxW = textW + 24;
    const boxH = 48;
    let boxX = point.x - boxW / 2;
    let boxY = point.y - boxH - 16;

    // Keep within bounds
    if (boxX < 5) boxX = 5;
    if (boxX + boxW > parseFloat(canvas.style.width) - 5) boxX = parseFloat(canvas.style.width) - boxW - 5;
    if (boxY < 5) boxY = point.y + 16;

    // Background
    ctx.fillStyle = isDark ? 'rgba(30, 33, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    _roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Time label
    ctx.font = `500 11px ${CHART_CONFIG.fontFamily}`;
    ctx.fillStyle = isDark ? 'rgba(241,245,249,0.5)' : 'rgba(26,26,46,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(timeText, boxX + boxW / 2, boxY + 8);

    // Value
    ctx.font = `700 13px ${CHART_CONFIG.fontFamily}`;
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1a1a2e';
    ctx.fillText(text, boxX + boxW / 2, boxY + 26);

    // Vertical guide line
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y + CHART_CONFIG.pointHoverRadius + 4);
    ctx.lineTo(point.x, canvasH - CHART_CONFIG.paddingBottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ──────────────────────────────────────────
     HELPERS
     ────────────────────────────────────────── */

  function _roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function _hexToRGBA(hex, alpha) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /* ──────────────────────────────────────────
     MOUSE / TOUCH INTERACTION
     ────────────────────────────────────────── */

  function _handleMouseMove(e) {
    if (!currentData || currentData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    _updateTooltip(mouseX);
  }

  function _handleTouchMove(e) {
    if (!currentData || currentData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    _updateTooltip(touchX);
  }

  function _handleMouseLeave() {
    if (tooltipIndex !== -1) {
      tooltipIndex = -1;
      _draw();
    }
    canvas.style.cursor = 'default';
  }

  function _updateTooltip(mouseX) {
    const w = parseFloat(canvas.style.width);
    const { paddingLeft, paddingRight } = CHART_CONFIG;
    const chartW = w - paddingLeft - paddingRight;

    const relX = mouseX - paddingLeft;
    const index = Math.round((relX / chartW) * (currentData.length - 1));
    const clampedIndex = Utils.clamp(index, 0, currentData.length - 1);

    if (clampedIndex !== tooltipIndex) {
      tooltipIndex = clampedIndex;
      canvas.style.cursor = 'crosshair';
      _draw();
    }
  }

  /* ──────────────────────────────────────────
     CLEANUP
     ────────────────────────────────────────── */

  function destroy() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeObserver) resizeObserver.disconnect();
    if (canvas) {
      canvas.removeEventListener('mousemove', _handleMouseMove);
      canvas.removeEventListener('mouseleave', _handleMouseLeave);
      canvas.removeEventListener('touchmove', _handleTouchMove);
      canvas.removeEventListener('touchend', _handleMouseLeave);
    }
  }

  /* ── Public API ── */
  return {
    init,
    setData,
    setType,
    destroy,
    redraw: _draw,
  };
})();
