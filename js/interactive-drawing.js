/**
 * TikZ Studio - Canvas-First Interactive Rubberband Drawing & Direct Canvas Manipulation
 * 
 * Implements direct rubberband drawing on canvas as the primary tool with:
 * - Live rubberband previews with dimensions, corner tags, guidelines & snap-to-grid
 * - Direct interactive candidate shape state with draggable corner/vertex handles
 * - On-canvas final confirmation popover with quick styling (color, dash, label, target slot)
 * - Automatic secondary form synchronization & animated pulse feedback
 * - Direct canvas selection & handle manipulation for existing shapes
 */

(function () {
  'use strict';

  // Global Drawing State
  window.drawingState = {
    active: true,
    tool: 'rectangle',    // 'select' | 'rectangle' | 'line' | 'curve' | 'point' | 'pan' | 'axis'
    index: 1,
    subPoint: 'all',
    requireConfirm: true, // "maybe with final confirm"
    isMouseDown: false,
    hasMoved: false,
    dragStartPos: null,
    currentPos: null,
    placedCurvePoints: [],

    // Canvas panning & navigation state
    isPanning: false,
    panStart: null,
    isSpacePressed: false,

    // Candidate shape awaiting confirmation
    candidate: null,

    // Selected existing shape in select mode
    selectedShape: null
  };

  // Grid snap interval (0.5 is default for crisp mathematical coordinates)
  window.currentSnapGrid = 0.5;

  /**
   * Convert client mouse coordinates to Mathematical and Canvas Screen coordinates
   */
  window.getCanvasMathPos = function (clientX, clientY) {
    var cnv = document.getElementById("myCanvas");
    if (!cnv) return { x: 0, y: 0, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 };
    var rect = cnv.getBoundingClientRect();
    var scaleX = cnv.width / rect.width;
    var scaleY = cnv.height / rect.height;
    var canvasX = (clientX - rect.left) * scaleX;
    var canvasY = (clientY - rect.top) * scaleY;

    var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : (parseFloat(document.getElementById("graph_scale")?.value) || 35));
    var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
    var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);

    var rawX = (canvasX - curXOffset) / curScale;
    var rawY = (cnv.height - curYOffset - canvasY) / curScale;

    // Apply snap if configured
    var snap = window.currentSnapGrid;
    var finalX = rawX;
    var finalY = rawY;
    if (snap > 0) {
      finalX = Math.round(rawX / snap) * snap;
      finalY = Math.round(rawY / snap) * snap;
    }
    finalX = Math.round(finalX * 100) / 100;
    finalY = Math.round(finalY * 100) / 100;

    // Converted back to canvas screen coordinates for pixel-perfect preview
    var screenX = curXOffset + finalX * curScale;
    var screenY = cnv.height - curYOffset - finalY * curScale;

    return {
      x: finalX,
      y: finalY,
      screenX: screenX,
      screenY: screenY,
      canvasX: canvasX,
      canvasY: canvasY
    };
  };

  /**
   * Helper: convert math coordinates to screen coordinates
   */
  window.mathToScreen = function (mx, my) {
    var cnv = document.getElementById("myCanvas");
    var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : (parseFloat(document.getElementById("graph_scale")?.value) || 35));
    var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
    var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);
    return {
      screenX: curXOffset + mx * curScale,
      screenY: (cnv ? cnv.height : 580) - curYOffset - my * curScale
    };
  };

  /**
   * Update Coordinate HUD readout and Viewport Controls
   */
  window.updateViewportHUD = function (customPos) {
    var hud = document.getElementById("canvas-coord-hud");
    var vpBadge = document.getElementById("vp-badge-zoom");
    var zoomInd = document.getElementById("canvas-zoom-indicator");
    var vpZoomLabel = document.getElementById("viewport-zoom-label");
    var curScale = (typeof window.scale !== 'undefined') ? window.scale : 35;
    var zoomPct = Math.round((curScale / 35) * 100);
    if (vpBadge) {
      vpBadge.textContent = zoomPct + "%";
    }
    if (zoomInd) {
      zoomInd.textContent = zoomPct + "%";
    }
    if (vpZoomLabel) {
      vpZoomLabel.textContent = zoomPct + "%";
    }
    if (!hud) return;
    var state = window.drawingState;
    var pos = customPos || state?.currentPos;
    var coordText = pos ? "Cursor: (" + pos.x + ", " + pos.y + ")" : "Cursor: (x, y)";
    if (state && state.tool === 'line' && state.dragStartPos && pos) {
      var dx = pos.x - state.dragStartPos.x;
      var dy = pos.y - state.dragStartPos.y;
      var len = Math.hypot(dx, dy).toFixed(2);
      var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
      coordText = "Line: L=" + len + "u, " + angle + "° | " + coordText;
    }
    hud.textContent = coordText + " | Zoom: " + zoomPct + "%";
  };

  /**
   * Viewport navigation helper: Zoom centered at canvas midpoint
   */
  window.zoomCanvasAtCenter = function (factor) {
    var cnv = document.getElementById("myCanvas");
    if (!cnv) return;
    var canvasX = cnv.width / 2;
    var canvasY = cnv.height / 2;

    var curScale = (typeof window.scale !== 'undefined') ? window.scale : 35;
    var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : 28;
    var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : 28;

    var mathX = (canvasX - curXOffset) / curScale;
    var mathY = (cnv.height - curYOffset - canvasY) / curScale;

    var newScale = Math.max(6, Math.min(300, curScale * factor));
    var newXOffset = canvasX - mathX * newScale;
    var newYOffset = cnv.height - canvasY - mathY * newScale;

    window.scale = Math.round(newScale * 100) / 100;
    window.x_offset = Math.round(newXOffset * 10) / 10;
    window.y_offset = Math.round(newYOffset * 10) / 10;
    if (typeof scale !== 'undefined') scale = window.scale;
    if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
    if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

    var scaleInput = document.getElementById("graph_scale");
    if (scaleInput) scaleInput.value = Math.round(window.scale * 10) / 10;

    if (typeof DrawGraph === 'function') DrawGraph();
    if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
    renderAllOverlays();
    window.updateViewportHUD();
  };

  /**
   * Reset zoom level back to 100% (scale 35) preserving current center
   */
  window.resetCanvasZoom = function () {
    var curScale = (typeof window.scale !== 'undefined') ? window.scale : 35;
    window.zoomCanvasAtCenter(35 / curScale);
  };

  /**
   * Center the mathematical origin (0, 0) in the middle of canvas
   */
  window.centerCanvasOrigin = function () {
    var cnv = document.getElementById("myCanvas");
    if (!cnv) return;
    window.x_offset = Math.round(cnv.width / 2);
    window.y_offset = Math.round(cnv.height / 2);
    if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
    if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

    if (typeof DrawGraph === 'function') DrawGraph();
    if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
    renderAllOverlays();
    window.updateViewportHUD();
  };

  /**
   * Reset view to initial layout (scale 35, origin at standard bottom-left corner)
   */
  window.resetCanvasView = function () {
    var cnv = document.getElementById("myCanvas");
    window.scale = 35;
    window.x_offset = 28;
    window.y_offset = 28;
    if (typeof scale !== 'undefined') scale = window.scale;
    if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
    if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

    var scaleInput = document.getElementById("graph_scale");
    if (scaleInput) scaleInput.value = 35;

    if (typeof DrawGraph === 'function') DrawGraph();
    if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
    renderAllOverlays();
    window.updateViewportHUD();
  };

  /**
   * Automatically fit all diagram content comfortably in view
   */
  window.fitCanvasContent = function () {
    var cnv = document.getElementById("myCanvas");
    if (!cnv) return;

    var minX = 0, maxX = 10, minY = 0, maxY = 10;
    var foundAny = false;

    // 1. Axis bounds
    var xSize = parseFloat(document.getElementById("xsize")?.value) || 0;
    var ySize = parseFloat(document.getElementById("ysize")?.value) || 0;
    if (xSize > 0 || ySize > 0) {
      minX = 0; maxX = Math.max(1, xSize);
      minY = 0; maxY = Math.max(1, ySize);
      foundAny = true;
    }

    // 2. Lines
    for (var i = 1; i <= 4; i++) {
      var show = document.getElementById("lineshow_" + i);
      if (!show || show.checked) {
        var x1 = parseFloat(document.getElementById("a_" + i)?.value);
        var y1 = parseFloat(document.getElementById("b_" + i)?.value);
        var x2 = parseFloat(document.getElementById("c_" + i)?.value);
        var y2 = parseFloat(document.getElementById("d_" + i)?.value);
        if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && (x1 !== 0 || y1 !== 0 || x2 !== 0 || y2 !== 0)) {
          minX = foundAny ? Math.min(minX, x1, x2) : Math.min(x1, x2);
          maxX = foundAny ? Math.max(maxX, x1, x2) : Math.max(x1, x2);
          minY = foundAny ? Math.min(minY, y1, y2) : Math.min(y1, y2);
          maxY = foundAny ? Math.max(maxY, y1, y2) : Math.max(y1, y2);
          foundAny = true;
        }
      }
    }

    // 3. Rectangles
    for (var z = 1; z <= 2; z++) {
      var rShow = document.getElementById("rectshow_" + z);
      if (!rShow || rShow.checked) {
        var rx1 = parseFloat(document.getElementById("r_" + z)?.value);
        var ry1 = parseFloat(document.getElementById("s_" + z)?.value);
        var rx2 = parseFloat(document.getElementById("u_" + z)?.value);
        var ry2 = parseFloat(document.getElementById("v_" + z)?.value);
        if (!isNaN(rx1) && !isNaN(ry1) && !isNaN(rx2) && !isNaN(ry2) && (rx1 !== 0 || ry1 !== 0 || rx2 !== 0 || ry2 !== 0)) {
          minX = foundAny ? Math.min(minX, rx1, rx2) : Math.min(rx1, rx2);
          maxX = foundAny ? Math.max(maxX, rx1, rx2) : Math.max(rx1, rx2);
          minY = foundAny ? Math.min(minY, ry1, ry2) : Math.min(ry1, ry2);
          maxY = foundAny ? Math.max(maxY, ry1, ry2) : Math.max(ry1, ry2);
          foundAny = true;
        }
      }
    }

    // 4. Circles
    for (var ci = 1; ci <= 2; ci++) {
      var cShow = document.getElementById("circleshow_" + ci);
      if (!cShow || cShow.checked) {
        var cx = parseFloat(document.getElementById("circle_x_" + ci)?.value);
        var cy = parseFloat(document.getElementById("circle_y_" + ci)?.value);
        var cr = parseFloat(document.getElementById("circle_r_" + ci)?.value);
        if (!isNaN(cx) && !isNaN(cy) && !isNaN(cr) && cr > 0) {
          minX = foundAny ? Math.min(minX, cx - cr) : cx - cr;
          maxX = foundAny ? Math.max(maxX, cx + cr) : cx + cr;
          minY = foundAny ? Math.min(minY, cy - cr) : cy - cr;
          maxY = foundAny ? Math.max(maxY, cy + cr) : cy + cr;
          foundAny = true;
        }
      }
    }

    // 5. Points
    var psJ = typeof window.ps_j !== 'undefined' ? window.ps_j : 4;
    for (var p = 1; p < psJ; p++) {
      var ptShow = document.getElementById("pointshow_" + p);
      if (!ptShow || ptShow.checked) {
        var px = parseFloat(document.getElementById("p_" + p)?.value);
        var py = parseFloat(document.getElementById("q_" + p)?.value);
        if (!isNaN(px) && !isNaN(py) && (px !== 0 || py !== 0)) {
          minX = foundAny ? Math.min(minX, px) : px;
          maxX = foundAny ? Math.max(maxX, px) : px;
          minY = foundAny ? Math.min(minY, py) : py;
          maxY = foundAny ? Math.max(maxY, py) : py;
          foundAny = true;
        }
      }
    }

    var spanX = Math.max(1, maxX - minX);
    var spanY = Math.max(1, maxY - minY);
    var padX = Math.max(0.5, spanX * 0.15);
    var padY = Math.max(0.5, spanY * 0.15);
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;
    spanX = maxX - minX;
    spanY = maxY - minY;

    var scaleX = (cnv.width - 40) / spanX;
    var scaleY = (cnv.height - 40) / spanY;
    var fitScale = Math.max(8, Math.min(180, Math.min(scaleX, scaleY)));

    var centerMathX = (minX + maxX) / 2;
    var centerMathY = (minY + maxY) / 2;

    window.scale = Math.round(fitScale * 10) / 10;
    window.x_offset = Math.round((cnv.width / 2) - (centerMathX * window.scale));
    window.y_offset = Math.round((cnv.height / 2) - (centerMathY * window.scale));

    if (typeof scale !== 'undefined') scale = window.scale;
    if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
    if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

    var scaleInput = document.getElementById("graph_scale");
    if (scaleInput) scaleInput.value = window.scale;

    if (typeof DrawGraph === 'function') DrawGraph();
    if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
    renderAllOverlays();
    window.updateViewportHUD();
  };

  /**
   * Set active drawing tool from toolbar or programmatically
   */
  window.setDrawTool = function (toolType, targetIndex, subPoint) {
    var state = window.drawingState;

    // If changing tools while a candidate is open, cancel candidate
    if (state.candidate && state.tool !== toolType) {
      window.cancelCandidateShape();
    }

    state.tool = toolType;
    state.index = targetIndex || 1;
    state.subPoint = subPoint || 'all';
    state.dragStartPos = null;
    state.placedCurvePoints = [];
    state.isMouseDown = false;
    state.hasMoved = false;

    if (toolType === 'pan') {
      state.active = true;
      deactivateAllDrawCheckboxes();
      updateDrawingUI();
      renderAllOverlays();
      var cnv = document.getElementById("myCanvas");
      if (cnv) cnv.style.cursor = 'grab';
      return;
    }

    if (toolType === 'select') {
      state.active = true;
      deactivateAllDrawCheckboxes();
      updateDrawingUI();
      renderAllOverlays();
      return;
    }

    if (toolType === 'axis') {
      state.active = true;
      deactivateAllDrawCheckboxes();
      var xVal = parseFloat(document.getElementById("xsize") ? document.getElementById("xsize").value : 0) || 0;
      var yVal = parseFloat(document.getElementById("ysize") ? document.getElementById("ysize").value : 0) || 0;
      if (xVal === 0 && yVal === 0) {
        if (document.getElementById("xsize")) document.getElementById("xsize").value = "10";
        if (document.getElementById("ysize")) document.getElementById("ysize").value = "10";
        if (typeof DrawGraph === 'function') DrawGraph();
      }
      if (typeof openAxisCard === 'function') openAxisCard();
      updateDrawingUI();
      renderAllOverlays();
      return;
    }

    if (typeof closeAxisCard === 'function' && state.selectedShape?.type !== 'axis') {
      closeAxisCard();
    }

    state.active = true;
    syncCheckboxesToActiveTool();
    updateDrawingUI();
    renderAllOverlays();
  };

  /**
   * Toggle snap interval between 0.5, 1.0, 0.25, and Free (0.1)
   */
  window.toggleSnapGrid = function () {
    var snapSpan = document.getElementById("snap-val");
    if (window.currentSnapGrid === 0.5) {
      window.currentSnapGrid = 1.0;
    } else if (window.currentSnapGrid === 1.0) {
      window.currentSnapGrid = 0.25;
    } else if (window.currentSnapGrid === 0.25) {
      window.currentSnapGrid = 0.1;
    } else {
      window.currentSnapGrid = 0.5;
    }
    if (snapSpan) snapSpan.textContent = window.currentSnapGrid;
    if (window.showToast) {
      window.showToast("Snap-to-Grid: " + window.currentSnapGrid + " units");
    }
  };

  /**
   * Toggle requirement for final confirmation
   */
  window.toggleConfirmMode = function () {
    var state = window.drawingState;
    state.requireConfirm = !state.requireConfirm;
    var badge = document.getElementById("confirm-mode-val");
    if (badge) {
      badge.textContent = state.requireConfirm ? "ON" : "OFF";
      badge.className = state.requireConfirm ? "badge-confirm-on" : "badge-confirm-off";
    }
    if (window.showToast) {
      window.showToast("Final Confirm: " + (state.requireConfirm ? "Enabled (popover before apply)" : "Disabled (immediate apply)"));
    }
  };

  /**
   * Cancel drawing mode
   */
  window.cancelDrawingMode = function () {
    if (window.drawingState.candidate) {
      window.cancelCandidateShape();
    } else {
      window.setDrawTool('select');
      if (window.showToast) {
        window.showToast("Drawing cancelled");
      }
    }
  };

  /**
   * Backward-compatibility for card clicks
   */
  window.activateDrawingMode = function (toolType, index, subPoint) {
    var state = window.drawingState;
    state.active = true;
    state.tool = toolType;
    state.index = index;
    state.subPoint = subPoint || 'all';
    state.dragStartPos = null;
    state.placedCurvePoints = [];
    state.isMouseDown = false;
    state.hasMoved = false;

    updateDrawingUI();
    renderAllOverlays();
  };

  window.deactivateDrawingMode = function () {
    var state = window.drawingState;
    state.tool = 'select';
    state.dragStartPos = null;
    state.placedCurvePoints = [];
    updateDrawingUI();
    renderAllOverlays();
  };

  /**
   * Synchronize DOM checkboxes with the currently active drawing tool
   */
  function syncCheckboxesToActiveTool() {
    var state = window.drawingState;
    if (!state.active) return;

    if (state.tool === 'rectangle') {
      var showCb = document.getElementById("retangularshow_" + state.index);
      if (showCb) showCb.checked = true;
      var drawCb = document.getElementById("mouseDR_" + state.index);
      if (drawCb) drawCb.checked = true;
      var allCb = document.getElementById("retangular_" + state.index);
      if (allCb && state.subPoint === 'all') allCb.checked = true;
    } else if (state.tool === 'line') {
      var showCb = document.getElementById("lineshow_" + state.index);
      if (showCb) showCb.checked = true;
      var drawCb = document.getElementById("mouseDL_" + state.index);
      if (drawCb) drawCb.checked = true;
      var allCb = document.getElementById("lin_" + state.index);
      if (allCb && state.subPoint === 'all') allCb.checked = true;
    } else if (state.tool === 'curve') {
      var showCb = document.getElementById("curveshow_" + state.index);
      if (showCb) showCb.checked = true;
      var drawCb = document.getElementById("mouseDC_" + state.index);
      if (drawCb) drawCb.checked = true;
      var allCb = document.getElementById("cm_" + state.index);
      if (allCb && state.subPoint === 'all') allCb.checked = true;
    } else if (state.tool === 'circle') {
      var showCb = document.getElementById("circleshow_" + state.index);
      if (showCb) showCb.checked = true;
    }
  }

  function deactivateAllDrawCheckboxes() {
    ['mouseDL_1', 'mouseDL_2', 'mouseDL_3', 'mouseDL_4', 'mouseDR_1', 'mouseDC_1', 'mouseDC_2'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.checked = false;
    });
  }

  /**
   * Update Toolbar buttons, Guide Banner, and cursor
   */
  function updateDrawingUI() {
    var state = window.drawingState;
    var banner = document.getElementById("drawing-guide-banner");
    var bannerText = document.getElementById("drawing-guide-text");
    var cnv = document.getElementById("myCanvas");

    // Update Toolbar active button states
    document.querySelectorAll(".tool-btn").forEach(function (btn) {
      btn.classList.remove("active");
    });
    var activeToolBtn = document.getElementById("tool-btn-" + state.tool);
    if (activeToolBtn) activeToolBtn.classList.add("active");

    // Remove active drawing classes from all cards
    document.querySelectorAll(".item-card").forEach(function (c) {
      c.classList.remove("is-active-drawing");
    });
    document.querySelectorAll(".options-row label").forEach(function (lbl) {
      lbl.classList.remove("is-drawing-active");
    });

    if (state.tool === 'select') {
      if (cnv) cnv.style.cursor = "default";
      if (banner) banner.style.display = "none";
    } else if (state.tool === 'pan') {
      if (cnv) cnv.style.cursor = state.isPanning ? "grabbing" : "grab";
      if (banner) banner.style.display = "flex";
      if (bannerText) bannerText.textContent = "Canvas Pan: Drag anywhere to move canvas view. Scroll mouse wheel to zoom.";
    } else {
      if (cnv) cnv.style.cursor = "crosshair";
      if (banner) banner.style.display = "flex";

      // Guide text & step progress
      if (bannerText) {
        if (state.tool === 'rectangle') {
          bannerText.textContent = "Canvas Rubberband: Click & drag opposite corners to draw a rectangle.";
        } else if (state.tool === 'circle') {
          bannerText.textContent = "Canvas Rubberband: Click center & drag outward to set circle radius.";
        } else if (state.tool === 'line') {
          bannerText.textContent = "Canvas Rubberband: Click & drag start and end points to draw a straight line.";
        } else if (state.tool === 'curve') {
          var step = state.placedCurvePoints.length + 1;
          var stepDesc = step === 1 ? "Click to place Start Point (P₁)" :
                         (step === 2 ? "Click to place End Point (P₂) — sets curve span" :
                         (step === 3 ? "Click to place Control Point 1 (C₁) — bends curve" :
                                       "Click to place Control Point 2 (C₂) — or click C₁ to match (C₂ = C₁)"));
          bannerText.textContent = "Curve [Step " + step + "/4]: " + stepDesc;
        } else if (state.tool === 'point') {
          bannerText.textContent = "Canvas Point: Click anywhere to place a point.";
        } else if (state.tool === 'axis') {
          bannerText.textContent = "Interactive Axis: Drag arrowheads/corner to set limits, click axis to set ticks, or fine-tune in card.";
        }
      }

      // Update Curve Step Chips in Banner
      var curveStepsContainer = document.getElementById("curve-step-indicators");
      var undoBtn = document.getElementById("curve-undo-step-btn");
      var matchBtn = document.getElementById("curve-match-ctrl-btn");
      if (state.tool === 'curve') {
        if (curveStepsContainer) {
          curveStepsContainer.style.display = "flex";
          var curStep = state.placedCurvePoints.length + 1;
          for (var s = 1; s <= 4; s++) {
            var chip = document.getElementById("curve-step-" + s);
            if (chip) {
              chip.className = "curve-step-chip";
              if (s < curStep) {
                chip.classList.add("completed");
                chip.innerHTML = "✓ " + (s === 1 ? "P₁" : (s === 2 ? "P₂" : (s === 3 ? "C₁" : "C₂")));
              } else if (s === curStep) {
                chip.classList.add("active");
                chip.innerHTML = (s === 1 ? "1. Start P₁" : (s === 2 ? "2. End P₂" : (s === 3 ? "3. Ctrl C₁" : "4. Ctrl C₂")));
              } else {
                chip.innerHTML = (s === 1 ? "1. P₁" : (s === 2 ? "2. P₂" : (s === 3 ? "3. C₁" : "4. C₂")));
              }
            }
          }
        }
        if (undoBtn) {
          undoBtn.style.display = state.placedCurvePoints.length > 0 ? "inline-block" : "none";
        }
        if (matchBtn) {
          matchBtn.style.display = state.placedCurvePoints.length >= 2 ? "inline-block" : "none";
        }
      } else {
        if (curveStepsContainer) curveStepsContainer.style.display = "none";
        if (undoBtn) undoBtn.style.display = "none";
        if (matchBtn) matchBtn.style.display = "none";
      }
    }

    updateCheckedChipStyles();
  }

  function updateCheckedChipStyles() {
    document.querySelectorAll(".options-row label").forEach(function (label) {
      var input = label.querySelector("input[type='checkbox']");
      if (input) {
        if (input.checked) {
          label.classList.add("is-checked");
        } else {
          label.classList.remove("is-checked");
        }
      }
    });
  }

  /**
   * Render helper dot with optional label
   */
  function drawPointDot(ctx, x, y, color, label, isSelected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 6.5 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = color || "#4f46e5";
    ctx.fill();
    ctx.lineWidth = isSelected ? 2.5 : 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if (label) {
      ctx.font = "bold 11px system-ui, sans-serif";
      var txtWidth = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(x + 8, y - 18, txtWidth + 10, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x + 13, y - 5);
    }
    ctx.restore();
  }

  /**
   * Render prominent Anchor Pin (for Start P1 and End P2)
   */
  function drawAnchorPin(ctx, x, y, color, label, isTarget) {
    ctx.save();
    // Halo glow
    ctx.beginPath();
    ctx.arc(x, y, isTarget ? 11 : 9, 0, 2 * Math.PI);
    ctx.fillStyle = isTarget ? "rgba(16, 185, 129, 0.28)" : "rgba(79, 70, 229, 0.25)";
    ctx.fill();

    // Solid pin
    ctx.beginPath();
    ctx.arc(x, y, isTarget ? 6.5 : 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = color || "#4f46e5";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Center micro dot
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (label) {
      drawPillLabel(ctx, x + 12, y - 10, label, color || "#4f46e5");
    }
    ctx.restore();
  }

  /**
   * Render Control Point Diamond Handle (for C1 and C2)
   */
  function drawControlHandle(ctx, x, y, color, label, isTarget) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);

    if (isTarget) {
      ctx.beginPath();
      ctx.rect(-7, -7, 14, 14);
      ctx.fillStyle = "rgba(245, 158, 11, 0.35)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.rect(-5, -5, 10, 10);
    ctx.fillStyle = color || "#f59e0b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();

    if (label) {
      drawPillLabel(ctx, x + 12, y - 10, label, "#b45309");
    }
  }

  /**
   * Render Tangent Handlebar between Anchor and Control Point
   */
  function drawHandlebar(ctx, x1, y1, x2, y2, color, dash) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash || [4, 4]);
    ctx.strokeStyle = color || "#f59e0b";
    ctx.lineWidth = 1.8;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Render High-Contrast Pill Label with accent dot
   */
  function drawPillLabel(ctx, x, y, text, accentColor) {
    ctx.save();
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    var tw = ctx.measureText(text).width;
    var pillW = tw + 18;
    var pillH = 22;

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y - pillH / 2, pillW, pillH, 4);
    } else {
      ctx.rect(x, y - pillH / 2, pillW, pillH);
    }
    ctx.fill();

    // Accent dot
    ctx.beginPath();
    ctx.arc(x + 7, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = accentColor || "#38bdf8";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x + 14, y + 3.5);
    ctx.restore();
  }

  /**
   * Render Cursor HUD badge during curve drawing
   */
  function drawCurveCursorHUD(ctx, pos, step) {
    var stepTitles = [
      "Click to set Start Point (P₁)",
      "Click to set End Point (P₂) — sets curve span",
      "Click to set Control 1 (C₁) — bends curve",
      "Click to set Control 2 (C₂) — or click C₁ / button to match"
    ];
    var stepBadge = "Step " + step + "/4: " + (stepTitles[step - 1] || "");
    var coordStr = "(" + pos.x + ", " + pos.y + ")";
    var fullText = stepBadge + "  " + coordStr;

    ctx.save();
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    var tw = ctx.measureText(fullText).width;
    var pillW = tw + 20;
    var pillH = 24;

    var px = pos.screenX + 14;
    var py = pos.screenY + 14;

    var cnv = document.getElementById("previewCanvas");
    if (cnv) {
      if (px + pillW > cnv.width - 5) px = pos.screenX - pillW - 14;
      if (py + pillH > cnv.height - 5) py = pos.screenY - pillH - 14;
    }

    ctx.fillStyle = step === 4 ? "rgba(6, 78, 59, 0.94)" : (step === 1 ? "rgba(30, 27, 75, 0.94)" : "rgba(120, 53, 15, 0.94)");
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(px, py, pillW, pillH, 6);
    } else {
      ctx.rect(px, py, pillW, pillH);
    }
    ctx.fill();

    ctx.strokeStyle = step === 4 ? "#10b981" : (step === 1 ? "#818cf8" : "#fbbf24");
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(fullText, px + 10, py + 16);
    ctx.restore();
  }

  /**
   * Render Live Interactive Curve Drawing Workflow
   * Sequence: P1 (Start) -> P2 (End) -> C1 (Control 1) -> C2 (Control 2)
   */
  function renderLiveCurveWorkflow(ctx, placedPoints, currentPos) {
    if (!ctx) return;
    var step = placedPoints.length + 1;

    // 1. Crosshair & Dynamic Cursor HUD
    if (currentPos) {
      drawCursorCrosshair(ctx, currentPos);
      drawCurveCursorHUD(ctx, currentPos, step);
    }

    // 2. Render all placed points with anchor pins or control diamonds
    if (placedPoints.length >= 1) {
      var p1 = placedPoints[0];
      drawAnchorPin(ctx, p1.screenX, p1.screenY, "#4f46e5", "P₁ Start (" + p1.x + ", " + p1.y + ")", false);
    }

    if (placedPoints.length >= 2) {
      var p2 = placedPoints[1];
      drawAnchorPin(ctx, p2.screenX, p2.screenY, "#10b981", "P₂ End (" + p2.x + ", " + p2.y + ")", false);
    }

    if (placedPoints.length >= 3) {
      var p1 = placedPoints[0];
      var c1 = placedPoints[2];
      drawHandlebar(ctx, p1.screenX, p1.screenY, c1.screenX, c1.screenY, "#f59e0b", [4, 4]);
      drawControlHandle(ctx, c1.screenX, c1.screenY, "#f59e0b", "C₁ Ctrl 1 (" + c1.x + ", " + c1.y + ")", false);
    }

    // 3. Dynamic Visual Guides to Moving Cursor
    if (currentPos) {
      if (placedPoints.length === 0) {
        // Step 1: Placing P1
        drawAnchorPin(ctx, currentPos.screenX, currentPos.screenY, "#4f46e5", "Target P₁ (" + currentPos.x + ", " + currentPos.y + ")", true);
      } else if (placedPoints.length === 1) {
        // Step 2: Placing P2. Draw dashed chord line and distance badge between P1 and cursor
        var p1 = placedPoints[0];
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "rgba(79, 70, 229, 0.75)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(currentPos.screenX, currentPos.screenY);
        ctx.stroke();
        ctx.setLineDash([]);

        var span = Math.hypot(currentPos.x - p1.x, currentPos.y - p1.y).toFixed(2);
        var midX = (p1.screenX + currentPos.screenX) / 2;
        var midY = (p1.screenY + currentPos.screenY) / 2;
        drawPillLabel(ctx, midX - 25, midY - 10, "Span: " + span + " u", "#4f46e5");
        ctx.restore();

        drawAnchorPin(ctx, currentPos.screenX, currentPos.screenY, "#10b981", "Target P₂ (" + currentPos.x + ", " + currentPos.y + ")", true);
      } else if (placedPoints.length === 2) {
        // Step 3: P1 and P2 placed! Placing C1.
        // User moves cursor to bend curve (showing live arc where C2 = C1)
        var p1 = placedPoints[0];
        var p2 = placedPoints[1];

        // Handlebars from P1 to C1 and from P2 to C1
        drawHandlebar(ctx, p1.screenX, p1.screenY, currentPos.screenX, currentPos.screenY, "#f59e0b", [4, 4]);
        drawHandlebar(ctx, p2.screenX, p2.screenY, currentPos.screenX, currentPos.screenY, "rgba(245, 158, 11, 0.5)", [3, 3]);

        // Live preview curve assuming C2 = C1 (Smooth single-control arc)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.bezierCurveTo(currentPos.screenX, currentPos.screenY, currentPos.screenX, currentPos.screenY, p2.screenX, p2.screenY);
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.strokeStyle = "rgba(99, 102, 241, 0.25)";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();

        drawControlHandle(ctx, currentPos.screenX, currentPos.screenY, "#f59e0b", "Target C₁ (" + currentPos.x + ", " + currentPos.y + ")", true);
      } else if (placedPoints.length === 3) {
        // Step 4: P1, P2, and C1 placed! Placing C2.
        var p1 = placedPoints[0];
        var p2 = placedPoints[1];
        var c1 = placedPoints[2];

        // Check if cursor is very close to C1 (snapping for C2 = C1)
        var distToC1 = Math.hypot(currentPos.screenX - c1.screenX, currentPos.screenY - c1.screenY);
        var isNearC1 = distToC1 <= 16;
        var effectiveC2X = isNearC1 ? c1.screenX : currentPos.screenX;
        var effectiveC2Y = isNearC1 ? c1.screenY : currentPos.screenY;

        // Tangent handlebar from P2 to C2
        drawHandlebar(ctx, p2.screenX, p2.screenY, effectiveC2X, effectiveC2Y, "#f59e0b", [4, 4]);

        // Real-Time Full Cubic Bézier Spline
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.bezierCurveTo(c1.screenX, c1.screenY, effectiveC2X, effectiveC2Y, p2.screenX, p2.screenY);
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();

        // Subtle glow halo
        ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();

        var c2Label = isNearC1 ? "Snap: C₂ = C₁ (Single Arc)" : "Target C₂ (" + currentPos.x + ", " + currentPos.y + ")";
        drawControlHandle(ctx, effectiveC2X, effectiveC2Y, isNearC1 ? "#10b981" : "#f59e0b", c2Label, true);
      }
    }
  }

  /**
   * Draw fine crosshair guidelines at cursor
   */
  function drawCursorCrosshair(ctx, pos) {
    var cnv = document.getElementById("previewCanvas");
    if (!cnv || !pos) return;

    ctx.save();
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(0, pos.screenY);
    ctx.lineTo(cnv.width, pos.screenY);
    ctx.moveTo(pos.screenX, 0);
    ctx.lineTo(pos.screenX, cnv.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small coordinate badge at cursor (only if not drawing curve, curve has rich HUD)
    var state = window.drawingState;
    if (state.tool !== 'curve') {
      ctx.font = "10px monospace";
      var coordStr = "(" + pos.x + ", " + pos.y + ")";
      var tw = ctx.measureText(coordStr).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(pos.screenX + 8, pos.screenY + 8, tw + 8, 16);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(coordStr, pos.screenX + 12, pos.screenY + 20);
    }

    ctx.restore();
  }

  /**
   * Render Live Interactive Point / Label Placement Workflow
   */
  function renderLivePointWorkflow(ctx, pos) {
    if (!ctx || !pos) return;
    drawCursorCrosshair(ctx, pos);

    ctx.save();
    // Pulsing cyan/blue target ring around cursor
    ctx.beginPath();
    ctx.arc(pos.screenX, pos.screenY, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(14, 165, 233, 0.15)";
    ctx.fill();
    ctx.stroke();

    // Center point marker dot
    ctx.beginPath();
    ctx.arc(pos.screenX, pos.screenY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#0284c7";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Floating HUD pill badge
    var fullText = "📍 Click to place Point (" + pos.x + ", " + pos.y + ") — type text in card";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    var tw = ctx.measureText(fullText).width;
    var pillW = tw + 18;
    var pillH = 24;
    var px = pos.screenX + 14;
    var py = pos.screenY + 14;

    var cnv = document.getElementById("previewCanvas");
    if (cnv) {
      if (px + pillW > cnv.width - 5) px = pos.screenX - pillW - 14;
      if (py + pillH > cnv.height - 5) py = pos.screenY - pillH - 14;
    }

    ctx.fillStyle = "rgba(12, 74, 110, 0.94)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(px, py, pillW, pillH, 6);
    } else {
      ctx.rect(px, py, pillW, pillH);
    }
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(fullText, px + 9, py + 16);
    ctx.restore();
  }

  /**
   * Render all overlays: live rubberband, candidate shape with draggable handles, selected shape
   */
  function renderAllOverlays() {
    var previewCnv = document.getElementById("previewCanvas");
    if (!previewCnv) return;
    var ctx = previewCnv.getContext("2d");
    ctx.clearRect(0, 0, previewCnv.width, previewCnv.height);

    var state = window.drawingState;

    // 1. Draw candidate shape awaiting confirmation
    if (state.candidate) {
      renderCandidateShape(ctx, state.candidate);
    }

    // 2. Draw selected shape in select mode
    if (state.selectedShape && !state.candidate) {
      renderSelectedShape(ctx, state.selectedShape);
    }

    // 3. Draw live curve workflow, point workflow, axis workflow, OR live rubberband preview
    if (state.tool === 'axis' && !state.candidate) {
      renderAxisHandles(ctx, state.activeAxisHandle);
      if (state.isMouseDown && state.dragStartPos && state.currentPos) {
        renderLiveRubberband(ctx, state.dragStartPos, state.currentPos);
      }
    } else if (state.tool === 'curve' && !state.candidate) {
      renderLiveCurveWorkflow(ctx, state.placedCurvePoints, state.currentPos);
    } else if (state.tool === 'point' && !state.candidate && state.currentPos) {
      renderLivePointWorkflow(ctx, state.currentPos);
    } else if (state.isMouseDown && state.dragStartPos && state.currentPos) {
      renderLiveRubberband(ctx, state.dragStartPos, state.currentPos);
    } else if (state.currentPos && !state.candidate) {
      drawCursorCrosshair(ctx, state.currentPos);
    }
  }

  /**
   * Render live rubberband drag
   */
  function renderLiveRubberband(ctx, start, current) {
    var state = window.drawingState;
    drawCursorCrosshair(ctx, current);

    if (state.tool === 'rectangle') {
      var minX = Math.min(start.screenX, current.screenX);
      var minY = Math.min(start.screenY, current.screenY);
      var w = Math.abs(current.screenX - start.screenX);
      var h = Math.abs(current.screenY - start.screenY);

      ctx.save();
      // Translucent fill
      ctx.fillStyle = "rgba(79, 70, 229, 0.12)";
      ctx.fillRect(minX, minY, w, h);

      // Dashed border
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(minX, minY, w, h);
      ctx.setLineDash([]);

      // Corner handles
      drawPointDot(ctx, start.screenX, start.screenY, "#4f46e5", "Corner 1 (" + start.x + ", " + start.y + ")");
      drawPointDot(ctx, current.screenX, current.screenY, "#4f46e5", "Corner 2 (" + current.x + ", " + current.y + ")");

      // Dimension badge
      var dimStr = Math.abs(current.x - start.x).toFixed(1) + " × " + Math.abs(current.y - start.y).toFixed(1);
      ctx.font = "bold 11px system-ui, sans-serif";
      var dtw = ctx.measureText(dimStr).width;
      ctx.fillStyle = "#4f46e5";
      ctx.fillRect(minX + w / 2 - dtw / 2 - 6, minY - 20, dtw + 12, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(dimStr, minX + w / 2 - dtw / 2, minY - 7);

      ctx.restore();
    } else if (state.tool === 'circle') {
      var rMath = Math.hypot(current.x - start.x, current.y - start.y);
      var curScale = typeof scale !== 'undefined' ? scale : 35;
      var rPx = rMath * curScale;

      ctx.save();
      // Translucent fill
      ctx.fillStyle = "rgba(79, 70, 229, 0.12)";
      ctx.beginPath();
      ctx.arc(start.screenX, start.screenY, rPx, 0, Math.PI * 2);
      ctx.fill();

      // Dashed border
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(start.screenX, start.screenY, rPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Radius line guide from center to current cursor
      ctx.beginPath();
      ctx.strokeStyle = "rgba(79, 70, 229, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(start.screenX, start.screenY);
      ctx.lineTo(current.screenX, current.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center and perimeter points
      drawPointDot(ctx, start.screenX, start.screenY, "#10b981", "Center (" + start.x + ", " + start.y + ")");
      drawPointDot(ctx, current.screenX, current.screenY, "#4f46e5", "R=" + rMath.toFixed(1));

      // Radius badge
      var dimStr = "R = " + rMath.toFixed(2) + " units";
      ctx.font = "bold 11px system-ui, sans-serif";
      var dtw = ctx.measureText(dimStr).width;
      ctx.fillStyle = "#4f46e5";
      ctx.fillRect(start.screenX - dtw / 2 - 6, start.screenY - rPx - 22, dtw + 12, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(dimStr, start.screenX - dtw / 2, start.screenY - rPx - 9);

      ctx.restore();
    } else if (state.tool === 'line') {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.moveTo(start.screenX, start.screenY);
      ctx.lineTo(current.screenX, current.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPointDot(ctx, start.screenX, start.screenY, "#4f46e5", "P1 (" + start.x + ", " + start.y + ")");
      drawPointDot(ctx, current.screenX, current.screenY, "#4f46e5", "P2 (" + current.x + ", " + current.y + ")");

      var dx = current.x - start.x;
      var dy = current.y - start.y;
      var dist = Math.hypot(dx, dy).toFixed(2);
      var slope = Math.abs(dx) < 0.0001 ? "∞" : (dy / dx).toFixed(2);
      var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);

      var midX = (start.screenX + current.screenX) / 2;
      var midY = (start.screenY + current.screenY) / 2;
      var badgeText = "L: " + dist + " u | " + angle + "° (Slope: " + slope + ")";
      ctx.font = "bold 11px system-ui, sans-serif";
      var dtw = ctx.measureText(badgeText).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(midX - dtw / 2 - 8, midY - 24, dtw + 16, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(badgeText, midX - dtw / 2, midY - 10);
      ctx.restore();
    } else if (state.tool === 'curve') {
      ctx.save();
      for (var i = 0; i < state.placedCurvePoints.length; i++) {
        var pt = state.placedCurvePoints[i];
        var label = i === 0 ? "Start" : (i === 1 ? "Ctrl 1" : (i === 2 ? "Ctrl 2" : "End"));
        drawPointDot(ctx, pt.screenX, pt.screenY, "#4f46e5", label + " (" + pt.x + ", " + pt.y + ")");
      }
      if (state.placedCurvePoints.length > 0) {
        var lastPt = state.placedCurvePoints[state.placedCurvePoints.length - 1];
        ctx.beginPath();
        ctx.strokeStyle = "rgba(79, 70, 229, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(lastPt.screenX, lastPt.screenY);
        ctx.lineTo(current.screenX, current.screenY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    } else if (state.tool === 'axis') {
      ctx.save();
      var origin = window.mathToScreen(0, 0);
      var endX = Math.max(1, Math.round(current.x * 2) / 2);
      var endY = Math.max(1, Math.round(current.y * 2) / 2);
      var pCorner = window.mathToScreen(endX, endY);
      var pXArrow = window.mathToScreen(endX, 0);
      var pYArrow = window.mathToScreen(0, endY);

      // Translucent quadrant preview
      ctx.fillStyle = "rgba(79, 70, 229, 0.08)";
      ctx.fillRect(origin.screenX, pCorner.screenY, pXArrow.screenX - origin.screenX, origin.screenY - pCorner.screenY);

      // Dashed quadrant border
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(origin.screenX, pCorner.screenY, pXArrow.screenX - origin.screenX, origin.screenY - pCorner.screenY);
      ctx.setLineDash([]);

      // Arrow guides
      drawDiamondHandle(ctx, pXArrow.screenX, pXArrow.screenY, "#4f46e5", true);
      drawDiamondHandle(ctx, pYArrow.screenX, pYArrow.screenY, "#4f46e5", true);
      drawPointDot(ctx, pCorner.screenX, pCorner.screenY, "#3b82f6", "Set Limits: " + endX + " × " + endY, true);

      ctx.restore();
    }
  }

  /**
   * Helper: extract current axis values and labels from DOM
   */
  function getAxisData() {
    var xsizeEl = document.getElementById("xsize");
    var ysizeEl = document.getElementById("ysize");
    var xnameEl = document.getElementById("xname");
    var ynameEl = document.getElementById("yname");
    var originEl = document.getElementById("label_origin_name");

    var x1El = document.getElementById("label_x_1");
    var x1NameEl = document.getElementById("label_x_1_name");
    var x2El = document.getElementById("label_x_2");
    var x2NameEl = document.getElementById("label_x_2_name");

    var y1El = document.getElementById("label_y_1");
    var y1NameEl = document.getElementById("label_y_1_name");
    var y2El = document.getElementById("label_y_2");
    var y2NameEl = document.getElementById("label_y_2_name");

    var rawX = parseFloat(xsizeEl ? xsizeEl.value : 0) || 0;
    var rawY = parseFloat(ysizeEl ? ysizeEl.value : 0) || 0;
    var effX = rawX > 0 ? rawX : 10;
    var effY = rawY > 0 ? rawY : 10;

    return {
      rawXSize: rawX,
      rawYSize: rawY,
      effectiveXSize: effX,
      effectiveYSize: effY,
      xname: xnameEl ? xnameEl.value.trim() : "",
      yname: ynameEl ? ynameEl.value.trim() : "",
      originName: originEl ? originEl.value.trim() : "",
      x1: parseFloat(x1El ? x1El.value : 0) || 0,
      x1Name: x1NameEl ? x1NameEl.value.trim() : "",
      x2: parseFloat(x2El ? x2El.value : 0) || 0,
      x2Name: x2NameEl ? x2NameEl.value.trim() : "",
      y1: parseFloat(y1El ? y1El.value : 0) || 0,
      y1Name: y1NameEl ? y1NameEl.value.trim() : "",
      y2: parseFloat(y2El ? y2El.value : 0) || 0,
      y2Name: y2NameEl ? y2NameEl.value.trim() : ""
    };
  }

  /**
   * Hit test handles for Axis (Arrows, Corner, Ticks, Origin)
   */
  function hitTestAxisHandles(pos) {
    var axis = getAxisData();
    var pXArrow = window.mathToScreen(axis.effectiveXSize, 0);
    var pYArrow = window.mathToScreen(0, axis.effectiveYSize);
    var pCorner = window.mathToScreen(axis.effectiveXSize, axis.effectiveYSize);
    var pOrigin = window.mathToScreen(0, 0);

    var threshold = 14;

    if (Math.hypot(pos.screenX - pXArrow.screenX, pos.screenY - pXArrow.screenY) <= threshold + 4) return 'x_arrow';
    if (Math.hypot(pos.screenX - pYArrow.screenX, pos.screenY - pYArrow.screenY) <= threshold + 4) return 'y_arrow';
    if (Math.hypot(pos.screenX - pCorner.screenX, pos.screenY - pCorner.screenY) <= threshold + 4) return 'corner';

    if (axis.x1 > 0 || axis.x1Name !== "") {
      var pX1 = window.mathToScreen(axis.x1, 0);
      if (Math.hypot(pos.screenX - pX1.screenX, pos.screenY - pX1.screenY) <= threshold) return 'x_tick_1';
    }
    if (axis.x2 > 0 || axis.x2Name !== "") {
      var pX2 = window.mathToScreen(axis.x2, 0);
      if (Math.hypot(pos.screenX - pX2.screenX, pos.screenY - pX2.screenY) <= threshold) return 'x_tick_2';
    }
    if (axis.y1 > 0 || axis.y1Name !== "") {
      var pY1 = window.mathToScreen(0, axis.y1);
      if (Math.hypot(pos.screenX - pY1.screenX, pos.screenY - pY1.screenY) <= threshold) return 'y_tick_1';
    }
    if (axis.y2 > 0 || axis.y2Name !== "") {
      var pY2 = window.mathToScreen(0, axis.y2);
      if (Math.hypot(pos.screenX - pY2.screenX, pos.screenY - pY2.screenY) <= threshold) return 'y_tick_2';
    }

    if (Math.hypot(pos.screenX - pOrigin.screenX, pos.screenY - pOrigin.screenY) <= threshold) return 'origin';

    return null;
  }

  /**
   * Drag specific handle of Axis
   */
  function dragAxisHandle(handle, pos) {
    var xsizeEl = document.getElementById("xsize");
    var ysizeEl = document.getElementById("ysize");

    if (handle === 'x_arrow') {
      var newX = Math.max(1, Math.round(pos.x * 2) / 2);
      if (xsizeEl) xsizeEl.value = newX;
    } else if (handle === 'y_arrow') {
      var newY = Math.max(1, Math.round(pos.y * 2) / 2);
      if (ysizeEl) ysizeEl.value = newY;
    } else if (handle === 'corner') {
      var newX = Math.max(1, Math.round(pos.x * 2) / 2);
      var newY = Math.max(1, Math.round(pos.y * 2) / 2);
      if (xsizeEl) xsizeEl.value = newX;
      if (ysizeEl) ysizeEl.value = newY;
    } else if (handle === 'x_tick_1') {
      var x1El = document.getElementById("label_x_1");
      if (x1El) x1El.value = Math.max(0, Math.round(pos.x * 2) / 2);
    } else if (handle === 'x_tick_2') {
      var x2El = document.getElementById("label_x_2");
      if (x2El) x2El.value = Math.max(0, Math.round(pos.x * 2) / 2);
    } else if (handle === 'y_tick_1') {
      var y1El = document.getElementById("label_y_1");
      if (y1El) y1El.value = Math.max(0, Math.round(pos.y * 2) / 2);
    } else if (handle === 'y_tick_2') {
      var y2El = document.getElementById("label_y_2");
      if (y2El) y2El.value = Math.max(0, Math.round(pos.y * 2) / 2);
    }

    if (typeof DrawGraph === 'function') DrawGraph();
    if (typeof updateAxisCardUI === 'function') updateAxisCardUI();
  }

  /**
   * Set or update a tick along the given axis by clicking
   */
  function setOrMoveAxisTick(axisType, value) {
    var rounded = Math.max(0.5, Math.round(value * 2) / 2);
    if (axisType === 'x') {
      var x1Val = parseFloat(document.getElementById("label_x_1")?.value) || 0;
      var x1Name = document.getElementById("label_x_1_name")?.value || "";
      var x2Val = parseFloat(document.getElementById("label_x_2")?.value) || 0;
      var x2Name = document.getElementById("label_x_2_name")?.value || "";

      if (x1Val === 0 && !x1Name) {
        document.getElementById("label_x_1").value = rounded;
        document.getElementById("label_x_1_name").value = "x₁";
      } else if (x2Val === 0 && !x2Name) {
        document.getElementById("label_x_2").value = rounded;
        document.getElementById("label_x_2_name").value = "x₂";
      } else {
        var d1 = Math.abs(x1Val - rounded);
        var d2 = Math.abs(x2Val - rounded);
        if (d1 <= d2) {
          document.getElementById("label_x_1").value = rounded;
        } else {
          document.getElementById("label_x_2").value = rounded;
        }
      }
    } else {
      var y1Val = parseFloat(document.getElementById("label_y_1")?.value) || 0;
      var y1Name = document.getElementById("label_y_1_name")?.value || "";
      var y2Val = parseFloat(document.getElementById("label_y_2")?.value) || 0;
      var y2Name = document.getElementById("label_y_2_name")?.value || "";

      if (y1Val === 0 && !y1Name) {
        document.getElementById("label_y_1").value = rounded;
        document.getElementById("label_y_1_name").value = "y₁";
      } else if (y2Val === 0 && !y2Name) {
        document.getElementById("label_y_2").value = rounded;
        document.getElementById("label_y_2_name").value = "y₂";
      } else {
        var d1 = Math.abs(y1Val - rounded);
        var d2 = Math.abs(y2Val - rounded);
        if (d1 <= d2) {
          document.getElementById("label_y_1").value = rounded;
        } else {
          document.getElementById("label_y_2").value = rounded;
        }
      }
    }

    if (typeof DrawGraph === 'function') DrawGraph();
    if (typeof updateAxisCardUI === 'function') updateAxisCardUI();
    renderAllOverlays();
    if (window.showToast) {
      window.showToast("✓ Tick placed at " + rounded + " on " + (axisType === 'x' ? 'X' : 'Y') + "-axis");
    }
  }

  /**
   * Render interactive handles and labels for the Axis
   */
  function renderAxisHandles(ctx, activeHandle) {
    var axis = getAxisData();
    var pOrigin = window.mathToScreen(0, 0);
    var pXArrow = window.mathToScreen(axis.effectiveXSize, 0);
    var pYArrow = window.mathToScreen(0, axis.effectiveYSize);
    var pCorner = window.mathToScreen(axis.effectiveXSize, axis.effectiveYSize);

    ctx.save();

    // 1. Quadrant bounding box (subtle guide)
    ctx.fillStyle = "rgba(99, 102, 241, 0.04)";
    ctx.fillRect(pOrigin.screenX, pCorner.screenY, pXArrow.screenX - pOrigin.screenX, pOrigin.screenY - pCorner.screenY);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pYArrow.screenX, pYArrow.screenY);
    ctx.lineTo(pCorner.screenX, pCorner.screenY);
    ctx.lineTo(pXArrow.screenX, pXArrow.screenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Highlighting Axis lines
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pOrigin.screenX, pOrigin.screenY);
    ctx.lineTo(pYArrow.screenX, pYArrow.screenY);
    ctx.moveTo(pOrigin.screenX, pOrigin.screenY);
    ctx.lineTo(pXArrow.screenX, pXArrow.screenY);
    ctx.stroke();

    // 3. Corner handle at (effectiveXSize, effectiveYSize)
    var isCornerActive = activeHandle === 'corner';
    ctx.fillStyle = isCornerActive ? "#3b82f6" : "#4f46e5";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pCorner.screenX, pCorner.screenY, isCornerActive ? 7.5 : 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    drawHandlePill(ctx, pCorner.screenX, pCorner.screenY - 14, axis.effectiveXSize + " × " + axis.effectiveYSize, isCornerActive);

    // 4. X-Arrowhead handle at (effectiveXSize, 0)
    var isXArrowActive = activeHandle === 'x_arrow';
    drawDiamondHandle(ctx, pXArrow.screenX, pXArrow.screenY, isXArrowActive ? "#3b82f6" : "#4f46e5", isXArrowActive);
    drawHandlePill(ctx, pXArrow.screenX + 8, pXArrow.screenY + 18, "X Max: " + axis.effectiveXSize, isXArrowActive);

    // 5. Y-Arrowhead handle at (0, effectiveYSize)
    var isYArrowActive = activeHandle === 'y_arrow';
    drawDiamondHandle(ctx, pYArrow.screenX, pYArrow.screenY, isYArrowActive ? "#3b82f6" : "#4f46e5", isYArrowActive);
    drawHandlePill(ctx, pYArrow.screenX - 12, pYArrow.screenY - 16, "Y Max: " + axis.effectiveYSize, isYArrowActive);

    // 6. Origin handle at (0, 0)
    var isOriginActive = activeHandle === 'origin';
    drawAnchorPin(ctx, pOrigin.screenX, pOrigin.screenY, isOriginActive ? "#3b82f6" : "#64748b", axis.originName ? ("Origin: " + axis.originName) : "Origin", isOriginActive);

    // 7. Tick Handles
    var drawTickPin = function (sx, sy, label, val, isX, isActive) {
      ctx.strokeStyle = isActive ? "#3b82f6" : "#d97706";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (isX) {
        ctx.moveTo(sx, sy - 6);
        ctx.lineTo(sx, sy + 6);
      } else {
        ctx.moveTo(sx - 6, sy);
        ctx.lineTo(sx + 6, sy);
      }
      ctx.stroke();

      ctx.fillStyle = isActive ? "#3b82f6" : "#f59e0b";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      var badgeText = (label || (isX ? "x" : "y")) + ": " + val;
      var pillY = isX ? (sy + 18) : sy;
      var pillX = isX ? sx : (sx - 36);
      drawHandlePill(ctx, pillX, pillY, badgeText, isActive);
    };

    if (axis.x1 > 0 || axis.x1Name !== "") {
      var pX1 = window.mathToScreen(axis.x1, 0);
      drawTickPin(pX1.screenX, pX1.screenY, axis.x1Name, axis.x1, true, activeHandle === 'x_tick_1');
    }
    if (axis.x2 > 0 || axis.x2Name !== "") {
      var pX2 = window.mathToScreen(axis.x2, 0);
      drawTickPin(pX2.screenX, pX2.screenY, axis.x2Name, axis.x2, true, activeHandle === 'x_tick_2');
    }
    if (axis.y1 > 0 || axis.y1Name !== "") {
      var pY1 = window.mathToScreen(0, axis.y1);
      drawTickPin(pY1.screenX, pY1.screenY, axis.y1Name, axis.y1, false, activeHandle === 'y_tick_1');
    }
    if (axis.y2 > 0 || axis.y2Name !== "") {
      var pY2 = window.mathToScreen(0, axis.y2);
      drawTickPin(pY2.screenX, pY2.screenY, axis.y2Name, axis.y2, false, activeHandle === 'y_tick_2');
    }

    // 8. Axis Names Badges
    if (axis.xname) {
      var pXName = window.mathToScreen(axis.effectiveXSize + 0.3, 0);
      drawHandlePill(ctx, pXName.screenX + 16, pXName.screenY - 14, "Label: " + axis.xname, false);
    }
    if (axis.yname) {
      var pYName = window.mathToScreen(0, axis.effectiveYSize + 0.3);
      drawHandlePill(ctx, pYName.screenX + 24, pYName.screenY - 12, "Label: " + axis.yname, false);
    }

    ctx.restore();
  }

  function drawDiamondHandle(ctx, x, y, color, active) {
    ctx.save();
    var size = active ? 8 : 6.5;
    ctx.fillStyle = color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (active) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size + 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHandlePill(ctx, x, y, text, active) {
    ctx.save();
    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    var textWidth = ctx.measureText(text).width;
    var px = x - textWidth / 2 - 6;
    var py = y - 8;
    var pw = textWidth + 12;
    var ph = 16;

    ctx.fillStyle = active ? "#1e1b4b" : "rgba(15, 23, 42, 0.82)";
    ctx.strokeStyle = active ? "#3b82f6" : "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(px, py, pw, ph, 4);
    } else {
      ctx.rect(px, py, pw, ph);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Floating Axis Confirmation Card Management
  window.openAxisCard = function () {
    var card = document.getElementById("axis-confirm-card");
    if (!card) return;
    updateAxisCardUI();
    card.style.display = "block";
  };

  window.closeAxisCard = function () {
    var card = document.getElementById("axis-confirm-card");
    if (card) card.style.display = "none";
  };

  window.confirmAxisCard = function () {
    closeAxisCard();
    if (typeof DrawGraph === 'function') DrawGraph();
    renderAllOverlays();
    if (window.showToast) {
      var ax = getAxisData();
      window.showToast("✓ Axis configuration confirmed (" + ax.effectiveXSize + " × " + ax.effectiveYSize + ")");
    }
  };

  window.updateAxisCardUI = function () {
    var card = document.getElementById("axis-confirm-card");
    if (!card) return;
    var ax = getAxisData();

    var limits = document.getElementById("axis-card-limits");
    if (limits) limits.textContent = "X: 0 → " + ax.effectiveXSize + " | Y: 0 → " + ax.effectiveYSize;

    var xsizeIn = document.getElementById("axis-card-xsize");
    if (xsizeIn && document.activeElement !== xsizeIn) xsizeIn.value = ax.effectiveXSize;

    var ysizeIn = document.getElementById("axis-card-ysize");
    if (ysizeIn && document.activeElement !== ysizeIn) ysizeIn.value = ax.effectiveYSize;

    var xnameIn = document.getElementById("axis-card-xname");
    if (xnameIn && document.activeElement !== xnameIn) xnameIn.value = ax.xname;

    var ynameIn = document.getElementById("axis-card-yname");
    if (ynameIn && document.activeElement !== ynameIn) ynameIn.value = ax.yname;

    var originIn = document.getElementById("axis-card-origin");
    if (originIn && document.activeElement !== originIn) originIn.value = ax.originName;

    var x1NameIn = document.getElementById("axis-card-x1-name");
    if (x1NameIn && document.activeElement !== x1NameIn) x1NameIn.value = ax.x1Name;
    var x1ValIn = document.getElementById("axis-card-x1-val");
    if (x1ValIn && document.activeElement !== x1ValIn) x1ValIn.value = ax.x1;

    var x2NameIn = document.getElementById("axis-card-x2-name");
    if (x2NameIn && document.activeElement !== x2NameIn) x2NameIn.value = ax.x2Name;
    var x2ValIn = document.getElementById("axis-card-x2-val");
    if (x2ValIn && document.activeElement !== x2ValIn) x2ValIn.value = ax.x2;

    var y1NameIn = document.getElementById("axis-card-y1-name");
    if (y1NameIn && document.activeElement !== y1NameIn) y1NameIn.value = ax.y1Name;
    var y1ValIn = document.getElementById("axis-card-y1-val");
    if (y1ValIn && document.activeElement !== y1ValIn) y1ValIn.value = ax.y1;

    var y2NameIn = document.getElementById("axis-card-y2-name");
    if (y2NameIn && document.activeElement !== y2NameIn) y2NameIn.value = ax.y2Name;
    var y2ValIn = document.getElementById("axis-card-y2-val");
    if (y2ValIn && document.activeElement !== y2ValIn) y2ValIn.value = ax.y2;
  };

  window.syncAxisFromCard = function (field, val) {
    if (field === 'xsize') {
      var el = document.getElementById("xsize");
      if (el) el.value = val;
    } else if (field === 'ysize') {
      var el = document.getElementById("ysize");
      if (el) el.value = val;
    } else if (field === 'xname') {
      var el = document.getElementById("xname");
      if (el) el.value = val;
    } else if (field === 'yname') {
      var el = document.getElementById("yname");
      if (el) el.value = val;
    } else if (field === 'origin') {
      var el = document.getElementById("label_origin_name");
      if (el) el.value = val;
    } else if (field === 'x1_name') {
      var el = document.getElementById("label_x_1_name");
      if (el) el.value = val;
    } else if (field === 'x1_val') {
      var el = document.getElementById("label_x_1");
      if (el) el.value = val;
    } else if (field === 'x2_name') {
      var el = document.getElementById("label_x_2_name");
      if (el) el.value = val;
    } else if (field === 'x2_val') {
      var el = document.getElementById("label_x_2");
      if (el) el.value = val;
    } else if (field === 'y1_name') {
      var el = document.getElementById("label_y_1_name");
      if (el) el.value = val;
    } else if (field === 'y1_val') {
      var el = document.getElementById("label_y_1");
      if (el) el.value = val;
    } else if (field === 'y2_name') {
      var el = document.getElementById("label_y_2_name");
      if (el) el.value = val;
    } else if (field === 'y2_val') {
      var el = document.getElementById("label_y_2");
      if (el) el.value = val;
    }

    var limits = document.getElementById("axis-card-limits");
    if (limits) {
      var ax = getAxisData();
      limits.textContent = "X: 0 → " + ax.effectiveXSize + " | Y: 0 → " + ax.effectiveYSize;
    }

    if (typeof DrawGraph === 'function') DrawGraph();
    renderAllOverlays();
  };

  window.setAxisPreset = function (x, y) {
    var xEl = document.getElementById("xsize");
    var yEl = document.getElementById("ysize");
    if (xEl) xEl.value = x;
    if (yEl) yEl.value = y;
    updateAxisCardUI();
    if (typeof DrawGraph === 'function') DrawGraph();
    renderAllOverlays();
    if (window.showToast) {
      window.showToast("✓ Axis preset applied: " + x + " × " + y);
    }
  };

  window.setQuickAxisLabel = function (field, text) {
    syncAxisFromCard(field, text);
    updateAxisCardUI();
  };

  window.activateAxisOnCanvas = function () {
    window.setDrawTool('axis');
    var canvasStage = document.querySelector(".canvas-stage-wrapper");
    if (canvasStage) {
      canvasStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Helper: Draw an arrowhead on 2D canvas
   */
  function drawCanvasArrowhead(ctx, fromX, fromY, toX, toY, color, width) {
    var angle = Math.atan2(toY - fromY, toX - fromX);
    var headLen = Math.max(10, width * 3);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Render Candidate Shape with Draggable Handles & Confirmation Highlights
   */
  function renderCandidateShape(ctx, candidate) {
    ctx.save();

    if (candidate.type === 'rectangle') {
      var p1 = window.mathToScreen(candidate.start.x, candidate.start.y);
      var p2 = window.mathToScreen(candidate.end.x, candidate.end.y);
      var minX = Math.min(p1.screenX, p2.screenX);
      var minY = Math.min(p1.screenY, p2.screenY);
      var w = Math.abs(p2.screenX - p1.screenX);
      var h = Math.abs(p2.screenY - p1.screenY);

      // Semi-transparent background
      ctx.fillStyle = "rgba(79, 70, 229, 0.16)";
      ctx.fillRect(minX, minY, w, h);

      // Solid/Dashed border according to candidate setting
      ctx.strokeStyle = candidate.color === 'black' ? '#1e293b' : candidate.color;
      ctx.lineWidth = 2.5;
      if (candidate.dashed) {
        ctx.setLineDash([6, 4]);
      }
      ctx.strokeRect(minX, minY, w, h);
      ctx.setLineDash([]);

      // 4 Draggable Corner Handles
      drawPointDot(ctx, minX, minY, "#4f46e5", null, candidate.activeHandle === 'c1');
      drawPointDot(ctx, minX + w, minY, "#4f46e5", null, candidate.activeHandle === 'c2');
      drawPointDot(ctx, minX + w, minY + h, "#4f46e5", null, candidate.activeHandle === 'c3');
      drawPointDot(ctx, minX, minY + h, "#4f46e5", null, candidate.activeHandle === 'c4');

      // Center move handle
      drawPointDot(ctx, minX + w / 2, minY + h / 2, "#10b981", "Move", candidate.activeHandle === 'center');

      // Dimension pill
      var dimStr = Math.abs(candidate.end.x - candidate.start.x).toFixed(1) + " × " + Math.abs(candidate.end.y - candidate.start.y).toFixed(1) + " units";
      ctx.font = "bold 11px system-ui, sans-serif";
      var dtw = ctx.measureText(dimStr).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(minX + w / 2 - dtw / 2 - 8, minY - 22, dtw + 16, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(dimStr, minX + w / 2 - dtw / 2, minY - 8);

    } else if (candidate.type === 'circle') {
      var center = window.mathToScreen(candidate.center.x, candidate.center.y);
      var curScale = typeof scale !== 'undefined' ? scale : 35;
      var radiusScreen = candidate.radius * curScale;

      // Semi-transparent background
      ctx.fillStyle = "rgba(79, 70, 229, 0.16)";
      ctx.beginPath();
      ctx.arc(center.screenX, center.screenY, radiusScreen, 0, Math.PI * 2);
      ctx.fill();

      // Border outline
      ctx.strokeStyle = candidate.color === 'black' ? '#1e293b' : candidate.color;
      ctx.lineWidth = 2.5;
      if (candidate.dashed) {
        ctx.setLineDash([6, 4]);
      }
      ctx.beginPath();
      ctx.arc(center.screenX, center.screenY, radiusScreen, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center move handle
      drawPointDot(ctx, center.screenX, center.screenY, "#10b981", "Center (" + candidate.center.x + ", " + candidate.center.y + ")", candidate.activeHandle === 'center');

      // Cardinal perimeter handles for adjusting radius
      drawPointDot(ctx, center.screenX + radiusScreen, center.screenY, "#4f46e5", "R=" + candidate.radius.toFixed(1), candidate.activeHandle === 'radius_e');
      drawPointDot(ctx, center.screenX - radiusScreen, center.screenY, "#4f46e5", null, candidate.activeHandle === 'radius_w');
      drawPointDot(ctx, center.screenX, center.screenY - radiusScreen, "#4f46e5", null, candidate.activeHandle === 'radius_n');
      drawPointDot(ctx, center.screenX, center.screenY + radiusScreen, "#4f46e5", null, candidate.activeHandle === 'radius_s');

      // Dimension pill
      var dimStr = "Radius: " + candidate.radius.toFixed(2) + " units";
      ctx.font = "bold 11px system-ui, sans-serif";
      var dtw = ctx.measureText(dimStr).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(center.screenX - dtw / 2 - 8, center.screenY - radiusScreen - 24, dtw + 16, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(dimStr, center.screenX - dtw / 2, center.screenY - radiusScreen - 10);

    } else if (candidate.type === 'line') {
      var p1 = window.mathToScreen(candidate.start.x, candidate.start.y);
      var p2 = window.mathToScreen(candidate.end.x, candidate.end.y);

      ctx.beginPath();
      ctx.strokeStyle = candidate.color === 'black' ? '#1e293b' : candidate.color;
      var lw = 3;
      if (candidate.width === 'ultra thin') lw = 1;
      else if (candidate.width === 'very thin') lw = 1.5;
      else if (candidate.width === 'thin') lw = 2;
      else if (candidate.width === 'semithick') lw = 3;
      else if (candidate.width === 'thick') lw = 4;
      else if (candidate.width === 'very thick') lw = 5;
      else if (candidate.width === 'ultra thick') lw = 6.5;
      ctx.lineWidth = lw;

      if (candidate.style === 'dashed' || candidate.dashed) {
        ctx.setLineDash([6, 4]);
      } else if (candidate.style === 'dotted') {
        ctx.setLineDash([2.5, 3]);
      } else if (candidate.style === 'loosely dashed') {
        ctx.setLineDash([8, 8]);
      } else if (candidate.style === 'densely dashed') {
        ctx.setLineDash([4, 2.5]);
      }
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrowheads if any
      var arrow = candidate.arrow || 'none';
      if (arrow === '->' || arrow === '<->') {
        drawCanvasArrowhead(ctx, p1.screenX, p1.screenY, p2.screenX, p2.screenY, ctx.strokeStyle, lw);
      }
      if (arrow === '<-' || arrow === '<->') {
        drawCanvasArrowhead(ctx, p2.screenX, p2.screenY, p1.screenX, p1.screenY, ctx.strokeStyle, lw);
      }

      // Handles at endpoints and midpoint
      drawPointDot(ctx, p1.screenX, p1.screenY, "#4f46e5", "P1 (" + candidate.start.x + ", " + candidate.start.y + ")", candidate.activeHandle === 'p1');
      drawPointDot(ctx, p2.screenX, p2.screenY, "#4f46e5", "P2 (" + candidate.end.x + ", " + candidate.end.y + ")", candidate.activeHandle === 'p2');

      var midX = (p1.screenX + p2.screenX) / 2;
      var midY = (p1.screenY + p2.screenY) / 2;
      drawPointDot(ctx, midX, midY, "#10b981", "Move", candidate.activeHandle === 'mid');

      var dx = candidate.end.x - candidate.start.x;
      var dy = candidate.end.y - candidate.start.y;
      var len = Math.hypot(dx, dy).toFixed(2);
      var slope = Math.abs(dx) < 0.0001 ? "∞" : (dy / dx).toFixed(2);
      var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);

      ctx.font = "bold 11px system-ui, sans-serif";
      var lstr = "L: " + len + " u | " + angle + "° (Slope: " + slope + ")";
      var ltw = ctx.measureText(lstr).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(midX - ltw / 2 - 8, midY - 24, ltw + 16, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(lstr, midX - ltw / 2, midY - 10);

    } else if (candidate.type === 'curve') {
      var p1 = window.mathToScreen(candidate.p1.x, candidate.p1.y);
      var p2 = window.mathToScreen(candidate.p2.x, candidate.p2.y);
      var c1 = window.mathToScreen(candidate.c1.x, candidate.c1.y);
      var c2 = window.mathToScreen(candidate.c2.x, candidate.c2.y);

      // Tangent handlebars from endpoints to controls
      drawHandlebar(ctx, p1.screenX, p1.screenY, c1.screenX, c1.screenY, "#f59e0b", [4, 4]);
      drawHandlebar(ctx, p2.screenX, p2.screenY, c2.screenX, c2.screenY, "#f59e0b", [4, 4]);

      // Glow halo
      ctx.beginPath();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.25)";
      ctx.lineWidth = 8;
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.bezierCurveTo(c1.screenX, c1.screenY, c2.screenX, c2.screenY, p2.screenX, p2.screenY);
      ctx.stroke();

      // Main Spline curve
      ctx.beginPath();
      ctx.strokeStyle = candidate.color === 'black' ? '#1e293b' : candidate.color;
      ctx.lineWidth = 3;
      if (candidate.dashed) {
        ctx.setLineDash([6, 4]);
      }
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.bezierCurveTo(c1.screenX, c1.screenY, c2.screenX, c2.screenY, p2.screenX, p2.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Endpoint Anchor pins
      drawAnchorPin(ctx, p1.screenX, p1.screenY, "#4f46e5", "P₁ (" + candidate.p1.x + ", " + candidate.p1.y + ")", candidate.activeHandle === 'p1');
      drawAnchorPin(ctx, p2.screenX, p2.screenY, "#10b981", "P₂ (" + candidate.p2.x + ", " + candidate.p2.y + ")", candidate.activeHandle === 'p2');

      // Control handles
      var isSingle = (candidate.c1.x === candidate.c2.x && candidate.c1.y === candidate.c2.y);
      drawControlHandle(ctx, c1.screenX, c1.screenY, "#f59e0b", "C₁ (" + candidate.c1.x + ", " + candidate.c1.y + ")", candidate.activeHandle === 'c1');
      if (!isSingle) {
        drawControlHandle(ctx, c2.screenX, c2.screenY, "#f59e0b", "C₂ (" + candidate.c2.x + ", " + candidate.c2.y + ")", candidate.activeHandle === 'c2');
      } else {
        drawControlHandle(ctx, c2.screenX, c2.screenY, "#10b981", "C₂=C₁ Arc", candidate.activeHandle === 'c2');
      }

      // Midpoint translation handle at t=0.5
      var midX = 0.125 * p1.screenX + 0.375 * c1.screenX + 0.375 * c2.screenX + 0.125 * p2.screenX;
      var midY = 0.125 * p1.screenY + 0.375 * c1.screenY + 0.375 * c2.screenY + 0.125 * p2.screenY;
      drawPointDot(ctx, midX, midY, "#10b981", "Move", candidate.activeHandle === 'mid');

      // Span & curvature badge
      var span = Math.hypot(candidate.p2.x - candidate.p1.x, candidate.p2.y - candidate.p1.y).toFixed(2);
      var cstr = (isSingle ? "Arc (C₂=C₁) Span: " : "Curve Span: ") + span + " units";
      ctx.font = "bold 11px system-ui, sans-serif";
      var ctw = ctx.measureText(cstr).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(midX - ctw / 2 - 8, midY - 24, ctw + 16, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(cstr, midX - ctw / 2, midY - 10);
    } else if (candidate.type === 'point') {
      var p = window.mathToScreen(candidate.pos.x, candidate.pos.y);

      // Pulsing outer halo
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(14, 165, 233, 0.18)";
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dot marker if checked
      if (candidate.dot !== false) {
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, 4, 0, Math.PI * 2);
        ctx.fillStyle = candidate.color === 'black' ? '#0f172a' : candidate.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Center handle pin
      drawPointDot(ctx, p.screenX, p.screenY, "#0284c7", "(" + candidate.pos.x + ", " + candidate.pos.y + ")", candidate.activeHandle === 'pos');

      // Live custom text label preview with chosen anchor
      var labelText = candidate.label || "";
      var anchor = candidate.anchor || "above_right";

      ctx.save();
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      var tcol = candidate.color === 'black' ? '#0f172a' : candidate.color;

      var ox = 8, oy = -8;
      var align = "left", baseline = "bottom";
      if (anchor === 'above_right') { ox = 8; oy = -8; align = "left"; baseline = "bottom"; }
      else if (anchor === 'above') { ox = 0; oy = -10; align = "center"; baseline = "bottom"; }
      else if (anchor === 'above_left') { ox = -8; oy = -8; align = "right"; baseline = "bottom"; }
      else if (anchor === 'right') { ox = 10; oy = 0; align = "left"; baseline = "middle"; }
      else if (anchor === 'left') { ox = -10; oy = 0; align = "right"; baseline = "middle"; }
      else if (anchor === 'below_right') { ox = 8; oy = 14; align = "left"; baseline = "top"; }
      else if (anchor === 'below') { ox = 0; oy = 14; align = "center"; baseline = "top"; }
      else if (anchor === 'below_left') { ox = -8; oy = 14; align = "right"; baseline = "top"; }
      else if (anchor === 'center') { ox = 0; oy = 0; align = "center"; baseline = "middle"; }

      ctx.textAlign = align;
      ctx.textBaseline = baseline;

      if (labelText) {
        ctx.fillStyle = tcol;
        ctx.fillText(labelText, p.screenX + ox, p.screenY + oy);
      } else {
        ctx.fillStyle = "rgba(100, 116, 139, 0.8)";
        ctx.font = "italic 11px system-ui, sans-serif";
        ctx.fillText("[Type text in card]", p.screenX + ox, p.screenY + oy);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render Selected Shape handles in 'select' mode
   */
  function renderSelectedShape(ctx, selected) {
    if (!selected) return;

    var coords = getShapeCoordinates(selected.type, selected.index);
    if (!coords) return;

    ctx.save();
    if (selected.type === 'rectangle') {
      var p1 = window.mathToScreen(coords.x1, coords.y1);
      var p2 = window.mathToScreen(coords.x2, coords.y2);
      var minX = Math.min(p1.screenX, p2.screenX);
      var minY = Math.min(p1.screenY, p2.screenY);
      var w = Math.abs(p2.screenX - p1.screenX);
      var h = Math.abs(p2.screenY - p1.screenY);

      // Glowing selection bounding box
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(minX - 3, minY - 3, w + 6, h + 6);
      ctx.setLineDash([]);

      drawPointDot(ctx, minX, minY, "#6366f1", null, selected.activeHandle === 'c1');
      drawPointDot(ctx, minX + w, minY, "#6366f1", null, selected.activeHandle === 'c2');
      drawPointDot(ctx, minX + w, minY + h, "#6366f1", null, selected.activeHandle === 'c3');
      drawPointDot(ctx, minX, minY + h, "#6366f1", null, selected.activeHandle === 'c4');
      drawPointDot(ctx, minX + w / 2, minY + h / 2, "#10b981", "Move", selected.activeHandle === 'center');
    } else if (selected.type === 'line') {
      var p1 = window.mathToScreen(coords.x1, coords.y1);
      var p2 = window.mathToScreen(coords.x2, coords.y2);

      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPointDot(ctx, p1.screenX, p1.screenY, "#6366f1", "P1", selected.activeHandle === 'p1');
      drawPointDot(ctx, p2.screenX, p2.screenY, "#6366f1", "P2", selected.activeHandle === 'p2');
      drawPointDot(ctx, (p1.screenX + p2.screenX) / 2, (p1.screenY + p2.screenY) / 2, "#10b981", "Move", selected.activeHandle === 'mid');
    } else if (selected.type === 'curve') {
      var p1 = window.mathToScreen(coords.p1.x, coords.p1.y);
      var c1 = window.mathToScreen(coords.c1.x, coords.c1.y);
      var c2 = window.mathToScreen(coords.c2.x, coords.c2.y);
      var p2 = window.mathToScreen(coords.p2.x, coords.p2.y);

      // Tangent handlebars to control points
      drawHandlebar(ctx, p1.screenX, p1.screenY, c1.screenX, c1.screenY, "#f59e0b", [4, 4]);
      drawHandlebar(ctx, p2.screenX, p2.screenY, c2.screenX, c2.screenY, "#f59e0b", [4, 4]);

      // Glowing selection spline
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.bezierCurveTo(c1.screenX, c1.screenY, c2.screenX, c2.screenY, p2.screenX, p2.screenY);
      ctx.stroke();

      // Handles: P1, C1, C2, P2 and midpoint move handle
      drawAnchorPin(ctx, p1.screenX, p1.screenY, "#4f46e5", "P1", selected.activeHandle === 'p1');
      drawControlHandle(ctx, c1.screenX, c1.screenY, "#f59e0b", "C1", selected.activeHandle === 'c1');
      drawControlHandle(ctx, c2.screenX, c2.screenY, "#f59e0b", "C2", selected.activeHandle === 'c2');
      drawAnchorPin(ctx, p2.screenX, p2.screenY, "#4f46e5", "P2", selected.activeHandle === 'p2');

      // Curve midpoint move handle (at t = 0.5)
      var midX = 0.125 * p1.screenX + 0.375 * c1.screenX + 0.375 * c2.screenX + 0.125 * p2.screenX;
      var midY = 0.125 * p1.screenY + 0.375 * c1.screenY + 0.375 * c2.screenY + 0.125 * p2.screenY;
      drawPointDot(ctx, midX, midY, "#10b981", "Move", selected.activeHandle === 'mid');
    } else if (selected.type === 'circle') {
      var center = window.mathToScreen(coords.cx, coords.cy);
      var curScale = typeof scale !== 'undefined' ? scale : 35;
      var radiusScreen = coords.r * curScale;

      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(center.screenX, center.screenY, radiusScreen + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPointDot(ctx, center.screenX, center.screenY, "#10b981", "Center", selected.activeHandle === 'center');
      drawPointDot(ctx, center.screenX + radiusScreen, center.screenY, "#6366f1", "R", selected.activeHandle === 'radius_e');
      drawPointDot(ctx, center.screenX - radiusScreen, center.screenY, "#6366f1", null, selected.activeHandle === 'radius_w');
      drawPointDot(ctx, center.screenX, center.screenY - radiusScreen, "#6366f1", null, selected.activeHandle === 'radius_n');
      drawPointDot(ctx, center.screenX, center.screenY + radiusScreen, "#6366f1", null, selected.activeHandle === 'radius_s');
    } else if (selected.type === 'axis') {
      renderAxisHandles(ctx, selected.activeHandle);
    }
    ctx.restore();
  }

  /**
   * Helper: extract math coordinates from DOM form for a shape
   */
  function getShapeCoordinates(type, index) {
    if (type === 'axis') {
      return getAxisData();
    } else if (type === 'rectangle') {
      var r = document.getElementById("r_" + index);
      var s = document.getElementById("s_" + index);
      var t = document.getElementById("t_" + index);
      var u = document.getElementById("u_" + index);
      if (r && s && t && u) {
        return {
          x1: parseFloat(r.value) || 0,
          y1: parseFloat(s.value) || 0,
          x2: parseFloat(t.value) || 0,
          y2: parseFloat(u.value) || 0
        };
      }
    } else if (type === 'circle') {
      var cx = document.getElementById("circle_x_" + index);
      var cy = document.getElementById("circle_y_" + index);
      var cr = document.getElementById("circle_r_" + index);
      if (cx && cy && cr) {
        return {
          cx: parseFloat(cx.value) || 0,
          cy: parseFloat(cy.value) || 0,
          r: parseFloat(cr.value) || 0
        };
      }
    } else if (type === 'line') {
      var a = document.getElementById("a_" + index);
      var b = document.getElementById("b_" + index);
      var c = document.getElementById("c_" + index);
      var d = document.getElementById("d_" + index);
      if (a && b && c && d) {
        return {
          x1: parseFloat(a.value) || 0,
          y1: parseFloat(b.value) || 0,
          x2: parseFloat(c.value) || 0,
          y2: parseFloat(d.value) || 0
        };
      }
    } else if (type === 'curve') {
      var e = document.getElementById("e_" + index);
      var f = document.getElementById("f_" + index);
      var g = document.getElementById("g_" + index);
      var h = document.getElementById("h_" + index);
      var i = document.getElementById("i_" + index);
      var jEl = document.getElementById("j_" + index);
      var k = document.getElementById("k_" + index);
      var l = document.getElementById("l_" + index);
      if (e && f && g && h && i && jEl && k && l) {
        return {
          p1: { x: parseFloat(e.value) || 0, y: parseFloat(f.value) || 0 },
          c1: { x: parseFloat(g.value) || 0, y: parseFloat(h.value) || 0 },
          c2: { x: parseFloat(i.value) || 0, y: parseFloat(jEl.value) || 0 },
          p2: { x: parseFloat(k.value) || 0, y: parseFloat(l.value) || 0 }
        };
      }
    }
    return null;
  }

  /**
   * Hit test handles for Candidate Shape
   */
  function hitTestCandidateHandles(pos) {
    var candidate = window.drawingState.candidate;
    if (!candidate) return null;

    var threshold = 10; // pixels

    if (candidate.type === 'rectangle') {
      var p1 = window.mathToScreen(candidate.start.x, candidate.start.y);
      var p2 = window.mathToScreen(candidate.end.x, candidate.end.y);
      var minX = Math.min(p1.screenX, p2.screenX);
      var minY = Math.min(p1.screenY, p2.screenY);
      var w = Math.abs(p2.screenX - p1.screenX);
      var h = Math.abs(p2.screenY - p1.screenY);

      if (Math.hypot(pos.screenX - minX, pos.screenY - minY) <= threshold) return 'c1';
      if (Math.hypot(pos.screenX - (minX + w), pos.screenY - minY) <= threshold) return 'c2';
      if (Math.hypot(pos.screenX - (minX + w), pos.screenY - (minY + h)) <= threshold) return 'c3';
      if (Math.hypot(pos.screenX - minX, pos.screenY - (minY + h)) <= threshold) return 'c4';
      if (Math.hypot(pos.screenX - (minX + w / 2), pos.screenY - (minY + h / 2)) <= threshold) return 'center';
    } else if (candidate.type === 'line') {
      var p1 = window.mathToScreen(candidate.start.x, candidate.start.y);
      var p2 = window.mathToScreen(candidate.end.x, candidate.end.y);
      if (Math.hypot(pos.screenX - p1.screenX, pos.screenY - p1.screenY) <= threshold) return 'p1';
      if (Math.hypot(pos.screenX - p2.screenX, pos.screenY - p2.screenY) <= threshold) return 'p2';
      if (Math.hypot(pos.screenX - (p1.screenX + p2.screenX) / 2, pos.screenY - (p1.screenY + p2.screenY) / 2) <= threshold) return 'mid';
    } else if (candidate.type === 'curve') {
      var p1 = window.mathToScreen(candidate.p1.x, candidate.p1.y);
      var p2 = window.mathToScreen(candidate.p2.x, candidate.p2.y);
      var c1 = window.mathToScreen(candidate.c1.x, candidate.c1.y);
      var c2 = window.mathToScreen(candidate.c2.x, candidate.c2.y);

      // Midpoint at t = 0.5
      var midX = 0.125 * p1.screenX + 0.375 * c1.screenX + 0.375 * c2.screenX + 0.125 * p2.screenX;
      var midY = 0.125 * p1.screenY + 0.375 * c1.screenY + 0.375 * c2.screenY + 0.125 * p2.screenY;

      if (Math.hypot(pos.screenX - p1.screenX, pos.screenY - p1.screenY) <= threshold) return 'p1';
      if (Math.hypot(pos.screenX - p2.screenX, pos.screenY - p2.screenY) <= threshold) return 'p2';
      if (Math.hypot(pos.screenX - c1.screenX, pos.screenY - c1.screenY) <= threshold) return 'c1';
      if (Math.hypot(pos.screenX - c2.screenX, pos.screenY - c2.screenY) <= threshold) return 'c2';
      if (Math.hypot(pos.screenX - midX, pos.screenY - midY) <= threshold) return 'mid';
    } else if (candidate.type === 'point') {
      var p = window.mathToScreen(candidate.pos.x, candidate.pos.y);
      if (Math.hypot(pos.screenX - p.screenX, pos.screenY - p.screenY) <= threshold + 6) return 'pos';
    } else if (candidate.type === 'circle') {
      var center = window.mathToScreen(candidate.center.x, candidate.center.y);
      var curScale = typeof scale !== 'undefined' ? scale : 35;
      var radiusScreen = candidate.radius * curScale;

      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - center.screenY) <= threshold) return 'center';
      if (Math.hypot(pos.screenX - (center.screenX + radiusScreen), pos.screenY - center.screenY) <= threshold) return 'radius_e';
      if (Math.hypot(pos.screenX - (center.screenX - radiusScreen), pos.screenY - center.screenY) <= threshold) return 'radius_w';
      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - (center.screenY - radiusScreen)) <= threshold) return 'radius_n';
      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - (center.screenY + radiusScreen)) <= threshold) return 'radius_s';
      var distFromCenter = Math.hypot(pos.screenX - center.screenX, pos.screenY - center.screenY);
      if (Math.abs(distFromCenter - radiusScreen) <= threshold) return 'radius';
    }

    return null;
  }

  /**
   * Hit test handles for Selected Shape in 'select' mode
   */
  function hitTestSelectedHandles(pos) {
    var selected = window.drawingState.selectedShape;
    if (!selected) return null;

    var coords = getShapeCoordinates(selected.type, selected.index);
    if (!coords) return null;

    if (selected.type === 'rectangle') {
      var p1 = window.mathToScreen(coords.x1, coords.y1);
      var p2 = window.mathToScreen(coords.x2, coords.y2);
      var minX = Math.min(p1.screenX, p2.screenX);
      var minY = Math.min(p1.screenY, p2.screenY);
      var w = Math.abs(p2.screenX - p1.screenX);
      var h = Math.abs(p2.screenY - p1.screenY);

      if (Math.hypot(pos.screenX - minX, pos.screenY - minY) <= threshold) return 'c1';
      if (Math.hypot(pos.screenX - (minX + w), pos.screenY - minY) <= threshold) return 'c2';
      if (Math.hypot(pos.screenX - (minX + w), pos.screenY - (minY + h)) <= threshold) return 'c3';
      if (Math.hypot(pos.screenX - minX, pos.screenY - (minY + h)) <= threshold) return 'c4';
      if (Math.hypot(pos.screenX - (minX + w / 2), pos.screenY - (minY + h / 2)) <= threshold) return 'center';
    } else if (selected.type === 'circle') {
      var center = window.mathToScreen(coords.cx, coords.cy);
      var curScale = typeof scale !== 'undefined' ? scale : 35;
      var radiusScreen = coords.r * curScale;

      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - center.screenY) <= threshold) return 'center';
      if (Math.hypot(pos.screenX - (center.screenX + radiusScreen), pos.screenY - center.screenY) <= threshold) return 'radius_e';
      if (Math.hypot(pos.screenX - (center.screenX - radiusScreen), pos.screenY - center.screenY) <= threshold) return 'radius_w';
      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - (center.screenY - radiusScreen)) <= threshold) return 'radius_n';
      if (Math.hypot(pos.screenX - center.screenX, pos.screenY - (center.screenY + radiusScreen)) <= threshold) return 'radius_s';
      var distFromCenter = Math.hypot(pos.screenX - center.screenX, pos.screenY - center.screenY);
      if (Math.abs(distFromCenter - radiusScreen) <= threshold) return 'radius';
    } else if (selected.type === 'line') {
      var p1 = window.mathToScreen(coords.x1, coords.y1);
      var p2 = window.mathToScreen(coords.x2, coords.y2);
      if (Math.hypot(pos.screenX - p1.screenX, pos.screenY - p1.screenY) <= threshold) return 'p1';
      if (Math.hypot(pos.screenX - p2.screenX, pos.screenY - p2.screenY) <= threshold) return 'p2';
      if (Math.hypot(pos.screenX - (p1.screenX + p2.screenX) / 2, pos.screenY - (p1.screenY + p2.screenY) / 2) <= threshold) return 'mid';
    } else if (selected.type === 'curve') {
      var p1 = window.mathToScreen(coords.p1.x, coords.p1.y);
      var c1 = window.mathToScreen(coords.c1.x, coords.c1.y);
      var c2 = window.mathToScreen(coords.c2.x, coords.c2.y);
      var p2 = window.mathToScreen(coords.p2.x, coords.p2.y);
      var midX = 0.125 * p1.screenX + 0.375 * c1.screenX + 0.375 * c2.screenX + 0.125 * p2.screenX;
      var midY = 0.125 * p1.screenY + 0.375 * c1.screenY + 0.375 * c2.screenY + 0.125 * p2.screenY;

      if (Math.hypot(pos.screenX - p1.screenX, pos.screenY - p1.screenY) <= threshold) return 'p1';
      if (Math.hypot(pos.screenX - c1.screenX, pos.screenY - c1.screenY) <= threshold) return 'c1';
      if (Math.hypot(pos.screenX - c2.screenX, pos.screenY - c2.screenY) <= threshold) return 'c2';
      if (Math.hypot(pos.screenX - p2.screenX, pos.screenY - p2.screenY) <= threshold) return 'p2';
      if (Math.hypot(pos.screenX - midX, pos.screenY - midY) <= threshold) return 'mid';
    } else if (selected.type === 'axis') {
      return hitTestAxisHandles(pos);
    }

    return null;
  }

  /**
   * Hit test existing shapes on canvas when in 'select' mode
   */
  /**
   * Hit test existing shapes on canvas when in 'select' mode
   */
  function hitTestExistingShapes(pos) {
    var curScale = typeof scale !== 'undefined' ? scale : 35;
    var tolerance = 12 / curScale; // Math distance tolerance ~12px

    // 1. If layerManager is active, check shapes in Z-order from front/top to back/bottom
    if (window.layerManager && window.layerManager.layers && window.layerManager.layers.length > 0) {
      var layers = window.layerManager.layers; // Index 0 is Top/Front, N-1 is Bottom/Back
      for (var k = 0; k < layers.length; k++) {
        var ly = layers[k];
        if (!ly.visible) continue;
        if (ly.locked) continue; // Locked layers cannot be selected or modified on canvas

        if (ly.type === 'rectangle') {
          var showRec = document.getElementById("retangularshow_" + ly.index);
          if (showRec && showRec.checked) {
            var rCoords = getShapeCoordinates('rectangle', ly.index);
            if (rCoords) {
              var minX = Math.min(rCoords.x1, rCoords.x2);
              var maxX = Math.max(rCoords.x1, rCoords.x2);
              var minY = Math.min(rCoords.y1, rCoords.y2);
              var maxY = Math.max(rCoords.y1, rCoords.y2);
              if (pos.x >= minX - tolerance && pos.x <= maxX + tolerance &&
                  pos.y >= minY - tolerance && pos.y <= maxY + tolerance) {
                return { type: 'rectangle', index: ly.index };
              }
            }
          }
        } else if (ly.type === 'circle') {
          var showCir = document.getElementById("circleshow_" + ly.index);
          if (showCir && showCir.checked) {
            var cCoords = getShapeCoordinates('circle', ly.index);
            if (cCoords && cCoords.r > 0) {
              var cDist = Math.hypot(pos.x - cCoords.cx, pos.y - cCoords.cy);
              if (Math.abs(cDist - cCoords.r) <= tolerance || cDist <= tolerance) {
                return { type: 'circle', index: ly.index };
              }
            }
          }
        } else if (ly.type === 'line') {
          var showL = document.getElementById("lineshow_" + ly.index);
          if (showL && showL.checked) {
            var lCoords = getShapeCoordinates('line', ly.index);
            if (lCoords) {
              var lDist = pointToSegmentDistance(pos.x, pos.y, lCoords.x1, lCoords.y1, lCoords.x2, lCoords.y2);
              if (lDist <= tolerance) {
                return { type: 'line', index: ly.index };
              }
            }
          }
        } else if (ly.type === 'curve') {
          var showC = document.getElementById("curveshow_" + ly.index);
          if (showC && showC.checked) {
            var cvCoords = getShapeCoordinates('curve', ly.index);
            if (cvCoords) {
              var cvDist = pointToBezierDistance(pos.x, pos.y, cvCoords.p1, cvCoords.c1, cvCoords.c2, cvCoords.p2);
              if (cvDist <= tolerance) {
                return { type: 'curve', index: ly.index };
              }
            }
          }
        } else if (ly.type === 'point') {
          var showP = document.getElementById("pointshow_" + ly.index);
          if (!showP || showP.checked) {
            var px = parseFloat(document.getElementById("p_" + ly.index)?.value);
            var py = parseFloat(document.getElementById("q_" + ly.index)?.value);
            if (!isNaN(px) && !isNaN(py)) {
              var pDist = Math.hypot(pos.x - px, pos.y - py);
              if (pDist <= tolerance) {
                return { type: 'point', index: ly.index };
              }
            }
          }
        } else if (ly.type === 'axis') {
          var axHandle = hitTestAxisHandles(pos);
          if (axHandle) {
            return { type: 'axis', index: 1 };
          }
          var axis = getAxisData();
          if (pos.x >= -tolerance && pos.x <= axis.effectiveXSize + tolerance && Math.abs(pos.y) <= tolerance + 0.15) {
            return { type: 'axis', index: 1 };
          }
          if (pos.y >= -tolerance && pos.y <= axis.effectiveYSize + tolerance && Math.abs(pos.x) <= tolerance + 0.15) {
            return { type: 'axis', index: 1 };
          }
        }
      }
      return null;
    }

    // 2. Default Fallback
    // Rectangles
    var maxRec = typeof counter_z !== 'undefined' ? counter_z : 5;
    for (var z = 1; z <= maxRec; z++) {
      if (window.layerManager && window.layerManager.isLocked('rectangle', z)) continue;
      if (window.isLayerVisible && !window.isLayerVisible('rectangle', z)) continue;
      var show = document.getElementById("retangularshow_" + z);
      if (show && show.checked) {
        var coords = getShapeCoordinates('rectangle', z);
        if (coords) {
          var minX = Math.min(coords.x1, coords.x2);
          var maxX = Math.max(coords.x1, coords.x2);
          var minY = Math.min(coords.y1, coords.y2);
          var maxY = Math.max(coords.y1, coords.y2);

          if (pos.x >= minX - tolerance && pos.x <= maxX + tolerance &&
              pos.y >= minY - tolerance && pos.y <= maxY + tolerance) {
            return { type: 'rectangle', index: z };
          }
        }
      }
    }

    // Circles
    var maxCircles = typeof counter_circle !== 'undefined' ? counter_circle : 5;
    for (var c = 1; c <= maxCircles; c++) {
      if (window.layerManager && window.layerManager.isLocked('circle', c)) continue;
      if (window.isLayerVisible && !window.isLayerVisible('circle', c)) continue;
      var showCircle = document.getElementById("circleshow_" + c);
      if (showCircle && showCircle.checked) {
        var circleCoords = getShapeCoordinates('circle', c);
        if (circleCoords && circleCoords.r > 0) {
          var dist = Math.hypot(pos.x - circleCoords.cx, pos.y - circleCoords.cy);
          if (Math.abs(dist - circleCoords.r) <= tolerance || dist <= tolerance) {
            return { type: 'circle', index: c };
          }
        }
      }
    }

    // Lines
    var maxLines = typeof counter_i !== 'undefined' ? counter_i : 6;
    for (var i = 1; i <= maxLines; i++) {
      if (window.layerManager && window.layerManager.isLocked('line', i)) continue;
      if (window.isLayerVisible && !window.isLayerVisible('line', i)) continue;
      var showL = document.getElementById("lineshow_" + i);
      if (showL && showL.checked) {
        var coords = getShapeCoordinates('line', i);
        if (coords) {
          var d = pointToSegmentDistance(pos.x, pos.y, coords.x1, coords.y1, coords.x2, coords.y2);
          if (d <= tolerance) {
            return { type: 'line', index: i };
          }
        }
      }
    }

    // Curves
    var maxCurves = typeof counter_j !== 'undefined' ? counter_j : 5;
    for (var j = 1; j <= maxCurves; j++) {
      if (window.layerManager && window.layerManager.isLocked('curve', j)) continue;
      if (window.isLayerVisible && !window.isLayerVisible('curve', j)) continue;
      var showC = document.getElementById("curveshow_" + j);
      if (showC && showC.checked) {
        var cCoords = getShapeCoordinates('curve', j);
        if (cCoords) {
          var dC = pointToBezierDistance(pos.x, pos.y, cCoords.p1, cCoords.c1, cCoords.c2, cCoords.p2);
          if (dC <= tolerance) {
            return { type: 'curve', index: j };
          }
        }
      }
    }

    // Axis
    if (!(window.layerManager && window.layerManager.isLocked('axis', 1)) &&
        !(window.isLayerVisible && !window.isLayerVisible('axis', 1))) {
      var axis = getAxisData();
      var axHandle = hitTestAxisHandles(pos);
      if (axHandle) {
        return { type: 'axis', index: 1 };
      }
      if (pos.x >= -tolerance && pos.x <= axis.effectiveXSize + tolerance && Math.abs(pos.y) <= tolerance + 0.15) {
        return { type: 'axis', index: 1 };
      }
      if (pos.y >= -tolerance && pos.y <= axis.effectiveYSize + tolerance && Math.abs(pos.x) <= tolerance + 0.15) {
        return { type: 'axis', index: 1 };
      }
    }

    return null;
  }

  function pointToBezierDistance(px, py, p1, c1, c2, p2) {
    var minD = Infinity;
    var steps = 24;
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var mt = 1 - t;
      var mt2 = mt * mt;
      var mt3 = mt2 * mt;
      var t2 = t * t;
      var t3 = t2 * t;

      var bx = mt3 * p1.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t3 * p2.x;
      var by = mt3 * p1.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t3 * p2.y;
      var d = Math.hypot(px - bx, py - by);
      if (d < minD) minD = d;
    }
    return minD;
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    var l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    var t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  /**
   * Open the On-Canvas Final Confirmation Card for Candidate Shape
   */
  function openConfirmationCard(candidate) {
    var card = document.getElementById("shape-confirm-card");
    if (!card) return;

    var typeBadge = document.getElementById("confirm-type-badge");
    var coordsText = document.getElementById("confirm-coords-text");
    var dimText = document.getElementById("confirm-dimension-text");
    var slotSelect = document.getElementById("confirm-target-slot");
    var labelInput = document.getElementById("confirm-shape-label");
    var matchBtn = document.getElementById("confirm-curve-match-btn");

    var labelHeading = document.getElementById("confirm-label-heading");
    var quickChips = document.getElementById("confirm-quick-labels");
    var lineStyleField = document.getElementById("confirm-field-line-style");
    var pointPosField = document.getElementById("confirm-field-point-pos");
    var pointPosSelect = document.getElementById("confirm-point-pos");
    var pointDotField = document.getElementById("confirm-field-point-dot");
    var pointDotChk = document.getElementById("confirm-point-dot-chk");

    if (typeBadge) {
      typeBadge.textContent = candidate.type === 'rectangle' ? "Rectangle" : (candidate.type === 'circle' ? "Circle" : (candidate.type === 'line' ? "Straight Line" : (candidate.type === 'curve' ? "Bézier Curve" : "Point / Label")));
    }

    if (coordsText) {
      if (candidate.type === 'curve') {
        coordsText.textContent = "P₁(" + candidate.p1.x + ", " + candidate.p1.y + ") → P₂(" + candidate.p2.x + ", " + candidate.p2.y + ")";
      } else if (candidate.type === 'circle') {
        coordsText.textContent = "Center: (" + candidate.center.x + ", " + candidate.center.y + ")";
      } else if (candidate.type === 'point') {
        coordsText.textContent = "(" + candidate.pos.x + ", " + candidate.pos.y + ")";
      } else {
        coordsText.textContent = "(" + candidate.start.x + ", " + candidate.start.y + ") → (" + candidate.end.x + ", " + candidate.end.y + ")";
      }
    }

    if (matchBtn) {
      matchBtn.style.display = candidate.type === 'curve' ? "inline-block" : "none";
    }

    if (dimText) {
      if (candidate.type === 'rectangle') {
        var w = Math.abs(candidate.end.x - candidate.start.x).toFixed(1);
        var h = Math.abs(candidate.end.y - candidate.start.y).toFixed(1);
        dimText.textContent = "Size: " + w + " × " + h + " units";
      } else if (candidate.type === 'circle') {
        dimText.textContent = "Radius: " + candidate.radius.toFixed(2) + " units (Dia: " + (candidate.radius * 2).toFixed(1) + " u)";
      } else if (candidate.type === 'line') {
        var dx = candidate.end.x - candidate.start.x;
        var dy = candidate.end.y - candidate.start.y;
        var len = Math.hypot(dx, dy).toFixed(2);
        var slope = Math.abs(dx) < 0.0001 ? "∞" : (dy / dx).toFixed(2);
        var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
        dimText.textContent = "Length: " + len + " u | Slope: " + slope + " (" + angle + "°)";
      } else if (candidate.type === 'curve') {
        var isSingle = (candidate.c1.x === candidate.c2.x && candidate.c1.y === candidate.c2.y);
        var span = Math.hypot(candidate.p2.x - candidate.p1.x, candidate.p2.y - candidate.p1.y).toFixed(2);
        dimText.textContent = (isSingle ? "Arc (C₂=C₁) Span: " : "Span: ") + span + " u | C₁(" + candidate.c1.x + ", " + candidate.c1.y + ")" + (isSingle ? "" : "  C₂(" + candidate.c2.x + ", " + candidate.c2.y + ")");
      } else if (candidate.type === 'point') {
        dimText.textContent = "Marker & Text Label";
      }
    }

    // Toggle line-specific advanced settings (Arrow, Width, Pattern, Label Pos/Anchor)
    var lineExtras = document.getElementById("confirm-field-line-extras");
    var lineArrowSel = document.getElementById("confirm-line-arrow");
    var lineWidthSel = document.getElementById("confirm-line-width");
    var linePatternSel = document.getElementById("confirm-line-pattern");
    var lineLabelPosSel = document.getElementById("confirm-line-label-pos");
    var lineLabelAnchorSel = document.getElementById("confirm-line-label-anchor");

    if (candidate.type === 'line') {
      if (lineExtras) lineExtras.style.display = "flex";
      if (lineArrowSel) lineArrowSel.value = candidate.arrow || "none";
      if (lineWidthSel) lineWidthSel.value = candidate.width || "semithick";
      if (linePatternSel) linePatternSel.value = candidate.style || (candidate.dashed ? "dashed" : "solid");
      if (lineLabelPosSel) lineLabelPosSel.value = candidate.labelPos || "midway";
      if (lineLabelAnchorSel) lineLabelAnchorSel.value = candidate.labelAnchor || "above";
    } else {
      if (lineExtras) lineExtras.style.display = "none";
    }

    // Toggle point-specific vs line/rectangle fields
    if (candidate.type === 'point') {
      if (labelHeading) labelHeading.textContent = "Label Text:";
      if (labelInput) {
        labelInput.placeholder = "e.g. A, (2, 3), Max, E₁";
        labelInput.value = candidate.label || "";
      }
      if (quickChips) quickChips.style.display = "flex";
      if (lineStyleField) lineStyleField.style.display = "none";
      if (pointPosField) pointPosField.style.display = "flex";
      if (pointPosSelect) pointPosSelect.value = candidate.anchor || "above_right";
      if (pointDotField) pointDotField.style.display = "block";
      if (pointDotChk) pointDotChk.checked = (candidate.dot !== false);
    } else {
      if (labelHeading) labelHeading.textContent = "Label Name:";
      if (labelInput) {
        labelInput.placeholder = "e.g. Shape label";
        labelInput.value = candidate.label || "";
      }
      if (quickChips) quickChips.style.display = "none";
      if (lineStyleField) lineStyleField.style.display = candidate.type === 'line' ? "none" : "flex";
      if (pointPosField) pointPosField.style.display = "none";
      if (pointDotField) pointDotField.style.display = "none";
    }

    // Populate target slots dropdown
    if (slotSelect) {
      slotSelect.innerHTML = '<option value="auto">Auto (Next Available)</option>';
      if (candidate.type === 'rectangle') {
        var maxRec = typeof counter_z !== 'undefined' ? counter_z : 2;
        for (var r = 1; r < maxRec; r++) {
          slotSelect.innerHTML += '<option value="rectangle_' + r + '">Rectangle ' + r + '</option>';
        }
        slotSelect.innerHTML += '<option value="new_rectangle">+ New Rectangle</option>';
      } else if (candidate.type === 'circle') {
        var maxCircle = typeof counter_circle !== 'undefined' ? counter_circle : 2;
        for (var c = 1; c < maxCircle; c++) {
          slotSelect.innerHTML += '<option value="circle_' + c + '">Circle ' + c + '</option>';
        }
        slotSelect.innerHTML += '<option value="new_circle">+ New Circle</option>';
      } else if (candidate.type === 'line') {
        var maxLine = typeof counter_i !== 'undefined' ? counter_i : 5;
        for (var l = 1; l < maxLine; l++) {
          slotSelect.innerHTML += '<option value="line_' + l + '">Line ' + l + '</option>';
        }
        slotSelect.innerHTML += '<option value="new_line">+ New Line</option>';
      } else if (candidate.type === 'curve') {
        var maxCurve = typeof counter_j !== 'undefined' ? counter_j : 2;
        for (var c = 1; c < maxCurve; c++) {
          slotSelect.innerHTML += '<option value="curve_' + c + '">Curve ' + c + '</option>';
        }
        slotSelect.innerHTML += '<option value="new_curve">+ New Curve</option>';
      } else if (candidate.type === 'point') {
        var maxP = typeof ps_j !== 'undefined' ? ps_j : 4;
        for (var p = 1; p < maxP; p++) {
          var pTitle = document.getElementById("p_name_" + p)?.value || ("Point " + p);
          slotSelect.innerHTML += '<option value="point_' + p + '">Point ' + p + ' (' + pTitle + ')</option>';
        }
        slotSelect.innerHTML += '<option value="new_point">+ New Point / Label</option>';
      }
      slotSelect.value = candidate.targetSlot || 'auto';
    }

    // Color Swatches
    updateConfirmColorSwatches(candidate.color || 'black');
    updateConfirmStyleButtons(candidate.dashed);

    card.style.display = "block";

    // Auto-focus text input for rapid keyboard typing
    if (candidate.type === 'point' && labelInput) {
      setTimeout(function () {
        labelInput.focus();
        labelInput.select();
      }, 40);
    }
  }

  function updateConfirmColorSwatches(selectedColor) {
    var matched = false;
    var customBtn = document.getElementById("confirm-custom-color-btn");
    document.querySelectorAll("#confirm-color-swatches .color-swatch").forEach(function (sw) {
      if (sw.id === "confirm-custom-color-btn") return;
      if (sw.getAttribute("data-color") === selectedColor) {
        sw.classList.add("active");
        matched = true;
      } else {
        sw.classList.remove("active");
      }
    });

    if (customBtn) {
      if (!matched && selectedColor) {
        customBtn.classList.add("active");
        var hex = window.normalizeToHex ? window.normalizeToHex(selectedColor) : selectedColor;
        customBtn.style.background = hex;
        customBtn.style.color = "#ffffff";
      } else {
        customBtn.classList.remove("active");
        customBtn.style.background = "";
        customBtn.style.color = "";
      }
    }
  }

  window.openCandidateCustomColorPicker = function(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var btn = document.getElementById("confirm-custom-color-btn") || (event ? event.currentTarget : null);
    var currentColor = (window.drawingState && window.drawingState.candidate && window.drawingState.candidate.color) || "#0f172a";
    if (window.openColorPopover) {
      window.openColorPopover({
        anchorEl: btn,
        currentColor: currentColor,
        onSelect: function(chosenColor) {
          window.setCandidateColor(chosenColor);
        }
      });
    }
  };

  function updateConfirmStyleButtons(isDashed) {
    var solidBtn = document.getElementById("confirm-style-solid");
    var dashBtn = document.getElementById("confirm-style-dashed");
    if (solidBtn && dashBtn) {
      if (isDashed) {
        dashBtn.classList.add("active");
        solidBtn.classList.remove("active");
      } else {
        solidBtn.classList.add("active");
        dashBtn.classList.remove("active");
      }
    }
  }

  /**
   * Set color for candidate shape
   */
  window.setCandidateColor = function (color) {
    var state = window.drawingState;
    if (state.candidate) {
      state.candidate.color = color;
      updateConfirmColorSwatches(color);
      renderAllOverlays();
    }
  };

  /**
   * Set style (solid / dashed) for candidate shape
   */
  window.setCandidateStyle = function (style) {
    var state = window.drawingState;
    if (state.candidate) {
      state.candidate.dashed = (style === 'dashed');
      if (state.candidate.type === 'line') {
        state.candidate.style = style;
      }
      updateConfirmStyleButtons(state.candidate.dashed);
      renderAllOverlays();
    }
  };

  /**
   * Update line-specific candidate properties
   */
  window.updateCandidateLineArrow = function (val) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'line') {
      state.candidate.arrow = val;
      renderAllOverlays();
    }
  };

  window.updateCandidateLineWidth = function (val) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'line') {
      state.candidate.width = val;
      renderAllOverlays();
    }
  };

  window.updateCandidateLinePattern = function (val) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'line') {
      state.candidate.style = val;
      state.candidate.dashed = (val === 'dashed' || val === 'loosely dashed' || val === 'densely dashed' || val === 'dotted');
      updateConfirmStyleButtons(state.candidate.dashed);
      renderAllOverlays();
    }
  };

  window.updateCandidateLineLabelPos = function (val) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'line') {
      state.candidate.labelPos = val;
      renderAllOverlays();
    }
  };

  window.updateCandidateLineLabelAnchor = function (val) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'line') {
      state.candidate.labelAnchor = val;
      renderAllOverlays();
    }
  };

  /**
   * Quick chip text inserter for Point/Label confirmation card
   */
  window.setQuickPointLabel = function (text) {
    var state = window.drawingState;
    var candidate = state.candidate;
    var labelInput = document.getElementById("confirm-shape-label");
    if (!candidate || candidate.type !== 'point') return;

    if (text === 'coords') {
      candidate.label = "(" + candidate.pos.x + ", " + candidate.pos.y + ")";
    } else {
      candidate.label = text;
    }
    if (labelInput) {
      labelInput.value = candidate.label;
      labelInput.focus();
    }
    renderAllOverlays();
  };

  /**
   * Update anchor position for Candidate Point
   */
  window.updateCandidatePointAnchor = function (anchor) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'point') {
      state.candidate.anchor = anchor;
      renderAllOverlays();
    }
  };

  /**
   * Update dot marker visibility for Candidate Point
   */
  window.updateCandidatePointDot = function (hasDot) {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'point') {
      state.candidate.dot = hasDot;
      renderAllOverlays();
    }
  };

  /**
   * Cancel candidate shape
   */
  window.cancelCandidateShape = function () {
    var state = window.drawingState;
    state.candidate = null;
    var card = document.getElementById("shape-confirm-card");
    if (card) card.style.display = "none";
    renderAllOverlays();
  };

  /**
   * Find available form slot or dynamically create a new one
   */
  function resolveTargetSlot(type, userChoice) {
    if (userChoice && userChoice !== 'auto') {
      if (userChoice === 'new_rectangle') {
        var form = document.getElementById("Retangularform");
        if (typeof AddRec === 'function') AddRec(form);
        return { type: 'rectangle', index: (typeof counter_z !== 'undefined' ? counter_z - 1 : 2) };
      } else if (userChoice === 'new_circle') {
        var form = document.getElementById("circleform");
        if (typeof AddCircle === 'function') AddCircle(form);
        return { type: 'circle', index: (typeof counter_circle !== 'undefined' ? counter_circle - 1 : 2) };
      } else if (userChoice === 'new_line') {
        var form = document.getElementById("lineform");
        if (typeof AddLine === 'function') AddLine(form);
        return { type: 'line', index: (typeof counter_i !== 'undefined' ? counter_i - 1 : 5) };
      } else if (userChoice === 'new_curve') {
        var form = document.getElementById("curveform");
        if (typeof AddCurve === 'function') AddCurve(form);
        return { type: 'curve', index: (typeof counter_j !== 'undefined' ? counter_j - 1 : 2) };
      } else if (userChoice === 'new_point') {
        var form = document.getElementById("pointform");
        if (typeof AddPoints === 'function') AddPoints(form);
        return { type: 'point', index: (typeof ps_j !== 'undefined' ? ps_j - 1 : 1) };
      } else {
        var parts = userChoice.split("_");
        return { type: parts[0], index: parseInt(parts[1], 10) };
      }
    }

    // Auto find empty slot
    if (type === 'rectangle') {
      var maxRec = typeof counter_z !== 'undefined' ? counter_z : 2;
      for (var z = 1; z < maxRec; z++) {
        var r = document.getElementById("r_" + z);
        var s = document.getElementById("s_" + z);
        var t = document.getElementById("t_" + z);
        var u = document.getElementById("u_" + z);
        if (r && s && t && u && (parseFloat(r.value) === 0 && parseFloat(s.value) === 0 && parseFloat(t.value) === 0 && parseFloat(u.value) === 0)) {
          return { type: 'rectangle', index: z };
        }
      }
      // If none empty, create new rectangle card!
      var form = document.getElementById("Retangularform");
      if (typeof AddRec === 'function') {
        AddRec(form);
        return { type: 'rectangle', index: (typeof counter_z !== 'undefined' ? counter_z - 1 : 2) };
      }
      return { type: 'rectangle', index: 1 };
    } else if (type === 'circle') {
      var maxCircle = typeof counter_circle !== 'undefined' ? counter_circle : 2;
      for (var c = 1; c < maxCircle; c++) {
        var r = document.getElementById("circle_r_" + c);
        if (r && parseFloat(r.value) === 0) {
          return { type: 'circle', index: c };
        }
      }
      // If none empty, create new circle card!
      var form = document.getElementById("circleform");
      if (typeof AddCircle === 'function') {
        AddCircle(form);
        return { type: 'circle', index: (typeof counter_circle !== 'undefined' ? counter_circle - 1 : 2) };
      }
      return { type: 'circle', index: 1 };
    } else if (type === 'line') {
      var maxLine = typeof counter_i !== 'undefined' ? counter_i : 5;
      for (var i = 1; i < maxLine; i++) {
        var a = document.getElementById("a_" + i);
        var b = document.getElementById("b_" + i);
        var c = document.getElementById("c_" + i);
        var d = document.getElementById("d_" + i);
        if (a && b && c && d && (parseFloat(a.value) === 0 && parseFloat(b.value) === 0 && parseFloat(c.value) === 0 && parseFloat(d.value) === 0)) {
          return { type: 'line', index: i };
        }
      }
      // If none empty, create new line card!
      var form = document.getElementById("lineform");
      if (typeof AddLine === 'function') {
        AddLine(form);
        return { type: 'line', index: (typeof counter_i !== 'undefined' ? counter_i - 1 : 5) };
      }
      return { type: 'line', index: 1 };
    } else if (type === 'curve') {
      var maxCurve = typeof counter_j !== 'undefined' ? counter_j : 2;
      for (var j = 1; j < maxCurve; j++) {
        var e = document.getElementById("e_" + j);
        var f = document.getElementById("f_" + j);
        var k = document.getElementById("k_" + j);
        var l = document.getElementById("l_" + j);
        if (e && f && k && l && (parseFloat(e.value) === 0 && parseFloat(f.value) === 0 && parseFloat(k.value) === 0 && parseFloat(l.value) === 0)) {
          return { type: 'curve', index: j };
        }
      }
      // If none empty, create new curve card!
      var form = document.getElementById("curveform");
      if (typeof AddCurve === 'function') {
        AddCurve(form);
        return { type: 'curve', index: (typeof counter_j !== 'undefined' ? counter_j - 1 : 2) };
      }
      return { type: 'curve', index: 1 };
    } else if (type === 'point') {
      var maxP = typeof ps_j !== 'undefined' ? ps_j : 4;
      for (var p = 1; p < maxP; p++) {
        var pEl = document.getElementById("p_" + p);
        var qEl = document.getElementById("q_" + p);
        var nameEl = document.getElementById("p_name_" + p);
        if (pEl && qEl && (parseFloat(pEl.value) === 0 && parseFloat(qEl.value) === 0 && (!nameEl || !nameEl.value))) {
          return { type: 'point', index: p };
        }
      }
      // If none empty, create new point card!
      var form = document.getElementById("pointform");
      if (typeof AddPoints === 'function') {
        AddPoints(form);
        return { type: 'point', index: (typeof ps_j !== 'undefined' ? ps_j - 1 : 1) };
      }
      return { type: 'point', index: 1 };
    }

    return { type: type, index: 1 };
  }

  /**
   * Confirm Candidate Shape: Commit to Graph & Synchronize Secondary Form
   */
  window.confirmCandidateShape = function () {
    var state = window.drawingState;
    var candidate = state.candidate;
    if (!candidate) return;

    var slotChoice = document.getElementById("confirm-target-slot")?.value || candidate.targetSlot || 'auto';
    var labelInput = document.getElementById("confirm-shape-label");
    var labelVal = labelInput ? labelInput.value.trim() : (candidate.label || "");

    var target = resolveTargetSlot(candidate.type, slotChoice);

    if (candidate.type === 'rectangle') {
      var j = target.index;
      var r = document.getElementById("r_" + j);
      var s = document.getElementById("s_" + j);
      var t = document.getElementById("t_" + j);
      var u = document.getElementById("u_" + j);
      var show = document.getElementById("retangularshow_" + j);
      var nameEl = document.getElementById("retangularname_" + j);
      var colorEl = document.getElementById("retangularColor_" + j);
      var dashEl = document.getElementById("retangulardash_" + j);

      if (r && s && t && u) {
        r.value = candidate.start.x;
        s.value = candidate.start.y;
        t.value = candidate.end.x;
        u.value = candidate.end.y;
        if (show) show.checked = true;
        if (nameEl && labelVal) nameEl.value = labelVal;
        if (colorEl && candidate.color) colorEl.value = candidate.color;
        if (dashEl) dashEl.checked = !!candidate.dashed;

        if (typeof DrawGraph === 'function') DrawGraph();

        // Secondary Form Feedback
        synchronizeSidebarCard('rectangle', j);
        if (window.showToast) {
          window.showToast("✓ Rectangle " + j + " created on canvas! Secondary form synchronized.");
        }
      }
    } else if (candidate.type === 'circle') {
      var j = target.index;
      var cx = document.getElementById("circle_x_" + j);
      var cy = document.getElementById("circle_y_" + j);
      var cr = document.getElementById("circle_r_" + j);
      var show = document.getElementById("circleshow_" + j);
      var nameEl = document.getElementById("circlename_" + j);
      var colorEl = document.getElementById("circleColor_" + j);
      var dashEl = document.getElementById("circledash_" + j);
      var fillEl = document.getElementById("circlefill_" + j);

      if (cx && cy && cr) {
        cx.value = candidate.center.x;
        cy.value = candidate.center.y;
        cr.value = candidate.radius;
        if (show) show.checked = true;
        if (nameEl && labelVal) nameEl.value = labelVal;
        if (colorEl && candidate.color) colorEl.value = candidate.color;
        if (dashEl) dashEl.checked = !!candidate.dashed;
        if (fillEl) fillEl.checked = !!candidate.fill;

        if (typeof DrawGraph === 'function') DrawGraph();

        // Secondary Form Feedback
        synchronizeSidebarCard('circle', j);
        if (window.showToast) {
          window.showToast("✓ Circle " + j + " created on canvas! Secondary form synchronized.");
        }
      }
    } else if (candidate.type === 'line') {
      var j = target.index;
      var a = document.getElementById("a_" + j);
      var b = document.getElementById("b_" + j);
      var c = document.getElementById("c_" + j);
      var d = document.getElementById("d_" + j);
      var show = document.getElementById("lineshow_" + j);
      var nameEl = document.getElementById("linename_" + j);
      var colorEl = document.getElementById("lineColor_" + j);
      var dashEl = document.getElementById("linedash_" + j);
      var arrowEl = document.getElementById("lineArrow_" + j);
      var widthEl = document.getElementById("lineWidth_" + j);
      var styleEl = document.getElementById("lineStyle_" + j);
      var labelPosEl = document.getElementById("lineLabelPos_" + j);
      var labelAnchorEl = document.getElementById("lineLabelAnchor_" + j);

      var confArrow = document.getElementById("confirm-line-arrow")?.value || candidate.arrow || "none";
      var confWidth = document.getElementById("confirm-line-width")?.value || candidate.width || "semithick";
      var confStyle = document.getElementById("confirm-line-pattern")?.value || candidate.style || (candidate.dashed ? "dashed" : "solid");
      var confLabelPos = document.getElementById("confirm-line-label-pos")?.value || candidate.labelPos || "midway";
      var confLabelAnchor = document.getElementById("confirm-line-label-anchor")?.value || candidate.labelAnchor || "above";

      if (a && b && c && d) {
        a.value = candidate.start.x;
        b.value = candidate.start.y;
        c.value = candidate.end.x;
        d.value = candidate.end.y;
        if (show) show.checked = true;
        if (nameEl && labelVal) nameEl.value = labelVal;
        if (colorEl && candidate.color) colorEl.value = candidate.color;
        if (arrowEl) arrowEl.value = confArrow;
        if (widthEl) widthEl.value = confWidth;
        if (styleEl) styleEl.value = confStyle;
        if (dashEl) dashEl.checked = (confStyle === 'dashed' || candidate.dashed);
        if (labelPosEl) labelPosEl.value = confLabelPos;
        if (labelAnchorEl) labelAnchorEl.value = confLabelAnchor;

        if (typeof window.updateLineTelemetry === 'function') {
          window.updateLineTelemetry(j);
        }

        if (typeof DrawGraph === 'function') DrawGraph();

        // Secondary Form Feedback
        synchronizeSidebarCard('line', j);
        if (window.showToast) {
          window.showToast("✓ Line " + j + " created on canvas! Secondary form synchronized.");
        }
      }
    } else if (candidate.type === 'curve') {
      var j = target.index;
      var e = document.getElementById("e_" + j);
      var f = document.getElementById("f_" + j);
      var g = document.getElementById("g_" + j);
      var h = document.getElementById("h_" + j);
      var i = document.getElementById("i_" + j);
      var jEl = document.getElementById("j_" + j);
      var k = document.getElementById("k_" + j);
      var l = document.getElementById("l_" + j);
      var show = document.getElementById("curveshow_" + j);
      var nameEl = document.getElementById("curvename_" + j);
      var colorEl = document.getElementById("curveColor_" + j);
      var dashEl = document.getElementById("curvedash_" + j);

      if (e && f && g && h && i && jEl && k && l) {
        e.value = candidate.p1.x;
        f.value = candidate.p1.y;
        g.value = candidate.c1.x;
        h.value = candidate.c1.y;
        i.value = candidate.c2.x;
        jEl.value = candidate.c2.y;
        k.value = candidate.p2.x;
        l.value = candidate.p2.y;
        if (show) show.checked = true;
        if (nameEl && labelVal) nameEl.value = labelVal;
        if (colorEl && candidate.color) colorEl.value = candidate.color;
        if (dashEl) dashEl.checked = !!candidate.dashed;

        if (typeof DrawGraph === 'function') DrawGraph();

        // Secondary Form Feedback
        synchronizeSidebarCard('curve', j);
        if (window.showToast) {
          window.showToast("✓ Curve " + j + " created on canvas! Secondary form synchronized.");
        }
      }
    } else if (candidate.type === 'point') {
      var j = target.index;
      var pEl = document.getElementById("p_" + j);
      var qEl = document.getElementById("q_" + j);
      var nameEl = document.getElementById("p_name_" + j);
      var colorEl = document.getElementById("pointColor_" + j);
      var dotEl = document.getElementById("pointdot_" + j);
      var posEl = document.getElementById("pointpos_" + j);
      var showEl = document.getElementById("pointshow_" + j);

      if (pEl && qEl) {
        pEl.value = candidate.pos.x;
        qEl.value = candidate.pos.y;
        if (nameEl) nameEl.value = labelVal;
        if (colorEl && candidate.color) colorEl.value = candidate.color;
        if (dotEl) dotEl.checked = (candidate.dot !== false);
        if (posEl && candidate.anchor) posEl.value = candidate.anchor;
        if (showEl) showEl.checked = true;

        if (typeof updatePointCardHeader === 'function') updatePointCardHeader(j);
        if (typeof DrawGraph === 'function') DrawGraph();

        // Secondary Form Feedback
        synchronizeSidebarCard('point', j);
        if (window.showToast) {
          window.showToast("✓ Point " + j + (labelVal ? ' ("' + labelVal + '")' : '') + " created at (" + candidate.pos.x + ", " + candidate.pos.y + ")");
        }
      }
    }

    if (window.layerManager) {
      window.layerManager.syncFromDOM();
      if (target && target.type) {
        window.layerManager.selectLayer(target.type + '_' + target.index);
      }
    }

    // Clear candidate & close card
    var createdType = candidate ? candidate.type : 'shape';
    var createdLabel = labelVal;
    state.candidate = null;
    var confirmCard = document.getElementById("shape-confirm-card");
    if (confirmCard) confirmCard.style.display = "none";

    renderAllOverlays();

    if (window.coordinateHistory) {
      var act = "Add " + createdType.charAt(0).toUpperCase() + createdType.slice(1);
      if (createdLabel) act += ' "' + createdLabel + '"';
      window.coordinateHistory.push(act);
    }
  };

  /**
   * Programmatically open accordion and highlight the secondary form card
   */
  function synchronizeSidebarCard(type, index) {
    // Axis is accordion index 1; Points & Labels 2; Rectangles 3; Circles 4; Lines 5; Curves 6
    var accordionItemIdx = type === 'axis' ? 1 : (type === 'point' ? 2 : (type === 'rectangle' ? 3 : (type === 'circle' ? 4 : (type === 'line' ? 5 : (type === 'curve' ? 6 : 7)))));

    // Open hoverAccordion section if jQuery available
    if (window.jQuery) {
      try {
        var headerLink = window.jQuery('#example2 > li:nth-child(' + accordionItemIdx + ') > a');
        if (headerLink.length) {
          headerLink.click();
        }
      } catch (e) {}
    }

    // Locate the card and apply glowing feedback
    var cardId = type === 'axis' ? 'axisform' : (type === 'point' ? ('point_card_' + index) : (type === 'rectangle' ? ('rectangle_card_' + index) : (type === 'circle' ? ('circle_card_' + index) : (type === 'line' ? ('line_card_' + index) : ('curve_card_' + index)))));
    var card = document.getElementById(cardId);
    if (!card) {
      var formId = type === 'axis' ? 'axisform' : (type === 'point' ? 'pointform' : (type === 'rectangle' ? 'Retangularform' : (type === 'circle' ? 'circleform' : (type === 'line' ? 'lineform' : 'curveform'))));
      var form = document.getElementById(formId);
      if (form) {
        var cards = form.querySelectorAll(".item-card");
        if (cards && cards[index - 1]) card = cards[index - 1];
        else card = form;
      }
    }

    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove("is-newly-synchronized");
      // Trigger reflow to restart animation
      void card.offsetWidth;
      card.classList.add("is-newly-synchronized");
      setTimeout(function () {
        card.classList.remove("is-newly-synchronized");
      }, 2200);
    }
  }

  /**
   * Canvas Shape Selection Actions
   */
  function showSelectedShapeBar(selected) {
    var bar = document.getElementById("shape-selected-card");
    if (!bar) return;

    var badge = document.getElementById("selected-badge-text");
    var coords = document.getElementById("selected-coords-text");

    if (badge) {
      var title = selected.type === 'axis' ? "Coordinate Axis" : (selected.type === 'rectangle' ? ("Rectangle " + selected.index) : (selected.type === 'circle' ? ("Circle " + selected.index) : (selected.type === 'curve' ? ("Curve " + selected.index) : ("Line " + selected.index))));
      badge.textContent = title;
    }

    var c = getShapeCoordinates(selected.type, selected.index);
    if (coords && c) {
      if (selected.type === 'axis') {
        coords.textContent = "X: 0 → " + c.effectiveXSize + " | Y: 0 → " + c.effectiveYSize;
        if (typeof openAxisCard === 'function') openAxisCard();
      } else if (selected.type === 'circle') {
        coords.textContent = "Center: (" + c.cx + ", " + c.cy + ") | Radius: " + c.r;
      } else if (selected.type === 'curve') {
        coords.textContent = "P₁(" + c.p1.x + ", " + c.p1.y + ") C₁(" + c.c1.x + ", " + c.c1.y + ") C₂(" + c.c2.x + ", " + c.c2.y + ") P₂(" + c.p2.x + ", " + c.p2.y + ")";
      } else {
        coords.textContent = "(" + c.x1 + ", " + c.y1 + ") → (" + c.x2 + ", " + c.y2 + ")";
      }
    }

    bar.style.display = "flex";
  }

  window.deselectShape = function () {
    window.drawingState.selectedShape = null;
    var bar = document.getElementById("shape-selected-card");
    if (bar) bar.style.display = "none";
    if (window.drawingState.tool !== 'axis') {
      window.closeAxisCard();
    }
    renderAllOverlays();
  };

  window.selectShapeOnCanvas = function (type, index) {
    var state = window.drawingState;
    window.setDrawTool('select');
    state.selectedShape = { type: type, index: index, activeHandle: null };
    showSelectedShapeBar(state.selectedShape);
    renderAllOverlays();

    var canvasStage = document.querySelector(".canvas-stage-wrapper");
    if (canvasStage) {
      canvasStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (window.showToast) {
      var title = type === 'axis' ? "Coordinate Axis" : (type === 'rectangle' ? "Rectangle " : (type === 'circle' ? "Circle " : (type === 'curve' ? "Curve " : "Line "))) + (type === 'axis' ? "" : index);
      window.showToast("Selected " + title + " on canvas. Drag handles to tweak!");
    }
  };

  window.scrollToSelectedCard = function () {
    var sel = window.drawingState.selectedShape;
    if (sel) {
      synchronizeSidebarCard(sel.type, sel.index);
      if (window.showToast) {
        var title = sel.type === 'axis' ? "Coordinate Axis" : (sel.type === 'rectangle' ? "Rectangle " : (sel.type === 'circle' ? "Circle " : (sel.type === 'curve' ? "Curve " : "Line "))) + (sel.type === 'axis' ? "" : sel.index);
        window.showToast("Scrolled to " + title + " in secondary form");
      }
    }
  };

  window.deleteSelectedShape = function () {
    var sel = window.drawingState.selectedShape;
    if (!sel) return;

    if (window.layerManager && window.layerManager.isLocked(sel.type, sel.index)) {
      if (window.showToast) window.showToast('Layer is locked. Unlock it in the Layers sidebar to delete.');
      return;
    }

    if (sel.type === 'axis') {
      var xsizeEl = document.getElementById("xsize");
      var ysizeEl = document.getElementById("ysize");
      if (xsizeEl) xsizeEl.value = 10;
      if (ysizeEl) ysizeEl.value = 10;
      var x1 = document.getElementById("label_x_1"); if (x1) x1.value = 0;
      var x1n = document.getElementById("label_x_1_name"); if (x1n) x1n.value = "";
      var x2 = document.getElementById("label_x_2"); if (x2) x2.value = 0;
      var x2n = document.getElementById("label_x_2_name"); if (x2n) x2n.value = "";
      var y1 = document.getElementById("label_y_1"); if (y1) y1.value = 0;
      var y1n = document.getElementById("label_y_1_name"); if (y1n) y1n.value = "";
      var y2 = document.getElementById("label_y_2"); if (y2) y2.value = 0;
      var y2n = document.getElementById("label_y_2_name"); if (y2n) y2n.value = "";
      if (typeof updateAxisCardUI === 'function') updateAxisCardUI();
    } else if (sel.type === 'rectangle') {
      if (typeof delR === 'function') delR(sel.index);
      var show = document.getElementById("retangularshow_" + sel.index);
      if (show) show.checked = false;
    } else if (sel.type === 'circle') {
      if (typeof delCircle === 'function') delCircle(sel.index);
      var show = document.getElementById("circleshow_" + sel.index);
      if (show) show.checked = false;
    } else if (sel.type === 'line') {
      if (typeof del === 'function') del(sel.index);
      var show = document.getElementById("lineshow_" + sel.index);
      if (show) show.checked = false;
    } else if (sel.type === 'curve') {
      if (typeof delC === 'function') delC(sel.index);
      var show = document.getElementById("curveshow_" + sel.index);
      if (show) show.checked = false;
    }

    if (window.layerManager) {
      window.layerManager.syncFromDOM();
    }
    if (typeof DrawGraph === 'function') DrawGraph();
    window.deselectShape();
    if (window.showToast) {
      window.showToast(sel.type === 'axis' ? "Axis reset to defaults" : "Shape cleared from canvas");
    }
    if (window.coordinateHistory) {
      window.coordinateHistory.push("Delete " + sel.type.charAt(0).toUpperCase() + sel.type.slice(1) + " " + sel.index);
    }
  };

  /**
   * Handle mouse events on canvas
   */
  window.initCanvasInteraction = function () {
    var cnv = document.getElementById("myCanvas");
    if (!cnv) return;

    cnv.onmousedown = null;

    // Smooth Infinite Canvas Wheel Zoom centered at mouse cursor
    function handleCanvasWheel(evt) {
      var cnv = document.getElementById("myCanvas");
      if (!cnv) return;
      evt.preventDefault();

      var rect = cnv.getBoundingClientRect();
      var scaleX = cnv.width / rect.width;
      var scaleY = cnv.height / rect.height;
      var canvasX = (evt.clientX - rect.left) * scaleX;
      var canvasY = (evt.clientY - rect.top) * scaleY;

      var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : 35);
      var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
      var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);

      var mathX = (canvasX - curXOffset) / curScale;
      var mathY = (cnv.height - curYOffset - canvasY) / curScale;

      var delta = evt.deltaY;
      var zoomFactor = delta < 0 ? 1.12 : 0.893;

      var newScale = Math.max(6, Math.min(300, curScale * zoomFactor));
      if (Math.abs(newScale - curScale) < 0.01) return;

      var newXOffset = canvasX - mathX * newScale;
      var newYOffset = cnv.height - canvasY - mathY * newScale;

      window.scale = Math.round(newScale * 100) / 100;
      window.x_offset = Math.round(newXOffset * 10) / 10;
      window.y_offset = Math.round(newYOffset * 10) / 10;

      if (typeof scale !== 'undefined') scale = window.scale;
      if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
      if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

      var scaleInput = document.getElementById("graph_scale");
      if (scaleInput) scaleInput.value = Math.round(window.scale * 10) / 10;

      if (typeof DrawGraph === 'function') DrawGraph();
      if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
      renderAllOverlays();
      window.updateViewportHUD(window.getCanvasMathPos(evt.clientX, evt.clientY));
    }

    cnv.addEventListener('wheel', handleCanvasWheel, { passive: false });
    var stageWrapper = document.querySelector('.canvas-stage-wrapper');
    if (stageWrapper) {
      stageWrapper.addEventListener('wheel', function (e) {
        if (e.target === stageWrapper || stageWrapper.contains(e.target)) {
          handleCanvasWheel(e);
        }
      }, { passive: false });
    }

    cnv.addEventListener('mousedown', function (evt) {
      var state = window.drawingState;
      var pos = window.getCanvasMathPos(evt.clientX, evt.clientY);

      // 0. Check for Pan trigger: Middle-click OR Spacebar held OR Pan Tool active
      if (evt.button === 1 || state.isSpacePressed || state.tool === 'pan') {
        state.isPanning = true;
        state.panStart = {
          clientX: evt.clientX,
          clientY: evt.clientY,
          x_offset: (typeof window.x_offset !== 'undefined') ? window.x_offset : 28,
          y_offset: (typeof window.y_offset !== 'undefined') ? window.y_offset : 28
        };
        cnv.style.cursor = 'grabbing';
        evt.preventDefault();
        return;
      }

      // 1. Check if user clicked on Candidate Handle
      if (state.candidate) {
        var candidateHandle = hitTestCandidateHandles(pos);
        if (candidateHandle) {
          state.candidate.activeHandle = candidateHandle;
          state.isMouseDown = true;
          return;
        } else {
          // If clicked far away, dismiss or cancel previous candidate
          // and let user start fresh
          window.cancelCandidateShape();
        }
      }

      // 2. In 'select' mode: check handles or hit test existing shapes
      if (state.tool === 'select') {
        if (state.selectedShape) {
          var isCurLocked = window.layerManager && window.layerManager.isLocked(state.selectedShape.type, state.selectedShape.index);
          if (isCurLocked) {
            if (window.showToast) window.showToast('Layer is locked. Unlock it in the Layers sidebar to modify.');
          } else {
            var selHandle = hitTestSelectedHandles(pos);
            if (selHandle) {
              state.selectedShape.activeHandle = selHandle;
              state.isMouseDown = true;
              state.dragPreState = window.coordinateHistory ? window.coordinateHistory.capture() : null;
              return;
            }
          }
        }

        var hitShape = hitTestExistingShapes(pos);
        if (hitShape) {
          state.selectedShape = hitShape;
          showSelectedShapeBar(hitShape);
          renderAllOverlays();
          if (window.layerManager) {
            window.layerManager.selectLayer(hitShape.type + '_' + hitShape.index);
          }
          return;
        } else {
          window.deselectShape();
        }
        return;
      }

      // 3. In Axis Mode: check handle clicks, line ticks, or quadrant drag
      if (state.tool === 'axis') {
        var axHandle = hitTestAxisHandles(pos);
        if (axHandle) {
          if (axHandle === 'origin') {
            // Prompt or cycle origin name or focus card
            openAxisCard();
            var origIn = document.getElementById("axis-card-origin");
            if (origIn) origIn.focus();
          } else {
            state.activeAxisHandle = axHandle;
            state.isMouseDown = true;
            state.dragPreState = window.coordinateHistory ? window.coordinateHistory.capture() : null;
          }
          return;
        }

        // Clicking on or near the X axis line (y near 0, x > 0) sets/moves an X-tick
        if (Math.abs(pos.y) <= 0.35 && pos.x >= 0.5) {
          setOrMoveAxisTick('x', pos.x);
          return;
        }
        // Clicking on or near the Y axis line (x near 0, y > 0) sets/moves a Y-tick
        if (Math.abs(pos.x) <= 0.35 && pos.y >= 0.5) {
          setOrMoveAxisTick('y', pos.y);
          return;
        }

        // Clicking elsewhere starts a quadrant resizing drag
        state.isMouseDown = true;
        state.hasMoved = false;
        state.dragStartPos = { x: 0, y: 0 };
        state.currentPos = pos;
        return;
      }

      // 4. In Drawing Mode: start rubberband drag
      state.isMouseDown = true;
      state.hasMoved = false;

      // Single point placement for rectangle or line subPoints (p1 / p2)
      if (state.subPoint !== 'all') {
        placePointDirectly(pos);
        state.isMouseDown = false;
        return;
      }

      // Point / Label placement with Confirmation Card
      if (state.tool === 'point') {
        createAndCommitPointCandidate(pos);
        state.isMouseDown = false;
        return;
      }

      // Curve placement
      if (state.tool === 'curve') {
        handleCurvePointPlacement(pos);
        state.isMouseDown = false;
        return;
      }

      // Rubberband Rectangle or Line
      if (!state.dragStartPos) {
        state.dragStartPos = pos;
        state.currentPos = pos;
      } else {
        // Second click of two-click interaction
        var endP = pos;
        if (state.tool === 'line' && evt.shiftKey) {
          var sn = snapToStandardAngles(state.dragStartPos.x, state.dragStartPos.y, pos.x, pos.y);
          endP = {
            x: sn.x,
            y: sn.y,
            screenX: window.mathToScreen(sn.x, sn.y).screenX,
            screenY: window.mathToScreen(sn.x, sn.y).screenY,
            canvasX: pos.canvasX,
            canvasY: pos.canvasY
          };
        }
        completeRubberband(state.dragStartPos, endP);
      }
    });

    cnv.addEventListener('mousemove', function (evt) {
      var state = window.drawingState;

      // 0. If currently panning canvas viewport
      if (state.isPanning && state.panStart) {
        var rect = cnv.getBoundingClientRect();
        var scaleX = cnv.width / rect.width;
        var scaleY = cnv.height / rect.height;
        var dx = (evt.clientX - state.panStart.clientX) * scaleX;
        var dy = (evt.clientY - state.panStart.clientY) * scaleY;
        window.x_offset = Math.round((state.panStart.x_offset + dx) * 10) / 10;
        window.y_offset = Math.round((state.panStart.y_offset - dy) * 10) / 10;
        if (typeof x_offset !== 'undefined') x_offset = window.x_offset;
        if (typeof y_offset !== 'undefined') y_offset = window.y_offset;

        if (typeof DrawGraph === 'function') DrawGraph();
        if (window.isGridDrawn && typeof drawGrid === 'function') drawGrid();
        renderAllOverlays();
        window.updateViewportHUD(window.getCanvasMathPos(evt.clientX, evt.clientY));
        return;
      }

      var pos = window.getCanvasMathPos(evt.clientX, evt.clientY);

      // Shift-to-snap constraint (0°, 45°, 90°, etc.) for straight line drawing
      if (state.tool === 'line' && state.dragStartPos && evt.shiftKey) {
        var snapped = snapToStandardAngles(state.dragStartPos.x, state.dragStartPos.y, pos.x, pos.y);
        pos.x = snapped.x;
        pos.y = snapped.y;
        var sc = window.mathToScreen(pos.x, pos.y);
        pos.screenX = sc.screenX;
        pos.screenY = sc.screenY;
      }

      state.currentPos = pos;

      // Update HUD coordinates with telemetry
      var hud = document.getElementById("canvas-coord-hud");
      if (hud) {
        if (state.tool === 'line' && state.dragStartPos) {
          var dx = pos.x - state.dragStartPos.x;
          var dy = pos.y - state.dragStartPos.y;
          var len = Math.hypot(dx, dy).toFixed(2);
          var slope = Math.abs(dx) < 0.0001 ? "∞" : (dy / dx).toFixed(2);
          var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
          var snapTag = evt.shiftKey ? " [Shift Snapped 45°]" : " [Shift to snap 45°]";
          hud.textContent = "Cursor: (" + pos.x + ", " + pos.y + ") | L: " + len + " u | " + angle + "° (Slope: " + slope + ")" + snapTag;
        } else {
          hud.textContent = "Cursor: (" + pos.x + ", " + pos.y + ")";
        }
      }

      // 1. Dragging candidate handle
      if (state.isMouseDown && state.candidate && state.candidate.activeHandle) {
        dragCandidateHandle(state.candidate, state.candidate.activeHandle, pos, evt);
        openConfirmationCard(state.candidate);
        renderAllOverlays();
        return;
      }

      // 2. Dragging selected shape handle in 'select' mode
      if (state.isMouseDown && state.selectedShape && state.selectedShape.activeHandle) {
        dragSelectedHandle(state.selectedShape, state.selectedShape.activeHandle, pos, evt);
        if (typeof DrawGraph === 'function') DrawGraph();
        renderAllOverlays();
        return;
      }

      // 3. Dragging Axis handles or dragging quadrant bounds in Axis mode
      if (state.isMouseDown && state.tool === 'axis') {
        if (state.activeAxisHandle) {
          dragAxisHandle(state.activeAxisHandle, pos);
          openAxisCard();
          renderAllOverlays();
          return;
        } else if (state.dragStartPos) {
          var newX = Math.max(1, Math.round(pos.x * 2) / 2);
          var newY = Math.max(1, Math.round(pos.y * 2) / 2);
          var xsizeEl = document.getElementById("xsize");
          var ysizeEl = document.getElementById("ysize");
          if (xsizeEl) xsizeEl.value = newX;
          if (ysizeEl) ysizeEl.value = newY;
          if (typeof DrawGraph === 'function') DrawGraph();
          if (typeof updateAxisCardUI === 'function') updateAxisCardUI();
          renderAllOverlays();
          return;
        }
      }

      // 4. Hover cursor updates
      if (state.candidate) {
        var hHandle = hitTestCandidateHandles(pos);
        if (hHandle) {
          if (hHandle === 'c1' || hHandle === 'c3') cnv.style.cursor = 'nwse-resize';
          else if (hHandle === 'c2' || hHandle === 'c4') cnv.style.cursor = 'nesw-resize';
          else if (hHandle === 'radius_e' || hHandle === 'radius_w') cnv.style.cursor = 'ew-resize';
          else if (hHandle === 'radius_n' || hHandle === 'radius_s') cnv.style.cursor = 'ns-resize';
          else if (hHandle === 'radius') cnv.style.cursor = 'crosshair';
          else cnv.style.cursor = 'move';
          return;
        }
      } else if (state.tool === 'axis') {
        var axH = hitTestAxisHandles(pos);
        if (axH === 'corner') cnv.style.cursor = 'nesw-resize';
        else if (axH === 'x_arrow') cnv.style.cursor = 'ew-resize';
        else if (axH === 'y_arrow') cnv.style.cursor = 'ns-resize';
        else if (axH && axH.indexOf('x_tick') !== -1) cnv.style.cursor = 'ew-resize';
        else if (axH && axH.indexOf('y_tick') !== -1) cnv.style.cursor = 'ns-resize';
        else if (axH === 'origin') cnv.style.cursor = 'pointer';
        else if (Math.abs(pos.y) <= 0.35 && pos.x >= 0.5) cnv.style.cursor = 'cell';
        else if (Math.abs(pos.x) <= 0.35 && pos.y >= 0.5) cnv.style.cursor = 'cell';
        else cnv.style.cursor = 'crosshair';
      } else if (state.tool === 'select') {
        if (state.selectedShape) {
          var sHandle = hitTestSelectedHandles(pos);
          if (sHandle) {
            if (sHandle === 'c1' || sHandle === 'c3' || sHandle === 'corner') cnv.style.cursor = 'nwse-resize';
            else if (sHandle === 'c2' || sHandle === 'c4') cnv.style.cursor = 'nesw-resize';
            else if (sHandle === 'radius_e' || sHandle === 'radius_w') cnv.style.cursor = 'ew-resize';
            else if (sHandle === 'radius_n' || sHandle === 'radius_s') cnv.style.cursor = 'ns-resize';
            else if (sHandle === 'radius') cnv.style.cursor = 'crosshair';
            else cnv.style.cursor = 'move';
            return;
          }
        }
        var hShape = hitTestExistingShapes(pos);
        cnv.style.cursor = hShape ? 'pointer' : 'default';
      } else {
        cnv.style.cursor = 'crosshair';
      }

      if (state.isMouseDown) {
        state.hasMoved = true;
      }

      renderAllOverlays();
    });

    cnv.addEventListener('mouseup', function (evt) {
      var state = window.drawingState;

      // Handle pan release
      if (state.isPanning) {
        state.isPanning = false;
        state.panStart = null;
        if (state.tool === 'pan' || state.isSpacePressed) {
          cnv.style.cursor = 'grab';
        } else if (state.tool === 'select') {
          cnv.style.cursor = 'default';
        } else {
          cnv.style.cursor = 'crosshair';
        }
        return;
      }

      if (!state.isMouseDown) return;
      state.isMouseDown = false;

      // Axis handle release
      if (state.tool === 'axis') {
        state.activeAxisHandle = null;
        state.dragStartPos = null;
        if (state.dragPreState && window.coordinateHistory) {
          window.coordinateHistory.pushPreState("Adjust Axis", state.dragPreState);
          state.dragPreState = null;
        }
        openAxisCard();
        renderAllOverlays();
        return;
      }

      // If finished dragging a handle
      if (state.candidate && state.candidate.activeHandle) {
        state.candidate.activeHandle = null;
        renderAllOverlays();
        return;
      }
      if (state.selectedShape && state.selectedShape.activeHandle) {
        if (state.dragPreState && window.coordinateHistory) {
          var sType = state.selectedShape.type || 'Shape';
          window.coordinateHistory.pushPreState("Move " + sType.charAt(0).toUpperCase() + sType.slice(1) + " " + state.selectedShape.index, state.dragPreState);
          state.dragPreState = null;
        }
        state.selectedShape.activeHandle = null;
        renderAllOverlays();
        return;
      }

      // If dragged with meaningful distance (> 6px), complete rubberband
      if (state.hasMoved && state.dragStartPos) {
        var endPos = window.getCanvasMathPos(evt.clientX, evt.clientY);
        if (state.tool === 'line' && evt.shiftKey) {
          var sn = snapToStandardAngles(state.dragStartPos.x, state.dragStartPos.y, endPos.x, endPos.y);
          endPos.x = sn.x;
          endPos.y = sn.y;
          var sc = window.mathToScreen(endPos.x, endPos.y);
          endPos.screenX = sc.screenX;
          endPos.screenY = sc.screenY;
        }
        var dist = Math.hypot(endPos.canvasX - state.dragStartPos.canvasX, endPos.canvasY - state.dragStartPos.canvasY);
        if (dist > 6) {
          completeRubberband(state.dragStartPos, endPos);
        }
      }
    });

    // Window mouseup listener prevents getting stuck in pan if released outside canvas
    window.addEventListener('mouseup', function () {
      var state = window.drawingState;
      if (state && state.isPanning) {
        state.isPanning = false;
        state.panStart = null;
        if (cnv) {
          cnv.style.cursor = (state.tool === 'pan' || state.isSpacePressed) ? 'grab' : (state.tool === 'select' ? 'default' : 'crosshair');
        }
      }
    });

    // Spacebar release listener
    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space') {
        window.drawingState.isSpacePressed = false;
        if (!window.drawingState.isPanning && cnv) {
          cnv.style.cursor = (window.drawingState.tool === 'pan') ? 'grab' : (window.drawingState.tool === 'select' ? 'default' : 'crosshair');
        }
      }
    });

    cnv.addEventListener('mouseleave', function () {
      var hud = document.getElementById("canvas-coord-hud");
      if (hud) hud.textContent = "Cursor: (x, y)";
      window.drawingState.currentPos = null;
      renderAllOverlays();
    });

    // Keyboard Shortcuts: Enter (Confirm), Escape (Cancel), Space (Pan), H (Pan Tool), +, -, 0 (Zoom)
    window.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && window.drawingState.candidate) {
          window.confirmCandidateShape();
          e.preventDefault();
        }
        return;
      }

      // Spacebar temporary pan mode
      if (e.code === 'Space' && !window.drawingState.isSpacePressed) {
        window.drawingState.isSpacePressed = true;
        if (cnv && !window.drawingState.isPanning) {
          cnv.style.cursor = 'grab';
        }
        e.preventDefault();
        return;
      }

      if (e.key === 'Enter') {
        if (window.drawingState.candidate) {
          window.confirmCandidateShape();
          e.preventDefault();
        } else if (window.drawingState.tool === 'axis') {
          window.confirmAxisCard();
          e.preventDefault();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (window.coordinateHistory && window.coordinateHistory.canUndo()) {
          window.coordinateUndo();
          e.preventDefault();
        }
      } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
        if (window.coordinateHistory && window.coordinateHistory.canRedo()) {
          window.coordinateRedo();
          e.preventDefault();
        }
      } else if (e.key === 'Escape') {
        if (window.drawingState.candidate) {
          window.cancelCandidateShape();
        } else if (window.drawingState.selectedShape) {
          window.deselectShape();
        } else if (window.drawingState.tool === 'axis') {
          window.closeAxisCard();
          window.setDrawTool('select');
        } else {
          window.cancelDrawingMode();
        }
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && window.drawingState.tool === 'curve' && window.drawingState.placedCurvePoints.length > 0) {
        window.undoLastCurvePoint();
        e.preventDefault();
      } else if (e.key === 'Delete' && window.drawingState.selectedShape) {
        window.deleteSelectedShape();
        e.preventDefault();
      } else if (e.key === 'h' || e.key === 'H') {
        window.setDrawTool('pan');
      } else if (e.key === '+' || e.key === '=') {
        window.zoomCanvasAtCenter(1.2);
        e.preventDefault();
      } else if (e.key === '-' || e.key === '_') {
        window.zoomCanvasAtCenter(0.833);
        e.preventDefault();
      } else if (e.key === '0') {
        window.resetCanvasZoom();
        e.preventDefault();
      } else if (e.key === 'a' || e.key === 'A') {
        window.setDrawTool('axis');
      } else if (e.key === 'r' || e.key === 'R') {
        window.setDrawTool('rectangle');
      } else if (e.key === 'o' || e.key === 'O') {
        window.setDrawTool('circle');
      } else if (e.key === 'l' || e.key === 'L') {
        window.setDrawTool('line');
      } else if (e.key === 'c' || e.key === 'C') {
        window.setDrawTool('curve');
      } else if (e.key === 'p' || e.key === 'P') {
        window.setDrawTool('point');
      } else if (e.key === 'v' || e.key === 'V' || e.key === 's' || e.key === 'S') {
        window.setDrawTool('select');
      } else if (e.key === 'g' || e.key === 'G') {
        window.toggleSnapGrid();
      }
    });

    // Real-time live label update while typing in confirmation card
    var confirmLabelInput = document.getElementById("confirm-shape-label");
    if (confirmLabelInput) {
      confirmLabelInput.addEventListener("input", function (e) {
        var state = window.drawingState;
        if (state.candidate) {
          state.candidate.label = e.target.value;
          renderAllOverlays();
        }
      });
    }

    // Initialize telemetry readout for all current lines
    initializeAllLineTelemetry();
  };

  /**
   * Drag handle adjustments for Candidate shape
   */
  function dragCandidateHandle(candidate, handle, pos, evt) {
    if (candidate.type === 'rectangle') {
      if (handle === 'c1') {
        candidate.start.x = pos.x;
        candidate.start.y = pos.y;
      } else if (handle === 'c2') {
        candidate.end.x = pos.x;
        candidate.start.y = pos.y;
      } else if (handle === 'c3') {
        candidate.end.x = pos.x;
        candidate.end.y = pos.y;
      } else if (handle === 'c4') {
        candidate.start.x = pos.x;
        candidate.end.y = pos.y;
      } else if (handle === 'center') {
        var w = candidate.end.x - candidate.start.x;
        var h = candidate.end.y - candidate.start.y;
        candidate.start.x = Math.round((pos.x - w / 2) * 100) / 100;
        candidate.start.y = Math.round((pos.y - h / 2) * 100) / 100;
        candidate.end.x = Math.round((candidate.start.x + w) * 100) / 100;
        candidate.end.y = Math.round((candidate.start.y + h) * 100) / 100;
      }
    } else if (candidate.type === 'line') {
      if (handle === 'p1') {
        if (evt && evt.shiftKey) {
          var sn = snapToStandardAngles(candidate.end.x, candidate.end.y, pos.x, pos.y);
          candidate.start.x = sn.x;
          candidate.start.y = sn.y;
        } else {
          candidate.start.x = pos.x;
          candidate.start.y = pos.y;
        }
      } else if (handle === 'p2') {
        if (evt && evt.shiftKey) {
          var sn = snapToStandardAngles(candidate.start.x, candidate.start.y, pos.x, pos.y);
          candidate.end.x = sn.x;
          candidate.end.y = sn.y;
        } else {
          candidate.end.x = pos.x;
          candidate.end.y = pos.y;
        }
      } else if (handle === 'mid') {
        var dx = candidate.end.x - candidate.start.x;
        var dy = candidate.end.y - candidate.start.y;
        candidate.start.x = Math.round((pos.x - dx / 2) * 100) / 100;
        candidate.start.y = Math.round((pos.y - dy / 2) * 100) / 100;
        candidate.end.x = Math.round((candidate.start.x + dx) * 100) / 100;
        candidate.end.y = Math.round((candidate.start.y + dy) * 100) / 100;
      }
    } else if (candidate.type === 'curve') {
      if (handle === 'p1') {
        candidate.p1.x = pos.x;
        candidate.p1.y = pos.y;
      } else if (handle === 'p2') {
        candidate.p2.x = pos.x;
        candidate.p2.y = pos.y;
      } else if (handle === 'c1') {
        var wasSingle = (candidate.c1.x === candidate.c2.x && candidate.c1.y === candidate.c2.y);
        candidate.c1.x = pos.x;
        candidate.c1.y = pos.y;
        if (wasSingle) {
          candidate.c2.x = pos.x;
          candidate.c2.y = pos.y;
        }
      } else if (handle === 'c2') {
        candidate.c2.x = pos.x;
        candidate.c2.y = pos.y;
      } else if (handle === 'mid') {
        var curMidX = 0.125 * candidate.p1.x + 0.375 * candidate.c1.x + 0.375 * candidate.c2.x + 0.125 * candidate.p2.x;
        var curMidY = 0.125 * candidate.p1.y + 0.375 * candidate.c1.y + 0.375 * candidate.c2.y + 0.125 * candidate.p2.y;
        var dx = pos.x - curMidX;
        var dy = pos.y - curMidY;

        candidate.p1.x = Math.round((candidate.p1.x + dx) * 100) / 100;
        candidate.p1.y = Math.round((candidate.p1.y + dy) * 100) / 100;
        candidate.c1.x = Math.round((candidate.c1.x + dx) * 100) / 100;
        candidate.c1.y = Math.round((candidate.c1.y + dy) * 100) / 100;
        candidate.c2.x = Math.round((candidate.c2.x + dx) * 100) / 100;
        candidate.c2.y = Math.round((candidate.c2.y + dy) * 100) / 100;
        candidate.p2.x = Math.round((candidate.p2.x + dx) * 100) / 100;
        candidate.p2.y = Math.round((candidate.p2.y + dy) * 100) / 100;
      }
    } else if (candidate.type === 'point') {
      if (handle === 'pos') {
        candidate.pos.x = pos.x;
        candidate.pos.y = pos.y;
      }
    } else if (candidate.type === 'circle') {
      if (handle === 'center') {
        candidate.center.x = pos.x;
        candidate.center.y = pos.y;
      } else if (handle === 'radius_e') {
        candidate.radius = Math.round(Math.max(0.1, Math.abs(pos.x - candidate.center.x)) * 100) / 100;
      } else if (handle === 'radius_w') {
        candidate.radius = Math.round(Math.max(0.1, Math.abs(candidate.center.x - pos.x)) * 100) / 100;
      } else if (handle === 'radius_n') {
        candidate.radius = Math.round(Math.max(0.1, Math.abs(pos.y - candidate.center.y)) * 100) / 100;
      } else if (handle === 'radius_s') {
        candidate.radius = Math.round(Math.max(0.1, Math.abs(candidate.center.y - pos.y)) * 100) / 100;
      } else if (handle === 'radius') {
        candidate.radius = Math.round(Math.max(0.1, Math.hypot(pos.x - candidate.center.x, pos.y - candidate.center.y)) * 100) / 100;
      }
    }
  }

  /**
   * Drag handle adjustments for Selected existing shape in select mode
   */
  function dragSelectedHandle(selected, handle, pos, evt) {
    if (selected.type === 'rectangle') {
      var r = document.getElementById("r_" + selected.index);
      var s = document.getElementById("s_" + selected.index);
      var t = document.getElementById("t_" + selected.index);
      var u = document.getElementById("u_" + selected.index);
      if (!r || !s || !t || !u) return;

      if (handle === 'c1') {
        r.value = pos.x; s.value = pos.y;
      } else if (handle === 'c2') {
        t.value = pos.x; s.value = pos.y;
      } else if (handle === 'c3') {
        t.value = pos.x; u.value = pos.y;
      } else if (handle === 'c4') {
        r.value = pos.x; u.value = pos.y;
      } else if (handle === 'center') {
        var w = parseFloat(t.value) - parseFloat(r.value);
        var h = parseFloat(u.value) - parseFloat(s.value);
        r.value = Math.round((pos.x - w / 2) * 100) / 100;
        s.value = Math.round((pos.y - h / 2) * 100) / 100;
        t.value = Math.round((parseFloat(r.value) + w) * 100) / 100;
        u.value = Math.round((parseFloat(s.value) + h) * 100) / 100;
      }
    } else if (selected.type === 'circle') {
      var cx = document.getElementById("circle_x_" + selected.index);
      var cy = document.getElementById("circle_y_" + selected.index);
      var cr = document.getElementById("circle_r_" + selected.index);
      if (!cx || !cy || !cr) return;

      var curCx = parseFloat(cx.value) || 0;
      var curCy = parseFloat(cy.value) || 0;

      if (handle === 'center') {
        cx.value = pos.x;
        cy.value = pos.y;
      } else if (handle === 'radius_e') {
        cr.value = Math.round(Math.max(0.1, Math.abs(pos.x - curCx)) * 100) / 100;
      } else if (handle === 'radius_w') {
        cr.value = Math.round(Math.max(0.1, Math.abs(curCx - pos.x)) * 100) / 100;
      } else if (handle === 'radius_n') {
        cr.value = Math.round(Math.max(0.1, Math.abs(pos.y - curCy)) * 100) / 100;
      } else if (handle === 'radius_s') {
        cr.value = Math.round(Math.max(0.1, Math.abs(curCy - pos.y)) * 100) / 100;
      } else if (handle === 'radius') {
        cr.value = Math.round(Math.max(0.1, Math.hypot(pos.x - curCx, pos.y - curCy)) * 100) / 100;
      }
    } else if (selected.type === 'line') {
      var a = document.getElementById("a_" + selected.index);
      var b = document.getElementById("b_" + selected.index);
      var c = document.getElementById("c_" + selected.index);
      var d = document.getElementById("d_" + selected.index);
      if (!a || !b || !c || !d) return;

      if (handle === 'p1') {
        if (evt && evt.shiftKey) {
          var fixedX = parseFloat(c.value) || 0;
          var fixedY = parseFloat(d.value) || 0;
          var sn = snapToStandardAngles(fixedX, fixedY, pos.x, pos.y);
          a.value = sn.x; b.value = sn.y;
        } else {
          a.value = pos.x; b.value = pos.y;
        }
      } else if (handle === 'p2') {
        if (evt && evt.shiftKey) {
          var fixedX = parseFloat(a.value) || 0;
          var fixedY = parseFloat(b.value) || 0;
          var sn = snapToStandardAngles(fixedX, fixedY, pos.x, pos.y);
          c.value = sn.x; d.value = sn.y;
        } else {
          c.value = pos.x; d.value = pos.y;
        }
      } else if (handle === 'mid') {
        var dx = parseFloat(c.value) - parseFloat(a.value);
        var dy = parseFloat(d.value) - parseFloat(b.value);
        a.value = Math.round((pos.x - dx / 2) * 100) / 100;
        b.value = Math.round((pos.y - dy / 2) * 100) / 100;
        c.value = Math.round((parseFloat(a.value) + dx) * 100) / 100;
        d.value = Math.round((parseFloat(b.value) + dy) * 100) / 100;
      }

      if (typeof window.updateLineTelemetry === 'function') {
        window.updateLineTelemetry(selected.index);
      }
    } else if (selected.type === 'curve') {
      var e = document.getElementById("e_" + selected.index);
      var f = document.getElementById("f_" + selected.index);
      var g = document.getElementById("g_" + selected.index);
      var h = document.getElementById("h_" + selected.index);
      var i = document.getElementById("i_" + selected.index);
      var jEl = document.getElementById("j_" + selected.index);
      var k = document.getElementById("k_" + selected.index);
      var l = document.getElementById("l_" + selected.index);
      if (!e || !f || !g || !h || !i || !jEl || !k || !l) return;

      if (handle === 'p1') {
        e.value = pos.x; f.value = pos.y;
      } else if (handle === 'c1') {
        g.value = pos.x; h.value = pos.y;
      } else if (handle === 'c2') {
        i.value = pos.x; jEl.value = pos.y;
      } else if (handle === 'p2') {
        k.value = pos.x; l.value = pos.y;
      } else if (handle === 'mid') {
        var curX = (parseFloat(e.value) + parseFloat(g.value) + parseFloat(i.value) + parseFloat(k.value)) / 4;
        var curY = (parseFloat(f.value) + parseFloat(h.value) + parseFloat(jEl.value) + parseFloat(l.value)) / 4;
        var dx = pos.x - curX;
        var dy = pos.y - curY;
        e.value = Math.round((parseFloat(e.value) + dx) * 100) / 100;
        f.value = Math.round((parseFloat(f.value) + dy) * 100) / 100;
        g.value = Math.round((parseFloat(g.value) + dx) * 100) / 100;
        h.value = Math.round((parseFloat(h.value) + dy) * 100) / 100;
        i.value = Math.round((parseFloat(i.value) + dx) * 100) / 100;
        jEl.value = Math.round((parseFloat(jEl.value) + dy) * 100) / 100;
        k.value = Math.round((parseFloat(k.value) + dx) * 100) / 100;
        l.value = Math.round((parseFloat(l.value) + dy) * 100) / 100;
      }
    } else if (selected.type === 'axis') {
      dragAxisHandle(handle, pos);
    }
  }

  /**
   * Geometric Constraint: Snap point (px, py) relative to origin (ox, oy)
   * to multiples of 45° (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
   */
  function snapToStandardAngles(ox, oy, px, py) {
    var dx = px - ox;
    var dy = py - oy;
    var dist = Math.hypot(dx, dy);
    if (dist < 0.001) return { x: px, y: py };
    var angle = Math.atan2(dy, dx);
    var step = Math.PI / 4; // 45 degrees
    var snappedAngle = Math.round(angle / step) * step;
    return {
      x: Math.round((ox + dist * Math.cos(snappedAngle)) * 100) / 100,
      y: Math.round((oy + dist * Math.sin(snappedAngle)) * 100) / 100
    };
  }

  /**
   * Calculate & display telemetry (Length, Slope, Angle) for a given Line ID
   */
  window.updateLineTelemetry = function (id) {
    if (!id) return;
    var a = parseFloat(document.getElementById("a_" + id)?.value) || 0;
    var b = parseFloat(document.getElementById("b_" + id)?.value) || 0;
    var c = parseFloat(document.getElementById("c_" + id)?.value) || 0;
    var d = parseFloat(document.getElementById("d_" + id)?.value) || 0;
    var dx = c - a;
    var dy = d - b;
    var len = Math.hypot(dx, dy).toFixed(2);
    var slope = Math.abs(dx) < 0.0001 ? (Math.abs(dy) < 0.0001 ? "0" : "∞") : (dy / dx).toFixed(2);
    var angle = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);

    var pill = document.getElementById("line_telemetry_" + id);
    if (pill) {
      pill.textContent = "L: " + len + " u | Slope: " + slope + " (" + angle + "°)";
    }

    var state = window.drawingState;
    if (state && state.selectedShape && state.selectedShape.type === 'line' && state.selectedShape.index == id) {
      var hud = document.getElementById("canvas-coord-hud");
      if (hud) {
        hud.textContent = "Line " + id + " | L: " + len + " u | " + angle + "° (Slope: " + slope + ")";
      }
    }
  };

  /**
   * Initialize telemetry for lines on page load
   */
  function initializeAllLineTelemetry() {
    var maxLine = typeof counter_i !== 'undefined' ? counter_i : 5;
    for (var i = 1; i < maxLine; i++) {
      if (typeof window.updateLineTelemetry === 'function') {
        window.updateLineTelemetry(i);
      }
    }
  }

  /**
   * Complete Rubberband Drawing
   */
  function completeRubberband(startPos, endPos) {
    var state = window.drawingState;

    var candidate;
    if (state.tool === 'circle') {
      var radius = Math.round(Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y) * 100) / 100;
      candidate = {
        type: 'circle',
        center: { x: startPos.x, y: startPos.y },
        radius: Math.max(0.2, radius),
        color: state.color || 'black',
        dashed: !!state.dashed,
        fill: false,
        label: state.index ? ("Circle " + state.index) : '',
        targetSlot: state.index ? ('circle_' + state.index) : 'auto',
        activeHandle: null
      };
    } else if (state.tool === 'line') {
      candidate = {
        type: 'line',
        start: { x: startPos.x, y: startPos.y },
        end: { x: endPos.x, y: endPos.y },
        color: state.color || 'black',
        dashed: !!state.dashed,
        arrow: 'none',
        width: 'semithick',
        style: state.dashed ? 'dashed' : 'solid',
        labelPos: 'midway',
        labelAnchor: 'above',
        label: state.index ? ("Line " + state.index) : '',
        targetSlot: state.index ? ('line_' + state.index) : 'auto',
        activeHandle: null
      };
    } else {
      candidate = {
        type: state.tool,
        start: { x: startPos.x, y: startPos.y },
        end: { x: endPos.x, y: endPos.y },
        color: 'black',
        dashed: false,
        label: '',
        targetSlot: 'auto',
        activeHandle: null
      };
    }

    state.dragStartPos = null;
    state.hasMoved = false;

    if (state.requireConfirm) {
      state.candidate = candidate;
      openConfirmationCard(candidate);
      renderAllOverlays();
    } else {
      // Auto-commit immediately if confirm mode disabled
      state.candidate = candidate;
      window.confirmCandidateShape();
    }
  }

  /**
   * Helper: create and commit curve candidate shape for confirmation
   */
  function createAndCommitCurveCandidate(p1, p2, c1, c2) {
    var state = window.drawingState;
    var candidate = {
      type: 'curve',
      p1: { x: p1.x, y: p1.y },
      p2: { x: p2.x, y: p2.y },
      c1: { x: c1.x, y: c1.y },
      c2: { x: c2.x, y: c2.y },
      color: state.color || 'black',
      dashed: !!state.dashed,
      label: "Curve " + state.index,
      targetSlot: 'curve_' + state.index,
      activeHandle: null
    };

    state.placedCurvePoints = [];
    updateDrawingUI();

    if (state.requireConfirm) {
      state.candidate = candidate;
      openConfirmationCard(candidate);
      renderAllOverlays();
      if (window.showToast) {
        window.showToast("Curve endpoints & controls set. Adjust handles on canvas or confirm.");
      }
    } else {
      state.candidate = candidate;
      window.confirmCandidateShape();
    }
  }

  /**
   * Helper: create and commit point candidate shape for confirmation
   */
  function createAndCommitPointCandidate(pos) {
    var state = window.drawingState;
    var candidate = {
      type: 'point',
      pos: { x: pos.x, y: pos.y },
      color: state.color || 'black',
      dot: true,
      anchor: 'above_right',
      label: '', // User will type their text label in confirmation card
      targetSlot: state.index ? ('point_' + state.index) : 'auto',
      activeHandle: null
    };

    state.dragStartPos = null;
    state.hasMoved = false;

    if (state.requireConfirm) {
      state.candidate = candidate;
      openConfirmationCard(candidate);
      renderAllOverlays();
      if (window.showToast) {
        window.showToast("Point placed at (" + pos.x + ", " + pos.y + "). Type your label text in the card.");
      }
    } else {
      state.candidate = candidate;
      window.confirmCandidateShape();
    }
  }

  /**
   * Handle 4-point Bézier curve clicks in order:
   * 1. Start (P₁) -> 2. End (P₂) -> 3. Control 1 (C₁) -> 4. Control 2 (C₂)
   */
  function handleCurvePointPlacement(pos) {
    var state = window.drawingState;
    var step = state.placedCurvePoints.length + 1;

    if (step === 1) {
      state.placedCurvePoints.push(pos);
      if (window.showToast) {
        window.showToast("Start Point (P₁) set at (" + pos.x + ", " + pos.y + "). Now click End Point (P₂).");
      }
    } else if (step === 2) {
      state.placedCurvePoints.push(pos);
      if (window.showToast) {
        window.showToast("End Point (P₂) set at (" + pos.x + ", " + pos.y + "). Now click Control 1 (C₁).");
      }
    } else if (step === 3) {
      state.placedCurvePoints.push(pos);
      if (window.showToast) {
        window.showToast("Control 1 (C₁) set at (" + pos.x + ", " + pos.y + "). Click Control 2 (C₂) or 'Match C₂ = C₁ (Arc)'.");
      }
    } else if (step === 4) {
      var p1 = state.placedCurvePoints[0];
      var p2 = state.placedCurvePoints[1];
      var c1 = state.placedCurvePoints[2];

      // If user clicks directly on or very close to C1, automatically match C2 = C1
      var distToC1 = Math.hypot(pos.screenX - c1.screenX, pos.screenY - c1.screenY);
      var c2 = distToC1 <= 16 ? { x: c1.x, y: c1.y } : pos;

      createAndCommitCurveCandidate(p1, p2, c1, c2);
      return;
    }

    updateDrawingUI();
    renderAllOverlays();
  }

  /**
   * Finish curve with single control point (C2 = C1) from banner
   */
  window.finishCurveAsSingleControl = function () {
    var state = window.drawingState;
    if (state.tool === 'curve' && state.placedCurvePoints) {
      if (state.placedCurvePoints.length === 3) {
        var p1 = state.placedCurvePoints[0];
        var p2 = state.placedCurvePoints[1];
        var c1 = state.placedCurvePoints[2];
        var c2 = { x: c1.x, y: c1.y };
        createAndCommitCurveCandidate(p1, p2, c1, c2);
      } else if (state.placedCurvePoints.length === 2 && state.currentPos) {
        var p1 = state.placedCurvePoints[0];
        var p2 = state.placedCurvePoints[1];
        var c1 = { x: state.currentPos.x, y: state.currentPos.y };
        var c2 = { x: state.currentPos.x, y: state.currentPos.y };
        createAndCommitCurveCandidate(p1, p2, c1, c2);
      } else if (window.showToast) {
        window.showToast("Please place P₁ and P₂ first to match control points.");
      }
    }
  };
  window.matchCurveC2ToC1 = window.finishCurveAsSingleControl;

  /**
   * Make existing candidate curve single control (C2 = C1) from confirmation card
   */
  window.makeCandidateCurveSingleControl = function () {
    var state = window.drawingState;
    if (state.candidate && state.candidate.type === 'curve') {
      state.candidate.c2.x = state.candidate.c1.x;
      state.candidate.c2.y = state.candidate.c1.y;
      openConfirmationCard(state.candidate);
      renderAllOverlays();
      if (window.showToast) {
        window.showToast("✓ Matched C₂ = C₁ (" + state.candidate.c1.x + ", " + state.candidate.c1.y + ") — Arc mode enabled.");
      }
    }
  };

  /**
   * Undo last placed curve point
   */
  window.undoLastCurvePoint = function () {
    var state = window.drawingState;
    if (state.tool === 'curve' && state.placedCurvePoints && state.placedCurvePoints.length > 0) {
      state.placedCurvePoints.pop();
      updateDrawingUI();
      renderAllOverlays();
      if (window.showToast) {
        window.showToast("Undid last curve point. Step " + (state.placedCurvePoints.length + 1) + "/4");
      }
    }
  };

  /**
   * Single point placement
   */
  function placePointDirectly(pos) {
    var state = window.drawingState;
    var j = state.index;

    if (state.tool === 'rectangle') {
      if (state.subPoint === 'p1') {
        var r = document.getElementById("r_" + j);
        var s = document.getElementById("s_" + j);
        if (r && s) { r.value = pos.x; s.value = pos.y; }
      } else if (state.subPoint === 'p2') {
        var t = document.getElementById("t_" + j);
        var u = document.getElementById("u_" + j);
        if (t && u) { t.value = pos.x; u.value = pos.y; }
      }
      var show = document.getElementById("retangularshow_" + j);
      if (show) show.checked = true;
      if (typeof DrawGraph === 'function') DrawGraph();
      synchronizeSidebarCard('rectangle', j);
      if (window.showToast) window.showToast("Rectangle " + j + " point updated: (" + pos.x + ", " + pos.y + ")");
    } else if (state.tool === 'line') {
      if (state.subPoint === 'p1') {
        var a = document.getElementById("a_" + j);
        var b = document.getElementById("b_" + j);
        if (a && b) { a.value = pos.x; b.value = pos.y; }
      } else if (state.subPoint === 'p2') {
        var c = document.getElementById("c_" + j);
        var d = document.getElementById("d_" + j);
        if (c && d) { c.value = pos.x; d.value = pos.y; }
      }
      var show = document.getElementById("lineshow_" + j);
      if (show) show.checked = true;
      if (typeof DrawGraph === 'function') DrawGraph();
      synchronizeSidebarCard('line', j);
      if (window.showToast) window.showToast("Line " + j + " point updated: (" + pos.x + ", " + pos.y + ")");
    } else if (state.tool === 'point') {
      for (var p = 1; p <= 9; p++) {
        var pEl = document.getElementById("p_" + p);
        var qEl = document.getElementById("q_" + p);
        var nameEl = document.getElementById("p_name_" + p);
        if (pEl && qEl && (parseFloat(pEl.value) === 0 && parseFloat(qEl.value) === 0 && (!nameEl || !nameEl.value))) {
          pEl.value = pos.x;
          qEl.value = pos.y;
          if (nameEl && !nameEl.value) nameEl.value = "P" + p;
          if (typeof DrawGraph === 'function') DrawGraph();
          if (window.showToast) window.showToast("Point P" + p + " placed at (" + pos.x + ", " + pos.y + ")");
          break;
        }
      }
    }

    renderAllOverlays();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initCanvasInteraction);
  } else {
    window.initCanvasInteraction();
  }
})();
