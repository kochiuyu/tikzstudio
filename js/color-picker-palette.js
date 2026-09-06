/**
 * TikZ Studio - Color Palette & Custom Color Picker Module
 * Provides unified color palette swatches, HTML5/HEX custom color picker,
 * LaTeX TikZ color code conversion, and real-time canvas preview updates.
 */

(function (window, document) {
  'use strict';

  // Standard TikZ xcolor Named Colors
  var TIKZ_NAMED_COLORS = [
    { name: 'black', hex: '#0f172a', label: 'Black' },
    { name: 'darkgray', hex: '#334155', label: 'Dark Gray' },
    { name: 'gray', hex: '#64748b', label: 'Gray' },
    { name: 'lightgray', hex: '#cbd5e1', label: 'Light Gray' },
    { name: 'red', hex: '#dc2626', label: 'Red' },
    { name: 'blue', hex: '#2563eb', label: 'Blue' },
    { name: 'green', hex: '#16a34a', label: 'Green' },
    { name: 'yellow', hex: '#ca8a04', label: 'Yellow' },
    { name: 'purple', hex: '#9333ea', label: 'Purple' },
    { name: 'orange', hex: '#ea580c', label: 'Orange' },
    { name: 'cyan', hex: '#0891b2', label: 'Cyan' },
    { name: 'magenta', hex: '#db2777', label: 'Magenta' },
    { name: 'teal', hex: '#0d9488', label: 'Teal' },
    { name: 'violet', hex: '#7c3aed', label: 'Violet' },
    { name: 'lime', hex: '#84cc16', label: 'Lime' },
    { name: 'olive', hex: '#65a30d', label: 'Olive' },
    { name: 'brown', hex: '#92400e', label: 'Brown' },
    { name: 'pink', hex: '#f472b6', label: 'Pink' }
  ];

  // Curated Academic & Scientific Presets
  var ACADEMIC_PRESET_COLORS = [
    { name: 'navy', hex: '#1e3a8a', label: 'Navy' },
    { name: 'crimson', hex: '#991b1b', label: 'Crimson' },
    { name: 'emerald', hex: '#059669', label: 'Emerald' },
    { name: 'indigo', hex: '#4f46e5', label: 'Indigo' },
    { name: 'amber', hex: '#d97706', label: 'Amber' },
    { name: 'slate', hex: '#475569', label: 'Slate' }
  ];

  // Map of known names to hex
  var COLOR_NAME_MAP = {
    'black': '#0f172a',
    'darkgray': '#334155',
    'gray': '#64748b',
    'lightgray': '#cbd5e1',
    'white': '#ffffff',
    'red': '#dc2626',
    'blue': '#2563eb',
    'green': '#16a34a',
    'yellow': '#ca8a04',
    'purple': '#9333ea',
    'orange': '#ea580c',
    'cyan': '#0891b2',
    'magenta': '#db2777',
    'teal': '#0d9488',
    'violet': '#7c3aed',
    'lime': '#84cc16',
    'olive': '#65a30d',
    'brown': '#92400e',
    'pink': '#f472b6',
    'navy': '#1e3a8a',
    'crimson': '#991b1b',
    'emerald': '#059669',
    'indigo': '#4f46e5',
    'amber': '#d97706',
    'slate': '#475569'
  };

  // Recent/Saved Custom Colors (localStorage or in-memory)
  var savedColors = ['#4f46e5', '#059669', '#dc2626', '#d97706', '#0891b2', '#7c3aed'];
  try {
    var stored = localStorage.getItem('tikz_custom_saved_colors');
    if (stored) {
      var parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) savedColors = parsed;
    }
  } catch (e) {}

  function saveCustomColor(hex) {
    if (!hex || typeof hex !== 'string') return;
    hex = hex.trim().toLowerCase();
    if (!hex.startsWith('#') || hex.length !== 7) return;
    // Remove if exists and unshift
    savedColors = savedColors.filter(function (c) { return c.toLowerCase() !== hex; });
    savedColors.unshift(hex);
    if (savedColors.length > 12) savedColors.pop();
    try {
      localStorage.setItem('tikz_custom_saved_colors', JSON.stringify(savedColors));
    } catch (e) {}
  }

  /**
   * Helper: Hex to RGB object {r, g, b}
   */
  function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    var num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /**
   * Helper: RGB to Hex string
   */
  function rgbToHex(r, g, b) {
    var bin = ((1 << 24) + (Number(r) << 16) + (Number(g) << 8) + Number(b)).toString(16).slice(1);
    return '#' + bin;
  }

  /**
   * Normalize any color string into a clean hex representation for canvas rendering
   */
  function normalizeToHex(color) {
    if (!color) return '#0f172a';
    color = color.trim().toLowerCase();
    if (COLOR_NAME_MAP[color]) return COLOR_NAME_MAP[color];
    if (color.startsWith('#')) {
      if (color.length === 4) {
        return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color;
    }
    // Fallback: create temporary canvas element to resolve color
    try {
      var d = document.createElement('div');
      d.style.color = color;
      document.body.appendChild(d);
      var cs = window.getComputedStyle(d).color;
      document.body.removeChild(d);
      var match = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return rgbToHex(match[1], match[2], match[3]);
      }
    } catch (e) {}
    return '#0f172a';
  }

  /**
   * Convert any color value (name, hex, or rgb) to valid explicit LaTeX TikZ representation.
   * Explicitly outputs "color={rgb,255:red,r;green,g;blue,b}" for RGB/hex colors,
   * as required for successful TikZ compilation.
   *
   * @param {string} col - Named color or Hex code or RGB spec
   * @param {string} [mode] - 'draw', 'fill', 'fill-tint', 'text', 'raw', or default ('color')
   * @returns {string} Explicit LaTeX TikZ color option
   */
  function toTikzColor(col, mode) {
    if (!col) return (mode === 'draw' ? 'draw=black' : (mode === 'fill' ? 'fill=black' : (mode === 'text' ? 'text=black' : 'color=black')));
    col = String(col).trim();

    // If col is already a complete TikZ option like "color={rgb,255:...}" or "draw={rgb...}"
    if (col.startsWith('color=') || col.startsWith('draw=') || col.startsWith('fill=') || col.startsWith('text=')) {
      if (mode === 'raw' || mode === 'plain') {
        return col.replace(/^(color|draw|fill|text)=/, '');
      }
      return col;
    }

    var colLower = col.toLowerCase();

    // If col is already "{rgb,255:red,217;green,119;blue,6}" or "rgb,255:..."
    if (colLower.indexOf('rgb,255:') !== -1 || (colLower.indexOf('red,') !== -1 && colLower.indexOf('green,') !== -1 && colLower.indexOf('blue,') !== -1)) {
      var rawRgb = col.startsWith('{') ? col : ('{' + col + '}');
      if (mode === 'fill-tint') return 'fill=' + rawRgb + ', fill opacity=0.15';
      if (mode === 'draw') return 'draw=' + rawRgb;
      if (mode === 'fill') return 'fill=' + rawRgb;
      if (mode === 'text') return 'text=' + rawRgb;
      if (mode === 'raw' || mode === 'plain') return rawRgb;
      return 'color=' + rawRgb;
    }

    // Check if it's rgb(...) or rgba(...) format
    var rgbMatch = col.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      var r = parseInt(rgbMatch[1], 10);
      var g = parseInt(rgbMatch[2], 10);
      var b = parseInt(rgbMatch[3], 10);
      var rgbSpec = '{rgb,255:red,' + r + ';green,' + g + ';blue,' + b + '}';
      if (mode === 'fill-tint') return 'fill=' + rgbSpec + ', fill opacity=0.15';
      if (mode === 'draw') return 'draw=' + rgbSpec;
      if (mode === 'fill') return 'fill=' + rgbSpec;
      if (mode === 'text') return 'text=' + rgbSpec;
      if (mode === 'raw' || mode === 'plain') return rgbSpec;
      return 'color=' + rgbSpec;
    }

    // Map known color name to hex if available
    var hex = col;
    if (COLOR_NAME_MAP[colLower]) {
      hex = COLOR_NAME_MAP[colLower];
    } else {
      // Check in TIKZ_NAMED_COLORS
      for (var tn = 0; tn < TIKZ_NAMED_COLORS.length; tn++) {
        if (TIKZ_NAMED_COLORS[tn].name === colLower) {
          hex = TIKZ_NAMED_COLORS[tn].hex;
          break;
        }
      }
    }

    if (hex && hex.startsWith('#')) {
      var rgb = hexToRgb(hex);
      if (rgb) {
        var rgbSpec = '{rgb,255:red,' + rgb.r + ';green,' + rgb.g + ';blue,' + rgb.b + '}';
        if (mode === 'fill-tint') {
          return 'fill=' + rgbSpec + ', fill opacity=0.15';
        }
        if (mode === 'draw') return 'draw=' + rgbSpec;
        if (mode === 'fill') return 'fill=' + rgbSpec;
        if (mode === 'text') return 'text=' + rgbSpec;
        if (mode === 'raw' || mode === 'plain') return rgbSpec;
        return 'color=' + rgbSpec;
      }
    }

    // Fallback: wrap with color= or requested mode
    if (mode === 'draw') return 'draw=' + col;
    if (mode === 'fill') return 'fill=' + col;
    if (mode === 'text') return 'text=' + col;
    if (mode === 'raw' || mode === 'plain') return col;
    return 'color=' + col;
  }

  // Active floating popover instance
  var activePopover = null;

  /**
   * Close any active color popover
   */
  function closeColorPopover() {
    if (activePopover && activePopover.element) {
      if (activePopover.element.parentNode) {
        activePopover.element.parentNode.removeChild(activePopover.element);
      }
      activePopover = null;
    }
  }

  /**
   * Open the unified Color Palette & Custom Color Picker popover
   * @param {Object} options
   *   - anchorEl: DOM element to position near
   *   - currentColor: Initial color string
   *   - title: Header title
   *   - onSelect: callback function(color, tikzColor)
   */
  function openColorPopover(options) {
    closeColorPopover();

    var anchorEl = options.anchorEl;
    var currentColor = options.currentColor || '#0f172a';
    var title = options.title || 'Color Palette & Picker';
    var onSelect = options.onSelect || function () {};

    var currentHex = normalizeToHex(currentColor);
    var selectedColorVal = currentColor;

    var popover = document.createElement('div');
    popover.className = 'tikz-color-popover modern-shadow';
    popover.id = 'tikz-color-popover';

    // Tabs: Palette vs Custom
    var activeTab = 'palette';

    function renderPopoverContent() {
      var currentRgb = hexToRgb(currentHex) || { r: 15, g: 23, b: 42 };
      var currentTikzStr = toTikzColor(selectedColorVal);

      var html = '' +
        '<div class="color-popover-header">' +
          '<div class="color-popover-title-row">' +
            '<span class="color-popover-title">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z"/></svg>' +
              title +
            '</span>' +
            '<button type="button" class="color-popover-close-btn" id="popover-close-btn" title="Close color picker">&times;</button>' +
          '</div>' +
          '<div class="color-popover-tabs">' +
            '<button type="button" class="color-tab-btn ' + (activeTab === 'palette' ? 'active' : '') + '" id="tab-palette-btn">Palette Swatches</button>' +
            '<button type="button" class="color-tab-btn ' + (activeTab === 'custom' ? 'active' : '') + '" id="tab-custom-btn">Custom Picker</button>' +
          '</div>' +
        '</div>' +

        '<div class="color-popover-body">';

      if (activeTab === 'palette') {
        // Standard TikZ Colors
        html += '<div class="palette-section-title">Standard TikZ Colors</div>' +
          '<div class="palette-swatches-grid">';
        for (var i = 0; i < TIKZ_NAMED_COLORS.length; i++) {
          var sc = TIKZ_NAMED_COLORS[i];
          var isAct = (selectedColorVal.toLowerCase() === sc.name || selectedColorVal.toLowerCase() === sc.hex.toLowerCase());
          html += '<button type="button" class="palette-swatch-item ' + (isAct ? 'active' : '') + '" ' +
            'data-color-name="' + sc.name + '" data-color-hex="' + sc.hex + '" ' +
            'title="' + sc.label + ' (\\draw[' + sc.name + '])" style="background-color: ' + sc.hex + ';">' +
            (isAct ? '<span class="swatch-check">✓</span>' : '') +
          '</button>';
        }
        html += '</div>';

        // Academic Extension Colors
        html += '<div class="palette-section-title" style="margin-top: 0.65rem;">Academic Presets</div>' +
          '<div class="palette-swatches-grid" style="grid-template-columns: repeat(6, 1fr);">';
        for (var j = 0; j < ACADEMIC_PRESET_COLORS.length; j++) {
          var ac = ACADEMIC_PRESET_COLORS[j];
          var isActAc = (selectedColorVal.toLowerCase() === ac.name || selectedColorVal.toLowerCase() === ac.hex.toLowerCase());
          html += '<button type="button" class="palette-swatch-item ' + (isActAc ? 'active' : '') + '" ' +
            'data-color-name="' + ac.name + '" data-color-hex="' + ac.hex + '" ' +
            'title="' + ac.label + ' (' + ac.hex + ')" style="background-color: ' + ac.hex + ';">' +
            (isActAc ? '<span class="swatch-check">✓</span>' : '') +
          '</button>';
        }
        html += '</div>';

        // Recent / Saved Colors
        if (savedColors.length > 0) {
          html += '<div class="palette-section-title" style="margin-top: 0.65rem; display: flex; justify-content: space-between; align-items: center;">' +
            '<span>Recent / Saved Custom</span>' +
            '<span style="font-size: 0.65rem; color: var(--color-text-muted); font-weight: normal;">Saved locally</span>' +
          '</div>' +
          '<div class="palette-swatches-grid" style="grid-template-columns: repeat(6, 1fr);">';
          for (var s = 0; s < savedColors.length; s++) {
            var saveHex = savedColors[s];
            var isActSave = (selectedColorVal.toLowerCase() === saveHex.toLowerCase());
            html += '<button type="button" class="palette-swatch-item ' + (isActSave ? 'active' : '') + '" ' +
              'data-color-hex="' + saveHex + '" title="Custom ' + saveHex + '" style="background-color: ' + saveHex + ';">' +
              (isActSave ? '<span class="swatch-check">✓</span>' : '') +
            '</button>';
          }
          html += '</div>';
        }

      } else {
        // Custom Picker Tab
        html += '<div class="custom-picker-pane">' +
          '<div class="custom-picker-row">' +
            '<div class="custom-wheel-wrapper">' +
              '<input type="color" id="native-color-input" class="native-color-input" value="' + currentHex + '" title="Click to open system color spectrum &amp; eyedropper">' +
              '<span class="custom-wheel-label">Pick Spectrum</span>' +
            '</div>' +
            '<div class="custom-color-preview-box" style="background-color: ' + currentHex + ';">' +
              '<span class="preview-hex-tag" id="preview-hex-tag">' + currentHex.toUpperCase() + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="custom-inputs-group">' +
            '<div class="custom-input-field">' +
              '<label>HEX:</label>' +
              '<input type="text" id="custom-hex-input" class="input-modern" value="' + currentHex + '" maxlength="7" placeholder="#000000">' +
            '</div>' +
            '<div class="custom-input-field">' +
              '<label>R:</label>' +
              '<input type="number" id="custom-r-input" class="input-modern rgb-num" value="' + currentRgb.r + '" min="0" max="255">' +
            '</div>' +
            '<div class="custom-input-field">' +
              '<label>G:</label>' +
              '<input type="number" id="custom-g-input" class="input-modern rgb-num" value="' + currentRgb.g + '" min="0" max="255">' +
            '</div>' +
            '<div class="custom-input-field">' +
              '<label>B:</label>' +
              '<input type="number" id="custom-b-input" class="input-modern rgb-num" value="' + currentRgb.b + '" min="0" max="255">' +
            '</div>' +
          '</div>' +

          '<div class="custom-action-row">' +
            '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" id="btn-save-to-palette" style="width: 100%;">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>' +
              'Save to Custom Swatches' +
            '</button>' +
          '</div>' +
        '</div>';
      }

      // Footer with Live TikZ code preview & apply button
      html += '</div>' +
        '<div class="color-popover-footer">' +
          '<div class="tikz-live-badge">' +
            '<span class="tikz-badge-label">TikZ:</span>' +
            '<code class="tikz-badge-code" id="tikz-badge-preview">' + currentTikzStr + '</code>' +
          '</div>' +
          '<div style="display: flex; gap: 0.35rem;">' +
            '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" id="popover-cancel-btn">Close</button>' +
            '<button type="button" class="btn-modern btn-modern-primary btn-modern-sm" id="popover-apply-btn">Apply</button>' +
          '</div>' +
        '</div>';

      popover.innerHTML = html;
      bindPopoverEvents();
    }

    function applySelectedColor(val) {
      selectedColorVal = val;
      currentHex = normalizeToHex(val);
      var tikz = toTikzColor(val);
      onSelect(selectedColorVal, tikz);
    }

    function bindPopoverEvents() {
      // Close button
      var closeBtn = popover.querySelector('#popover-close-btn');
      if (closeBtn) closeBtn.onclick = closeColorPopover;

      var cancelBtn = popover.querySelector('#popover-cancel-btn');
      if (cancelBtn) cancelBtn.onclick = closeColorPopover;

      var applyBtn = popover.querySelector('#popover-apply-btn');
      if (applyBtn) {
        applyBtn.onclick = function () {
          applySelectedColor(selectedColorVal);
          closeColorPopover();
        };
      }

      // Tab switcher
      var tabPalBtn = popover.querySelector('#tab-palette-btn');
      var tabCustBtn = popover.querySelector('#tab-custom-btn');
      if (tabPalBtn) {
        tabPalBtn.onclick = function () {
          activeTab = 'palette';
          renderPopoverContent();
        };
      }
      if (tabCustBtn) {
        tabCustBtn.onclick = function () {
          activeTab = 'custom';
          renderPopoverContent();
        };
      }

      // Palette swatches clicks
      var swatches = popover.querySelectorAll('.palette-swatch-item');
      for (var i = 0; i < swatches.length; i++) {
        (function (sw) {
          sw.onclick = function () {
            var colorName = sw.getAttribute('data-color-name');
            var colorHex = sw.getAttribute('data-color-hex');
            var chosen = colorName || colorHex;
            applySelectedColor(chosen);

            // Update UI indicators
            popover.querySelectorAll('.palette-swatch-item').forEach(function (el) {
              el.classList.remove('active');
              var ch = el.querySelector('.swatch-check');
              if (ch) ch.remove();
            });
            sw.classList.add('active');
            var chk = document.createElement('span');
            chk.className = 'swatch-check';
            chk.textContent = '✓';
            sw.appendChild(chk);

            var codeEl = popover.querySelector('#tikz-badge-preview');
            if (codeEl) codeEl.textContent = toTikzColor(chosen);
          };
        })(swatches[i]);
      }

      // Custom picker inputs
      var nativeInput = popover.querySelector('#native-color-input');
      var hexInput = popover.querySelector('#custom-hex-input');
      var rInput = popover.querySelector('#custom-r-input');
      var gInput = popover.querySelector('#custom-g-input');
      var bInput = popover.querySelector('#custom-b-input');
      var previewBox = popover.querySelector('.custom-color-preview-box');
      var hexTag = popover.querySelector('#preview-hex-tag');
      var tikzCode = popover.querySelector('#tikz-badge-preview');

      function updateCustomPreview(hex) {
        currentHex = hex;
        selectedColorVal = hex;
        if (previewBox) previewBox.style.backgroundColor = hex;
        if (hexTag) hexTag.textContent = hex.toUpperCase();
        if (tikzCode) tikzCode.textContent = toTikzColor(hex);
        applySelectedColor(hex);
      }

      if (nativeInput) {
        nativeInput.oninput = function () {
          var val = nativeInput.value;
          if (hexInput) hexInput.value = val;
          var rgb = hexToRgb(val);
          if (rgb) {
            if (rInput) rInput.value = rgb.r;
            if (gInput) gInput.value = rgb.g;
            if (bInput) bInput.value = rgb.b;
          }
          updateCustomPreview(val);
        };
      }

      if (hexInput) {
        hexInput.oninput = function () {
          var val = hexInput.value.trim();
          if (!val.startsWith('#')) val = '#' + val;
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            if (nativeInput) nativeInput.value = val;
            var rgb = hexToRgb(val);
            if (rgb) {
              if (rInput) rInput.value = rgb.r;
              if (gInput) gInput.value = rgb.g;
              if (bInput) bInput.value = rgb.b;
            }
            updateCustomPreview(val);
          }
        };
      }

      function onRgbChange() {
        var r = Math.max(0, Math.min(255, parseInt(rInput.value) || 0));
        var g = Math.max(0, Math.min(255, parseInt(gInput.value) || 0));
        var b = Math.max(0, Math.min(255, parseInt(bInput.value) || 0));
        var hex = rgbToHex(r, g, b);
        if (nativeInput) nativeInput.value = hex;
        if (hexInput) hexInput.value = hex;
        updateCustomPreview(hex);
      }

      if (rInput) rInput.oninput = onRgbChange;
      if (gInput) gInput.oninput = onRgbChange;
      if (bInput) bInput.oninput = onRgbChange;

      var saveBtn = popover.querySelector('#btn-save-to-palette');
      if (saveBtn) {
        saveBtn.onclick = function () {
          saveCustomColor(currentHex);
          if (window.showToast) window.showToast('✓ Color ' + currentHex.toUpperCase() + ' saved to custom palette!');
          activeTab = 'palette';
          renderPopoverContent();
        };
      }
    }

    renderPopoverContent();
    document.body.appendChild(popover);

    // Position popover intelligently near anchor
    if (anchorEl) {
      var rect = anchorEl.getBoundingClientRect();
      var top = rect.bottom + window.scrollY + 6;
      var left = rect.left + window.scrollX;

      // Ensure does not overflow right viewport
      var popoverWidth = 270;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      if (left < 10) left = 10;

      popover.style.top = top + 'px';
      popover.style.left = left + 'px';
    }

    activePopover = {
      element: popover,
      anchorEl: anchorEl
    };

    // Close on click outside
    function onDocClick(e) {
      if (!popover.contains(e.target) && !anchorEl.contains(e.target)) {
        closeColorPopover();
        document.removeEventListener('mousedown', onDocClick);
      }
    }
    setTimeout(function () {
      document.addEventListener('mousedown', onDocClick);
    }, 10);
  }

  /**
   * Universal Color Trigger Widget
   * Wraps or attaches to any select/input element, creating a modern color badge
   */
  function enhanceColorControl(targetEl, options) {
    if (!targetEl || targetEl._hasModernColorPicker) return;
    targetEl._hasModernColorPicker = true;

    options = options || {};
    var title = options.title || 'Choose Color';

    // Create trigger button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'color-picker-trigger';
    trigger.title = 'Open Color Palette & Custom Picker (' + (targetEl.value || 'black') + ')';

    var swatch = document.createElement('span');
    swatch.className = 'color-trigger-swatch';
    var label = document.createElement('span');
    label.className = 'color-trigger-label';
    var icon = document.createElement('span');
    icon.className = 'color-trigger-icon';
    icon.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';

    trigger.appendChild(swatch);
    trigger.appendChild(label);
    trigger.appendChild(icon);

    function updateTriggerUI() {
      var val = targetEl.value || 'black';
      var hex = normalizeToHex(val);
      swatch.style.backgroundColor = hex;
      label.textContent = val.length > 9 ? (val.substring(0, 8) + '…') : val;
      trigger.title = 'Current color: ' + val + ' (Click to customize)';
    }

    updateTriggerUI();

    trigger.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      openColorPopover({
        anchorEl: trigger,
        currentColor: targetEl.value || 'black',
        title: title,
        onSelect: function (chosenColor, tikzColor) {
          // Set value on target element
          if (targetEl.tagName === 'SELECT') {
            var found = false;
            for (var i = 0; i < targetEl.options.length; i++) {
              if (targetEl.options[i].value.toLowerCase() === chosenColor.toLowerCase()) {
                targetEl.selectedIndex = i;
                found = true;
                break;
              }
            }
            if (!found) {
              var opt = document.createElement('option');
              opt.value = chosenColor;
              opt.text = chosenColor;
              opt.selected = true;
              targetEl.appendChild(opt);
            }
          } else {
            targetEl.value = chosenColor;
          }

          updateTriggerUI();

          // Dispatch change event
          try {
            var ev = new Event('change', { bubbles: true });
            targetEl.dispatchEvent(ev);
          } catch (err) {}

          // Invoke redraw handlers if defined
          if (typeof window.DrawGraph === 'function') window.DrawGraph();
          if (typeof window.draw === 'function') window.draw();
        }
      });
    };

    targetEl.addEventListener('change', updateTriggerUI);
    targetEl.parentNode.insertBefore(trigger, targetEl.nextSibling);

    // Hide default select visually but keep in DOM for accessibility & form submission
    targetEl.style.display = 'none';

    targetEl._colorPickerTrigger = {
      update: updateTriggerUI,
      trigger: trigger
    };

    return trigger;
  }

  /**
   * Automatically enhance all known color controls in the document
   */
  function initAllColorControls() {
    // Coordinate Studio Selects
    var coordColorIds = [
      'lineColor_1', 'lineColor_2', 'lineColor_3', 'lineColor_4',
      'curveColor_1', 'curveColor_2',
      'retangularColor_1',
      'circleColor_1',
      'pointColor_1', 'pointColor_2', 'pointColor_3',
      'axisColor'
    ];

    for (var i = 0; i < coordColorIds.length; i++) {
      var el = document.getElementById(coordColorIds[i]);
      if (el) enhanceColorControl(el);
    }

    // Timeline Studio Selects
    var timelineColorIds = ['linecolor', 'pointcolor', 'textcolor', 'eyearColor'];
    for (var j = 0; j < timelineColorIds.length; j++) {
      var tel = document.getElementById(timelineColorIds[j]);
      if (tel) enhanceColorControl(tel);
    }
  }

  // Canvas-level Palette & Color Tool Handler
  window.openCanvasColorPalette = function (event, studio) {
    var btn = event ? (event.currentTarget || event.target) : document.getElementById('tool-btn-canvas-color');

    // Determine target context
    var title = 'Canvas Drawing Color';
    var currentColor = window.activeDrawingColor || '#0f172a';

    // If a shape is selected in Coordinate Studio, prioritize selected shape
    if (window.drawingState && window.drawingState.selectedShape) {
      var sel = window.drawingState.selectedShape;
      var shapeColorEl = null;
      if (sel.type === 'line') shapeColorEl = document.getElementById('lineColor_' + sel.index);
      else if (sel.type === 'rectangle') shapeColorEl = document.getElementById('retangularColor_' + sel.index);
      else if (sel.type === 'circle') shapeColorEl = document.getElementById('circleColor_' + sel.index);
      else if (sel.type === 'curve') shapeColorEl = document.getElementById('curveColor_' + sel.index);
      else if (sel.type === 'point') shapeColorEl = document.getElementById('pointColor_' + sel.index);
      else if (sel.type === 'axis') shapeColorEl = document.getElementById('axisColor');

      if (shapeColorEl && shapeColorEl.value) {
        currentColor = shapeColorEl.value;
        title = 'Selected ' + sel.type.charAt(0).toUpperCase() + sel.type.slice(1) + ' Color';
      }
    }

    openColorPopover({
      anchorEl: btn,
      currentColor: currentColor,
      title: title,
      onSelect: function (chosenColor, tikzColor) {
        window.activeDrawingColor = chosenColor;

        // Update canvas toolbar swatch indicator
        var activeSwatch = document.getElementById('canvas-active-color-swatch');
        if (activeSwatch) activeSwatch.style.backgroundColor = normalizeToHex(chosenColor);

        // If candidate shape is active in candidate card, update it
        if (window.drawingState && window.drawingState.candidate) {
          if (typeof window.setCandidateColor === 'function') {
            window.setCandidateColor(chosenColor);
          }
        }

        // If a shape is currently selected on canvas, update that shape immediately
        if (window.drawingState && window.drawingState.selectedShape) {
          var selShape = window.drawingState.selectedShape;
          var targetEl = null;
          if (selShape.type === 'line') targetEl = document.getElementById('lineColor_' + selShape.index);
          else if (selShape.type === 'rectangle') targetEl = document.getElementById('retangularColor_' + selShape.index);
          else if (selShape.type === 'circle') targetEl = document.getElementById('circleColor_' + selShape.index);
          else if (selShape.type === 'curve') targetEl = document.getElementById('curveColor_' + selShape.index);
          else if (selShape.type === 'point') targetEl = document.getElementById('pointColor_' + selShape.index);
          else if (selShape.type === 'axis') targetEl = document.getElementById('axisColor');

          if (targetEl) {
            targetEl.value = chosenColor;
            if (targetEl._colorPickerTrigger) targetEl._colorPickerTrigger.update();
            try {
              var chEv = new Event('change', { bubbles: true });
              targetEl.dispatchEvent(chEv);
            } catch (err) {}

            if (typeof window.DrawGraph === 'function') window.DrawGraph();
            if (window.renderAllOverlays) window.renderAllOverlays();
            if (window.coordinateHistory) {
              window.coordinateHistory.push('Color ' + selShape.type.charAt(0).toUpperCase() + selShape.type.slice(1) + ' ' + selShape.index + ' (' + chosenColor + ')');
            }
            if (window.showToast) {
              window.showToast('✓ ' + selShape.type.charAt(0).toUpperCase() + selShape.type.slice(1) + ' ' + selShape.index + ' color set to ' + chosenColor);
            }
            return;
          }
        }

        if (window.showToast) {
          window.showToast('Active drawing color set to ' + chosenColor);
        }
      }
    });
  };

  // Expose global APIs
  window.toTikzColor = toTikzColor;
  window.hexToRgb = hexToRgb;
  window.rgbToHex = rgbToHex;
  window.normalizeToHex = normalizeToHex;
  window.openColorPopover = openColorPopover;
  window.closeColorPopover = closeColorPopover;
  window.enhanceColorControl = enhanceColorControl;
  window.initAllColorControls = initAllColorControls;
  window.TIKZ_NAMED_COLORS = TIKZ_NAMED_COLORS;
  window.ACADEMIC_PRESET_COLORS = ACADEMIC_PRESET_COLORS;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllColorControls);
  } else {
    setTimeout(initAllColorControls, 50);
  }

})(window, document);
