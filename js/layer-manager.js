/**
 * TikZ Studio - Coordinate Canvas Layering Manager
 * 
 * Provides full layer hierarchy management for the Coordinate Studio:
 * - Reorder layers (drag-and-drop, bring forward, send backward, bring to front, send to back)
 * - Lock / unlock specific shapes & lines to prevent accidental edits or dragging
 * - Hide / show specific shapes & lines with live canvas and TikZ code synchronization
 * - Bi-directional canvas-to-layer selection and hover preview highlights
 * - Bulk actions (Lock All, Unlock All, Show All, Hide All)
 * - Filter & search for complex multi-curve diagrams
 */

(function () {
  'use strict';

  function LayerManager() {
    this.layers = [];           // Array of layer objects, ordered [0] = Top (Front) to [N-1] = Bottom (Back)
    this.lockedMap = {};        // Map of locked layer IDs: { 'line_1': true, ... }
    this.selectedLayerId = null;// Currently selected layer ID
    this.isOpen = true;         // Sidebar expanded / collapsed state
    this.activeFilter = 'all';  // 'all' | 'line' | 'curve' | 'shape' | 'point'
    this.searchQuery = '';      // Text search filter
    this.isDragging = false;    // HTML5 drag state
    this.draggedLayerId = null; // Currently dragged layer ID
    this.axisVisible = true;    // Visibility of Axis layer
    this.axisLocked = false;    // Locked state of Axis layer
  }

  /**
   * Helper: generate human-readable label and telemetry for an element
   */
  LayerManager.prototype.getElementDetails = function (type, index) {
    var details = {
      id: type + '_' + index,
      type: type,
      index: index,
      name: '',
      color: '#0f172a',
      visible: true,
      locked: !!this.lockedMap[type + '_' + index],
      desc: '',
      badge: '',
      hasData: false
    };

    if (type === 'axis') {
      var xsize = document.getElementById('xsize');
      var ysize = document.getElementById('ysize');
      var xname = document.getElementById('xname');
      var yname = document.getElementById('yname');
      var axCol = document.getElementById('axisColor');
      var axShow = document.getElementById('axisshow');
      var xval = xsize ? parseFloat(xsize.value) || 0 : 0;
      var yval = ysize ? parseFloat(ysize.value) || 0 : 0;
      var isAct = window.isAxisActive ? window.isAxisActive() : (axShow ? axShow.checked : (xval > 0 || yval > 0));
      details.name = 'Axes & Ticks (' + (xname ? xname.value || 'x' : 'x') + ', ' + (yname ? yname.value || 'y' : 'y') + ')';
      details.color = axCol ? (axCol.value === 'black' ? '#0f172a' : axCol.value) : '#0f172a';
      details.desc = isAct ? ('X: 0 → ' + xval + ' | Y: 0 → ' + yval) : 'Inactive';
      details.badge = 'Axes';
      details.visible = this.axisVisible && isAct;
      details.locked = this.axisLocked;
      details.hasData = isAct;
      return details;
    }

    if (type === 'line') {
      var a = document.getElementById('a_' + index);
      var b = document.getElementById('b_' + index);
      var c = document.getElementById('c_' + index);
      var d = document.getElementById('d_' + index);
      var nameEl = document.getElementById('linename_' + index);
      var showEl = document.getElementById('lineshow_' + index);
      var colEl = document.getElementById('lineColor_' + index);
      var dashEl = document.getElementById('linedash_' + index);
      var arrowEl = document.getElementById('lineArrow_' + index);
      var styleEl = document.getElementById('lineStyle_' + index);

      if (a && b && c && d) {
        var aVal = parseFloat(a.value) || 0;
        var bVal = parseFloat(b.value) || 0;
        var cVal = parseFloat(c.value) || 0;
        var dVal = parseFloat(d.value) || 0;
        var label = nameEl ? nameEl.value.trim() : '';
        details.hasData = (aVal !== 0 || bVal !== 0 || cVal !== 0 || dVal !== 0 || label !== '');
        details.name = label ? label : ('Line ' + index);
        details.color = colEl ? (colEl.value === 'black' ? '#0f172a' : colEl.value) : '#0f172a';
        details.visible = showEl ? showEl.checked : true;
        details.badge = 'Line ' + index;
        var styleTag = (dashEl && dashEl.checked) || (styleEl && styleEl.value === 'dashed') ? 'dashed' : 'solid';
        var arrowTag = arrowEl && arrowEl.value !== 'none' ? ' ' + arrowEl.value : '';
        details.desc = '(' + aVal + ',' + bVal + ') → (' + cVal + ',' + dVal + ') • ' + styleTag + arrowTag;
      }
      return details;
    }

    if (type === 'curve') {
      var e = document.getElementById('e_' + index);
      var f = document.getElementById('f_' + index);
      var g = document.getElementById('g_' + index);
      var h = document.getElementById('h_' + index);
      var i = document.getElementById('i_' + index);
      var j = document.getElementById('j_' + index);
      var k = document.getElementById('k_' + index);
      var l = document.getElementById('l_' + index);
      var cname = document.getElementById('curvename_' + index);
      var cshow = document.getElementById('curveshow_' + index);
      var ccol = document.getElementById('curveColor_' + index) || document.getElementById('curvecolor_' + index);
      var cdash = document.getElementById('curvedash_' + index);

      if (e && f && k && l) {
        var eVal = parseFloat(e.value) || 0;
        var fVal = parseFloat(f.value) || 0;
        var kVal = parseFloat(k.value) || 0;
        var lVal = parseFloat(l.value) || 0;
        var clabel = cname ? cname.value.trim() : '';
        details.hasData = (eVal !== 0 || fVal !== 0 || kVal !== 0 || lVal !== 0 || clabel !== '');
        details.name = clabel ? clabel : ('Curve ' + index);
        details.color = ccol ? (ccol.value === 'black' ? '#0f172a' : ccol.value) : '#0f172a';
        details.visible = cshow ? cshow.checked : true;
        details.badge = 'Curve ' + index;
        var cstyle = cdash && cdash.checked ? 'dashed' : 'solid';
        details.desc = '(' + eVal + ',' + fVal + ') ~ (' + kVal + ',' + lVal + ') • Bézier ' + cstyle;
      }
      return details;
    }

    if (type === 'rectangle') {
      var r = document.getElementById('r_' + index);
      var s = document.getElementById('s_' + index);
      var t = document.getElementById('t_' + index);
      var u = document.getElementById('u_' + index);
      var rname = document.getElementById('retangularname_' + index);
      var rshow = document.getElementById('retangularshow_' + index);
      var rcol = document.getElementById('retangularColor_' + index);
      var rfill = document.getElementById('retangularfill_' + index);

      if (r && s && t && u) {
        var rVal = parseFloat(r.value) || 0;
        var sVal = parseFloat(s.value) || 0;
        var tVal = parseFloat(t.value) || 0;
        var uVal = parseFloat(u.value) || 0;
        var rlabel = rname ? rname.value.trim() : '';
        details.hasData = (rVal !== 0 || sVal !== 0 || tVal !== 0 || uVal !== 0 || rlabel !== '');
        details.name = rlabel ? rlabel : ('Rectangle ' + index);
        details.color = rcol ? (rcol.value === 'black' ? '#0f172a' : rcol.value) : '#0f172a';
        details.visible = rshow ? rshow.checked : true;
        details.badge = 'Rect ' + index;
        var fillTag = rfill && rfill.value ? 'fill: ' + rfill.value : 'outline';
        var w = Math.round(Math.abs(tVal - rVal) * 100) / 100;
        var h = Math.round(Math.abs(uVal - sVal) * 100) / 100;
        details.desc = '(' + rVal + ',' + sVal + ') • ' + w + '×' + h + ' • ' + fillTag;
      }
      return details;
    }

    if (type === 'circle') {
      var cx = document.getElementById('circle_x_' + index);
      var cy = document.getElementById('circle_y_' + index);
      var cr = document.getElementById('circle_r_' + index);
      var cirname = document.getElementById('circlename_' + index);
      var cirshow = document.getElementById('circleshow_' + index);
      var circol = document.getElementById('circleColor_' + index);
      var cirfill = document.getElementById('circlefill_' + index);

      if (cx && cy && cr) {
        var cxVal = parseFloat(cx.value) || 0;
        var cyVal = parseFloat(cy.value) || 0;
        var crVal = parseFloat(cr.value) || 0;
        var cirlabel = cirname ? cirname.value.trim() : '';
        details.hasData = (crVal > 0 || cirlabel !== '');
        details.name = cirlabel ? cirlabel : ('Circle ' + index);
        details.color = circol ? (circol.value === 'black' ? '#0f172a' : circol.value) : '#0f172a';
        details.visible = cirshow ? cirshow.checked : true;
        details.badge = 'Circle ' + index;
        var cFillTag = cirfill && cirfill.value ? 'fill: ' + cirfill.value : 'outline';
        details.desc = 'Center: (' + cxVal + ',' + cyVal + ') • R=' + crVal + ' • ' + cFillTag;
      }
      return details;
    }

    if (type === 'point') {
      var p = document.getElementById('p_' + index);
      var q = document.getElementById('q_' + index);
      var pname = document.getElementById('p_name_' + index);
      var pshow = document.getElementById('pointshow_' + index);
      var pcol = document.getElementById('pointColor_' + index);
      var pdot = document.getElementById('pointdot_' + index);

      if (p && q) {
        var pVal = parseFloat(p.value) || 0;
        var qVal = parseFloat(q.value) || 0;
        var plabel = pname ? pname.value.trim() : '';
        details.hasData = (pVal !== 0 || qVal !== 0 || plabel !== '');
        details.name = plabel ? plabel : ('Point ' + index);
        details.color = pcol ? (pcol.value === 'black' ? '#0f172a' : pcol.value) : '#0f172a';
        details.visible = pshow ? pshow.checked : true;
        details.badge = 'Point ' + index;
        var dotTag = !pdot || pdot.checked ? 'marker dot' : 'text only';
        details.desc = '(' + pVal + ',' + qVal + ') • ' + dotTag;
      }
      return details;
    }

    return details;
  };

  /**
   * Scan DOM and synchronize the layers array
   * When resetOrder is true, establishes the complete natural layer hierarchy:
   * Front/Top: Points & Labels (drawn on top)
   * Middle: Straight Lines & Curves (main functions/diagrams)
   * Shading: Rectangles & Circles (areas, fills, regions)
   * Base: Coordinate Axis (drawn first at background)
   * When resetOrder is false, preserves existing custom relative ordering, adding newly discovered elements at top
   */
  LayerManager.prototype.syncFromDOM = function (resetOrder) {
    var detected = [];

    // 1. Points & Labels (Top of stack - front-most layer, rendered last on top of canvas)
    var maxPoints = Math.max(typeof window.ps_j !== 'undefined' ? window.ps_j : (typeof ps_j !== 'undefined' ? ps_j : 10), 20);
    for (var p = 1; p <= maxPoints; p++) {
      if (!document.getElementById('p_' + p)) continue;
      var ptDet = this.getElementDetails('point', p);
      if (ptDet && ptDet.hasData) detected.push(ptDet);
    }

    // 2. Curves (Drawn before points)
    var maxCurves = Math.max(typeof window.counter_j !== 'undefined' ? window.counter_j : (typeof counter_j !== 'undefined' ? counter_j : 10), 20);
    for (var cu = 1; cu <= maxCurves; cu++) {
      if (!document.getElementById('e_' + cu)) continue;
      var curveDet = this.getElementDetails('curve', cu);
      if (curveDet && curveDet.hasData) detected.push(curveDet);
    }

    // 3. Straight Lines (Drawn before points, with curves)
    var maxLines = Math.max(typeof window.counter_i !== 'undefined' ? window.counter_i : (typeof counter_i !== 'undefined' ? counter_i : 10), 25);
    for (var l = 1; l <= maxLines; l++) {
      if (!document.getElementById('a_' + l)) continue;
      var lineDet = this.getElementDetails('line', l);
      if (lineDet && lineDet.hasData) detected.push(lineDet);
    }

    // 4. Rectangles (Shaded regions, deadweight loss, consumer surplus boxes)
    var maxRects = Math.max(typeof window.counter_z !== 'undefined' ? window.counter_z : (typeof counter_z !== 'undefined' ? counter_z : 10), 15);
    for (var r = 1; r <= maxRects; r++) {
      if (!document.getElementById('r_' + r)) continue;
      var rectDet = this.getElementDetails('rectangle', r);
      if (rectDet && rectDet.hasData) detected.push(rectDet);
    }

    // 5. Circles (Circular regions / geometry)
    var maxCircles = Math.max(typeof window.counter_circle !== 'undefined' ? window.counter_circle : (typeof counter_circle !== 'undefined' ? counter_circle : 10), 15);
    for (var ci = 1; ci <= maxCircles; ci++) {
      if (!document.getElementById('circle_x_' + ci)) continue;
      var circDet = this.getElementDetails('circle', ci);
      if (circDet && circDet.hasData) detected.push(circDet);
    }

    // 6. Coordinate Axis (Base background layer, rendered first)
    var axisDet = this.getElementDetails('axis', 1);
    if (axisDet && axisDet.hasData) {
      detected.push(axisDet);
    }

    var newLayerOrder = [];
    if (resetOrder) {
      this.lockedMap = {};
      this.axisLocked = false;
      this.axisVisible = true;
      this.selectedLayerId = null;
      newLayerOrder = detected;
    } else {
      // Merge with existing layer order to preserve custom z-order
      var existingIds = this.layers.map(function (ly) { return ly.id; });

      // Retain existing items in their current sequence if still active
      for (var i = 0; i < this.layers.length; i++) {
        var oldId = this.layers[i].id;
        var found = detected.find(function (d) { return d.id === oldId; });
        if (found) {
          newLayerOrder.push(found);
        }
      }

      // Append newly detected items to the top (front) of the stack
      for (var k = 0; k < detected.length; k++) {
        var detItem = detected[k];
        if (existingIds.indexOf(detItem.id) === -1) {
          // If it's an axis, place it near the bottom; otherwise place near top
          if (detItem.type === 'axis') {
            newLayerOrder.push(detItem);
          } else {
            newLayerOrder.unshift(detItem);
          }
        }
      }
    }

    // Fallback if empty
    if (newLayerOrder.length === 0) {
      newLayerOrder.push(axisDet);
    }

    this.layers = newLayerOrder;
    this.updateUI();
  };

  /**
   * Dedicated initiator when an example model is loaded
   * Cleans up filter states, resets stale locks, scans new elements and repopulates UI
   */
  LayerManager.prototype.initForExample = function (model) {
    this.lockedMap = {};
    this.axisLocked = false;
    this.axisVisible = true;
    this.selectedLayerId = null;
    this.searchQuery = '';
    this.activeFilter = 'all';

    var searchInput = document.getElementById('layer-search-input');
    if (searchInput) searchInput.value = '';

    var pills = document.querySelectorAll('.layer-pill');
    pills.forEach(function (p) {
      var f = p.getAttribute('data-filter') || p.textContent.trim().toLowerCase();
      if (f === 'all') {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    this.syncFromDOM(true);
  };

  /**
   * Return array of layers in drawing order: from Back/Bottom to Front/Top
   */
  LayerManager.prototype.getRenderOrder = function () {
    // this.layers[0] is Front (top of UI list, drawn last)
    // this.layers[N-1] is Back (bottom of UI list, drawn first)
    return this.layers.slice().reverse();
  };

  /**
   * Check if custom layer manager has active layers
   */
  LayerManager.prototype.hasCustomLayers = function () {
    return Array.isArray(this.layers) && this.layers.length > 0;
  };

  /**
   * Check if a layer is locked
   */
  LayerManager.prototype.isLocked = function (type, index) {
    if (type === 'axis') return !!this.axisLocked;
    return !!this.lockedMap[type + '_' + index];
  };

  /**
   * Check if a layer is visible
   */
  LayerManager.prototype.isVisible = function (type, index) {
    if (type === 'axis') return !!this.axisVisible;
    var layer = this.layers.find(function (ly) { return ly.type === type && ly.index === index; });
    return layer ? layer.visible : true;
  };

  /**
   * Move layer one step forward (closer to top of list, index - 1)
   */
  LayerManager.prototype.moveLayerUp = function (layerId) {
    var idx = this.layers.findIndex(function (l) { return l.id === layerId; });
    if (idx <= 0) return; // Already at the very top (front)

    var item = this.layers.splice(idx, 1)[0];
    this.layers.splice(idx - 1, 0, item);

    if (window.coordinateHistory) {
      window.coordinateHistory.push('Bring Forward: ' + item.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
    if (window.showToast) {
      window.showToast('Brought Forward: ' + item.name);
    }
  };

  /**
   * Move layer one step backward (closer to bottom of list, index + 1)
   */
  LayerManager.prototype.moveLayerDown = function (layerId) {
    var idx = this.layers.findIndex(function (l) { return l.id === layerId; });
    if (idx < 0 || idx >= this.layers.length - 1) return; // Already at the very bottom (back)

    var item = this.layers.splice(idx, 1)[0];
    this.layers.splice(idx + 1, 0, item);

    if (window.coordinateHistory) {
      window.coordinateHistory.push('Send Backward: ' + item.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
    if (window.showToast) {
      window.showToast('Sent Backward: ' + item.name);
    }
  };

  /**
   * Bring layer directly to the very top (front)
   */
  LayerManager.prototype.bringToFront = function (layerId) {
    var idx = this.layers.findIndex(function (l) { return l.id === layerId; });
    if (idx <= 0) return;

    var item = this.layers.splice(idx, 1)[0];
    this.layers.unshift(item);

    if (window.coordinateHistory) {
      window.coordinateHistory.push('Bring to Front: ' + item.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
    if (window.showToast) {
      window.showToast('Brought to Front: ' + item.name);
    }
  };

  /**
   * Send layer directly to the very bottom (back)
   */
  LayerManager.prototype.sendToBack = function (layerId) {
    var idx = this.layers.findIndex(function (l) { return l.id === layerId; });
    if (idx < 0 || idx === this.layers.length - 1) return;

    var item = this.layers.splice(idx, 1)[0];
    this.layers.push(item);

    if (window.coordinateHistory) {
      window.coordinateHistory.push('Send to Back: ' + item.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
    if (window.showToast) {
      window.showToast('Sent to Back: ' + item.name);
    }
  };

  /**
   * Reorder drag & drop: place source layer before or after target layer
   */
  LayerManager.prototype.reorderLayer = function (sourceId, targetId, insertBefore) {
    if (!sourceId || !targetId || sourceId === targetId) return;

    var srcIdx = this.layers.findIndex(function (l) { return l.id === sourceId; });
    var tgtIdx = this.layers.findIndex(function (l) { return l.id === targetId; });
    if (srcIdx === -1 || tgtIdx === -1) return;

    var item = this.layers.splice(srcIdx, 1)[0];
    tgtIdx = this.layers.findIndex(function (l) { return l.id === targetId; });
    var finalIdx = insertBefore ? tgtIdx : tgtIdx + 1;
    this.layers.splice(finalIdx, 0, item);

    if (window.coordinateHistory) {
      window.coordinateHistory.push('Reorder Layer: ' + item.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
  };

  /**
   * Toggle visibility of a specific layer
   */
  LayerManager.prototype.toggleVisibility = function (layerId, forceVal) {
    var parts = layerId.split('_');
    var type = parts[0];
    var index = parseInt(parts[1], 10);

    var layer = this.layers.find(function (l) { return l.id === layerId; });
    if (!layer) return;

    var newVal = typeof forceVal === 'boolean' ? forceVal : !layer.visible;
    layer.visible = newVal;

    if (type === 'axis') {
      this.axisVisible = newVal;
    } else if (type === 'line') {
      var lineshow = document.getElementById('lineshow_' + index);
      if (lineshow) lineshow.checked = newVal;
    } else if (type === 'curve') {
      var curveshow = document.getElementById('curveshow_' + index);
      if (curveshow) curveshow.checked = newVal;
    } else if (type === 'rectangle') {
      var rectshow = document.getElementById('retangularshow_' + index);
      if (rectshow) rectshow.checked = newVal;
    } else if (type === 'circle') {
      var circshow = document.getElementById('circleshow_' + index);
      if (circshow) circshow.checked = newVal;
    } else if (type === 'point') {
      var pointshow = document.getElementById('pointshow_' + index);
      if (pointshow) pointshow.checked = newVal;
    }

    if (window.coordinateHistory) {
      window.coordinateHistory.push((newVal ? 'Show ' : 'Hide ') + layer.name);
    }

    this.updateUI();
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
  };

  /**
   * Toggle lock status of a specific layer
   */
  LayerManager.prototype.toggleLock = function (layerId, forceVal) {
    var parts = layerId.split('_');
    var type = parts[0];

    var layer = this.layers.find(function (l) { return l.id === layerId; });
    if (!layer) return;

    var curLocked = type === 'axis' ? this.axisLocked : !!this.lockedMap[layerId];
    var newLocked = typeof forceVal === 'boolean' ? forceVal : !curLocked;

    if (type === 'axis') {
      this.axisLocked = newLocked;
    } else {
      if (newLocked) {
        this.lockedMap[layerId] = true;
      } else {
        delete this.lockedMap[layerId];
      }
    }
    layer.locked = newLocked;

    // If currently selected shape was locked, deselect it
    if (newLocked && window.drawingState && window.drawingState.selectedShape) {
      var sel = window.drawingState.selectedShape;
      if (sel.type === layer.type && sel.index === layer.index) {
        if (typeof window.deselectShape === 'function') {
          window.deselectShape();
        }
      }
    }

    if (window.showToast) {
      window.showToast((newLocked ? '🔒 Locked: ' : '🔓 Unlocked: ') + layer.name);
    }

    this.updateUI();
    if (typeof window.renderAllOverlays === 'function') {
      window.renderAllOverlays();
    }
  };

  /**
   * Bulk Action: Show or hide all layers
   */
  LayerManager.prototype.toggleAllVisibility = function (forceVisible) {
    var self = this;
    var targetVis = typeof forceVisible === 'boolean' ? forceVisible : true;
    this.layers.forEach(function (ly) {
      self.toggleVisibility(ly.id, targetVis);
    });
    if (window.showToast) {
      window.showToast(targetVis ? 'All layers visible' : 'All layers hidden');
    }
  };

  /**
   * Bulk Action: Lock or unlock all layers
   */
  LayerManager.prototype.toggleAllLocks = function (forceLocked) {
    var self = this;
    var anyUnlocked = this.layers.some(function (l) { return !l.locked; });
    var targetLock = typeof forceLocked === 'boolean' ? forceLocked : anyUnlocked;

    this.layers.forEach(function (ly) {
      self.toggleLock(ly.id, targetLock);
    });
    if (window.showToast) {
      window.showToast(targetLock ? '🔒 All layers locked' : '🔓 All layers unlocked');
    }
  };

  LayerManager.prototype.toggleAllLock = LayerManager.prototype.toggleAllLocks;

  /**
   * Select a layer from the sidebar and focus it on the canvas
   */
  LayerManager.prototype.selectLayer = function (layerId) {
    this.selectedLayerId = layerId;
    var layer = this.layers.find(function (l) { return l.id === layerId; });
    if (!layer) return;

    if (layer.locked) {
      if (window.showToast) {
        window.showToast('Layer is locked. Unlock to select & edit.');
      }
      this.updateUI();
      return;
    }

    // Switch draw tool to 'select'
    if (typeof window.setDrawTool === 'function') {
      window.setDrawTool('select');
    }

    // Select shape on canvas
    if (layer.type === 'axis') {
      if (typeof window.activateAxisOnCanvas === 'function') {
        window.activateAxisOnCanvas();
      }
    } else if (window.drawingState) {
      window.drawingState.selectedShape = { type: layer.type, index: layer.index, activeHandle: null };
      if (typeof window.showSelectedShapeBar === 'function') {
        window.showSelectedShapeBar(window.drawingState.selectedShape);
      }
      if (typeof window.renderAllOverlays === 'function') {
        window.renderAllOverlays();
      }
    }

    this.updateUI();
  };

  /**
   * Highlight a layer when selected from canvas
   */
  LayerManager.prototype.highlightLayer = function (type, index) {
    var layerId = type + '_' + index;
    this.selectedLayerId = layerId;
    var itemEl = document.getElementById('layer-item-' + layerId);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    this.updateUI();
  };

  /**
   * Hover preview outline on canvas
   */
  LayerManager.prototype.hoverLayer = function (layerId, isHovering) {
    var prevCnv = document.getElementById('previewCanvas');
    if (!prevCnv) return;
    var ctx = prevCnv.getContext('2d');

    if (!isHovering) {
      if (typeof window.renderAllOverlays === 'function') {
        window.renderAllOverlays();
      }
      return;
    }

    var layer = this.layers.find(function (l) { return l.id === layerId; });
    if (!layer || !layer.visible) return;

    // Render subtle highlight halo on preview canvas
    ctx.save();
    var curScale = typeof window.scale !== 'undefined' ? window.scale : 35;
    var curXOffset = typeof window.x_offset !== 'undefined' ? window.x_offset : 28;
    var curYOffset = typeof window.y_offset !== 'undefined' ? window.y_offset : 28;

    ctx.transform(1, 0, 0, -1, curXOffset, prevCnv.height - curYOffset);
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.7)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (layer.type === 'line') {
      var a = parseFloat(document.getElementById('a_' + layer.index)?.value) || 0;
      var b = parseFloat(document.getElementById('b_' + layer.index)?.value) || 0;
      var c = parseFloat(document.getElementById('c_' + layer.index)?.value) || 0;
      var d = parseFloat(document.getElementById('d_' + layer.index)?.value) || 0;
      ctx.beginPath();
      ctx.moveTo(a * curScale, b * curScale);
      ctx.lineTo(c * curScale, d * curScale);
      ctx.stroke();
    } else if (layer.type === 'curve') {
      var e = parseFloat(document.getElementById('e_' + layer.index)?.value) || 0;
      var f = parseFloat(document.getElementById('f_' + layer.index)?.value) || 0;
      var g = parseFloat(document.getElementById('g_' + layer.index)?.value) || 0;
      var h = parseFloat(document.getElementById('h_' + layer.index)?.value) || 0;
      var i = parseFloat(document.getElementById('i_' + layer.index)?.value) || 0;
      var j = parseFloat(document.getElementById('j_' + layer.index)?.value) || 0;
      var k = parseFloat(document.getElementById('k_' + layer.index)?.value) || 0;
      var l = parseFloat(document.getElementById('l_' + layer.index)?.value) || 0;
      ctx.beginPath();
      ctx.moveTo(e * curScale, f * curScale);
      ctx.bezierCurveTo(g * curScale, h * curScale, i * curScale, j * curScale, k * curScale, l * curScale);
      ctx.stroke();
    } else if (layer.type === 'rectangle') {
      var r = parseFloat(document.getElementById('r_' + layer.index)?.value) || 0;
      var s = parseFloat(document.getElementById('s_' + layer.index)?.value) || 0;
      var t = parseFloat(document.getElementById('t_' + layer.index)?.value) || 0;
      var u = parseFloat(document.getElementById('u_' + layer.index)?.value) || 0;
      ctx.beginPath();
      ctx.strokeRect(r * curScale, s * curScale, (t - r) * curScale, (u - s) * curScale);
    } else if (layer.type === 'circle') {
      var cx = parseFloat(document.getElementById('circle_x_' + layer.index)?.value) || 0;
      var cy = parseFloat(document.getElementById('circle_y_' + layer.index)?.value) || 0;
      var cr = parseFloat(document.getElementById('circle_r_' + layer.index)?.value) || 0;
      ctx.beginPath();
      ctx.arc(cx * curScale, cy * curScale, cr * curScale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (layer.type === 'point') {
      var px = parseFloat(document.getElementById('p_' + layer.index)?.value) || 0;
      var py = parseFloat(document.getElementById('q_' + layer.index)?.value) || 0;
      ctx.beginPath();
      ctx.arc(px * curScale, py * curScale, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  /**
   * Toggle sidebar collapse / expand
   */
  LayerManager.prototype.toggleSidebar = function (forceVal) {
    this.isOpen = typeof forceVal === 'boolean' ? forceVal : !this.isOpen;
    var sidebar = document.getElementById('layering-sidebar');
    var toolBtn = document.getElementById('tool-btn-layers');
    var topBtn = document.getElementById('btn-top-layers');

    if (sidebar) {
      if (this.isOpen) {
        sidebar.classList.remove('collapsed');
      } else {
        sidebar.classList.add('collapsed');
      }
    }
    if (toolBtn) {
      if (this.isOpen) {
        toolBtn.classList.add('active');
      } else {
        toolBtn.classList.remove('active');
      }
    }
    if (topBtn) {
      if (this.isOpen) {
        topBtn.classList.add('btn-modern-primary');
        topBtn.classList.remove('btn-modern-secondary');
      } else {
        topBtn.classList.remove('btn-modern-primary');
        topBtn.classList.add('btn-modern-secondary');
      }
    }
  };

  /**
   * Filter layers by category and search term
   */
  LayerManager.prototype.setFilter = function (filter) {
    this.activeFilter = filter;
    this.updateUI();
  };

  LayerManager.prototype.setSearchQuery = function (query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.updateUI();
  };

  /**
   * Render the entire sidebar HTML and bind event listeners
   */
  LayerManager.prototype.updateUI = function () {
    var self = this;
    var container = document.getElementById('layer-list-container');
    if (!container) return;

    var totalActive = this.layers.length;
    var countBadge = document.getElementById('layer-count-badge');
    var topBadge = document.getElementById('top-layer-count-badge');
    var headerCount = document.getElementById('layer-header-count');
    var accCount = document.getElementById('accordion-layer-count');
    if (countBadge) countBadge.textContent = totalActive;
    if (topBadge) topBadge.textContent = totalActive;
    if (headerCount) headerCount.textContent = totalActive + (totalActive === 1 ? ' Layer' : ' Layers');
    if (accCount) accCount.textContent = totalActive + ' Layers';

    // Filter layers
    var visibleLayers = this.layers.filter(function (ly) {
      // Category filter
      if (self.activeFilter === 'line' && ly.type !== 'line') return false;
      if (self.activeFilter === 'curve' && ly.type !== 'curve') return false;
      if (self.activeFilter === 'shape' && (ly.type !== 'rectangle' && ly.type !== 'circle')) return false;
      if (self.activeFilter === 'point' && ly.type !== 'point') return false;

      // Text search filter
      if (self.searchQuery) {
        var matchText = (ly.name + ' ' + ly.desc + ' ' + ly.badge).toLowerCase();
        if (matchText.indexOf(self.searchQuery) === -1) return false;
      }
      return true;
    });

    if (visibleLayers.length === 0) {
      container.innerHTML = '<div class="layers-empty-state">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' +
        '<div style="font-weight: 600; color: #475569; margin-top: 0.35rem;">No matching layers</div>' +
        '<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.2rem;">Draw shapes on canvas or select an Example Model above.</div>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < visibleLayers.length; i++) {
      var ly = visibleLayers[i];
      var isFirst = i === 0;
      var isLast = i === visibleLayers.length - 1;
      var isSelected = self.selectedLayerId === ly.id;

      var rowClasses = ['layer-card-item'];
      if (!ly.visible) rowClasses.push('layer-hidden');
      if (ly.locked) rowClasses.push('layer-locked');
      if (isSelected) rowClasses.push('layer-selected');

      var eyeIcon = ly.visible
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

      var lockIcon = ly.locked
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

      html += '<div class="' + rowClasses.join(' ') + '" id="layer-item-' + ly.id + '" data-layer-id="' + ly.id + '" draggable="true" ' +
        'onclick="window.layerManager.selectLayer(\'' + ly.id + '\')" ' +
        'onmouseenter="window.layerManager.hoverLayer(\'' + ly.id + '\', true)" ' +
        'onmouseleave="window.layerManager.hoverLayer(\'' + ly.id + '\', false)">' +
        
        // Drag Grip Handle
        '<div class="layer-grip-handle" title="Drag to reorder layer (Move in Z-order)">' +
          '<svg width="10" height="14" viewBox="0 0 10 14" fill="#94a3b8"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>' +
        '</div>' +

        // Color Pill / Swatch
        '<span class="layer-color-dot" style="background-color: ' + ly.color + ';" title="Element color: ' + ly.color + '"></span>' +

        // Info: Badge + Label + Desc
        '<div class="layer-info-col">' +
          '<div class="layer-header-line">' +
            '<span class="layer-type-tag layer-tag-' + ly.type + '">' + ly.badge + '</span>' +
            '<span class="layer-title-text" title="' + ly.name + '">' + (ly.name || 'Unnamed') + '</span>' +
            (ly.locked ? '<span class="layer-locked-badge">Locked</span>' : '') +
          '</div>' +
          '<div class="layer-desc-text" title="' + ly.desc + '">' + ly.desc + '</div>' +
        '</div>' +

        // Action Controls (Eye, Lock, Move Up, Move Down)
        '<div class="layer-actions-group" onclick="event.stopPropagation();">' +
          // Eye button
          '<button type="button" class="btn-layer-icon ' + (!ly.visible ? 'active-hidden' : '') + '" title="' + (ly.visible ? 'Hide layer' : 'Show layer') + '" onclick="window.layerManager.toggleVisibility(\'' + ly.id + '\')">' +
            eyeIcon +
          '</button>' +
          // Lock button
          '<button type="button" class="btn-layer-icon ' + (ly.locked ? 'active-locked' : '') + '" title="' + (ly.locked ? 'Unlock layer' : 'Lock layer (prevents accidental edits)') + '" onclick="window.layerManager.toggleLock(\'' + ly.id + '\')">' +
            lockIcon +
          '</button>' +
          // Move Up (Bring Forward)
          '<button type="button" class="btn-layer-icon" title="Bring Forward (Move Up in Z-order)" ' + (isFirst ? 'disabled style="opacity: 0.3;"' : '') + ' onclick="window.layerManager.moveLayerUp(\'' + ly.id + '\')">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>' +
          '</button>' +
          // Move Down (Send Backward)
          '<button type="button" class="btn-layer-icon" title="Send Backward (Move Down in Z-order)" ' + (isLast ? 'disabled style="opacity: 0.3;"' : '') + ' onclick="window.layerManager.moveLayerDown(\'' + ly.id + '\')">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</button>' +
        '</div>' +

      '</div>';
    }

    container.innerHTML = html;
    this.bindDragEvents();
  };

  /**
   * Bind HTML5 drag-and-drop events to all layer rows
   */
  LayerManager.prototype.bindDragEvents = function () {
    var self = this;
    var items = document.querySelectorAll('.layer-card-item');

    items.forEach(function (el) {
      el.addEventListener('dragstart', function (e) {
        self.isDragging = true;
        self.draggedLayerId = el.getAttribute('data-layer-id');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', self.draggedLayerId);
        el.classList.add('dragging-layer');
      });

      el.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var rect = el.getBoundingClientRect();
        var relY = e.clientY - rect.top;
        var isTopHalf = relY < rect.height / 2;

        items.forEach(function (it) {
          it.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        if (isTopHalf) {
          el.classList.add('drag-over-top');
        } else {
          el.classList.add('drag-over-bottom');
        }
      });

      el.addEventListener('dragleave', function () {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      el.addEventListener('drop', function (e) {
        e.preventDefault();
        var targetId = el.getAttribute('data-layer-id');
        var rect = el.getBoundingClientRect();
        var relY = e.clientY - rect.top;
        var isTopHalf = relY < rect.height / 2;

        items.forEach(function (it) {
          it.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging-layer');
        });

        self.reorderLayer(self.draggedLayerId, targetId, isTopHalf);
        self.draggedLayerId = null;
        self.isDragging = false;
      });

      el.addEventListener('dragend', function () {
        self.isDragging = false;
        self.draggedLayerId = null;
        items.forEach(function (it) {
          it.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging-layer');
        });
      });
    });
  };

  /**
   * Fast label and color update on input without full DOM reconstruction
   */
  LayerManager.prototype.updateLayerLabels = function () {
    var self = this;
    this.layers.forEach(function (ly) {
      var details = self.getElementDetails(ly.type, ly.index);
      ly.name = details.name;
      ly.desc = details.desc;
      ly.color = details.color;
      ly.visible = details.visible;
    });
    this.updateUI();
  };

  /**
   * Initialize on page load
   */
  LayerManager.prototype.init = function () {
    var self = this;

    // Scan initial DOM elements
    this.syncFromDOM();

    // Bind search and filter inputs
    var searchInput = document.getElementById('layer-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        self.setSearchQuery(this.value);
      });
    }

    // Keyboard shortcut: Alt+L to toggle layers sidebar
    window.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        self.toggleSidebar();
      }
    });

    // Real-time synchronization when any form field changes
    var formIds = ['axisform', 'pointform', 'Retangularform', 'circleform', 'lineform', 'curveform'];
    formIds.forEach(function (fId) {
      var f = document.getElementById(fId);
      if (f) {
        f.addEventListener('input', function () {
          self.updateLayerLabels();
        });
      }
    });
  };

  // Expose global instance
  window.layerManager = new LayerManager();

  // Helper convenience functions for onclick bindings in HTML
  window.toggleLayeringSidebar = function (force) {
    if (window.layerManager) window.layerManager.toggleSidebar(force);
  };
  window.openLayeringSidebar = function () {
    if (window.layerManager) window.layerManager.toggleSidebar(true);
  };
  window.isLayerLocked = function (type, index) {
    return window.layerManager ? window.layerManager.isLocked(type, index) : false;
  };
  window.isLayerVisible = function (type, index) {
    return window.layerManager ? window.layerManager.isVisible(type, index) : true;
  };
  window.setLayerFilterPill = function (btn, filter) {
    if (window.layerManager) window.layerManager.setFilter(filter);
    var pills = document.querySelectorAll('.layer-pill');
    pills.forEach(function (p) { p.classList.remove('active'); });
    if (btn) btn.classList.add('active');
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.layerManager.init();
    });
  } else {
    window.layerManager.init();
  }

})();
