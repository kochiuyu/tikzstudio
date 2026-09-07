/**
 * Venn Diagram & Euler Diagram Generator for TikZ Studio
 * Interactive Model, Canvas Viewport Renderer, and LaTeX TikZ Code Generator
 */

(function (window) {
  'use strict';

  function uid(prefix = 'v_') {
    return prefix + Math.random().toString(36).substr(2, 6);
  }

  class VennDiagramModel {
    constructor(mode = '2-set') {
      this.title = 'Venn Diagram';
      this.mode = mode; // '2-set', '3-set', 'euler'

      // Universal Set Configuration
      this.universalSet = {
        enabled: true,
        label: 'U',
        width: 540,
        height: 360,
        strokeColor: '#334155',
        strokeWidth: 2,
        fillColor: '#ffffff',
        labelPos: 'top-left' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
      };

      // Set Circles
      this.circles = [];

      // Regions (Atoms of the Venn partition)
      this.regions = {};

      // Custom Labels & Element Annotations
      this.labels = [];

      this.initDefaultLayout(mode);
    }

    initDefaultLayout(mode = '2-set') {
      this.mode = mode;
      this.circles = [];
      this.regions = {};
      this.labels = [];

      if (mode === '2-set') {
        const r = 110;
        const offset = 70;
        this.circles = [
          {
            id: 'A',
            label: 'A',
            x: -offset,
            y: 0,
            r: r,
            strokeColor: '#2563eb', // Blue
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: -85, y: -95 }
          },
          {
            id: 'B',
            label: 'B',
            x: offset,
            y: 0,
            r: r,
            strokeColor: '#dc2626', // Red
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: 85, y: -95 }
          }
        ];

        this.regions = {
          'U_only': {
            id: 'U_only',
            name: 'Outside (A ∪ B)ᶜ',
            texExpression: '(A \\cup B)^c',
            shaded: false,
            fillColor: '#94a3b8',
            opacity: 0.35,
            pattern: 'none',
            label: '',
            labelPos: { x: -210, y: 130 }
          },
          'A_only': {
            id: 'A_only',
            name: 'Only A (A \\ B)',
            texExpression: 'A \\setminus B',
            shaded: false,
            fillColor: '#3b82f6',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: -105, y: 0 }
          },
          'B_only': {
            id: 'B_only',
            name: 'Only B (B \\ A)',
            texExpression: 'B \\setminus A',
            shaded: false,
            fillColor: '#ef4444',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: 105, y: 0 }
          },
          'AB': {
            id: 'AB',
            name: 'Intersection A ∩ B',
            texExpression: 'A \\cap B',
            shaded: false,
            fillColor: '#8b5cf6',
            opacity: 0.55,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: 0 }
          }
        };

      } else if (mode === '3-set') {
        const r = 95;
        const d = 55;
        const dy = 32;

        this.circles = [
          {
            id: 'A',
            label: 'A',
            x: -d,
            y: -dy,
            r: r,
            strokeColor: '#2563eb', // Blue
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: -80, y: -80 }
          },
          {
            id: 'B',
            label: 'B',
            x: d,
            y: -dy,
            r: r,
            strokeColor: '#dc2626', // Red
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: 80, y: -80 }
          },
          {
            id: 'C',
            label: 'C',
            x: 0,
            y: dy + 30,
            r: r,
            strokeColor: '#16a34a', // Green
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: 0, y: 105 }
          }
        ];

        this.regions = {
          'U_only': {
            id: 'U_only',
            name: 'Outside (A ∪ B ∪ C)ᶜ',
            texExpression: '(A \\cup B \\cup C)^c',
            shaded: false,
            fillColor: '#94a3b8',
            opacity: 0.35,
            pattern: 'none',
            label: '',
            labelPos: { x: -210, y: 140 }
          },
          'A_only': {
            id: 'A_only',
            name: 'Only A',
            texExpression: 'A \\setminus (B \\cup C)',
            shaded: false,
            fillColor: '#3b82f6',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: -85, y: -65 }
          },
          'B_only': {
            id: 'B_only',
            name: 'Only B',
            texExpression: 'B \\setminus (A \\cup C)',
            shaded: false,
            fillColor: '#ef4444',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: 85, y: -65 }
          },
          'C_only': {
            id: 'C_only',
            name: 'Only C',
            texExpression: 'C \\setminus (A \\cup B)',
            shaded: false,
            fillColor: '#10b981',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: 95 }
          },
          'AB_only': {
            id: 'AB_only',
            name: 'A ∩ B only (without C)',
            texExpression: '(A \\cap B) \\setminus C',
            shaded: false,
            fillColor: '#8b5cf6',
            opacity: 0.5,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: -50 }
          },
          'AC_only': {
            id: 'AC_only',
            name: 'A ∩ C only (without B)',
            texExpression: '(A \\cap C) \\setminus B',
            shaded: false,
            fillColor: '#06b6d4',
            opacity: 0.5,
            pattern: 'none',
            label: '',
            labelPos: { x: -45, y: 25 }
          },
          'BC_only': {
            id: 'BC_only',
            name: 'B ∩ C only (without A)',
            texExpression: '(B \\cap C) \\setminus A',
            shaded: false,
            fillColor: '#f59e0b',
            opacity: 0.5,
            pattern: 'none',
            label: '',
            labelPos: { x: 45, y: 25 }
          },
          'ABC': {
            id: 'ABC',
            name: 'Triple Intersection A ∩ B ∩ C',
            texExpression: 'A \\cap B \\cap C',
            shaded: false,
            fillColor: '#ec4899',
            opacity: 0.6,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: 5 }
          }
        };

      } else if (mode === 'euler') {
        // Disjoint or Subset configuration
        this.circles = [
          {
            id: 'A',
            label: 'A',
            x: -120,
            y: 0,
            r: 85,
            strokeColor: '#2563eb',
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: -75, y: -75 }
          },
          {
            id: 'B',
            label: 'B',
            x: 120,
            y: 0,
            r: 85,
            strokeColor: '#dc2626',
            strokeWidth: 2.5,
            strokeStyle: 'solid',
            labelOffset: { x: 75, y: -75 }
          }
        ];

        this.regions = {
          'U_only': {
            id: 'U_only',
            name: 'Outside Universe',
            texExpression: '(A \\cup B)^c',
            shaded: false,
            fillColor: '#94a3b8',
            opacity: 0.35,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: 130 }
          },
          'A_only': {
            id: 'A_only',
            name: 'Set A (Disjoint)',
            texExpression: 'A',
            shaded: false,
            fillColor: '#3b82f6',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: -120, y: 0 }
          },
          'B_only': {
            id: 'B_only',
            name: 'Set B (Disjoint)',
            texExpression: 'B',
            shaded: false,
            fillColor: '#ef4444',
            opacity: 0.45,
            pattern: 'none',
            label: '',
            labelPos: { x: 120, y: 0 }
          },
          'AB': {
            id: 'AB',
            name: 'Intersection (Empty)',
            texExpression: 'A \\cap B = \\emptyset',
            shaded: false,
            fillColor: '#8b5cf6',
            opacity: 0.5,
            pattern: 'none',
            label: '',
            labelPos: { x: 0, y: 0 }
          }
        };
      }
      this.updateAutoLabelPositions();
    }

    getCircle(id) {
      return this.circles.find(c => c.id === id) || null;
    }

    updateCircle(id, props) {
      const c = this.getCircle(id);
      if (!c) return false;
      Object.assign(c, props);
      this.updateAutoLabelPositions();
      return true;
    }

    addCircle(opt = {}) {
      const existingIds = this.circles.map(c => c.id);
      const candidates = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z'];
      const nextId = candidates.find(id => !existingIds.includes(id)) || ('S' + (this.circles.length + 1));
      
      const palette = ['#2563eb', '#dc2626', '#16a34a', '#8b5cf6', '#d97706', '#0891b2', '#ec4899'];
      const color = palette[this.circles.length % palette.length];

      const newCircle = {
        id: nextId,
        label: nextId,
        x: opt.x !== undefined ? opt.x : ((this.circles.length - 1) * 60),
        y: opt.y !== undefined ? opt.y : 0,
        r: opt.r !== undefined ? opt.r : 85,
        strokeColor: opt.strokeColor || color,
        strokeWidth: opt.strokeWidth || 2.5,
        strokeStyle: opt.strokeStyle || 'solid',
        labelOffset: opt.labelOffset || { x: 0, y: -95 }
      };

      this.circles.push(newCircle);

      // If we now have 3 circles in euler mode, ensure region atoms exist
      if (this.circles.length >= 3 && !this.regions['C_only']) {
        this.regions['C_only'] = {
          id: 'C_only',
          name: 'Only ' + nextId,
          texExpression: nextId,
          shaded: false,
          fillColor: '#10b981',
          opacity: 0.45,
          pattern: 'none',
          label: '',
          labelPos: { x: newCircle.x, y: newCircle.y }
        };
      }

      this.updateAutoLabelPositions();
      return newCircle;
    }

    removeCircle(id) {
      if (this.circles.length <= 1) return false;
      const idx = this.circles.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.circles.splice(idx, 1);
        this.updateAutoLabelPositions();
        return true;
      }
      return false;
    }

    // Custom Label Management
    addLabel(opt = {}) {
      const id = uid('lbl_');
      const label = {
        id: id,
        text: opt.text !== undefined ? opt.text : 'x',
        x: opt.x !== undefined ? Math.round(opt.x) : 0,
        y: opt.y !== undefined ? Math.round(opt.y) : 0,
        fontSize: opt.fontSize || 14,
        color: opt.color || '#0f172a',
        showPoint: opt.showPoint !== undefined ? opt.showPoint : false,
        mathMode: opt.mathMode !== undefined ? opt.mathMode : true
      };
      this.labels.push(label);
      return label;
    }

    getLabel(id) {
      return this.labels.find(l => l.id === id) || null;
    }

    updateLabel(id, props) {
      const l = this.getLabel(id);
      if (!l) return false;
      Object.assign(l, props);
      return true;
    }

    removeLabel(id) {
      const idx = this.labels.findIndex(l => l.id === id);
      if (idx !== -1) {
        this.labels.splice(idx, 1);
        return true;
      }
      return false;
    }

    clearLabels() {
      this.labels = [];
    }

    updateAutoLabelPositions() {
      const cA = this.circles.find(c => c.id === 'A') || this.circles[0];
      const cB = this.circles.find(c => c.id === 'B') || this.circles[1];
      const cC = this.circles.find(c => c.id === 'C') || this.circles[2];

      if ((this.mode === '2-set' || this.mode === 'euler') && this.circles.length === 2 && cA && cB) {
        if (this.regions['AB']) {
          this.regions['AB'].labelPos = {
            x: Math.round((cA.x + cB.x) / 2),
            y: Math.round((cA.y + cB.y) / 2)
          };
        }
        if (this.regions['A_only']) {
          const dx = cA.x - cB.x;
          const dy = cA.y - cB.y;
          const dist = Math.hypot(dx, dy) || 1;
          const factor = cA.r * 0.45;
          this.regions['A_only'].labelPos = {
            x: Math.round(cA.x + (dx / dist) * factor),
            y: Math.round(cA.y + (dy / dist) * factor)
          };
        }
        if (this.regions['B_only']) {
          const dx = cB.x - cA.x;
          const dy = cB.y - cA.y;
          const dist = Math.hypot(dx, dy) || 1;
          const factor = cB.r * 0.45;
          this.regions['B_only'].labelPos = {
            x: Math.round(cB.x + (dx / dist) * factor),
            y: Math.round(cB.y + (dy / dist) * factor)
          };
        }
      } else if (cA && cB && cC) {
        if (this.regions['ABC']) {
          this.regions['ABC'].labelPos = {
            x: Math.round((cA.x + cB.x + cC.x) / 3),
            y: Math.round((cA.y + cB.y + cC.y) / 3)
          };
        }
        if (this.regions['AB_only']) {
          const midX = (cA.x + cB.x) / 2;
          const midY = (cA.y + cB.y) / 2;
          this.regions['AB_only'].labelPos = {
            x: Math.round(midX + (midX - cC.x) * 0.25),
            y: Math.round(midY + (midY - cC.y) * 0.25)
          };
        }
        if (this.regions['AC_only']) {
          const midX = (cA.x + cC.x) / 2;
          const midY = (cA.y + cC.y) / 2;
          this.regions['AC_only'].labelPos = {
            x: Math.round(midX + (midX - cB.x) * 0.25),
            y: Math.round(midY + (midY - cB.y) * 0.25)
          };
        }
        if (this.regions['BC_only']) {
          const midX = (cB.x + cC.x) / 2;
          const midY = (cB.y + cC.y) / 2;
          this.regions['BC_only'].labelPos = {
            x: Math.round(midX + (midX - cA.x) * 0.25),
            y: Math.round(midY + (midY - cA.y) * 0.25)
          };
        }
        if (this.regions['A_only']) {
          const midBCX = (cB.x + cC.x) / 2;
          const midBCY = (cB.y + cC.y) / 2;
          const dx = cA.x - midBCX;
          const dy = cA.y - midBCY;
          const dist = Math.hypot(dx, dy) || 1;
          this.regions['A_only'].labelPos = {
            x: Math.round(cA.x + (dx / dist) * (cA.r * 0.45)),
            y: Math.round(cA.y + (dy / dist) * (cA.r * 0.45))
          };
        }
        if (this.regions['B_only']) {
          const midACX = (cA.x + cC.x) / 2;
          const midACY = (cA.y + cC.y) / 2;
          const dx = cB.x - midACX;
          const dy = cB.y - midACY;
          const dist = Math.hypot(dx, dy) || 1;
          this.regions['B_only'].labelPos = {
            x: Math.round(cB.x + (dx / dist) * (cB.r * 0.45)),
            y: Math.round(cB.y + (dy / dist) * (cB.r * 0.45))
          };
        }
        if (this.regions['C_only']) {
          const midABX = (cA.x + cB.x) / 2;
          const midABY = (cA.y + cB.y) / 2;
          const dx = cC.x - midABX;
          const dy = cC.y - midABY;
          const dist = Math.hypot(dx, dy) || 1;
          this.regions['C_only'].labelPos = {
            x: Math.round(cC.x + (dx / dist) * (cC.r * 0.45)),
            y: Math.round(cC.y + (dy / dist) * (cC.r * 0.45))
          };
        }
      }
    }

    // Identify which region a point (wx, wy) falls into
    getRegionAtPoint(wx, wy) {
      const u = this.universalSet;
      const halfW = u.width / 2;
      const halfH = u.height / 2;

      // Outside universal box
      if (Math.abs(wx) > halfW || Math.abs(wy) > halfH) {
        return null;
      }

      if (this.mode === '2-set' || this.mode === 'euler') {
        const cA = this.circles.find(c => c.id === 'A') || this.circles[0];
        const cB = this.circles.find(c => c.id === 'B') || this.circles[1];
        if (!cA || !cB) return null;

        const inA = Math.hypot(wx - cA.x, wy - cA.y) <= cA.r;
        const inB = Math.hypot(wx - cB.x, wy - cB.y) <= cB.r;

        if (inA && inB) return 'AB';
        if (inA && !inB) return 'A_only';
        if (!inA && inB) return 'B_only';
        return 'U_only';

      } else if (this.mode === '3-set') {
        const cA = this.circles.find(c => c.id === 'A') || this.circles[0];
        const cB = this.circles.find(c => c.id === 'B') || this.circles[1];
        const cC = this.circles.find(c => c.id === 'C') || this.circles[2];
        if (!cA || !cB || !cC) return null;

        const inA = Math.hypot(wx - cA.x, wy - cA.y) <= cA.r;
        const inB = Math.hypot(wx - cB.x, wy - cB.y) <= cB.r;
        const inC = Math.hypot(wx - cC.x, wy - cC.y) <= cC.r;

        if (inA && inB && inC) return 'ABC';
        if (inA && inB && !inC) return 'AB_only';
        if (inA && inC && !inB) return 'AC_only';
        if (inB && inC && !inA) return 'BC_only';
        if (inA && !inB && !inC) return 'A_only';
        if (!inA && inB && !inC) return 'B_only';
        if (!inA && !inB && inC) return 'C_only';
        return 'U_only';
      }

      return null;
    }

    // Apply quick set-theoretic operations
    applySetOperation(op) {
      // Clear all first if requested
      if (op === 'clear') {
        Object.values(this.regions).forEach(r => { r.shaded = false; });
        return;
      }

      if (op === 'invert') {
        Object.values(this.regions).forEach(r => { r.shaded = !r.shaded; });
        return;
      }

      // Reset all to false before setting specific operation
      Object.values(this.regions).forEach(r => { r.shaded = false; });

      if (this.mode === '2-set' || this.mode === 'euler') {
        switch (op) {
          case 'intersect': // A ∩ B
            if (this.regions['AB']) this.regions['AB'].shaded = true;
            break;
          case 'union': // A ∪ B
            if (this.regions['A_only']) this.regions['A_only'].shaded = true;
            if (this.regions['B_only']) this.regions['B_only'].shaded = true;
            if (this.regions['AB']) this.regions['AB'].shaded = true;
            break;
          case 'diff_A_B': // A \ B
            if (this.regions['A_only']) this.regions['A_only'].shaded = true;
            break;
          case 'diff_B_A': // B \ A
            if (this.regions['B_only']) this.regions['B_only'].shaded = true;
            break;
          case 'sym_diff': // A Δ B = (A \ B) ∪ (B \ A)
            if (this.regions['A_only']) this.regions['A_only'].shaded = true;
            if (this.regions['B_only']) this.regions['B_only'].shaded = true;
            break;
          case 'complement_union': // (A ∪ B)ᶜ
            if (this.regions['U_only']) this.regions['U_only'].shaded = true;
            break;
          case 'complement_A': // Aᶜ
            if (this.regions['B_only']) this.regions['B_only'].shaded = true;
            if (this.regions['U_only']) this.regions['U_only'].shaded = true;
            break;
          case 'complement_B': // Bᶜ
            if (this.regions['A_only']) this.regions['A_only'].shaded = true;
            if (this.regions['U_only']) this.regions['U_only'].shaded = true;
            break;
        }
      } else if (this.mode === '3-set') {
        switch (op) {
          case 'intersect': // A ∩ B ∩ C
            if (this.regions['ABC']) this.regions['ABC'].shaded = true;
            break;
          case 'union': // A ∪ B ∪ C
            ['A_only', 'B_only', 'C_only', 'AB_only', 'AC_only', 'BC_only', 'ABC'].forEach(k => {
              if (this.regions[k]) this.regions[k].shaded = true;
            });
            break;
          case 'pairwise': // (A ∩ B) ∪ (A ∩ C) ∪ (B ∩ C)
            ['AB_only', 'AC_only', 'BC_only', 'ABC'].forEach(k => {
              if (this.regions[k]) this.regions[k].shaded = true;
            });
            break;
          case 'diff_A_B': // A \ B
            ['A_only', 'AC_only'].forEach(k => {
              if (this.regions[k]) this.regions[k].shaded = true;
            });
            break;
          case 'diff_B_A': // B \ A
            ['B_only', 'BC_only'].forEach(k => {
              if (this.regions[k]) this.regions[k].shaded = true;
            });
            break;
          case 'sym_diff': // Symmetric difference
            ['A_only', 'B_only', 'C_only'].forEach(k => {
              if (this.regions[k]) this.regions[k].shaded = true;
            });
            break;
          case 'complement_union': // (A ∪ B ∪ C)ᶜ
            if (this.regions['U_only']) this.regions['U_only'].shaded = true;
            break;
        }
      }
    }

    // TikZ LaTeX Code Generation
    generateTikZ(options = {}) {
      const isSnippet = options.snippetOnly || false;
      const scale = options.scale || 1.0;
      const pxToCm = 0.025; // 100px ≈ 2.5cm in TikZ

      // Convert coordinates to cm with 2 decimal places
      const toCmX = (px) => (px * pxToCm).toFixed(2);
      const toCmY = (py) => (-py * pxToCm).toFixed(2); // Invert Y for Cartesian math coordinates
      const toCmR = (r) => (r * pxToCm).toFixed(2);

      let out = '';

      if (!isSnippet) {
        out += '% TikZ Venn Diagram\n';
        out += '% Compile with: pdflatex or lualatex\n';
        out += '\\documentclass[tikz, border=10pt]{standalone}\n';
        out += '\\usepackage{amsmath, amssymb}\n';
        out += '\\usetikzlibrary{shapes, patterns, backgrounds}\n\n';
        out += '\\begin{document}\n';
      }

      out += `\\begin{tikzpicture}[scale=${scale.toFixed(1)}, every node/.style={transform shape}]\n`;

      const u = this.universalSet;
      const hw = (u.width / 2) * pxToCm;
      const hh = (u.height / 2) * pxToCm;
      const uCoords = {
        minX: (-hw).toFixed(2),
        maxX: (hw).toFixed(2),
        minY: (-hh).toFixed(2),
        maxY: (hh).toFixed(2)
      };

      // 1. Draw Universal Set Box (if enabled)
      if (u.enabled) {
        const uLabel = u.label ? `$${u.label}$` : '';
        out += '  % Universal Set Box\n';
        out += `  \\draw[draw=black!80, line width=${u.strokeWidth}pt, fill=white] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
        if (uLabel) {
          let pos = 'below right';
          let lx = uCoords.minX;
          let ly = uCoords.maxY;
          if (u.labelPos === 'top-right') { pos = 'below left'; lx = uCoords.maxX; ly = uCoords.maxY; }
          else if (u.labelPos === 'bottom-left') { pos = 'above right'; lx = uCoords.minX; ly = uCoords.minY; }
          else if (u.labelPos === 'bottom-right') { pos = 'above left'; lx = uCoords.maxX; ly = uCoords.minY; }
          out += `  \\node[${pos}=4pt, font=\\large\\bfseries] at (${lx}, ${ly}) {${uLabel}};\n\n`;
        }
      }

      // Map circles for convenience
      const cA = this.circles.find(c => c.id === 'A') || this.circles[0];
      const cB = this.circles.find(c => c.id === 'B') || this.circles[1];
      const cC = this.circles.find(c => c.id === 'C') || this.circles[2];

      // 2. Shading Logic using standard TikZ scopes & clipping
      out += '  % Shaded Regions\n';

      if (this.mode === '2-set' || this.mode === 'euler') {
        const rU = this.regions['U_only'];
        const rA = this.regions['A_only'];
        const rB = this.regions['B_only'];
        const rAB = this.regions['AB'];

        // U_only: Complement of union
        if (rU && rU.shaded) {
          out += '  % Region: (A u B)^c\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[blue!20, opacity=${rU.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // A only: A \ B
        if (rA && rA.shaded) {
          out += '  % Region: A \\ B\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[blue!40, opacity=${rA.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // B only: B \ A
        if (rB && rB.shaded) {
          out += '  % Region: B \\ A\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[red!40, opacity=${rB.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // Intersection: A ∩ B
        if (rAB && rAB.shaded) {
          out += '  % Region: A ∩ B\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[purple!50, opacity=${rAB.opacity}] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

      } else if (this.mode === '3-set' && cA && cB && cC) {
        const rU = this.regions['U_only'];
        const rA = this.regions['A_only'];
        const rB = this.regions['B_only'];
        const rC = this.regions['C_only'];
        const rAB = this.regions['AB_only'];
        const rAC = this.regions['AC_only'];
        const rBC = this.regions['BC_only'];
        const rABC = this.regions['ABC'];

        // U_only: Outside all 3
        if (rU && rU.shaded) {
          out += '  % Region: (A u B u C)^c\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[gray!25, opacity=${rU.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // A only: A \ (B u C)
        if (rA && rA.shaded) {
          out += '  % Region: A \\ (B ∪ C)\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[blue!40, opacity=${rA.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // B only: B \ (A u C)
        if (rB && rB.shaded) {
          out += '  % Region: B \\ (A ∪ C)\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[red!40, opacity=${rB.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // C only: C \ (A u B)
        if (rC && rC.shaded) {
          out += '  % Region: C \\ (A ∪ B)\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += `    \\fill[green!40, opacity=${rC.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // AB only: (A ∩ B) \ C
        if (rAB && rAB.shaded) {
          out += '  % Region: (A ∩ B) \\ C\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\clip (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[purple!50, opacity=${rAB.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // AC only: (A ∩ C) \ B
        if (rAC && rAC.shaded) {
          out += '  % Region: (A ∩ C) \\ B\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\clip (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += `    \\fill[cyan!50, opacity=${rAC.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // BC only: (B ∩ C) \ A
        if (rBC && rBC.shaded) {
          out += '  % Region: (B ∩ C) \\ A\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\clip (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += `    \\fill[orange!50, opacity=${rBC.opacity}] (${uCoords.minX}, ${uCoords.minY}) rectangle (${uCoords.maxX}, ${uCoords.maxY});\n`;
          out += `    \\fill[white] (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }

        // Triple intersection: A ∩ B ∩ C
        if (rABC && rABC.shaded) {
          out += '  % Region: A ∩ B ∩ C\n';
          out += '  \\begin{scope}\n';
          out += `    \\clip (${toCmX(cA.x)}, ${toCmY(cA.y)}) circle (${toCmR(cA.r)}cm);\n`;
          out += `    \\clip (${toCmX(cB.x)}, ${toCmY(cB.y)}) circle (${toCmR(cB.r)}cm);\n`;
          out += `    \\fill[magenta!60, opacity=${rABC.opacity}] (${toCmX(cC.x)}, ${toCmY(cC.y)}) circle (${toCmR(cC.r)}cm);\n`;
          out += '  \\end{scope}\n';
        }
      }

      out += '\n';

      // 3. Draw Circle Outlines and Labels
      out += '  % Set Circle Outlines & Labels\n';
      this.circles.forEach(c => {
        let style = `line width=${c.strokeWidth}pt`;
        if (c.strokeStyle === 'dashed') style += ', dashed';
        else if (c.strokeStyle === 'dotted') style += ', dotted';

        let col = 'black';
        if (c.id === 'A') col = 'blue!80!black';
        else if (c.id === 'B') col = 'red!80!black';
        else if (c.id === 'C') col = 'green!60!black';

        out += `  \\draw[draw=${col}, ${style}] (${toCmX(c.x)}, ${toCmY(c.y)}) circle (${toCmR(c.r)}cm);\n`;

        // Circle Name label
        if (c.label) {
          const lx = toCmX(c.x + c.labelOffset.x);
          const ly = toCmY(c.y + c.labelOffset.y);
          out += `  \\node[font=\\large\\bfseries] at (${lx}, ${ly}) {$${c.label}$};\n`;
        }
      });

      out += '\n';

      // 4. Draw Region Annotations / Cardinality Labels
      const activeLabels = Object.values(this.regions).filter(r => r.label && r.label.trim().length > 0);
      if (activeLabels.length > 0) {
        out += '  % Region Elements / Cardinalities\n';
        activeLabels.forEach(r => {
          const lx = toCmX(r.labelPos.x);
          const ly = toCmY(r.labelPos.y);
          out += `  \\node[font=\\small] at (${lx}, ${ly}) {$${r.label}$};\n`;
        });
        out += '\n';
      }

      // 5. Draw Custom Text & Element Labels
      if (this.labels && this.labels.length > 0) {
        out += '  % Custom Labels & Element Annotations\n';
        this.labels.forEach(lbl => {
          const lx = toCmX(lbl.x);
          const ly = toCmY(lbl.y);
          let fontOpt = '\\small';
          if (lbl.fontSize >= 18) fontOpt = '\\large';
          else if (lbl.fontSize >= 16) fontOpt = '\\normalsize';
          else if (lbl.fontSize <= 12) fontOpt = '\\footnotesize';

          const textContent = lbl.mathMode ? (lbl.text.startsWith('$') ? lbl.text : `$${lbl.text}$`) : lbl.text;

          if (lbl.showPoint) {
            out += `  \\fill[black] (${lx}, ${ly}) circle (1.5pt);\n`;
            out += `  \\node[right=2pt, font=${fontOpt}] at (${lx}, ${ly}) {${textContent}};\n`;
          } else {
            out += `  \\node[font=${fontOpt}] at (${lx}, ${ly}) {${textContent}};\n`;
          }
        });
        out += '\n';
      }

      out += '\\end{tikzpicture}\n';

      if (!isSnippet) {
        out += '\\end{document}\n';
      }

      return out;
    }

    toJSON() {
      return {
        title: this.title,
        mode: this.mode,
        universalSet: this.universalSet,
        circles: this.circles,
        regions: this.regions,
        labels: this.labels
      };
    }

    fromJSON(data) {
      if (!data) return false;
      this.title = data.title || 'Venn Diagram';
      this.mode = data.mode || '2-set';
      if (data.universalSet) this.universalSet = data.universalSet;
      if (data.circles) this.circles = data.circles;
      if (data.regions) this.regions = data.regions;
      if (data.labels) this.labels = data.labels;
      return true;
    }
  }

  // Classic Presets for Mathematics, Probability, and Logic
  const Presets = {
    '2set-intersect': () => {
      const model = new VennDiagramModel('2-set');
      model.title = 'Intersection of Two Sets (A ∩ B)';
      model.applySetOperation('intersect');
      model.regions['AB'].label = 'A \\cap B';
      return model;
    },

    '2set-union': () => {
      const model = new VennDiagramModel('2-set');
      model.title = 'Union of Two Sets (A ∪ B)';
      model.applySetOperation('union');
      return model;
    },

    '2set-diff-ab': () => {
      const model = new VennDiagramModel('2-set');
      model.title = 'Relative Complement / Difference (A \\ B)';
      model.applySetOperation('diff_A_B');
      model.regions['A_only'].label = 'A \\setminus B';
      return model;
    },

    '2set-symdiff': () => {
      const model = new VennDiagramModel('2-set');
      model.title = 'Symmetric Difference (A Δ B)';
      model.applySetOperation('sym_diff');
      return model;
    },

    '2set-demorgan': () => {
      const model = new VennDiagramModel('2-set');
      model.title = "De Morgan's Law: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ";
      model.applySetOperation('complement_union');
      model.regions['U_only'].label = '(A \\cup B)^c';
      return model;
    },

    '3set-triple-intersect': () => {
      const model = new VennDiagramModel('3-set');
      model.title = 'Triple Set Intersection (A ∩ B ∩ C)';
      model.applySetOperation('intersect');
      model.regions['ABC'].label = 'A \\cap B \\cap C';
      return model;
    },

    '3set-pairwise': () => {
      const model = new VennDiagramModel('3-set');
      model.title = 'Pairwise Intersections';
      model.applySetOperation('pairwise');
      return model;
    },

    '3set-inclusion-exclusion': () => {
      const model = new VennDiagramModel('3-set');
      model.title = 'Inclusion-Exclusion Cardinalities';
      model.regions['A_only'].label = '14';
      model.regions['B_only'].label = '18';
      model.regions['C_only'].label = '12';
      model.regions['AB_only'].label = '6';
      model.regions['AC_only'].label = '5';
      model.regions['BC_only'].label = '7';
      model.regions['ABC'].label = '4';
      model.regions['ABC'].shaded = true;
      model.regions['U_only'].label = '8';
      return model;
    },

    'euler-subset': () => {
      const model = new VennDiagramModel('euler');
      model.title = 'Subset / Proper Inclusion (A ⊂ B)';
      // Circle A inside Circle B
      model.circles[0].x = 10;
      model.circles[0].y = 0;
      model.circles[0].r = 55;
      model.circles[0].labelOffset = { x: 0, y: -25 };

      model.circles[1].x = 0;
      model.circles[1].y = 0;
      model.circles[1].r = 135;
      model.circles[1].labelOffset = { x: 95, y: -95 };

      model.regions['AB'].shaded = true;
      model.regions['AB'].label = 'A \\subset B';
      return model;
    },

    'euler-disjoint': () => {
      const model = new VennDiagramModel('euler');
      model.title = 'Disjoint / Mutually Exclusive Sets (A ∩ B = ∅)';
      model.circles[0].x = -130;
      model.circles[0].y = 0;
      model.circles[0].r = 90;

      model.circles[1].x = 130;
      model.circles[1].y = 0;
      model.circles[1].r = 90;

      model.regions['A_only'].shaded = true;
      model.regions['B_only'].shaded = true;
      model.regions['A_only'].label = 'P(A)';
      model.regions['B_only'].label = 'P(B)';
      return model;
    }
  };

  // High-DPI Interactive Canvas Renderer for Venn Diagrams
  class VennCanvasRenderer {
    constructor(canvas, model) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.model = model;

      // Viewport transform
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;

      // Interactive tool state
      this.toolMode = 'shade'; // 'shade' | 'move' | 'label'
      this.selectedCircleId = (this.model.circles[0] && this.model.circles[0].id) || 'A';
      this.selectedLabelId = null;
      this.dragTarget = null; // { type: 'circle'|'resize'|'label'|'customLabel'|'regionLabel', id, startWx, startWy, ... }

      // Region interaction state
      this.hoveredRegionId = null;
      this.selectedRegionId = null;
      this.isPanning = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.mouseDownPos = { x: 0, y: 0 };
      this.hasMovedSignificantly = false;

      this.initEvents();
      this.fitToScreen();
    }

    setToolMode(mode) {
      this.toolMode = mode;
      this.render();
    }

    selectCircle(circleId) {
      this.selectedCircleId = circleId;
      const c = this.model.getCircle(circleId);
      if (c && window.onVennCircleSelected) {
        window.onVennCircleSelected(c.id, c);
      }
      this.render();
    }

    selectLabel(labelId) {
      this.selectedLabelId = labelId;
      const lbl = this.model.getLabel(labelId);
      if (lbl && window.onVennLabelSelected) {
        window.onVennLabelSelected(lbl.id, lbl);
      }
      this.render();
    }

    getCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;

      if (clientX === undefined && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }

      if (clientX === undefined) {
        clientX = rect.left;
        clientY = rect.top;
      }

      const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    hitTestLabels(worldPos) {
      const hitTolerance = Math.max(16, 20 / this.scale);

      // 1. Check custom labels (reverse order for top-most)
      if (this.model.labels && this.model.labels.length > 0) {
        for (let i = this.model.labels.length - 1; i >= 0; i--) {
          const lbl = this.model.labels[i];
          const dist = Math.hypot(worldPos.x - lbl.x, worldPos.y - lbl.y);
          if (dist <= hitTolerance) {
            return { type: 'customLabel', label: lbl };
          }
        }
      }

      // 2. Check region labels
      if (this.model.regions) {
        for (const r of Object.values(this.model.regions)) {
          if (r.label && r.label.trim().length > 0 && r.labelPos) {
            const dist = Math.hypot(worldPos.x - r.labelPos.x, worldPos.y - r.labelPos.y);
            if (dist <= hitTolerance) {
              return { type: 'regionLabel', region: r };
            }
          }
        }
      }

      return null;
    }

    hitTestCircleHandles(worldPos) {
      const hitTolerance = Math.max(12, 16 / this.scale);

      // 1. Check selected circle's resize handle first (highest priority)
      if (this.selectedCircleId) {
        const selC = this.model.getCircle(this.selectedCircleId);
        if (selC) {
          const resizeX = selC.x + selC.r;
          const resizeY = selC.y;
          if (Math.hypot(worldPos.x - resizeX, worldPos.y - resizeY) <= hitTolerance) {
            return { type: 'resize', circle: selC };
          }

          const labelX = selC.x + selC.labelOffset.x;
          const labelY = selC.y + selC.labelOffset.y;
          if (Math.hypot(worldPos.x - labelX, worldPos.y - labelY) <= hitTolerance) {
            return { type: 'label', circle: selC };
          }

          if (Math.hypot(worldPos.x - selC.x, worldPos.y - selC.y) <= hitTolerance) {
            return { type: 'center', circle: selC };
          }
        }
      }

      // 2. Check all circles: label handles and center anchors
      for (let i = this.model.circles.length - 1; i >= 0; i--) {
        const c = this.model.circles[i];

        const labelX = c.x + c.labelOffset.x;
        const labelY = c.y + c.labelOffset.y;
        if (Math.hypot(worldPos.x - labelX, worldPos.y - labelY) <= hitTolerance) {
          return { type: 'label', circle: c };
        }

        if (Math.hypot(worldPos.x - c.x, worldPos.y - c.y) <= hitTolerance) {
          return { type: 'center', circle: c };
        }
      }

      // 3. Check circle borders
      for (let i = this.model.circles.length - 1; i >= 0; i--) {
        const c = this.model.circles[i];
        const distToCenter = Math.hypot(worldPos.x - c.x, worldPos.y - c.y);
        if (Math.abs(distToCenter - c.r) <= (10 / this.scale)) {
          return { type: 'border', circle: c };
        }
      }

      // 4. In 'move' mode, clicking inside any circle grabs and moves it
      if (this.toolMode === 'move') {
        for (let i = this.model.circles.length - 1; i >= 0; i--) {
          const c = this.model.circles[i];
          if (Math.hypot(worldPos.x - c.x, worldPos.y - c.y) <= c.r) {
            return { type: 'body', circle: c };
          }
        }
      }

      return null;
    }

    initEvents() {
      const c = this.canvas;

      const handlePointerDown = (e) => {
        const coords = this.getCanvasCoords(e);
        this.lastMouseX = coords.x;
        this.lastMouseY = coords.y;
        this.mouseDownPos = { x: coords.x, y: coords.y };
        this.hasMovedSignificantly = false;

        if (e.button === 1 || e.button === 2 || e.shiftKey) {
          this.isPanning = true;
          e.preventDefault();
          return;
        }

        const worldPos = this.screenToWorld(coords.x, coords.y);

        // 1. Check custom labels and region labels first
        const hitLbl = this.hitTestLabels(worldPos);
        if (hitLbl) {
          if (hitLbl.type === 'customLabel') {
            this.selectedLabelId = hitLbl.label.id;
            if (window.onVennLabelSelected) {
              window.onVennLabelSelected(hitLbl.label.id, hitLbl.label);
            }
            this.dragTarget = {
              type: 'customLabel',
              id: hitLbl.label.id,
              startWx: worldPos.x,
              startWy: worldPos.y,
              origX: hitLbl.label.x,
              origY: hitLbl.label.y
            };
            this.render();
            return;
          } else if (hitLbl.type === 'regionLabel') {
            this.selectedRegionId = hitLbl.region.id;
            if (window.onVennRegionSelected) {
              window.onVennRegionSelected(hitLbl.region.id, hitLbl.region);
            }
            this.dragTarget = {
              type: 'regionLabel',
              id: hitLbl.region.id,
              startWx: worldPos.x,
              startWy: worldPos.y,
              origX: hitLbl.region.labelPos.x,
              origY: hitLbl.region.labelPos.y
            };
            this.render();
            return;
          }
        }

        // 2. Check circle handles & borders
        const hit = this.hitTestCircleHandles(worldPos);
        if (hit) {
          const circle = hit.circle;
          this.selectedCircleId = circle.id;
          if (window.onVennCircleSelected) {
            window.onVennCircleSelected(circle.id, circle);
          }

          if (hit.type === 'resize') {
            this.dragTarget = {
              type: 'resize',
              id: circle.id,
              startWx: worldPos.x,
              startWy: worldPos.y,
              origR: circle.r
            };
          } else if (hit.type === 'label') {
            this.dragTarget = {
              type: 'label',
              id: circle.id,
              startWx: worldPos.x,
              startWy: worldPos.y,
              origOffX: circle.labelOffset.x,
              origOffY: circle.labelOffset.y
            };
          } else {
            // center, border, or body
            this.dragTarget = {
              type: 'circle',
              id: circle.id,
              startWx: worldPos.x,
              startWy: worldPos.y,
              origX: circle.x,
              origY: circle.y
            };
          }
          this.render();
          return;
        }

        // 3. If in 'label' tool mode, clicking places a new label at clicked coordinates!
        if (this.toolMode === 'label') {
          const newLbl = this.model.addLabel({
            x: Math.round(worldPos.x),
            y: Math.round(worldPos.y),
            text: 'x',
            mathMode: true
          });
          this.selectedLabelId = newLbl.id;
          if (window.onVennLabelAdded) {
            window.onVennLabelAdded(newLbl);
          }
          this.dragTarget = {
            type: 'customLabel',
            id: newLbl.id,
            startWx: worldPos.x,
            startWy: worldPos.y,
            origX: newLbl.x,
            origY: newLbl.y
          };
          this.render();
          if (window.updateTikZDisplay) window.updateTikZDisplay();
          if (window.updateUI) window.updateUI();
          return;
        }

        // 4. If in shade tool mode, check regions
        if (this.toolMode === 'shade') {
          const regionId = this.model.getRegionAtPoint(worldPos.x, worldPos.y);
          if (regionId) {
            const reg = this.model.regions[regionId];
            if (reg) {
              reg.shaded = !reg.shaded;
              this.selectedRegionId = regionId;
              if (window.onVennRegionSelected) {
                window.onVennRegionSelected(regionId, reg);
              }
              this.render();
              if (window.updateTikZDisplay) window.updateTikZDisplay();
              return;
            }
          }
        }

        // Empty canvas space -> start pan
        this.isPanning = true;
      };

      const handlePointerMove = (e) => {
        const coords = this.getCanvasCoords(e);
        const worldPos = this.screenToWorld(coords.x, coords.y);

        // Handle Active Dragging
        if (this.dragTarget) {
          if (this.dragTarget.type === 'customLabel') {
            const lbl = this.model.getLabel(this.dragTarget.id);
            if (lbl) {
              lbl.x = Math.round(this.dragTarget.origX + (worldPos.x - this.dragTarget.startWx));
              lbl.y = Math.round(this.dragTarget.origY + (worldPos.y - this.dragTarget.startWy));
              if (window.onVennLabelMoved) window.onVennLabelMoved(lbl);
              this.render();
            }
            return;
          } else if (this.dragTarget.type === 'regionLabel') {
            const reg = this.model.regions[this.dragTarget.id];
            if (reg && reg.labelPos) {
              reg.labelPos.x = Math.round(this.dragTarget.origX + (worldPos.x - this.dragTarget.startWx));
              reg.labelPos.y = Math.round(this.dragTarget.origY + (worldPos.y - this.dragTarget.startWy));
              if (window.onVennRegionLabelMoved) window.onVennRegionLabelMoved(reg);
              this.render();
            }
            return;
          }

          const circle = this.model.getCircle(this.dragTarget.id);
          if (circle) {
            if (this.dragTarget.type === 'circle') {
              circle.x = Math.round(this.dragTarget.origX + (worldPos.x - this.dragTarget.startWx));
              circle.y = Math.round(this.dragTarget.origY + (worldPos.y - this.dragTarget.startWy));
              this.model.updateAutoLabelPositions();
              if (window.onVennCircleMoved) window.onVennCircleMoved(circle);
              this.render();
            } else if (this.dragTarget.type === 'resize') {
              const newRadius = Math.hypot(worldPos.x - circle.x, worldPos.y - circle.y);
              circle.r = Math.max(30, Math.min(240, Math.round(newRadius)));
              this.model.updateAutoLabelPositions();
              if (window.onVennCircleMoved) window.onVennCircleMoved(circle);
              this.render();
            } else if (this.dragTarget.type === 'label') {
              circle.labelOffset.x = Math.round(worldPos.x - circle.x);
              circle.labelOffset.y = Math.round(worldPos.y - circle.y);
              if (window.onVennCircleMoved) window.onVennCircleMoved(circle);
              this.render();
            }
          }
          return;
        }

        if (this.isPanning) {
          const dx = coords.x - this.lastMouseX;
          const dy = coords.y - this.lastMouseY;
          if (Math.hypot(coords.x - this.mouseDownPos.x, coords.y - this.mouseDownPos.y) > 4) {
            this.hasMovedSignificantly = true;
          }
          this.panX += dx;
          this.panY += dy;
          this.lastMouseX = coords.x;
          this.lastMouseY = coords.y;
          this.render();
          return;
        }

        // Handle Hover States and Cursor Changes
        const hitLabel = this.hitTestLabels(worldPos);
        if (hitLabel) {
          c.style.cursor = 'move';
          return;
        }

        const hit = this.hitTestCircleHandles(worldPos);
        if (hit) {
          if (hit.type === 'resize') c.style.cursor = 'ew-resize';
          else if (hit.type === 'label') c.style.cursor = 'move';
          else if (hit.type === 'center' || hit.type === 'border' || hit.type === 'body') c.style.cursor = 'grab';
          return;
        }

        if (this.toolMode === 'label') {
          c.style.cursor = 'crosshair';
          return;
        }

        if (this.toolMode === 'shade') {
          const regionId = this.model.getRegionAtPoint(worldPos.x, worldPos.y);
          const prevHover = this.hoveredRegionId;
          this.hoveredRegionId = regionId;

          if (prevHover !== this.hoveredRegionId) {
            c.style.cursor = regionId ? 'pointer' : 'default';
            if (window.onVennRegionHovered) {
              window.onVennRegionHovered(regionId, regionId ? this.model.regions[regionId] : null);
            }
            this.render();
          }
        } else {
          c.style.cursor = 'default';
        }
      };

      const handleDblClick = (e) => {
        const coords = this.getCanvasCoords(e);
        const worldPos = this.screenToWorld(coords.x, coords.y);
        const hitLbl = this.hitTestLabels(worldPos);

        if (hitLbl) {
          if (hitLbl.type === 'customLabel') {
            const val = prompt('Edit Label Text (LaTeX math supported):', hitLbl.label.text);
            if (val !== null && val.trim().length > 0) {
              hitLbl.label.text = val.trim();
              this.render();
              if (window.updateUI) window.updateUI();
              if (window.updateTikZDisplay) window.updateTikZDisplay();
            }
          } else if (hitLbl.type === 'regionLabel') {
            const val = prompt('Edit Region Cardinality / Label:', hitLbl.region.label || '');
            if (val !== null) {
              hitLbl.region.label = val.trim();
              this.render();
              if (window.updateUI) window.updateUI();
              if (window.updateTikZDisplay) window.updateTikZDisplay();
            }
          }
        } else {
          const val = prompt('Place a new label at this location (e.g. x, 15, \\bullet e_1):', 'x');
          if (val !== null && val.trim().length > 0) {
            const newLbl = this.model.addLabel({
              x: Math.round(worldPos.x),
              y: Math.round(worldPos.y),
              text: val.trim(),
              mathMode: true
            });
            this.selectedLabelId = newLbl.id;
            this.render();
            if (window.updateUI) window.updateUI();
            if (window.updateTikZDisplay) window.updateTikZDisplay();
          }
        }
      };

      const handlePointerUp = (e) => {
        if (this.dragTarget) {
          this.dragTarget = null;
          if (window.updateTikZDisplay) window.updateTikZDisplay();
          if (window.updateUI) window.updateUI();
        }
        this.isPanning = false;
      };

      c.addEventListener('mousedown', handlePointerDown);
      c.addEventListener('mousemove', handlePointerMove);
      c.addEventListener('dblclick', handleDblClick);
      window.addEventListener('mouseup', handlePointerUp);

      c.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) handlePointerDown(e);
      }, { passive: false });

      c.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          handlePointerMove(e);
        }
      }, { passive: false });

      c.addEventListener('touchend', handlePointerUp);
      c.addEventListener('contextmenu', (e) => e.preventDefault());

      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const coords = this.getCanvasCoords(e);
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        const newScale = Math.min(Math.max(0.4, this.scale * zoomFactor), 3.0);

        this.panX = coords.x - (coords.x - this.panX) * (newScale / this.scale);
        this.panY = coords.y - (coords.y - this.panY) * (newScale / this.scale);
        this.scale = newScale;

        this.render();
      }, { passive: false });
    }

    screenToWorld(sx, sy) {
      return {
        x: (sx - this.panX) / this.scale,
        y: (sy - this.panY) / this.scale
      };
    }

    worldToScreen(wx, wy) {
      return {
        x: wx * this.scale + this.panX,
        y: wy * this.scale + this.panY
      };
    }

    fitToScreen() {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      const u = this.model.universalSet;

      const scaleX = (cw - 80) / u.width;
      const scaleY = (ch - 80) / u.height;
      this.scale = Math.min(Math.max(0.5, Math.min(scaleX, scaleY)), 1.35);

      this.panX = cw / 2;
      this.panY = ch / 2;

      this.render();
    }

    render() {
      const ctx = this.ctx;
      const cw = this.canvas.width;
      const ch = this.canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      // 1. Subtle background grid
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, cw, ch);

      const gridSize = 25 * this.scale;
      const offsetX = this.panX % gridSize;
      const offsetY = this.panY % gridSize;
      ctx.fillStyle = '#e2e8f0';
      for (let x = offsetX; x < cw; x += gridSize) {
        for (let y = offsetY; y < ch; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 2. Transformed world space
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      const u = this.model.universalSet;
      const halfW = u.width / 2;
      const halfH = u.height / 2;

      // Draw Universal Set Background
      if (u.enabled) {
        ctx.save();
        ctx.fillStyle = u.fillColor || '#ffffff';
        ctx.strokeStyle = u.strokeColor || '#334155';
        ctx.lineWidth = u.strokeWidth || 2;
        ctx.beginPath();
        ctx.rect(-halfW, -halfH, u.width, u.height);
        ctx.fill();
        ctx.stroke();

        // Universal Set Label
        if (u.label) {
          ctx.font = 'bold 18px Inter, sans-serif';
          ctx.fillStyle = '#1e293b';
          let lx = -halfW + 16;
          let ly = -halfH + 26;
          if (u.labelPos === 'top-right') { lx = halfW - 24; ly = -halfH + 26; }
          else if (u.labelPos === 'bottom-left') { lx = -halfW + 16; ly = halfH - 16; }
          else if (u.labelPos === 'bottom-right') { lx = halfW - 24; ly = halfH - 16; }
          ctx.fillText(u.label, lx, ly);
        }
        ctx.restore();
      }

      // Render shaded regions using clip paths
      this.renderShadedRegions(ctx);

      // Render Circle Outlines
      this.renderCircleOutlines(ctx);

      // Render Region Labels / Cardinalities
      this.renderRegionLabels(ctx);

      // Render Custom Text & Element Labels
      this.renderCustomLabels(ctx);

      ctx.restore();
    }

    renderShadedRegions(ctx) {
      const u = this.model.universalSet;
      const halfW = u.width / 2;
      const halfH = u.height / 2;

      const cA = this.model.circles.find(c => c.id === 'A') || this.model.circles[0];
      const cB = this.model.circles.find(c => c.id === 'B') || this.model.circles[1];
      const cC = this.model.circles.find(c => c.id === 'C') || this.model.circles[2];

      const drawRegionFill = (regionId, fillFn) => {
        const r = this.model.regions[regionId];
        const isHovered = (this.hoveredRegionId === regionId);
        const isSelected = (this.selectedRegionId === regionId);

        if (!r || (!r.shaded && !isHovered && !isSelected)) return;

        ctx.save();
        fillFn(ctx);

        if (r.shaded) {
          ctx.fillStyle = r.fillColor || '#3b82f6';
          ctx.globalAlpha = r.opacity || 0.45;
          ctx.fill();
        }

        if (isHovered || isSelected) {
          ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(59, 130, 246, 0.15)';
          ctx.globalAlpha = 1.0;
          ctx.fill();
        }

        ctx.restore();
      };

      if (this.model.mode === '2-set' || this.model.mode === 'euler') {
        if (!cA || !cB) return;

        // U_only: Universe outside both A and B
        drawRegionFill('U_only', (c) => {
          c.beginPath();
          c.rect(-halfW, -halfH, u.width, u.height);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true); // Counter-clockwise hole
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
        });

        // A_only: Inside A, outside B
        drawRegionFill('A_only', (c) => {
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, false);
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
        });

        // B_only: Inside B, outside A
        drawRegionFill('B_only', (c) => {
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, false);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true);
        });

        // AB: Intersection
        drawRegionFill('AB', (c) => {
          c.save();
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2);
          c.fill();
          c.restore();
        });

      } else if (this.model.mode === '3-set' && cA && cB && cC) {
        // U_only
        drawRegionFill('U_only', (c) => {
          c.beginPath();
          c.rect(-halfW, -halfH, u.width, u.height);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true);
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, true);
        });

        // A_only: Inside A, outside B and C
        drawRegionFill('A_only', (c) => {
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, false);
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, true);
        });

        // B_only
        drawRegionFill('B_only', (c) => {
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, false);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true);
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, true);
        });

        // C_only
        drawRegionFill('C_only', (c) => {
          c.beginPath();
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, false);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true);
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
        });

        // AB_only: Inside A and B, outside C
        drawRegionFill('AB_only', (c) => {
          c.save();
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, false);
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, true);
          c.fill();
          c.restore();
        });

        // AC_only: Inside A and C, outside B
        drawRegionFill('AC_only', (c) => {
          c.save();
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, false);
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2, true);
          c.fill();
          c.restore();
        });

        // BC_only: Inside B and C, outside A
        drawRegionFill('BC_only', (c) => {
          c.save();
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2, false);
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2, true);
          c.fill();
          c.restore();
        });

        // ABC: Triple intersection
        drawRegionFill('ABC', (c) => {
          c.save();
          c.beginPath();
          c.arc(cA.x, cA.y, cA.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cB.x, cB.y, cB.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.arc(cC.x, cC.y, cC.r, 0, Math.PI * 2);
          c.fill();
          c.restore();
        });
      }
    }

    renderCircleOutlines(ctx) {
      this.model.circles.forEach(c => {
        ctx.save();
        ctx.strokeStyle = c.strokeColor || '#1e293b';
        ctx.lineWidth = c.strokeWidth || 2.5;

        if (c.strokeStyle === 'dashed') ctx.setLineDash([6, 4]);
        else if (c.strokeStyle === 'dotted') ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.stroke();

        // Circle Label
        if (c.label) {
          const lx = c.x + c.labelOffset.x;
          const ly = c.y + c.labelOffset.y;
          ctx.setLineDash([]);
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.fillStyle = c.strokeColor || '#1e293b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.label, lx, ly);
        }

        // Selection Handles and Transform Gizmo
        if (this.selectedCircleId === c.id) {
          // 1. Dashed Selection Halo
          ctx.save();
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 1.75;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // 2. Center Move Anchor Handle
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 3. Border Resize Handle
          ctx.save();
          ctx.fillStyle = '#4f46e5';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x + c.r, c.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 4. Line to Label
          if (c.labelOffset && (c.labelOffset.x !== 0 || c.labelOffset.y !== 0)) {
            ctx.save();
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x + c.labelOffset.x, c.y + c.labelOffset.y);
            ctx.stroke();
            ctx.restore();
          }

          // 5. Live Coordinate Tag Badge
          ctx.save();
          const tagText = `${c.label || c.id} (X: ${c.x}, Y: ${c.y}, r: ${c.r}px)`;
          ctx.font = '600 11px Inter, sans-serif';
          const tagW = ctx.measureText(tagText).width + 14;
          const tagY = c.y + c.r + 18;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(c.x - tagW / 2, tagY - 14, tagW, 18, 4);
            ctx.fill();
          } else {
            ctx.fillRect(c.x - tagW / 2, tagY - 14, tagW, 18);
          }
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, c.x, tagY - 5);
          ctx.restore();
        }

        ctx.restore();
      });
    }

    renderRegionLabels(ctx) {
      Object.values(this.model.regions).forEach(r => {
        if (!r.label || r.label.trim().length === 0) return;

        ctx.save();
        const isSelected = (this.selectedRegionId === r.id);
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw pill background behind text for readability
        let text = r.label;
        if (text.startsWith('$') && text.endsWith('$') && text.length > 2) {
          text = text.slice(1, -1);
        }
        const textW = Math.max(26, text.length * 8.5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fillRect(r.labelPos.x - textW / 2, r.labelPos.y - 10, textW, 20);
        ctx.strokeStyle = isSelected ? '#4f46e5' : '#cbd5e1';
        ctx.lineWidth = isSelected ? 1.75 : 1;
        if (isSelected) ctx.setLineDash([3, 2]);
        ctx.strokeRect(r.labelPos.x - textW / 2, r.labelPos.y - 10, textW, 20);

        ctx.setLineDash([]);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, r.labelPos.x, r.labelPos.y);
        ctx.restore();
      });
    }

    renderCustomLabels(ctx) {
      if (!this.model.labels || this.model.labels.length === 0) return;

      this.model.labels.forEach(lbl => {
        ctx.save();
        const isSelected = (this.selectedLabelId === lbl.id);
        const fontSize = lbl.fontSize || 14;
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

        const text = lbl.text || '';
        let displayText = text;
        if (displayText.startsWith('$') && displayText.endsWith('$') && displayText.length > 2) {
          displayText = displayText.slice(1, -1);
        }

        const metrics = ctx.measureText(displayText);
        const textW = Math.max(16, metrics.width);
        const textH = fontSize;

        let posX = lbl.x;
        let posY = lbl.y;

        if (lbl.showPoint) {
          // Draw solid bullet dot point
          ctx.beginPath();
          ctx.arc(lbl.x, lbl.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = lbl.color || '#0f172a';
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          posX = lbl.x + 8;
          posY = lbl.y;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        }

        // Draw pill background behind text for maximum legibility
        const bgPadX = 6;
        const bgPadY = 4;
        const bgX = lbl.showPoint ? posX - 2 : posX - textW / 2 - bgPadX;
        const bgY = posY - textH / 2 - bgPadY / 2;
        const bgW = textW + bgPadX * 2;
        const bgH = textH + bgPadY;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(bgX, bgY, bgW, bgH, 4);
          ctx.fill();
        } else {
          ctx.fillRect(bgX, bgY, bgW, bgH);
        }

        ctx.fillStyle = lbl.color || '#0f172a';
        ctx.fillText(displayText, posX, posY);

        // If selected, draw active highlight box
        if (isSelected) {
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          const selPad = 4;
          const boxX = (lbl.showPoint ? lbl.x - 5 : bgX) - selPad;
          const boxY = bgY - selPad;
          const boxW = (lbl.showPoint ? (posX + textW - lbl.x + 8) : bgW) + selPad * 2;
          const boxH = bgH + selPad * 2;

          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 6);
            ctx.stroke();
          } else {
            ctx.strokeRect(boxX, boxY, boxW, boxH);
          }

          // Move indicator dot
          ctx.setLineDash([]);
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(boxX + boxW, boxY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    exportSVG() {
      const u = this.model.universalSet;
      const w = u.width + 40;
      const h = u.height + 40;
      const halfW = u.width / 2;
      const halfH = u.height / 2;

      let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${-w/2} ${-h/2} ${w} ${h}">\n`;
      svg += `  <style>\n`;
      svg += `    text { font-family: Inter, system-ui, sans-serif; }\n`;
      svg += `    .universe { fill: #ffffff; stroke: #334155; stroke-width: 2; }\n`;
      svg += `  </style>\n\n`;

      if (u.enabled) {
        svg += `  <rect class="universe" x="${-halfW}" y="${-halfH}" width="${u.width}" height="${u.height}" />\n`;
        svg += `  <text x="${-halfW + 16}" y="${-halfH + 26}" font-size="18" font-weight="bold" fill="#1e293b">${u.label}</text>\n\n`;
      }

      this.model.circles.forEach(c => {
        svg += `  <circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="none" stroke="${c.strokeColor}" stroke-width="${c.strokeWidth}" />\n`;
        if (c.label) {
          svg += `  <text x="${c.x + c.labelOffset.x}" y="${c.y + c.labelOffset.y}" font-size="16" font-weight="bold" fill="${c.strokeColor}" text-anchor="middle" dominant-baseline="middle">${c.label}</text>\n`;
        }
      });

      // Region Cardinality labels
      Object.values(this.model.regions).forEach(r => {
        if (r.label && r.label.trim().length > 0 && r.labelPos) {
          svg += `  <text x="${r.labelPos.x}" y="${r.labelPos.y}" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${r.label}</text>\n`;
        }
      });

      // Custom element labels
      if (this.model.labels && this.model.labels.length > 0) {
        this.model.labels.forEach(lbl => {
          if (lbl.showPoint) {
            svg += `  <circle cx="${lbl.x}" cy="${lbl.y}" r="3" fill="${lbl.color || '#0f172a'}" />\n`;
            svg += `  <text x="${lbl.x + 8}" y="${lbl.y}" font-size="${lbl.fontSize || 14}" font-weight="600" fill="${lbl.color || '#0f172a'}" dominant-baseline="middle">${lbl.text}</text>\n`;
          } else {
            svg += `  <text x="${lbl.x}" y="${lbl.y}" font-size="${lbl.fontSize || 14}" font-weight="600" fill="${lbl.color || '#0f172a'}" text-anchor="middle" dominant-baseline="middle">${lbl.text}</text>\n`;
          }
        });
      }

      svg += `</svg>`;
      return svg;
    }
  }

  // Expose to window
  window.VennDiagramModel = VennDiagramModel;
  window.VennCanvasRenderer = VennCanvasRenderer;
  window.VennPresets = Presets;

})(window);
