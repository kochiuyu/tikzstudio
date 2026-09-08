/**
 * TikZ Studio - Robust Undo / Redo History Engine
 * Provides state serialization, discrete action history stacks,
 * keyboard shortcut support (Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Shift+Z),
 * and automatic UI synchronization for both Coordinate and Timeline studios.
 */

(function () {
  'use strict';

  /**
   * Generic Stack-based Undo/Redo Manager
   */
  function UndoRedoManager(options) {
    this.name = options.name || 'Studio';
    this.maxHistory = options.maxHistory || 50;
    this.storageKey = options.storageKey || null;
    this.capture = options.capture;
    this.restore = options.restore;
    this.onUpdate = options.onUpdate || function () {};

    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
    this.isRestoring = false;
  }

  UndoRedoManager.prototype.saveToStorage = function (state) {
    if (!this.storageKey || !state) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {}
  };

  UndoRedoManager.prototype.restoreFromStorage = function () {
    if (!this.storageKey || typeof this.restore !== 'function') return false;
    try {
      var raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed) return false;
      this.isRestoring = true;
      this.restore(parsed);
      this.currentState = parsed;
      this.isRestoring = false;
      this.triggerUpdate();
      return true;
    } catch (e) {
      this.isRestoring = false;
      return false;
    }
  };

  UndoRedoManager.prototype.clearStorage = function () {
    if (!this.storageKey) return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
  };

  UndoRedoManager.prototype.init = function () {
    if (typeof this.capture !== 'function') return;
    this.currentState = this.capture();
    this.undoStack = [];
    this.redoStack = [];
    this.saveToStorage(this.currentState);
    this.triggerUpdate();
  };

  UndoRedoManager.prototype.push = function (actionName) {
    if (this.isRestoring || typeof this.capture !== 'function') return;

    var newState = this.capture();
    if (!newState) return;

    // Check if state actually changed
    var oldJson = JSON.stringify(this.currentState);
    var newJson = JSON.stringify(newState);
    if (oldJson === newJson) {
      return; // No-op, identical state
    }

    // Push previous state onto undo stack
    this.undoStack.push({
      action: actionName || 'Drawing change',
      state: this.currentState,
      timestamp: Date.now()
    });

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // Advance current state and clear redo stack
    this.currentState = newState;
    this.redoStack = [];
    this.saveToStorage(this.currentState);
    this.triggerUpdate();
  };

  /**
   * Push an explicit pre-change snapshot
   * Useful when an action began at mousedown and finalized at mouseup
   */
  UndoRedoManager.prototype.pushPreState = function (actionName, preState) {
    if (this.isRestoring || !preState) return;

    var newState = this.capture();
    var preJson = JSON.stringify(preState);
    var newJson = JSON.stringify(newState);
    if (preJson === newJson) {
      return; // No change occurred
    }

    this.undoStack.push({
      action: actionName || 'Edit shape',
      state: preState,
      timestamp: Date.now()
    });

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    this.currentState = newState;
    this.redoStack = [];
    this.triggerUpdate();
  };

  UndoRedoManager.prototype.undo = function () {
    if (!this.canUndo() || typeof this.restore !== 'function') return false;

    this.isRestoring = true;
    var entry = this.undoStack.pop();

    // Push current state to redo stack
    this.redoStack.push({
      action: entry.action,
      state: this.currentState,
      timestamp: Date.now()
    });

    this.currentState = entry.state;
    try {
      this.restore(entry.state);
    } catch (e) {
      console.error('[UndoRedo] Error restoring state:', e);
    } finally {
      this.isRestoring = false;
    }

    this.saveToStorage(this.currentState);
    this.triggerUpdate();
    if (window.showToast) {
      window.showToast('↶ Undone: ' + entry.action);
    }
    return true;
  };

  UndoRedoManager.prototype.redo = function () {
    if (!this.canRedo() || typeof this.restore !== 'function') return false;

    this.isRestoring = true;
    var entry = this.redoStack.pop();

    // Push current state to undo stack
    this.undoStack.push({
      action: entry.action,
      state: this.currentState,
      timestamp: Date.now()
    });

    this.currentState = entry.state;
    try {
      this.restore(entry.state);
    } catch (e) {
      console.error('[UndoRedo] Error redoing state:', e);
    } finally {
      this.isRestoring = false;
    }

    this.saveToStorage(this.currentState);
    this.triggerUpdate();
    if (window.showToast) {
      window.showToast('↷ Redone: ' + entry.action);
    }
    return true;
  };

  UndoRedoManager.prototype.canUndo = function () {
    return this.undoStack.length > 0;
  };

  UndoRedoManager.prototype.canRedo = function () {
    return this.redoStack.length > 0;
  };

  UndoRedoManager.prototype.getUndoLabel = function () {
    return this.undoStack.length ? this.undoStack[this.undoStack.length - 1].action : null;
  };

  UndoRedoManager.prototype.getRedoLabel = function () {
    return this.redoStack.length ? this.redoStack[this.redoStack.length - 1].action : null;
  };

  UndoRedoManager.prototype.triggerUpdate = function () {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.canUndo(), this.canRedo(), this.getUndoLabel(), this.getRedoLabel());
    }
  };


  /* ==========================================================================
     COORDINATE STUDIO STATE SERIALIZER & RESTORER
     ========================================================================== */

  function captureCoordinateState() {
    var state = {
      counter_i: (typeof window.counter_i !== 'undefined') ? window.counter_i : 5,
      counter_j: (typeof window.counter_j !== 'undefined') ? window.counter_j : 3,
      counter_z: (typeof window.counter_z !== 'undefined') ? window.counter_z : 2,
      counter_circle: (typeof window.counter_circle !== 'undefined') ? window.counter_circle : 2,
      ps_j: (typeof window.ps_j !== 'undefined') ? window.ps_j : 4,
      inputs: {}
    };

    var formIds = ['axisform', 'pointform', 'Retangularform', 'circleform', 'lineform', 'curveform'];
    formIds.forEach(function (fId) {
      var form = document.getElementById(fId);
      if (!form) return;
      var els = form.querySelectorAll('input, select, textarea');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.id) continue;
        if (el.type === 'checkbox' || el.type === 'radio') {
          state.inputs[el.id] = { type: 'chk', chk: el.checked };
        } else {
          state.inputs[el.id] = { type: 'val', val: el.value };
        }
      }
    });

    var gs = document.getElementById('graph_scale');
    if (gs) {
      state.inputs['graph_scale'] = { type: 'val', val: gs.value };
    }

    return state;
  }

  function restoreCoordinateState(state) {
    if (!state) return;

    // 1. Synchronize Line cards
    var targetLineCount = state.counter_i || 5;
    var lineForm = document.getElementById('lineform');
    if (lineForm && typeof window.AddLine === 'function') {
      while (window.counter_i < targetLineCount) {
        window.AddLine(lineForm);
      }
    }
    while (window.counter_i > targetLineCount && window.counter_i > 5) {
      var remId = window.counter_i - 1;
      var card = document.getElementById('line_card_' + remId);
      if (card) card.remove();
      window.counter_i = remId;
    }

    // 2. Synchronize Curve cards
    var targetCurveCount = state.counter_j || 3;
    var curveForm = document.getElementById('curveform');
    if (curveForm && typeof window.AddCurve === 'function') {
      while (window.counter_j < targetCurveCount) {
        window.AddCurve(curveForm);
      }
    }
    while (window.counter_j > targetCurveCount && window.counter_j > 3) {
      var remJ = window.counter_j - 1;
      var cCard = document.getElementById('curve_card_' + remJ);
      if (cCard) cCard.remove();
      window.counter_j = remJ;
    }

    // 3. Synchronize Rectangle cards
    var targetRectCount = state.counter_z || 2;
    var rectForm = document.getElementById('Retangularform');
    if (rectForm) {
      var addRecFn = (typeof window.AddRec === 'function') ? window.AddRec : window.AddRectangle;
      if (typeof addRecFn === 'function') {
        while (window.counter_z < targetRectCount) {
          addRecFn(rectForm);
        }
      }
    }
    while (window.counter_z > targetRectCount && window.counter_z > 2) {
      var remZ = window.counter_z - 1;
      var rCard = document.getElementById('rectangle_card_' + remZ);
      if (rCard) rCard.remove();
      window.counter_z = remZ;
    }

    // 4. Synchronize Circle cards
    var targetCircleCount = state.counter_circle || 2;
    var circleForm = document.getElementById('circleform');
    if (circleForm && typeof window.AddCircle === 'function') {
      while (window.counter_circle < targetCircleCount) {
        window.AddCircle(circleForm);
      }
    }
    while (window.counter_circle > targetCircleCount && window.counter_circle > 2) {
      var remC = window.counter_circle - 1;
      var crCard = document.getElementById('circle_card_' + remC);
      if (crCard) crCard.remove();
      window.counter_circle = remC;
    }

    // 5. Synchronize Point cards
    var targetPointCount = state.ps_j || 4;
    var pointForm = document.getElementById('pointform');
    if (pointForm && typeof window.AddPoints === 'function') {
      while (window.ps_j < targetPointCount) {
        window.AddPoints(pointForm);
      }
    }
    while (window.ps_j > targetPointCount && window.ps_j > 4) {
      var remP = window.ps_j - 1;
      var pCard = document.getElementById('point_card_' + remP);
      if (pCard) pCard.remove();
      window.ps_j = remP;
    }

    // 6. Restore all inputs & checkboxes
    if (state.inputs) {
      for (var id in state.inputs) {
        var item = state.inputs[id];
        var el = document.getElementById(id);
        if (!el) continue;
        if (item.type === 'chk') {
          el.checked = !!item.chk;
        } else {
          el.value = item.val;
        }
      }
    }

    // 7. Update UI helpers
    var curI = window.counter_i || 5;
    for (var li = 1; li < curI; li++) {
      if (typeof window.updateLineTelemetry === 'function') {
        window.updateLineTelemetry(li);
      }
    }
    var curP = window.ps_j || 4;
    for (var pi = 1; pi < curP; pi++) {
      if (typeof window.updatePointCardHeader === 'function') {
        window.updatePointCardHeader(pi);
      }
    }
    if (typeof window.updateAxisCardUI === 'function') {
      window.updateAxisCardUI();
    }
    var axShow = document.getElementById("axisshow");
    if (axShow && typeof window.toggleAxisState === 'function') {
      window.toggleAxisState(axShow.checked);
    }

    // Refresh all color picker triggers
    var colorControls = document.querySelectorAll('select, input');
    for (var ci = 0; ci < colorControls.length; ci++) {
      if (colorControls[ci]._colorPickerTrigger && colorControls[ci]._colorPickerTrigger.update) {
        colorControls[ci]._colorPickerTrigger.update();
      }
    }

    // Dismiss candidate if any
    if (window.cancelCandidateShape) {
      window.cancelCandidateShape();
    }
    if (window.deselectShape) {
      window.deselectShape();
    }

    // Sync layers
    if (window.layerManager && typeof window.layerManager.syncFromDOM === 'function') {
      window.layerManager.syncFromDOM();
    }

    // Redraw graph & interactive overlays
    if (typeof window.DrawGraph === 'function') {
      window.DrawGraph();
    }
    if (typeof window.renderAllOverlays === 'function') {
      window.renderAllOverlays();
    }
    if (typeof window.pt === 'function') {
      try { window.pt(); } catch (e) {}
    }
  }

  function updateCoordinateButtonsUI(canUndo, canRedo, undoLabel, redoLabel) {
    var undoBtns = [
      document.getElementById('tool-btn-undo'),
      document.getElementById('btn-top-undo'),
      document.getElementById('nav-btn-undo')
    ];
    var redoBtns = [
      document.getElementById('tool-btn-redo'),
      document.getElementById('btn-top-redo'),
      document.getElementById('nav-btn-redo')
    ];

    var undoTitle = canUndo ? ('Undo ' + (undoLabel || 'drawing operation') + ' (Ctrl+Z)') : 'Nothing to undo (Ctrl+Z)';
    var redoTitle = canRedo ? ('Redo ' + (redoLabel || 'drawing operation') + ' (Ctrl+Y)') : 'Nothing to redo (Ctrl+Y)';

    undoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canUndo;
      btn.title = undoTitle;
      if (canUndo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });

    redoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canRedo;
      btn.title = redoTitle;
      if (canRedo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  }

  var coordinateHistory = new UndoRedoManager({
    name: 'Coordinate',
    storageKey: 'tikz_autosave_coordinate',
    maxHistory: 50,
    capture: captureCoordinateState,
    restore: restoreCoordinateState,
    onUpdate: updateCoordinateButtonsUI
  });

  window.coordinateHistory = coordinateHistory;
  window.coordinateUndo = function () {
    return coordinateHistory.undo();
  };
  window.coordinateRedo = function () {
    return coordinateHistory.redo();
  };


  /* ==========================================================================
     TIMELINE STUDIO STATE SERIALIZER & RESTORER
     ========================================================================== */

  function captureTimelineState() {
    var config = {
      beginTime: document.getElementById('beginTime') ? document.getElementById('beginTime').value : '1900',
      endTime: document.getElementById('endTime') ? document.getElementById('endTime').value : '2015',
      scale: document.getElementById('scale') ? document.getElementById('scale').value : '5',
      fontsize: document.getElementById('fontsize') ? document.getElementById('fontsize').value : '12px',
      coordinate: document.getElementById('coordinate') ? document.getElementById('coordinate').value : 'x',
      linecolor: document.getElementById('linecolor') ? document.getElementById('linecolor').value : 'black',
      pointcolor: document.getElementById('pointcolor') ? document.getElementById('pointcolor').value : 'black',
      textcolor: document.getElementById('textcolor') ? document.getElementById('textcolor').value : 'black'
    };

    var events = [];
    var resultEl = document.getElementById('result');
    if (resultEl) {
      var chips = resultEl.querySelectorAll('.event-chip');
      for (var i = 0; i < chips.length; i++) {
        var chip = chips[i];
        var yEl = chip.querySelector('.myyear');
        var dEl = chip.querySelector('.mydesc');
        if (yEl && dEl) {
          events.push({
            year: yEl.textContent.trim(),
            desc: dEl.textContent.trim(),
            color: chip.getAttribute('data-color') || null
          });
        }
      }
    }

    return { config: config, events: events };
  }

  function restoreTimelineState(state) {
    if (!state) return;

    if (state.config) {
      for (var k in state.config) {
        var el = document.getElementById(k);
        if (el) {
          el.value = state.config[k];
          if (el._colorPickerTrigger && el._colorPickerTrigger.update) {
            el._colorPickerTrigger.update();
          }
        }
      }
    }

    var resultEl = document.getElementById('result');
    if (resultEl && state.events) {
      resultEl.innerHTML = '';
      state.events.forEach(function (ev) {
        var chip = document.createElement('div');
        chip.className = 'event-chip';
        if (ev.color && ev.color !== 'default') {
          chip.setAttribute('data-color', ev.color);
        }
        var colorIndicator = '';
        if (ev.color && ev.color !== 'default') {
          var badgeHex = window.normalizeToHex ? window.normalizeToHex(ev.color) : ev.color;
          colorIndicator = '<span style="width: 10px; height: 10px; border-radius: 50%; background: ' + badgeHex + '; display: inline-block; margin-right: 0.35rem; border: 1.5px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);" title="Milestone Color: ' + ev.color + '"></span>';
        }
        chip.innerHTML =
          '<div class="event-chip-info" style="display: flex; align-items: center;">' +
          colorIndicator +
          '<span class="event-year-badge myyear">' + ev.year + '</span>' +
          '<span class="mydesc" style="font-weight: 500; color: var(--color-text-main);">' + ev.desc + '</span>' +
          '</div>' +
          '<button type="button" class="btn-delete-chip" onclick="deleteEvent(this)" title="Delete">&times;</button>';
        resultEl.appendChild(chip);
      });
    }

    if (typeof window.draw === 'function') {
      window.draw();
    }
  }

  function updateTimelineButtonsUI(canUndo, canRedo, undoLabel, redoLabel) {
    var undoBtns = [
      document.getElementById('btn-timeline-undo'),
      document.getElementById('canvas-btn-timeline-undo')
    ];
    var redoBtns = [
      document.getElementById('btn-timeline-redo'),
      document.getElementById('canvas-btn-timeline-redo')
    ];

    var undoTitle = canUndo ? ('Undo ' + (undoLabel || 'action') + ' (Ctrl+Z)') : 'Nothing to undo (Ctrl+Z)';
    var redoTitle = canRedo ? ('Redo ' + (redoLabel || 'action') + ' (Ctrl+Y)') : 'Nothing to redo (Ctrl+Y)';

    undoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canUndo;
      btn.title = undoTitle;
      if (canUndo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });

    redoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canRedo;
      btn.title = redoTitle;
      if (canRedo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  }

  var timelineHistory = new UndoRedoManager({
    name: 'Timeline',
    storageKey: 'tikz_autosave_timeline',
    maxHistory: 50,
    capture: captureTimelineState,
    restore: restoreTimelineState,
    onUpdate: updateTimelineButtonsUI
  });

  window.timelineHistory = timelineHistory;
  window.timelineUndo = function () {
    return timelineHistory.undo();
  };
  window.timelineRedo = function () {
    return timelineHistory.redo();
  };


  /* ==========================================================================
     VENN & EULER STUDIO STATE SERIALIZER & RESTORER
     ========================================================================== */

  function captureVennState() {
    if (window.activeVennModel && typeof window.activeVennModel.toJSON === 'function') {
      return window.activeVennModel.toJSON();
    }
    return null;
  }

  function restoreVennState(state) {
    if (!state || !window.activeVennModel) return;
    window.activeVennModel.fromJSON(state);
    if (window.canvasRenderer) window.canvasRenderer.render();
    if (typeof window.syncSetInspectorValues === 'function') window.syncSetInspectorValues();
    if (typeof window.updateTikZDisplay === 'function') window.updateTikZDisplay();
  }

  function updateVennButtonsUI(canUndo, canRedo, undoLabel, redoLabel) {
    var undoBtns = [document.getElementById('btn-venn-undo')];
    var redoBtns = [document.getElementById('btn-venn-redo')];

    var undoTitle = canUndo ? ('Undo ' + (undoLabel || 'action') + ' (Ctrl+Z)') : 'Nothing to undo (Ctrl+Z)';
    var redoTitle = canRedo ? ('Redo ' + (redoLabel || 'action') + ' (Ctrl+Y)') : 'Nothing to redo (Ctrl+Y)';

    undoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canUndo;
      btn.title = undoTitle;
      if (canUndo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });

    redoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canRedo;
      btn.title = redoTitle;
      if (canRedo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  }

  var vennHistory = new UndoRedoManager({
    name: 'Venn',
    storageKey: 'tikz_autosave_venn',
    maxHistory: 50,
    capture: captureVennState,
    restore: restoreVennState,
    onUpdate: updateVennButtonsUI
  });

  window.vennHistory = vennHistory;
  window.vennUndo = function () {
    return vennHistory.undo();
  };
  window.vennRedo = function () {
    return vennHistory.redo();
  };


  /* ==========================================================================
     FLOWCHART & STATE AUTOMATA STATE SERIALIZER & RESTORER
     ========================================================================== */

  function captureFlowchartState() {
    var m = window.flowchartModel || window.model;
    if (m && typeof m.toJSON === 'function') {
      return m.toJSON();
    }
    return null;
  }

  function restoreFlowchartState(state) {
    if (!state) return;
    var m = window.flowchartModel || window.model;
    if (m && typeof m.fromJSON === 'function') {
      m.fromJSON(state);
      var r = window.flowchartRenderer || window.renderer;
      if (r) r.render();
      if (typeof window.updateCodeDisplay === 'function') window.updateCodeDisplay();
      if (typeof window.updateInspector === 'function') window.updateInspector();
    }
  }

  function updateFlowchartButtonsUI(canUndo, canRedo, undoLabel, redoLabel) {
    var undoBtns = [document.getElementById('btn-flowchart-undo')];
    var redoBtns = [document.getElementById('btn-flowchart-redo')];

    var undoTitle = canUndo ? ('Undo ' + (undoLabel || 'action') + ' (Ctrl+Z)') : 'Nothing to undo (Ctrl+Z)';
    var redoTitle = canRedo ? ('Redo ' + (redoLabel || 'action') + ' (Ctrl+Y)') : 'Nothing to redo (Ctrl+Y)';

    undoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canUndo;
      btn.title = undoTitle;
      if (canUndo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });

    redoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canRedo;
      btn.title = redoTitle;
      if (canRedo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  }

  var flowchartHistory = new UndoRedoManager({
    name: 'Flowchart',
    storageKey: 'tikz_autosave_flowchart',
    maxHistory: 50,
    capture: captureFlowchartState,
    restore: restoreFlowchartState,
    onUpdate: updateFlowchartButtonsUI
  });

  window.flowchartHistory = flowchartHistory;
  window.flowchartUndo = function () {
    return flowchartHistory.undo();
  };
  window.flowchartRedo = function () {
    return flowchartHistory.redo();
  };


  /* ==========================================================================
     GAME TREE STUDIO STATE SERIALIZER & RESTORER
     ========================================================================== */

  function captureGameTreeState() {
    var m = window.gameTreeModel || window.model;
    if (m && typeof m.toJSON === 'function') {
      return m.toJSON();
    }
    return null;
  }

  function restoreGameTreeState(state) {
    if (!state) return;
    var m = window.gameTreeModel || window.model;
    if (m && typeof m.fromJSON === 'function') {
      m.fromJSON(state);
      var r = window.gameTreeRenderer || window.renderer;
      if (r) r.render();
      if (typeof window.updateCodeDisplay === 'function') window.updateCodeDisplay();
      if (typeof window.updateInspector === 'function') window.updateInspector();
    }
  }

  function updateGameTreeButtonsUI(canUndo, canRedo, undoLabel, redoLabel) {
    var undoBtns = [document.getElementById('btn-gametree-undo')];
    var redoBtns = [document.getElementById('btn-gametree-redo')];

    var undoTitle = canUndo ? ('Undo ' + (undoLabel || 'action') + ' (Ctrl+Z)') : 'Nothing to undo (Ctrl+Z)';
    var redoTitle = canRedo ? ('Redo ' + (redoLabel || 'action') + ' (Ctrl+Y)') : 'Nothing to redo (Ctrl+Y)';

    undoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canUndo;
      btn.title = undoTitle;
      if (canUndo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });

    redoBtns.forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canRedo;
      btn.title = redoTitle;
      if (canRedo) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  }

  var gameTreeHistory = new UndoRedoManager({
    name: 'GameTree',
    storageKey: 'tikz_autosave_gametree',
    maxHistory: 50,
    capture: captureGameTreeState,
    restore: restoreGameTreeState,
    onUpdate: updateGameTreeButtonsUI
  });

  window.gameTreeHistory = gameTreeHistory;
  window.gameTreeUndo = function () {
    return gameTreeHistory.undo();
  };
  window.gameTreeRedo = function () {
    return gameTreeHistory.redo();
  };


  /* ==========================================================================
     GLOBAL SHORTCUT LISTENER (Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Shift+Z)
     ========================================================================== */

  document.addEventListener('keydown', function (e) {
    var isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (!isCtrlOrCmd) return;

    var isZ = e.key === 'z' || e.key === 'Z';
    var isY = e.key === 'y' || e.key === 'Y';
    if (!isZ && !isY) return;

    // Check which studio is active
    var isCoordinatePage = !!document.getElementById('bgcanvas') || !!document.getElementById('axisform');
    var isTimelinePage = !!document.getElementById('btn-timeline-undo') || !!document.getElementById('beginTime');
    var isVennPage = !!document.getElementById('btn-venn-undo') || !!document.getElementById('vennCanvas');
    var isFlowchartPage = !!document.getElementById('btn-flowchart-undo') || !!document.getElementById('flowchartCanvas');
    var isGameTreePage = !!document.getElementById('btn-gametree-undo') || !!document.getElementById('gameTreeCanvas');

    // If focused on an input element, only intercept if target isn't currently in native text editing
    var activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    var isTextInput = activeTag === 'input' || activeTag === 'textarea';

    // If inside a text input and just standard typing undo, let native text undo proceed
    if (isTextInput && !e.shiftKey && isZ && activeTag === 'input') {
      return;
    }

    if (isZ && !e.shiftKey) {
      // Undo
      if (isCoordinatePage && window.coordinateHistory) {
        if (window.coordinateHistory.canUndo()) {
          e.preventDefault();
          window.coordinateUndo();
        }
      } else if (isTimelinePage && window.timelineHistory) {
        if (window.timelineHistory.canUndo()) {
          e.preventDefault();
          window.timelineUndo();
        }
      } else if (isVennPage && window.vennHistory) {
        if (window.vennHistory.canUndo()) {
          e.preventDefault();
          window.vennUndo();
        }
      } else if (isFlowchartPage && window.flowchartHistory) {
        if (window.flowchartHistory.canUndo()) {
          e.preventDefault();
          window.flowchartUndo();
        }
      } else if (isGameTreePage && window.gameTreeHistory) {
        if (window.gameTreeHistory.canUndo()) {
          e.preventDefault();
          window.gameTreeUndo();
        }
      }
    } else if (isY || (isZ && e.shiftKey)) {
      // Redo
      if (isCoordinatePage && window.coordinateHistory) {
        if (window.coordinateHistory.canRedo()) {
          e.preventDefault();
          window.coordinateRedo();
        }
      } else if (isTimelinePage && window.timelineHistory) {
        if (window.timelineHistory.canRedo()) {
          e.preventDefault();
          window.timelineRedo();
        }
      } else if (isVennPage && window.vennHistory) {
        if (window.vennHistory.canRedo()) {
          e.preventDefault();
          window.vennRedo();
        }
      } else if (isFlowchartPage && window.flowchartHistory) {
        if (window.flowchartHistory.canRedo()) {
          e.preventDefault();
          window.flowchartRedo();
        }
      } else if (isGameTreePage && window.gameTreeHistory) {
        if (window.gameTreeHistory.canRedo()) {
          e.preventDefault();
          window.gameTreeRedo();
        }
      }
    }
  });


  /* ==========================================================================
     AUTO-INITIALIZATION ON DOM READY
     ========================================================================== */

  function setupHistoryHooks() {
    // 1. If Coordinate Studio is present
    if (document.getElementById('axisform') || document.getElementById('bgcanvas')) {
      // Initialize initial state snapshot after initial draw completes
      setTimeout(function () {
        var restored = coordinateHistory.restoreFromStorage();
        coordinateHistory.init();
        if (restored && window.showToast) {
          window.showToast('Restored previous coordinate session');
        }
      }, 350);

      // Track focus & blur on form inputs to push undo states on changes
      var trackedInputVal = null;
      var trackedInputEl = null;

      document.addEventListener('focusin', function (evt) {
        var t = evt.target;
        if (!t || !t.id) return;
        var form = t.closest('form');
        if (form && (form.id === 'axisform' || form.id === 'pointform' || form.id === 'Retangularform' || form.id === 'circleform' || form.id === 'lineform' || form.id === 'curveform')) {
          trackedInputEl = t;
          trackedInputVal = (t.type === 'checkbox' || t.type === 'radio') ? t.checked : t.value;
        }
      });

      document.addEventListener('change', function (evt) {
        var t = evt.target;
        if (!t || !t.id) return;
        var form = t.closest('form');
        if (form && (form.id === 'axisform' || form.id === 'pointform' || form.id === 'Retangularform' || form.id === 'circleform' || form.id === 'lineform' || form.id === 'curveform')) {
          var curVal = (t.type === 'checkbox' || t.type === 'radio') ? t.checked : t.value;
          if (curVal !== trackedInputVal) {
            coordinateHistory.push('Edit ' + (t.title || t.id));
            trackedInputVal = curVal;
          }
        }
      });
    }

    // 2. If Timeline Studio is present
    if (document.getElementById('beginTime') || document.getElementById('result')) {
      setTimeout(function () {
        var restored = timelineHistory.restoreFromStorage();
        timelineHistory.init();
        if (restored && window.showToast) {
          window.showToast('Restored previous timeline session');
        }
      }, 200);

      var timelineInputs = ['beginTime', 'endTime', 'scale', 'fontsize', 'coordinate', 'linecolor', 'pointcolor'];
      timelineInputs.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var prevVal = el.value;
        el.addEventListener('focus', function () {
          prevVal = el.value;
        });
        el.addEventListener('change', function () {
          if (el.value !== prevVal) {
            timelineHistory.push('Change ' + id);
            prevVal = el.value;
            if (typeof window.draw === 'function') window.draw();
          }
        });
      });
    }

    // 3. If Venn Studio is present
    if (document.getElementById('vennCanvas') || document.getElementById('btn-venn-undo')) {
      setTimeout(function () {
        vennHistory.init();
      }, 250);
    }

    // 4. If Flowchart Studio is present
    if (document.getElementById('flowchartCanvas') || document.getElementById('btn-flowchart-undo')) {
      setTimeout(function () {
        flowchartHistory.init();
      }, 250);
    }

    // 5. If Game Tree Studio is present
    if (document.getElementById('gameTreeCanvas') || document.getElementById('btn-gametree-undo')) {
      setTimeout(function () {
        gameTreeHistory.init();
      }, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHistoryHooks);
  } else {
    setupHistoryHooks();
  }

})();
