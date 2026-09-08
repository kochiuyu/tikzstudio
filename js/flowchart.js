/**
 * TikZ Studio - Flowchart & State Machine Engine
 * Interactive Flowcharts, Automata, and State Transition Diagrams with TikZ LaTeX generation
 */

(function (window) {
  'use strict';

  let idCounter = 1;
  function uniqueId(prefix = 'node') {
    return prefix + '_' + (idCounter++);
  }

  /**
   * Flowchart & State Machine Data Model
   */
  class FlowchartModel {
    constructor() {
      this.title = 'Flowchart & State Diagram';
      this.diagramType = 'flowchart'; // 'flowchart' | 'fsm' | 'hybrid'
      this.nodes = {}; // id -> Node
      this.edges = {}; // id -> Edge
      this.gridSnap = 20; // grid snap size in px
      this.enableSnap = true;
    }

    createNode(data = {}) {
      const id = data.id || uniqueId('node');
      const shape = data.shape || (this.diagramType === 'fsm' ? 'state' : 'process');

      // Default dimensions and styling based on shape
      let width = data.width;
      let height = data.height;
      if (!width || !height) {
        if (shape === 'state' || shape === 'accepting' || shape === 'initial') {
          width = 54;
          height = 54;
        } else if (shape === 'decision') {
          width = 110;
          height = 70;
        } else if (shape === 'terminal') {
          width = 110;
          height = 46;
        } else if (shape === 'io') {
          width = 110;
          height = 48;
        } else {
          width = 110;
          height = 50;
        }
      }

      const node = {
        id: id,
        text: data.text !== undefined ? data.text : (shape === 'decision' ? 'Condition?' : (shape === 'state' ? 'q_0' : 'Process')),
        shape: shape, // 'process', 'decision', 'terminal', 'io', 'subroutine', 'cylinder', 'state', 'accepting', 'initial'
        x: data.x !== undefined ? data.x : 0,
        y: data.y !== undefined ? data.y : 0,
        width: width,
        height: height,
        fillColor: data.fillColor || (shape === 'state' || shape === 'accepting' || shape === 'initial' ? '#eff6ff' : (shape === 'decision' ? '#fef3c7' : (shape === 'terminal' ? '#e0e7ff' : '#ffffff'))),
        borderColor: data.borderColor || (shape === 'state' || shape === 'accepting' || shape === 'initial' ? '#2563eb' : (shape === 'decision' ? '#d97706' : (shape === 'terminal' ? '#4f46e5' : '#334155'))),
        textColor: data.textColor || '#0f172a',
        borderWidth: data.borderWidth || (shape === 'accepting' ? 2 : 2),
        borderStyle: data.borderStyle || 'solid', // 'solid', 'dashed', 'dotted'
        isAccepting: !!data.isAccepting || shape === 'accepting',
        isInitial: !!data.isInitial || shape === 'initial'
      };

      this.nodes[id] = node;
      return node;
    }

    getNode(id) {
      return this.nodes[id] || null;
    }

    updateNode(id, props = {}) {
      const node = this.nodes[id];
      if (!node) return null;
      Object.assign(node, props);
      if (props.shape === 'accepting') node.isAccepting = true;
      if (props.shape === 'initial') node.isInitial = true;
      return node;
    }

    deleteNode(id) {
      if (!this.nodes[id]) return false;
      delete this.nodes[id];

      // Remove connected edges
      Object.keys(this.edges).forEach(edgeId => {
        const edge = this.edges[edgeId];
        if (edge.from === id || edge.to === id) {
          delete this.edges[edgeId];
        }
      });
      return true;
    }

    createEdge(data = {}) {
      if (!data.from || !data.to || !this.nodes[data.from] || !this.nodes[data.to]) {
        return null;
      }

      const id = data.id || uniqueId('edge');
      const isSelfLoop = (data.from === data.to);

      let defaultRouting = 'straight';
      if (isSelfLoop) {
        defaultRouting = 'loop-above';
      } else if (this.diagramType === 'fsm') {
        // Check if there's already an edge between these two in either direction
        const hasReverse = Object.values(this.edges).some(e => e.from === data.to && e.to === data.from);
        if (hasReverse) {
          defaultRouting = 'bend-left';
        }
      } else {
        defaultRouting = data.routing || 'orthogonal';
      }

      const edge = {
        id: id,
        from: data.from,
        to: data.to,
        fromAnchor: data.fromAnchor || 'auto', // 'auto', 'north', 'south', 'east', 'west'
        toAnchor: data.toAnchor || 'auto',     // 'auto', 'north', 'south', 'east', 'west'
        label: data.label !== undefined ? data.label : '',
        labelPos: data.labelPos || 'auto', // 'auto', 'above', 'below', 'left', 'right', 'near-start', 'near-end'
        routing: data.routing || defaultRouting, // 'straight', 'orthogonal', 'orthogonal-vert', 'orthogonal-horiz', 'feedback-left', 'feedback-right', 'bend-left', 'bend-right', 'loop-above', 'loop-below', 'loop-left', 'loop-right'
        arrow: data.arrow || 'forward', // 'forward', 'bidirectional', 'none', 'backward'
        color: data.color || '#334155',
        lineWidth: data.lineWidth || 2,
        lineStyle: data.lineStyle || 'solid' // 'solid', 'dashed', 'dotted'
      };

      this.edges[id] = edge;
      return edge;
    }

    getEdge(id) {
      return this.edges[id] || null;
    }

    updateEdge(id, props = {}) {
      const edge = this.edges[id];
      if (!edge) return null;
      Object.assign(edge, props);
      return edge;
    }

    deleteEdge(id) {
      if (!this.edges[id]) return false;
      delete this.edges[id];
      return true;
    }

    getBounds() {
      const nodes = Object.values(this.nodes);
      if (nodes.length === 0) {
        return { minX: -200, minY: -150, maxX: 200, maxY: 150, width: 400, height: 300, centerX: 0, centerY: 0 };
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        const halfW = n.width / 2;
        const halfH = n.height / 2;
        minX = Math.min(minX, n.x - halfW - 20);
        minY = Math.min(minY, n.y - halfH - 20);
        maxX = Math.max(maxX, n.x + halfW + 20);
        maxY = Math.max(maxY, n.y + halfH + 20);
      });

      return {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(100, maxX - minX),
        height: Math.max(100, maxY - minY),
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
    }

    toJSON() {
      return {
        title: this.title,
        diagramType: this.diagramType,
        nodes: this.nodes,
        edges: this.edges,
        enableSnap: this.enableSnap,
        gridSnap: this.gridSnap
      };
    }

    fromJSON(data) {
      if (!data || !data.nodes) return false;
      this.title = data.title || 'Flowchart & State Diagram';
      this.diagramType = data.diagramType || 'flowchart';
      this.nodes = data.nodes || {};
      this.edges = data.edges || {};
      this.enableSnap = data.enableSnap !== undefined ? data.enableSnap : true;
      this.gridSnap = data.gridSnap || 20;
      return true;
    }

    /**
     * Generate standard LaTeX TikZ Code
     */
    generateTikZ(options = {}) {
      const isStandalone = !!options.standalone;
      const nodesList = Object.values(this.nodes);
      const edgesList = Object.values(this.edges);

      if (nodesList.length === 0) {
        return '% Empty flowchart/state diagram\n\\begin{tikzpicture}\n\\end{tikzpicture}';
      }

      // Compute coordinate mapping: convert canvas px to cm (scale factor ~ 0.024, i.e., 100px ≈ 2.4cm)
      const scaleFactor = 0.025;

      // Find center to normalize coordinates so diagram centers near origin
      const bounds = this.getBounds();
      const originX = bounds.centerX;
      const originY = bounds.centerY;

      // Clean node identifier for LaTeX (alphanumeric only)
      const cleanNodeId = (id) => {
        return id.replace(/[^a-zA-Z0-9]/g, '');
      };

      // LaTeX color converter helper
      const hexToTikzColor = (hex, defaultName = 'black') => {
        if (!hex) return defaultName;
        const h = hex.toLowerCase();
        if (h === '#2563eb' || h === '#3b82f6') return 'blue!80!black';
        if (h === '#eff6ff' || h === '#dbeafe') return 'blue!10';
        if (h === '#4f46e5' || h === '#6366f1') return 'indigo!80!black';
        if (h === '#e0e7ff') return 'indigo!10';
        if (h === '#10b981' || h === '#16a34a') return 'teal!75!black';
        if (h === '#f0fdf4' || h === '#dcfce7') return 'green!10';
        if (h === '#f59e0b' || h === '#d97706') return 'orange!85!black';
        if (h === '#fef3c7') return 'orange!12';
        if (h === '#ef4444' || h === '#dc2626') return 'red!80!black';
        if (h === '#fee2e2') return 'red!10';
        if (h === '#8b5cf6' || h === '#7c3aed') return 'violet!80!black';
        if (h === '#ffffff') return 'white';
        if (h === '#0f172a' || h === '#334155' || h === '#1e293b') return 'black!85';
        return `black!75`;
      };

      let out = '';

      if (isStandalone) {
        out += '% Standalone Document for Flowcharts and State Machines\n';
        out += '\\documentclass[border=10pt]{standalone}\n';
        out += '\\usepackage{tikz}\n';
        out += '\\usetikzlibrary{shapes.geometric, arrows.meta, positioning, automata, backgrounds, fit}\n\n';
        out += '\\begin{document}\n\n';
      }

      out += '\\begin{tikzpicture}[\n';
      out += '  >=Stealth,\n';
      out += '  font=\\sffamily\\small,\n';
      out += '  node distance=2.5cm,\n';
      out += '  thick,\n';

      // Define reusable TikZ styles
      out += '  % Flowchart & State Shapes\n';
      out += '  flow_terminal/.style={rectangle, rounded corners=14pt, minimum width=2.6cm, minimum height=0.9cm, text centered, draw=indigo!80!black, fill=indigo!10, thick},\n';
      out += '  flow_process/.style={rectangle, rounded corners=2pt, minimum width=2.8cm, minimum height=1cm, text centered, draw=slate!80!black, fill=white, thick},\n';
      out += '  flow_decision/.style={diamond, aspect=2, minimum width=2.4cm, minimum height=1.2cm, text centered, inner sep=1pt, draw=orange!85!black, fill=orange!12, thick},\n';
      out += '  flow_io/.style={trapezium, trapezium left angle=70, trapezium right angle=110, minimum width=2.6cm, minimum height=0.9cm, text centered, draw=teal!80!black, fill=teal!10, thick},\n';
      out += '  flow_subroutine/.style={rectangle, double, double distance=2pt, minimum width=2.8cm, minimum height=1cm, text centered, draw=slate!80!black, fill=white, thick},\n';
      out += '  flow_cylinder/.style={cylinder, shape border rotate=90, aspect=0.25, minimum width=2cm, minimum height=1.3cm, text centered, draw=slate!80!black, fill=slate!10, thick},\n';
      out += '  state_node/.style={circle, minimum size=38pt, text centered, draw=blue!80!black, fill=blue!10, thick},\n';
      out += '  accepting_node/.style={circle, minimum size=38pt, text centered, draw=blue!80!black, fill=blue!10, thick, double, double distance=2pt},\n';
      out += '  initial_node/.style={circle, minimum size=38pt, text centered, draw=blue!80!black, fill=blue!10, thick}\n';
      out += ']\n\n';

      // 1. Draw Nodes
      out += '  % Nodes\n';
      nodesList.forEach(node => {
        const cid = cleanNodeId(node.id);
        const tx = ((node.x - originX) * scaleFactor).toFixed(2);
        const ty = (-(node.y - originY) * scaleFactor).toFixed(2); // Invert Y for TikZ

        let styleName = 'flow_process';
        if (node.shape === 'terminal') styleName = 'flow_terminal';
        else if (node.shape === 'decision') styleName = 'flow_decision';
        else if (node.shape === 'io') styleName = 'flow_io';
        else if (node.shape === 'subroutine') styleName = 'flow_subroutine';
        else if (node.shape === 'cylinder') styleName = 'flow_cylinder';
        else if (node.shape === 'accepting' || node.isAccepting) styleName = 'accepting_node';
        else if (node.shape === 'initial' || node.isInitial) styleName = 'initial_node';
        else if (node.shape === 'state') styleName = 'state_node';

        // Prepare text label (wrap math if contains math symbols like ^, _, \, $)
        let labelText = node.text || '';
        if (labelText.startsWith('$') && labelText.endsWith('$')) {
          // Already math
        } else if (/[\\_^]/.test(labelText) && !labelText.includes('$')) {
          labelText = `$${labelText}$`;
        }

        // Custom style overrides if altered from defaults
        const customFill = hexToTikzColor(node.fillColor);
        const customBorder = hexToTikzColor(node.borderColor);
        let extraOpts = '';
        if (customFill !== 'white') extraOpts += `, fill=${customFill}`;
        if (customBorder !== 'slate!80!black' && customBorder !== 'black') extraOpts += `, draw=${customBorder}`;
        if (node.borderStyle === 'dashed') extraOpts += ', dashed';
        else if (node.borderStyle === 'dotted') extraOpts += ', dotted';

        out += `  \\node[${styleName}${extraOpts}] (${cid}) at (${tx}, ${ty}) {${labelText}};\n`;

        // If it's an initial state, draw incoming arrow
        if (node.isInitial || node.shape === 'initial') {
          out += `  \\draw[->, thick] (${cid}.west) ++(-0.8, 0) -- (${cid}.west) node[midway, above] {\\scriptsize start};\n`;
        }
      });
      out += '\n';

      // 2. Draw Edges / Transitions
      if (edgesList.length > 0) {
        out += '  % Connections & Transitions\n';
        edgesList.forEach(edge => {
          const fromNode = this.nodes[edge.from];
          const toNode = this.nodes[edge.to];
          if (!fromNode || !toNode) return;

          const fromCid = cleanNodeId(edge.from);
          const toCid = cleanNodeId(edge.to);

          let arrowStyle = '->';
          if (edge.arrow === 'bidirectional') arrowStyle = '<->';
          else if (edge.arrow === 'none') arrowStyle = '-';
          else if (edge.arrow === 'backward') arrowStyle = '<-';

          let lineStyle = '';
          if (edge.lineStyle === 'dashed') lineStyle = ', dashed';
          else if (edge.lineStyle === 'dotted') lineStyle = ', dotted';

          const edgeColor = hexToTikzColor(edge.color, 'black!80');
          let colorOpt = '';
          if (edgeColor !== 'black!80' && edgeColor !== 'black') {
            colorOpt = `, draw=${edgeColor}`;
          }

          // Edge label
          let labelText = edge.label || '';
          if (labelText && /[\\_^]/.test(labelText) && !labelText.includes('$')) {
            labelText = `$${labelText}$`;
          }

          let labelNode = '';
          if (labelText) {
            let pos = 'auto';
            if (edge.labelPos === 'above') pos = 'above';
            else if (edge.labelPos === 'below') pos = 'below';
            else if (edge.labelPos === 'left') pos = 'left';
            else if (edge.labelPos === 'right') pos = 'right';
            else if (edge.labelPos === 'near-start') pos = 'pos=0.25, auto';
            else if (edge.labelPos === 'near-end') pos = 'pos=0.75, auto';

            labelNode = ` node[${pos}, font=\\footnotesize, fill=white, inner sep=1.5pt] {${labelText}}`;
          }

          // Resolve anchors for TikZ
          let fromAnchor = edge.fromAnchor || 'auto';
          let toAnchor = edge.toAnchor || 'auto';

          if (fromAnchor === 'auto' || toAnchor === 'auto') {
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            if (fromAnchor === 'auto') {
              if (Math.abs(dy) >= Math.abs(dx)) {
                fromAnchor = dy >= 0 ? 'south' : 'north';
              } else {
                fromAnchor = dx >= 0 ? 'east' : 'west';
              }
            }
            if (toAnchor === 'auto') {
              if (Math.abs(dy) >= Math.abs(dx)) {
                toAnchor = dy >= 0 ? 'north' : 'south';
              } else {
                toAnchor = dx >= 0 ? 'west' : 'east';
              }
            }
          }

          const isFSM = this.diagramType === 'fsm' || fromNode.shape.includes('state') || toNode.shape.includes('state');
          const fromPortTikz = isFSM ? '' : `.${fromAnchor}`;
          const toPortTikz = isFSM ? '' : `.${toAnchor}`;

          // Routing logic
          if (edge.from === edge.to) {
            // Self-loop
            let loopDir = 'loop above';
            if (edge.routing === 'loop-below') loopDir = 'loop below';
            else if (edge.routing === 'loop-left') loopDir = 'loop left';
            else if (edge.routing === 'loop-right') loopDir = 'loop right';

            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}) edge [${loopDir}]${labelNode} (${toCid});\n`;
          } else if (edge.routing === 'bend-left') {
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}) to[bend left=25]${labelNode} (${toCid});\n`;
          } else if (edge.routing === 'bend-right') {
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}) to[bend right=25]${labelNode} (${toCid});\n`;
          } else if (edge.routing === 'feedback-left') {
            // Flowchart loopback around left edge
            const fPort = edge.fromAnchor && edge.fromAnchor !== 'auto' ? edge.fromAnchor : 'west';
            const tPort = edge.toAnchor && edge.toAnchor !== 'auto' ? edge.toAnchor : 'west';
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}.${fPort}) -- ++(-1.0, 0) |- ${labelNode} (${toCid}.${tPort});\n`;
          } else if (edge.routing === 'feedback-right') {
            // Flowchart loopback around right edge
            const fPort = edge.fromAnchor && edge.fromAnchor !== 'auto' ? edge.fromAnchor : 'east';
            const tPort = edge.toAnchor && edge.toAnchor !== 'auto' ? edge.toAnchor : 'east';
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}.${fPort}) -- ++(1.0, 0) |- ${labelNode} (${toCid}.${tPort});\n`;
          } else if (edge.routing === 'orthogonal-vert') {
            // Vertical first, then horizontal
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) |- ${labelNode} (${toCid}${toPortTikz});\n`;
          } else if (edge.routing === 'orthogonal-horiz') {
            // Horizontal first, then vertical
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) -| ${labelNode} (${toCid}${toPortTikz});\n`;
          } else if (edge.routing === 'orthogonal') {
            const dx = Math.abs(toNode.x - fromNode.x);
            const dy = Math.abs(toNode.y - fromNode.y);

            if (dx < 15 || dy < 15) {
              out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) --${labelNode} (${toCid}${toPortTikz});\n`;
            } else if (fromAnchor === 'south' || fromAnchor === 'north') {
              out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) |- ${labelNode} (${toCid}${toPortTikz});\n`;
            } else {
              out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) -| ${labelNode} (${toCid}${toPortTikz});\n`;
            }
          } else {
            // Direct straight edge
            out += `  \\draw[${arrowStyle}${lineStyle}${colorOpt}] (${fromCid}${fromPortTikz}) --${labelNode} (${toCid}${toPortTikz});\n`;
          }
        });
      }

      out += '\\end{tikzpicture}';

      if (isStandalone) {
        out += '\n\n\\end{document}\n';
      }

      return out;
    }
  }

  /**
   * Classic Flowchart & State Machine Presets
   */
  const Presets = {
    // 1. Binary String Modulo-3 Automaton (DFA)
    'fsm-modulo3': () => {
      const model = new FlowchartModel();
      model.title = 'Modulo-3 Binary Counter (DFA)';
      model.diagramType = 'fsm';

      const q0 = model.createNode({ id: 'q0', text: 'q_0', shape: 'accepting', isInitial: true, x: -160, y: 0, width: 56, height: 56, fillColor: '#eff6ff', borderColor: '#2563eb' });
      const q1 = model.createNode({ id: 'q1', text: 'q_1', shape: 'state', x: 0, y: -90, width: 56, height: 56, fillColor: '#f8fafc', borderColor: '#475569' });
      const q2 = model.createNode({ id: 'q2', text: 'q_2', shape: 'state', x: 160, y: 0, width: 56, height: 56, fillColor: '#f8fafc', borderColor: '#475569' });

      // Transitions
      model.createEdge({ from: 'q0', to: 'q0', label: '0', routing: 'loop-below' });
      model.createEdge({ from: 'q0', to: 'q1', label: '1', routing: 'bend-left' });

      model.createEdge({ from: 'q1', to: 'q2', label: '0', routing: 'bend-left' });
      model.createEdge({ from: 'q1', to: 'q0', label: '1', routing: 'bend-left' });

      model.createEdge({ from: 'q2', to: 'q1', label: '0', routing: 'bend-left' });
      model.createEdge({ from: 'q2', to: 'q2', label: '1', routing: 'loop-below' });

      return model;
    },

    // 2. Turnstile FSM
    'fsm-turnstile': () => {
      const model = new FlowchartModel();
      model.title = 'Turnstile Finite State Machine';
      model.diagramType = 'fsm';

      const locked = model.createNode({ id: 'locked', text: 'Locked', shape: 'initial', isInitial: true, x: -140, y: 0, width: 68, height: 68, fillColor: '#fee2e2', borderColor: '#dc2626' });
      const unlocked = model.createNode({ id: 'unlocked', text: 'Unlocked', shape: 'state', x: 140, y: 0, width: 68, height: 68, fillColor: '#dcfce7', borderColor: '#16a34a' });

      // Transitions
      model.createEdge({ from: 'locked', to: 'unlocked', label: 'Coin', routing: 'bend-left' });
      model.createEdge({ from: 'unlocked', to: 'locked', label: 'Push', routing: 'bend-left' });

      model.createEdge({ from: 'locked', to: 'locked', label: 'Push', routing: 'loop-above' });
      model.createEdge({ from: 'unlocked', to: 'unlocked', label: 'Coin', routing: 'loop-above' });

      return model;
    },

    // 3. TCP 3-Way Handshake Connection FSM
    'fsm-tcp': () => {
      const model = new FlowchartModel();
      model.title = 'TCP 3-Way Handshake & Connection FSM';
      model.diagramType = 'fsm';

      model.createNode({ id: 'closed', text: 'CLOSED', shape: 'initial', isInitial: true, x: -180, y: -100, width: 64, height: 64, fillColor: '#f1f5f9', borderColor: '#475569' });
      model.createNode({ id: 'listen', text: 'LISTEN', shape: 'state', x: 0, y: -100, width: 64, height: 64, fillColor: '#eff6ff', borderColor: '#2563eb' });
      model.createNode({ id: 'syn_sent', text: 'SYN_SENT', shape: 'state', x: -180, y: 80, width: 68, height: 68, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'syn_rcvd', text: 'SYN_RCVD', shape: 'state', x: 0, y: 80, width: 68, height: 68, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'established', text: 'ESTABLISHED', shape: 'accepting', isAccepting: true, x: 180, y: 0, width: 78, height: 78, fillColor: '#dcfce7', borderColor: '#16a34a' });

      model.createEdge({ from: 'closed', to: 'listen', label: 'Passive Open', routing: 'straight' });
      model.createEdge({ from: 'closed', to: 'syn_sent', label: 'Active Open / SYN', routing: 'straight' });
      model.createEdge({ from: 'listen', to: 'syn_rcvd', label: 'SYN / SYN+ACK', routing: 'straight' });
      model.createEdge({ from: 'syn_sent', to: 'established', label: 'SYN+ACK / ACK', routing: 'bend-left' });
      model.createEdge({ from: 'syn_rcvd', to: 'established', label: 'ACK', routing: 'straight' });

      return model;
    },

    // 4. Traffic Light State Controller
    'fsm-traffic': () => {
      const model = new FlowchartModel();
      model.title = 'Traffic Light State Machine';
      model.diagramType = 'fsm';

      const red = model.createNode({ id: 'red', text: 'RED', shape: 'initial', isInitial: true, x: 0, y: -130, width: 60, height: 60, fillColor: '#fee2e2', borderColor: '#ef4444' });
      const green = model.createNode({ id: 'green', text: 'GREEN', shape: 'state', x: 140, y: 50, width: 60, height: 60, fillColor: '#dcfce7', borderColor: '#10b981' });
      const yellow = model.createNode({ id: 'yellow', text: 'YELLOW', shape: 'state', x: -140, y: 50, width: 60, height: 60, fillColor: '#fef3c7', borderColor: '#f59e0b' });

      model.createEdge({ from: 'red', to: 'green', label: 'Timer = 45s', routing: 'bend-left' });
      model.createEdge({ from: 'green', to: 'yellow', label: 'Timer = 30s', routing: 'bend-left' });
      model.createEdge({ from: 'yellow', to: 'red', label: 'Timer = 5s', routing: 'bend-left' });

      return model;
    },

    // 5. Algorithm Flowchart (Euclidean Algorithm / GCD)
    'flow-gcd': () => {
      const model = new FlowchartModel();
      model.title = 'Euclidean GCD Algorithm Flowchart';
      model.diagramType = 'flowchart';

      model.createNode({ id: 'start', text: 'Start', shape: 'terminal', x: 0, y: -180, width: 100, height: 42, fillColor: '#e0e7ff', borderColor: '#4f46e5' });
      model.createNode({ id: 'input', text: 'Input a, b', shape: 'io', x: 0, y: -100, width: 110, height: 46, fillColor: '#ecfdf5', borderColor: '#059669' });
      model.createNode({ id: 'check', text: 'b = 0?', shape: 'decision', x: 0, y: -10, width: 110, height: 68, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'output', text: 'Print a as GCD', shape: 'io', x: 160, y: -10, width: 120, height: 46, fillColor: '#ecfdf5', borderColor: '#059669' });
      model.createNode({ id: 'end', text: 'End', shape: 'terminal', x: 160, y: 80, width: 90, height: 42, fillColor: '#e0e7ff', borderColor: '#4f46e5' });
      model.createNode({ id: 'step', text: 't := b\nb := a mod b\na := t', shape: 'process', x: -150, y: 80, width: 125, height: 60, fillColor: '#ffffff', borderColor: '#334155' });

      model.createEdge({ from: 'start', to: 'input', label: '', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'input', to: 'check', label: '', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'check', to: 'output', label: 'Yes', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'output', to: 'end', label: '', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'check', to: 'step', label: 'No', routing: 'orthogonal-vert', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'step', to: 'check', label: '', routing: 'feedback-left', fromAnchor: 'west', toAnchor: 'west' });

      return model;
    },

    // 6. User Authentication & 2FA Flow
    'flow-auth': () => {
      const model = new FlowchartModel();
      model.title = 'User Authentication & MFA Security Flow';
      model.diagramType = 'flowchart';

      model.createNode({ id: 'start', text: 'User Login', shape: 'terminal', x: -160, y: -150, width: 100, height: 42, fillColor: '#e0e7ff', borderColor: '#4f46e5' });
      model.createNode({ id: 'creds', text: 'Enter User/Pass', shape: 'io', x: -160, y: -70, width: 115, height: 46, fillColor: '#f8fafc', borderColor: '#475569' });
      model.createNode({ id: 'valid', text: 'Password\nValid?', shape: 'decision', x: -160, y: 30, width: 105, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'mfa_check', text: '2FA\nEnabled?', shape: 'decision', x: 20, y: 30, width: 105, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'otp', text: 'Verify OTP Code', shape: 'process', x: 20, y: 120, width: 110, height: 48, fillColor: '#ffffff', borderColor: '#334155' });
      model.createNode({ id: 'success', text: 'Grant Access', shape: 'terminal', x: 170, y: 30, width: 100, height: 42, fillColor: '#dcfce7', borderColor: '#16a34a' });
      model.createNode({ id: 'lock', text: 'Deny & Increment\nAttempts', shape: 'process', x: -160, y: 140, width: 120, height: 50, fillColor: '#fee2e2', borderColor: '#ef4444' });

      model.createEdge({ from: 'start', to: 'creds', label: '', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'creds', to: 'valid', label: '', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'valid', to: 'mfa_check', label: 'Yes', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'valid', to: 'lock', label: 'No', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'mfa_check', to: 'success', label: 'No', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'mfa_check', to: 'otp', label: 'Yes', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'otp', to: 'success', label: 'Valid', routing: 'orthogonal-horiz', fromAnchor: 'east', toAnchor: 'south' });
      model.createEdge({ from: 'lock', to: 'creds', label: 'Retry < 3', routing: 'feedback-left', fromAnchor: 'west', toAnchor: 'west' });

      return model;
    },

    // 7. Order & Payment Pipeline
    'flow-order': () => {
      const model = new FlowchartModel();
      model.title = 'Order Processing & Payment Pipeline';
      model.diagramType = 'flowchart';

      model.createNode({ id: 'cart', text: 'Checkout', shape: 'terminal', x: -180, y: 0, width: 95, height: 42, fillColor: '#e0e7ff', borderColor: '#4f46e5' });
      model.createNode({ id: 'stock', text: 'Stock\nAvailable?', shape: 'decision', x: -60, y: 0, width: 105, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'pay', text: 'Process Payment', shape: 'process', x: 80, y: 0, width: 115, height: 50, fillColor: '#ffffff', borderColor: '#334155' });
      model.createNode({ id: 'pay_ok', text: 'Payment\nSuccess?', shape: 'decision', x: 210, y: 0, width: 105, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'ship', text: 'Ship Order', shape: 'terminal', x: 210, y: 110, width: 100, height: 42, fillColor: '#dcfce7', borderColor: '#16a34a' });
      model.createNode({ id: 'cancel', text: 'Cancel Order', shape: 'terminal', x: -60, y: 110, width: 100, height: 42, fillColor: '#fee2e2', borderColor: '#ef4444' });

      model.createEdge({ from: 'cart', to: 'stock', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'stock', to: 'pay', label: 'Yes', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'stock', to: 'cancel', label: 'No', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'pay', to: 'pay_ok', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'pay_ok', to: 'ship', label: 'Yes', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'pay_ok', to: 'cancel', label: 'Declined', routing: 'orthogonal-vert', fromAnchor: 'south', toAnchor: 'east' });

      return model;
    },

    // 8. Even/Odd Parity Bit Checker DFA
    'fsm-parity': () => {
      const model = new FlowchartModel();
      model.title = 'Even Parity Bit Checker (DFA)';
      model.diagramType = 'fsm';

      const sEven = model.createNode({ id: 's_even', text: 'Even\nParity', shape: 'accepting', isInitial: true, isAccepting: true, x: -120, y: 0, width: 72, height: 72, fillColor: '#eff6ff', borderColor: '#2563eb' });
      const sOdd = model.createNode({ id: 's_odd', text: 'Odd\nParity', shape: 'state', x: 120, y: 0, width: 72, height: 72, fillColor: '#f8fafc', borderColor: '#475569' });

      // Transitions
      model.createEdge({ from: 's_even', to: 's_even', label: '0', routing: 'loop-above' });
      model.createEdge({ from: 's_even', to: 's_odd', label: '1', routing: 'bend-left' });
      model.createEdge({ from: 's_odd', to: 's_even', label: '1', routing: 'bend-left' });
      model.createEdge({ from: 's_odd', to: 's_odd', label: '0', routing: 'loop-above' });

      return model;
    },

    // 9. Regex Pattern Matcher (a|b)*abb NFA
    'fsm-regex-nfa': () => {
      const model = new FlowchartModel();
      model.title = 'Pattern Matcher NFA for (a|b)*abb';
      model.diagramType = 'fsm';

      model.createNode({ id: 'q0', text: 'q_0', shape: 'initial', isInitial: true, x: -180, y: 0, width: 56, height: 56, fillColor: '#eff6ff', borderColor: '#2563eb' });
      model.createNode({ id: 'q1', text: 'q_1', shape: 'state', x: -60, y: 0, width: 56, height: 56, fillColor: '#f8fafc', borderColor: '#475569' });
      model.createNode({ id: 'q2', text: 'q_2', shape: 'state', x: 60, y: 0, width: 56, height: 56, fillColor: '#f8fafc', borderColor: '#475569' });
      model.createNode({ id: 'q3', text: 'q_3', shape: 'accepting', isAccepting: true, x: 180, y: 0, width: 62, height: 62, fillColor: '#dcfce7', borderColor: '#16a34a' });

      model.createEdge({ from: 'q0', to: 'q0', label: 'a, b', routing: 'loop-above' });
      model.createEdge({ from: 'q0', to: 'q1', label: 'a', routing: 'straight' });
      model.createEdge({ from: 'q1', to: 'q2', label: 'b', routing: 'straight' });
      model.createEdge({ from: 'q2', to: 'q3', label: 'b', routing: 'straight' });

      return model;
    },

    // 10. Git Feature Branch & CI/CD Pipeline
    'flow-git-release': () => {
      const model = new FlowchartModel();
      model.title = 'Git Branching & CI/CD Deployment Flow';
      model.diagramType = 'flowchart';

      model.createNode({ id: 'branch', text: 'Git Checkout -b\nFeature', shape: 'terminal', x: -200, y: -80, width: 110, height: 48, fillColor: '#e0e7ff', borderColor: '#4f46e5' });
      model.createNode({ id: 'commit', text: 'Commit & Push\nChanges', shape: 'process', x: -60, y: -80, width: 110, height: 48, fillColor: '#ffffff', borderColor: '#334155' });
      model.createNode({ id: 'pr', text: 'Open Pull\nRequest', shape: 'io', x: 80, y: -80, width: 105, height: 46, fillColor: '#ecfdf5', borderColor: '#059669' });
      model.createNode({ id: 'ci_tests', text: 'CI Tests\nPass?', shape: 'decision', x: 210, y: -80, width: 100, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'review', text: 'Peer Review\nApproved?', shape: 'decision', x: 210, y: 70, width: 105, height: 65, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'fix', text: 'Fix Lint/Tests', shape: 'process', x: 60, y: 0, width: 100, height: 44, fillColor: '#fee2e2', borderColor: '#ef4444' });
      model.createNode({ id: 'deploy', text: 'Merge to Main &\nDeploy Release', shape: 'terminal', x: -60, y: 70, width: 125, height: 48, fillColor: '#dcfce7', borderColor: '#16a34a' });

      model.createEdge({ from: 'branch', to: 'commit', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'commit', to: 'pr', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'pr', to: 'ci_tests', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'ci_tests', to: 'review', label: 'Yes', routing: 'straight', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'ci_tests', to: 'fix', label: 'No', routing: 'orthogonal-vert', fromAnchor: 'west', toAnchor: 'east' });
      model.createEdge({ from: 'fix', to: 'commit', label: '', routing: 'orthogonal-horiz', fromAnchor: 'west', toAnchor: 'south' });
      model.createEdge({ from: 'review', to: 'deploy', label: 'Yes', routing: 'straight', fromAnchor: 'west', toAnchor: 'east' });
      model.createEdge({ from: 'review', to: 'fix', label: 'Changes Req', routing: 'straight', fromAnchor: 'north', toAnchor: 'south' });

      return model;
    },

    // 11. Producer-Consumer with Mutex & Bounded Buffer
    'flow-producer-consumer': () => {
      const model = new FlowchartModel();
      model.title = 'Producer-Consumer Synchronization Flow';
      model.diagramType = 'flowchart';

      model.createNode({ id: 'produce', text: 'Produce Data Item', shape: 'process', x: -180, y: -70, width: 115, height: 46, fillColor: '#eff6ff', borderColor: '#2563eb' });
      model.createNode({ id: 'check_full', text: 'Buffer\nFull?', shape: 'decision', x: -50, y: -70, width: 95, height: 60, fillColor: '#fef3c7', borderColor: '#d97706' });
      model.createNode({ id: 'wait', text: 'Wait on Empty Slot', shape: 'process', x: -50, y: -160, width: 120, height: 42, fillColor: '#fee2e2', borderColor: '#ef4444' });
      model.createNode({ id: 'lock', text: 'Acquire Mutex &\nEnqueue Item', shape: 'process', x: 90, y: -70, width: 120, height: 50, fillColor: '#f8fafc', borderColor: '#334155' });
      model.createNode({ id: 'signal', text: 'Signal Consumer\n(Item Ready)', shape: 'terminal', x: 230, y: -70, width: 115, height: 46, fillColor: '#dcfce7', borderColor: '#16a34a' });

      model.createEdge({ from: 'produce', to: 'check_full', label: '', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'check_full', to: 'wait', label: 'Yes', routing: 'straight', fromAnchor: 'north', toAnchor: 'south' });
      model.createEdge({ from: 'wait', to: 'check_full', label: 'Retry', routing: 'bend-left', fromAnchor: 'south', toAnchor: 'north' });
      model.createEdge({ from: 'check_full', to: 'lock', label: 'No', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });
      model.createEdge({ from: 'lock', to: 'signal', label: 'Release Mutex', routing: 'straight', fromAnchor: 'east', toAnchor: 'west' });

      return model;
    }
  };

  /**
   * High-DPI Canvas Renderer & Direct Interaction Engine
   */
  class FlowchartCanvasRenderer {
    constructor(canvas, model) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.model = model;

      // Viewport transform
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;

      // Interaction mode: 'select', 'connect', 'add-node'
      this.toolMode = 'select';
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.hoveredNodeId = null;
      this.hoveredEdgeId = null;

      // Drag state
      this.isDraggingNode = false;
      this.draggedNodeId = null;
      this.dragStartWorld = { x: 0, y: 0 };
      this.dragNodeStartPos = { x: 0, y: 0 };

      // Connection interaction state
      this.isConnecting = false;
      this.connectSourceId = null;
      this.connectSourcePort = null; // 'north', 'south', 'east', 'west', or 'auto'
      this.connectCurrentPos = { x: 0, y: 0 };
      this.hoveredPortNodeId = null;
      this.hoveredPortName = null;
      this.snapTargetNodeId = null;
      this.snapTargetPortName = null;

      // Panning state
      this.isPanning = false;
      this.panStart = { x: 0, y: 0 };
      this.panOffsetStart = { x: 0, y: 0 };

      this.initEvents();
      this.fitToScreen();
    }

    setToolMode(mode) {
      this.toolMode = mode;
      if (mode !== 'connect') {
        this.isConnecting = false;
        this.connectSourceId = null;
        this.connectSourcePort = null;
        this.snapTargetNodeId = null;
        this.snapTargetPortName = null;
      }
      this.render();
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

    getCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      return {
        x: (clientX - rect.left) * (this.canvas.width / rect.width),
        y: (clientY - rect.top) * (this.canvas.height / rect.height)
      };
    }

    getNodePorts(node) {
      const halfW = node.width / 2;
      const halfH = node.height / 2;
      if (node.shape === 'state' || node.shape === 'accepting' || node.shape === 'initial') {
        const r = Math.max(halfW, halfH);
        return {
          north: { x: node.x, y: node.y - r },
          south: { x: node.x, y: node.y + r },
          east: { x: node.x + r, y: node.y },
          west: { x: node.x - r, y: node.y }
        };
      }
      return {
        north: { x: node.x, y: node.y - halfH },
        south: { x: node.x, y: node.y + halfH },
        east: { x: node.x + halfW, y: node.y },
        west: { x: node.x - halfW, y: node.y }
      };
    }

    getNodePort(node, portName) {
      const ports = this.getNodePorts(node);
      return ports[portName] || ports.north;
    }

    resolveEdgeAnchors(u, v, edge) {
      let fromAnchor = edge.fromAnchor || 'auto';
      let toAnchor = edge.toAnchor || 'auto';

      if (fromAnchor === 'auto' || toAnchor === 'auto') {
        const dx = v.x - u.x;
        const dy = v.y - u.y;

        if (fromAnchor === 'auto' && toAnchor === 'auto') {
          if (edge.routing === 'orthogonal-vert') {
            fromAnchor = dy >= 0 ? 'south' : 'north';
            toAnchor = dx >= 0 ? 'west' : 'east';
          } else if (edge.routing === 'orthogonal-horiz') {
            fromAnchor = dx >= 0 ? 'east' : 'west';
            toAnchor = dy >= 0 ? 'north' : 'south';
          } else if (edge.routing === 'feedback-left') {
            fromAnchor = 'west';
            toAnchor = 'west';
          } else if (edge.routing === 'feedback-right') {
            fromAnchor = 'east';
            toAnchor = 'east';
          } else {
            if (Math.abs(dy) >= Math.abs(dx)) {
              fromAnchor = dy >= 0 ? 'south' : 'north';
              toAnchor = dy >= 0 ? 'north' : 'south';
            } else {
              fromAnchor = dx >= 0 ? 'east' : 'west';
              toAnchor = dx >= 0 ? 'west' : 'east';
            }
          }
        } else if (fromAnchor === 'auto') {
          if (toAnchor === 'north') fromAnchor = u.y > v.y ? 'north' : 'south';
          else if (toAnchor === 'south') fromAnchor = u.y < v.y ? 'south' : 'north';
          else if (toAnchor === 'west') fromAnchor = u.x < v.x ? 'east' : 'west';
          else if (toAnchor === 'east') fromAnchor = u.x > v.x ? 'west' : 'east';
          else fromAnchor = 'south';
        } else if (toAnchor === 'auto') {
          if (fromAnchor === 'south') toAnchor = v.y > u.y ? 'north' : 'south';
          else if (fromAnchor === 'north') toAnchor = v.y < u.y ? 'south' : 'north';
          else if (fromAnchor === 'east') toAnchor = v.x > u.x ? 'west' : 'east';
          else if (fromAnchor === 'west') toAnchor = v.x < u.x ? 'east' : 'west';
          else toAnchor = 'north';
        }
      }

      const pStart = this.getNodePort(u, fromAnchor);
      const pEnd = this.getNodePort(v, toAnchor);
      return { fromAnchor, toAnchor, pStart, pEnd };
    }

    hitTestNode(worldPos) {
      const nodes = Object.values(this.model.nodes);
      // Reverse check to hit top-most rendered node first
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const halfW = n.width / 2;
        const halfH = n.height / 2;

        if (n.shape === 'state' || n.shape === 'accepting' || n.shape === 'initial') {
          const r = Math.max(halfW, halfH);
          const dist = Math.hypot(worldPos.x - n.x, worldPos.y - n.y);
          if (dist <= r + 4) return n;
        } else if (n.shape === 'decision') {
          // Diamond inside test: |dx|/halfW + |dy|/halfH <= 1
          const dx = Math.abs(worldPos.x - n.x);
          const dy = Math.abs(worldPos.y - n.y);
          if ((dx / (halfW + 4)) + (dy / (halfH + 4)) <= 1) return n;
        } else {
          // Box bounding test
          if (
            worldPos.x >= n.x - halfW - 4 &&
            worldPos.x <= n.x + halfW + 4 &&
            worldPos.y >= n.y - halfH - 4 &&
            worldPos.y <= n.y + halfH + 4
          ) {
            return n;
          }
        }
      }
      return null;
    }

    hitTestNodePort(worldPos, threshold = 14) {
      const nodes = Object.values(this.model.nodes);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const ports = this.getNodePorts(n);
        for (const [portKey, pt] of Object.entries(ports)) {
          if (Math.hypot(worldPos.x - pt.x, worldPos.y - pt.y) <= threshold) {
            return { node: n, port: portKey, point: pt };
          }
        }
      }
      return null;
    }

    hitTestEdge(worldPos) {
      const distToSegment = (p, v, w) => {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
      };

      const edges = Object.values(this.model.edges);
      for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges[i];
        const u = this.model.nodes[edge.from];
        const v = this.model.nodes[edge.to];
        if (!u || !v) continue;

        if (edge.from === edge.to) {
          // Self-loop center check
          const halfW = u.width / 2;
          const halfH = u.height / 2;
          let cx = u.x, cy = u.y - halfH - 16;
          if (edge.routing === 'loop-below') cy = u.y + halfH + 16;
          else if (edge.routing === 'loop-left') { cx = u.x - halfW - 16; cy = u.y; }
          else if (edge.routing === 'loop-right') { cx = u.x + halfW + 16; cy = u.y; }
          const d = Math.abs(Math.hypot(worldPos.x - cx, worldPos.y - cy) - 24);
          if (d < 14) return edge;
          continue;
        }

        const { fromAnchor, toAnchor, pStart, pEnd } = this.resolveEdgeAnchors(u, v, edge);

        if (edge.routing === 'bend-left' || edge.routing === 'bend-right') {
          const isLeft = (edge.routing === 'bend-left');
          const midX = (u.x + v.x) / 2;
          const midY = (u.y + v.y) / 2;
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = -dy / dist;
          const ny = dx / dist;
          const bendAmt = Math.min(45, Math.max(25, dist * 0.25)) * (isLeft ? 1 : -1);
          const cpX = midX + nx * bendAmt;
          const cpY = midY + ny * bendAmt;

          let minD = Infinity;
          for (let t = 0; t <= 1; t += 0.1) {
            const qx = (1 - t) * (1 - t) * pStart.x + 2 * (1 - t) * t * cpX + t * t * pEnd.x;
            const qy = (1 - t) * (1 - t) * pStart.y + 2 * (1 - t) * t * cpY + t * t * pEnd.y;
            minD = Math.min(minD, Math.hypot(worldPos.x - qx, worldPos.y - qy));
          }
          if (minD < 14) return edge;
          continue;
        }

        let points = [pStart, pEnd];
        if (edge.routing.includes('orthogonal') || edge.routing.includes('feedback')) {
          points = this.calculateOrthogonalPoints(u, v, edge, pStart, pEnd, fromAnchor, toAnchor);
        }

        for (let j = 0; j < points.length - 1; j++) {
          const d = distToSegment(worldPos, points[j], points[j + 1]);
          if (d < 12) return edge;
        }
      }
      return null;
    }

    initEvents() {
      const c = this.canvas;

      const handlePointerDown = (e) => {
        const coords = this.getCanvasCoords(e);
        const worldPos = this.screenToWorld(coords.x, coords.y);

        // Check for Middle click or Shift+Click for panning
        if (e.button === 1 || (e.button === 0 && (e.shiftKey || e.altKey))) {
          this.isPanning = true;
          this.panStart = { x: coords.x, y: coords.y };
          this.panOffsetStart = { x: this.panX, y: this.panY };
          c.style.cursor = 'grabbing';
          return;
        }

        if (e.button !== 0 && !e.touches) return;

        // Priority 1: Check if clicking directly on a Node Port (North, South, East, West)
        const portHit = this.hitTestNodePort(worldPos, 14);
        if (portHit) {
          this.isConnecting = true;
          this.connectSourceId = portHit.node.id;
          this.connectSourcePort = portHit.port;
          this.connectCurrentPos = { x: portHit.point.x, y: portHit.point.y };
          this.snapTargetNodeId = null;
          this.snapTargetPortName = null;
          this.selectedNodeId = portHit.node.id;
          this.selectedEdgeId = null;
          this.render();
          return;
        }

        const hitNode = this.hitTestNode(worldPos);

        // Priority 2: Connect Tool Mode
        if (this.toolMode === 'connect') {
          if (hitNode) {
            if (!this.connectSourceId) {
              this.connectSourceId = hitNode.id;
              this.connectSourcePort = 'auto';
              this.connectCurrentPos = { x: hitNode.x, y: hitNode.y };
              this.render();
            } else {
              // Complete connection!
              const newEdge = this.model.createEdge({
                from: this.connectSourceId,
                to: hitNode.id,
                fromAnchor: this.connectSourcePort || 'auto',
                toAnchor: 'auto',
                label: ''
              });
              this.connectSourceId = null;
              this.connectSourcePort = null;
              this.selectedEdgeId = newEdge ? newEdge.id : null;
              this.selectedNodeId = null;
              this.render();
              if (window.onFlowchartSelectionChanged) {
                window.onFlowchartSelectionChanged('edge', newEdge);
              }
              if (window.onFlowchartChanged) window.onFlowchartChanged();
            }
          } else {
            this.connectSourceId = null;
            this.connectSourcePort = null;
            this.render();
          }
          return;
        }

        // Priority 3: Add Node Tool
        if (this.toolMode === 'add-node') {
          let snapX = Math.round(worldPos.x);
          let snapY = Math.round(worldPos.y);
          if (this.model.enableSnap) {
            snapX = Math.round(snapX / this.model.gridSnap) * this.model.gridSnap;
            snapY = Math.round(snapY / this.model.gridSnap) * this.model.gridSnap;
          }

          const defaultShape = this.model.diagramType === 'fsm' ? 'state' : 'process';
          const newNode = this.model.createNode({
            x: snapX,
            y: snapY,
            shape: defaultShape
          });

          this.selectedNodeId = newNode.id;
          this.selectedEdgeId = null;
          this.toolMode = 'select'; // revert to select mode
          this.render();
          if (window.onFlowchartChanged) window.onFlowchartChanged();
          return;
        }

        // Priority 4: Select & Drag Node
        if (hitNode) {
          this.selectedNodeId = hitNode.id;
          this.selectedEdgeId = null;
          this.isDraggingNode = true;
          this.draggedNodeId = hitNode.id;
          this.dragStartWorld = { x: worldPos.x, y: worldPos.y };
          this.dragNodeStartPos = { x: hitNode.x, y: hitNode.y };
          this.render();
          if (window.onFlowchartSelectionChanged) {
            window.onFlowchartSelectionChanged('node', hitNode);
          }
          return;
        }

        // Priority 5: Hit test Edge (click anywhere on line, corner, or curve)
        const hitEdge = this.hitTestEdge(worldPos);
        if (hitEdge) {
          this.selectedEdgeId = hitEdge.id;
          this.selectedNodeId = null;
          this.render();
          if (window.onFlowchartSelectionChanged) {
            window.onFlowchartSelectionChanged('edge', hitEdge);
          }
          return;
        }

        // Clicked on empty space: deselect or start panning
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        this.render();
        if (window.onFlowchartSelectionChanged) {
          window.onFlowchartSelectionChanged(null, null);
        }

        this.isPanning = true;
        this.panStart = { x: coords.x, y: coords.y };
        this.panOffsetStart = { x: this.panX, y: this.panY };
      };

      const handlePointerMove = (e) => {
        const coords = this.getCanvasCoords(e);

        if (this.isPanning) {
          this.panX = this.panOffsetStart.x + (coords.x - this.panStart.x);
          this.panY = this.panOffsetStart.y + (coords.y - this.panStart.y);
          this.render();
          return;
        }

        const worldPos = this.screenToWorld(coords.x, coords.y);

        // Active connection drag or connect mode tracking
        if (this.isConnecting || (this.toolMode === 'connect' && this.connectSourceId)) {
          // Check magnetic snapping to another node's port
          const snapPort = this.hitTestNodePort(worldPos, 18);
          if (snapPort && snapPort.node.id !== this.connectSourceId) {
            this.snapTargetNodeId = snapPort.node.id;
            this.snapTargetPortName = snapPort.port;
            this.connectCurrentPos = { x: snapPort.point.x, y: snapPort.point.y };
          } else {
            const snapNode = this.hitTestNode(worldPos);
            if (snapNode && snapNode.id !== this.connectSourceId) {
              this.snapTargetNodeId = snapNode.id;
              this.snapTargetPortName = 'auto';
              this.connectCurrentPos = { x: worldPos.x, y: worldPos.y };
            } else {
              this.snapTargetNodeId = null;
              this.snapTargetPortName = null;
              this.connectCurrentPos = { x: worldPos.x, y: worldPos.y };
            }
          }
          this.render();
          return;
        }

        if (this.isDraggingNode && this.draggedNodeId) {
          const node = this.model.getNode(this.draggedNodeId);
          if (node) {
            let nextX = this.dragNodeStartPos.x + (worldPos.x - this.dragStartWorld.x);
            let nextY = this.dragNodeStartPos.y + (worldPos.y - this.dragStartWorld.y);

            if (this.model.enableSnap) {
              nextX = Math.round(nextX / this.model.gridSnap) * this.model.gridSnap;
              nextY = Math.round(nextY / this.model.gridSnap) * this.model.gridSnap;
            }

            node.x = nextX;
            node.y = nextY;
            this.render();
            if (window.onFlowchartNodeMoved) window.onFlowchartNodeMoved(node);
          }
          return;
        }

        // Port Hover Check
        const portHit = this.hitTestNodePort(worldPos, 14);
        const prevPortNode = this.hoveredPortNodeId;
        const prevPortName = this.hoveredPortName;
        if (portHit) {
          this.hoveredPortNodeId = portHit.node.id;
          this.hoveredPortName = portHit.port;
          this.hoveredNodeId = portHit.node.id;
          c.style.cursor = 'crosshair';
          if (prevPortNode !== this.hoveredPortNodeId || prevPortName !== this.hoveredPortName) {
            this.render();
          }
          return;
        } else {
          this.hoveredPortNodeId = null;
          this.hoveredPortName = null;
        }

        // Cursor & hover updates
        const hitNode = this.hitTestNode(worldPos);
        const prevHover = this.hoveredNodeId;
        this.hoveredNodeId = hitNode ? hitNode.id : null;

        if (this.toolMode === 'connect') {
          c.style.cursor = hitNode ? 'crosshair' : 'default';
        } else if (this.toolMode === 'add-node') {
          c.style.cursor = 'crosshair';
        } else if (hitNode) {
          c.style.cursor = 'move';
        } else {
          c.style.cursor = 'default';
        }

        if (prevHover !== this.hoveredNodeId || prevPortNode !== null) {
          this.render();
        }
      };

      const handlePointerUp = () => {
        if (this.isPanning) {
          this.isPanning = false;
          c.style.cursor = 'default';
        }
        if (this.isDraggingNode) {
          this.isDraggingNode = false;
          this.draggedNodeId = null;
          if (window.onFlowchartChanged) window.onFlowchartChanged();
        }

        // Complete drag-to-connect operation
        if (this.isConnecting) {
          if (this.snapTargetNodeId && this.snapTargetNodeId !== this.connectSourceId) {
            const newEdge = this.model.createEdge({
              from: this.connectSourceId,
              to: this.snapTargetNodeId,
              fromAnchor: this.connectSourcePort || 'auto',
              toAnchor: this.snapTargetPortName || 'auto',
              label: ''
            });
            this.selectedEdgeId = newEdge ? newEdge.id : null;
            this.selectedNodeId = null;
            if (window.onFlowchartSelectionChanged) {
              window.onFlowchartSelectionChanged('edge', newEdge);
            }
            if (window.onFlowchartChanged) window.onFlowchartChanged();
          }
          this.isConnecting = false;
          this.connectSourceId = null;
          this.connectSourcePort = null;
          this.snapTargetNodeId = null;
          this.snapTargetPortName = null;
          this.render();
        }
      };

      const handleDblClick = (e) => {
        const coords = this.getCanvasCoords(e);
        const worldPos = this.screenToWorld(coords.x, coords.y);
        const hitNode = this.hitTestNode(worldPos);

        if (hitNode) {
          const val = prompt('Edit Node Text (LaTeX math supported):', hitNode.text);
          if (val !== null) {
            hitNode.text = val;
            this.render();
            if (window.onFlowchartChanged) window.onFlowchartChanged();
          }
          return;
        }

        const hitEdge = this.hitTestEdge(worldPos);
        if (hitEdge) {
          const val = prompt('Edit Transition / Edge Label:', hitEdge.label || '');
          if (val !== null) {
            hitEdge.label = val;
            this.render();
            if (window.onFlowchartChanged) window.onFlowchartChanged();
          }
        }
      };

      const handleWheel = (e) => {
        e.preventDefault();
        const coords = this.getCanvasCoords(e);
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(3.5, Math.max(0.3, this.scale * zoomFactor));

        // Zoom relative to pointer
        this.panX = coords.x - (coords.x - this.panX) * (newScale / this.scale);
        this.panY = coords.y - (coords.y - this.panY) * (newScale / this.scale);
        this.scale = newScale;

        this.render();
      };

      c.addEventListener('mousedown', handlePointerDown);
      c.addEventListener('mousemove', handlePointerMove);
      c.addEventListener('dblclick', handleDblClick);
      window.addEventListener('mouseup', handlePointerUp);
      c.addEventListener('wheel', handleWheel, { passive: false });

      // Touch events
      c.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          handlePointerDown(e);
        }
      });
      c.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          handlePointerMove(e);
        }
      });
      window.addEventListener('touchend', handlePointerUp);
    }

    fitToScreen() {
      const bounds = this.model.getBounds();
      const margin = 80;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const scaleX = (w - margin * 2) / bounds.width;
      const scaleY = (h - margin * 2) / bounds.height;
      this.scale = Math.min(1.4, Math.max(0.4, Math.min(scaleX, scaleY)));

      this.panX = w / 2 - bounds.centerX * this.scale;
      this.panY = h / 2 - bounds.centerY * this.scale;
      this.render();
    }

    zoomIn() {
      this.scale = Math.min(3.5, this.scale * 1.2);
      this.render();
    }

    zoomOut() {
      this.scale = Math.max(0.3, this.scale / 1.2);
      this.render();
    }

    /**
     * Compute boundary intersection point so arrows touch the shape perimeter cleanly
     */
    getNodePerimeterPoint(node, targetPoint) {
      const dx = targetPoint.x - node.x;
      const dy = targetPoint.y - node.y;
      const halfW = node.width / 2;
      const halfH = node.height / 2;

      if (dx === 0 && dy === 0) return { x: node.x, y: node.y };

      if (node.shape === 'state' || node.shape === 'accepting' || node.shape === 'initial') {
        const angle = Math.atan2(dy, dx);
        const r = Math.max(halfW, halfH);
        return {
          x: node.x + r * Math.cos(angle),
          y: node.y + r * Math.sin(angle)
        };
      }

      if (node.shape === 'decision') {
        // Diamond intersection
        const angle = Math.atan2(dy, dx);
        const absCos = Math.abs(Math.cos(angle));
        const absSin = Math.abs(Math.sin(angle));
        const r = 1 / ((absCos / halfW) + (absSin / halfH));
        return {
          x: node.x + r * Math.cos(angle),
          y: node.y + r * Math.sin(angle)
        };
      }

      // Box / pill intersection
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      let scale = 1;

      if (absDx * halfH > absDy * halfW) {
        scale = halfW / absDx;
      } else {
        scale = halfH / absDy;
      }

      return {
        x: node.x + dx * scale,
        y: node.y + dy * scale
      };
    }

    /**
     * Main Render Loop
     */
    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid if snap enabled
      if (this.model.enableSnap) {
        ctx.save();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        const gridSpacing = this.model.gridSnap * this.scale;
        const offsetX = this.panX % gridSpacing;
        const offsetY = this.panY % gridSpacing;

        ctx.beginPath();
        for (let x = offsetX; x < w; x += gridSpacing) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = offsetY; y < h; y += gridSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Apply viewport transform
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      // 1. Draw Edges / Transitions
      this.renderEdges(ctx);

      // 2. Draw Active Connect Mode Line
      if (this.isConnecting || (this.toolMode === 'connect' && this.connectSourceId)) {
        const srcNode = this.model.getNode(this.connectSourceId);
        if (srcNode) {
          const startPt = (this.connectSourcePort && this.connectSourcePort !== 'auto')
            ? this.getNodePort(srcNode, this.connectSourcePort)
            : this.getNodePerimeterPoint(srcNode, this.connectCurrentPos);

          ctx.save();
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(startPt.x, startPt.y);
          ctx.lineTo(this.connectCurrentPos.x, this.connectCurrentPos.y);
          ctx.stroke();

          // Connection tip indicator
          ctx.setLineDash([]);
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(this.connectCurrentPos.x, this.connectCurrentPos.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // If snapping to target port, show snap halo
          if (this.snapTargetNodeId) {
            ctx.beginPath();
            ctx.arc(this.connectCurrentPos.x, this.connectCurrentPos.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 3. Draw Nodes
      this.renderNodes(ctx);

      ctx.restore();
    }

    calculateOrthogonalPoints(u, v, edge, pStart, pEnd, fromAnchor, toAnchor) {
      const routing = edge.routing;

      // 1. Explicit Feedback loop (left margin)
      if (routing === 'feedback-left') {
        const minX = Math.min(u.x - u.width / 2, v.x - v.width / 2) - 40;
        return [
          pStart,
          { x: minX, y: pStart.y },
          { x: minX, y: pEnd.y },
          pEnd
        ];
      }

      // 2. Explicit Feedback loop (right margin)
      if (routing === 'feedback-right') {
        const maxX = Math.max(u.x + u.width / 2, v.x + v.width / 2) + 40;
        return [
          pStart,
          { x: maxX, y: pStart.y },
          { x: maxX, y: pEnd.y },
          pEnd
        ];
      }

      // 3. Vertical first (|-): Start vertically, then turn horizontally
      if (routing === 'orthogonal-vert') {
        return [
          pStart,
          { x: pStart.x, y: pEnd.y },
          pEnd
        ];
      }

      // 4. Horizontal first (-|): Start horizontally, then turn vertically
      if (routing === 'orthogonal-horiz') {
        return [
          pStart,
          { x: pEnd.x, y: pStart.y },
          pEnd
        ];
      }

      // 5. General orthogonal routing with anchor awareness
      if ((fromAnchor === 'south' || fromAnchor === 'north') && (toAnchor === 'south' || toAnchor === 'north')) {
        const midY = (pStart.y + pEnd.y) / 2;
        return [
          pStart,
          { x: pStart.x, y: midY },
          { x: pEnd.x, y: midY },
          pEnd
        ];
      }

      if ((fromAnchor === 'east' || fromAnchor === 'west') && (toAnchor === 'east' || toAnchor === 'west')) {
        const midX = (pStart.x + pEnd.x) / 2;
        return [
          pStart,
          { x: midX, y: pStart.y },
          { x: midX, y: pEnd.y },
          pEnd
        ];
      }

      if (fromAnchor === 'south' || fromAnchor === 'north') {
        return [
          pStart,
          { x: pStart.x, y: pEnd.y },
          pEnd
        ];
      }

      if (fromAnchor === 'east' || fromAnchor === 'west') {
        return [
          pStart,
          { x: pEnd.x, y: pStart.y },
          pEnd
        ];
      }

      const dx = v.x - u.x;
      const dy = v.y - u.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        return [
          pStart,
          { x: pEnd.x, y: pStart.y },
          pEnd
        ];
      } else {
        return [
          pStart,
          { x: pStart.x, y: pEnd.y },
          pEnd
        ];
      }
    }

    renderEdges(ctx) {
      Object.values(this.model.edges).forEach(edge => {
        const fromNode = this.model.getNode(edge.from);
        const toNode = this.model.getNode(edge.to);
        if (!fromNode || !toNode) return;

        const isSelected = (edge.id === this.selectedEdgeId);
        const isHovered = (edge.id === this.hoveredEdgeId);

        ctx.save();
        ctx.strokeStyle = isSelected ? '#4f46e5' : (isHovered ? '#6366f1' : edge.color || '#334155');
        ctx.lineWidth = isSelected ? (edge.lineWidth + 1.5) : edge.lineWidth;

        if (edge.lineStyle === 'dashed') {
          ctx.setLineDash([6, 4]);
        } else if (edge.lineStyle === 'dotted') {
          ctx.setLineDash([2, 3]);
        } else {
          ctx.setLineDash([]);
        }

        // 1. Self Loop
        if (edge.from === edge.to) {
          this.drawSelfLoop(ctx, fromNode, edge, isSelected);
          ctx.restore();
          return;
        }

        const { fromAnchor, toAnchor, pStart, pEnd } = this.resolveEdgeAnchors(fromNode, toNode, edge);

        // 2. Bend Curves
        if (edge.routing === 'bend-left' || edge.routing === 'bend-right') {
          this.drawBentEdge(ctx, fromNode, toNode, edge, isSelected, pStart, pEnd);
          ctx.restore();
          return;
        }

        // 3. Orthogonal / Feedback Routing
        if (edge.routing.includes('orthogonal') || edge.routing.includes('feedback')) {
          this.drawOrthogonalEdge(ctx, fromNode, toNode, edge, isSelected, pStart, pEnd, fromAnchor, toAnchor);
          ctx.restore();
          return;
        }

        // 4. Straight Edge
        this.drawStraightEdge(ctx, fromNode, toNode, edge, isSelected, pStart, pEnd);
        ctx.restore();
      });
    }

    drawStraightEdge(ctx, u, v, edge, isSelected, pStart, pEnd) {
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();

      // Arrowhead
      this.drawArrowHead(ctx, pStart.x, pStart.y, pEnd.x, pEnd.y, edge.arrow);

      // Label
      if (edge.label) {
        let labelPosRatio = 0.5;
        if (edge.labelPosition === 'near-start') labelPosRatio = 0.25;
        else if (edge.labelPosition === 'near-end') labelPosRatio = 0.75;

        const lblX = pStart.x + (pEnd.x - pStart.x) * labelPosRatio;
        const lblY = pStart.y + (pEnd.y - pStart.y) * labelPosRatio;
        this.drawEdgeLabel(ctx, edge.label, lblX, lblY, isSelected);
      }
    }

    drawBentEdge(ctx, u, v, edge, isSelected, pStart, pEnd) {
      const isLeft = (edge.routing === 'bend-left');
      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;

      const bendAmt = Math.min(45, Math.max(25, dist * 0.25)) * (isLeft ? 1 : -1);
      const cpX = midX + nx * bendAmt;
      const cpY = midY + ny * bendAmt;

      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(cpX, cpY, pEnd.x, pEnd.y);
      ctx.stroke();

      // Draw arrowhead based on tangent at pEnd
      const tangentAngle = Math.atan2(pEnd.y - cpY, pEnd.x - cpX);
      this.drawArrowHeadAngle(ctx, pEnd.x, pEnd.y, tangentAngle, edge.arrow);

      // Label at control point
      if (edge.label) {
        this.drawEdgeLabel(ctx, edge.label, cpX, cpY, isSelected);
      }
    }

    drawOrthogonalEdge(ctx, u, v, edge, isSelected, pStart, pEnd, fromAnchor, toAnchor) {
      const points = this.calculateOrthogonalPoints(u, v, edge, pStart, pEnd, fromAnchor, toAnchor);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Arrowhead on last segment
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      this.drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, edge.arrow);

      // Label
      if (edge.label) {
        let lblX, lblY;
        if (edge.labelPosition === 'near-start' && points.length > 2) {
          lblX = (points[0].x + points[1].x) / 2;
          lblY = (points[0].y + points[1].y) / 2 - 10;
        } else if (edge.labelPosition === 'near-end' && points.length > 2) {
          lblX = (prev.x + last.x) / 2;
          lblY = (prev.y + last.y) / 2 - 10;
        } else {
          // Middle segment
          const midIdx = Math.floor(points.length / 2);
          const p1 = points[midIdx - 1];
          const p2 = points[midIdx];
          lblX = (p1.x + p2.x) / 2;
          lblY = (p1.y + p2.y) / 2 - 10;
        }
        this.drawEdgeLabel(ctx, edge.label, lblX, lblY, isSelected);
      }
    }

    drawSelfLoop(ctx, u, edge, isSelected) {
      const halfW = u.width / 2;
      const halfH = u.height / 2;
      const loopRadius = 24;

      let cx, cy, startAngle, endAngle;
      let labelX, labelY;

      if (edge.routing === 'loop-below') {
        cx = u.x;
        cy = u.y + halfH + loopRadius - 8;
        startAngle = Math.PI * 1.25;
        endAngle = Math.PI * 1.75;
        labelX = cx;
        labelY = cy + loopRadius + 10;
      } else if (edge.routing === 'loop-left') {
        cx = u.x - halfW - loopRadius + 8;
        cy = u.y;
        startAngle = Math.PI * 0.25;
        endAngle = Math.PI * 0.75;
        labelX = cx - loopRadius - 10;
        labelY = cy;
      } else if (edge.routing === 'loop-right') {
        cx = u.x + halfW + loopRadius - 8;
        cy = u.y;
        startAngle = Math.PI * 1.25;
        endAngle = Math.PI * 0.75;
        labelX = cx + loopRadius + 10;
        labelY = cy;
      } else {
        // default loop-above
        cx = u.x;
        cy = u.y - halfH - loopRadius + 8;
        startAngle = Math.PI * 0.25;
        endAngle = Math.PI * 0.75;
        labelX = cx;
        labelY = cy - loopRadius - 8;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, loopRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Loop arrow marker
      this.drawArrowHeadAngle(ctx, cx + 8, cy - loopRadius + 2, 0.2, edge.arrow);

      if (edge.label) {
        this.drawEdgeLabel(ctx, edge.label, labelX, labelY, isSelected);
      }
    }

    drawArrowHead(ctx, x1, y1, x2, y2, arrowType = 'forward') {
      if (arrowType === 'none') return;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      this.drawArrowHeadAngle(ctx, x2, y2, angle, arrowType);

      if (arrowType === 'bidirectional') {
        this.drawArrowHeadAngle(ctx, x1, y1, angle + Math.PI, 'forward');
      }
    }

    drawArrowHeadAngle(ctx, x, y, angle, arrowType = 'forward') {
      if (arrowType === 'none') return;
      const headLen = 9;
      ctx.save();
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawEdgeLabel(ctx, text, x, y, isSelected) {
      if (!text) return;
      ctx.save();
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayText = text;
      if (displayText.startsWith('$') && displayText.endsWith('$') && displayText.length > 2) {
        displayText = displayText.slice(1, -1);
      }

      const metrics = ctx.measureText(displayText);
      const padX = 6;
      const padY = 3;
      const w = Math.max(20, metrics.width + padX * 2);
      const h = 18;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(x - w / 2, y - h / 2, w, h);

      ctx.strokeStyle = isSelected ? '#4f46e5' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.setLineDash([]);
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);

      ctx.fillStyle = isSelected ? '#312e81' : '#1e293b';
      if (window.drawMathText) {
        window.drawMathText(ctx, displayText, x, y, { fontSize: 12, color: ctx.fillStyle, align: 'center', baseline: 'middle' });
      } else {
        ctx.fillText(displayText, x, y);
      }
      ctx.restore();
    }

    renderNodes(ctx) {
      Object.values(this.model.nodes).forEach(node => {
        const isSelected = (node.id === this.selectedNodeId);
        const isHovered = (node.id === this.hoveredNodeId);
        const halfW = node.width / 2;
        const halfH = node.height / 2;

        ctx.save();
        ctx.translate(node.x, node.y);

        // Selection glow / bounding box
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          const pad = 6;
          ctx.strokeRect(-halfW - pad, -halfH - pad, node.width + pad * 2, node.height + pad * 2);
          ctx.restore();
        } else if (isHovered) {
          ctx.save();
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.lineWidth = 3;
          ctx.strokeRect(-halfW - 3, -halfH - 3, node.width + 6, node.height + 6);
          ctx.restore();
        }

        // Draw Specific Shapes
        ctx.fillStyle = node.fillColor || '#ffffff';
        ctx.strokeStyle = isSelected ? '#4f46e5' : (node.borderColor || '#334155');
        ctx.lineWidth = node.borderWidth || 2;
        if (node.borderStyle === 'dashed') ctx.setLineDash([5, 4]);
        else if (node.borderStyle === 'dotted') ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);

        if (node.shape === 'state' || node.shape === 'accepting' || node.shape === 'initial') {
          // Circle State
          const r = Math.max(halfW, halfH);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // If accepting state: draw inner concentric circle
          if (node.shape === 'accepting' || node.isAccepting) {
            ctx.beginPath();
            ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
            ctx.stroke();
          }

          // If initial state: draw start arrow pointing to left edge
          if (node.shape === 'initial' || node.isInitial) {
            ctx.save();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-r - 28, 0);
            ctx.lineTo(-r - 1, 0);
            ctx.stroke();
            this.drawArrowHead(ctx, -r - 28, 0, -r - 1, 0, 'forward');

            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = '#2563eb';
            ctx.textAlign = 'center';
            ctx.fillText('start', -r - 14, -8);
            ctx.restore();
          }
        } else if (node.shape === 'decision') {
          // Diamond / Rhombus
          ctx.beginPath();
          ctx.moveTo(0, -halfH);
          ctx.lineTo(halfW, 0);
          ctx.lineTo(0, halfH);
          ctx.lineTo(-halfW, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (node.shape === 'terminal') {
          // Rounded Pill / Stadium
          const r = halfH;
          ctx.beginPath();
          ctx.moveTo(-halfW + r, -halfH);
          ctx.lineTo(halfW - r, -halfH);
          ctx.arc(halfW - r, 0, r, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(-halfW + r, halfH);
          ctx.arc(-halfW + r, 0, r, Math.PI / 2, -Math.PI / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (node.shape === 'io') {
          // Parallelogram
          const skew = 14;
          ctx.beginPath();
          ctx.moveTo(-halfW + skew, -halfH);
          ctx.lineTo(halfW, -halfH);
          ctx.lineTo(halfW - skew, halfH);
          ctx.lineTo(-halfW, halfH);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (node.shape === 'subroutine') {
          // Predefined Process (Rectangle with double vertical lines)
          ctx.fillRect(-halfW, -halfH, node.width, node.height);
          ctx.strokeRect(-halfW, -halfH, node.width, node.height);

          // Side lines
          const inset = 8;
          ctx.beginPath();
          ctx.moveTo(-halfW + inset, -halfH);
          ctx.lineTo(-halfW + inset, halfH);
          ctx.moveTo(halfW - inset, -halfH);
          ctx.lineTo(halfW - inset, halfH);
          ctx.stroke();
        } else if (node.shape === 'cylinder') {
          // Database Cylinder
          const topH = 8;
          ctx.beginPath();
          ctx.ellipse(0, -halfH + topH, halfW, topH, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-halfW, -halfH + topH);
          ctx.lineTo(-halfW, halfH - topH);
          ctx.ellipse(0, halfH - topH, halfW, topH, 0, 0, Math.PI, false);
          ctx.lineTo(halfW, -halfH + topH);
          ctx.fill();
          ctx.stroke();
        } else {
          // Standard Process Rectangle
          const radius = 4;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-halfW, -halfH, node.width, node.height, radius);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(-halfW, -halfH, node.width, node.height);
            ctx.strokeRect(-halfW, -halfH, node.width, node.height);
          }
        }

        // Draw Node Text
        let label = node.text || '';
        if (label.startsWith('$') && label.endsWith('$') && label.length > 2) {
          label = label.slice(1, -1);
        }

        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = node.textColor || '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Support multiline strings (\n)
        const lines = label.split('\n');
        const lineHeight = 16;
        const totalHeight = (lines.length - 1) * lineHeight;
        lines.forEach((line, idx) => {
          const lineY = (idx * lineHeight) - (totalHeight / 2);
          if (window.drawMathText) {
            window.drawMathText(ctx, line, 0, lineY, { fontSize: 13, color: ctx.fillStyle, align: 'center', baseline: 'middle' });
          } else {
            ctx.fillText(line, 0, lineY);
          }
        });

        // Draw Connection Ports (North, South, East, West)
        // Show ports if: node is hovered, selected, in connect mode, or currently dragging connection
        const showPorts = isHovered || isSelected || this.toolMode === 'connect' || this.isConnecting;
        if (showPorts) {
          const ports = this.getNodePorts(node);
          Object.entries(ports).forEach(([portKey, portPt]) => {
            const isPortHovered = (this.hoveredPortNodeId === node.id && this.hoveredPortName === portKey);
            const isSourcePort = (this.connectSourceId === node.id && this.connectSourcePort === portKey);
            const isSnapTarget = (this.snapTargetNodeId === node.id && (this.snapTargetPortName === portKey || this.snapTargetPortName === 'auto'));

            ctx.save();
            ctx.translate(portPt.x - node.x, portPt.y - node.y);

            const r = (isPortHovered || isSnapTarget || isSourcePort) ? 5.5 : 4.0;

            if (isSnapTarget) {
              // Magnetic snapping target glow
              ctx.beginPath();
              ctx.arc(0, 0, 11, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
              ctx.fill();
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = (isPortHovered || isSnapTarget || isSourcePort) ? '#4f46e5' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = (isPortHovered || isSnapTarget || isSourcePort) ? '#312e81' : '#6366f1';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();

            // Port label tag on hover
            if (isPortHovered) {
              const tagNames = { north: 'Top', south: 'Bottom', east: 'Right', west: 'Left' };
              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = '#4f46e5';
              ctx.textAlign = 'center';
              const offY = portKey === 'north' ? -10 : (portKey === 'south' ? 14 : -8);
              ctx.fillText(tagNames[portKey] || portKey, 0, offY);
            }

            ctx.restore();
          });
        }

        ctx.restore();
      });
    }

    exportSVG() {
      const bounds = this.model.getBounds();
      const pad = 40;
      const minX = Math.round(bounds.minX - pad);
      const minY = Math.round(bounds.minY - pad);
      const width = Math.round(bounds.width + pad * 2);
      const height = Math.round(bounds.height + pad * 2);

      let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">\n`;
      svg += `  <defs>\n`;
      svg += `    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">\n`;
      svg += `      <polygon points="0 0, 8 3, 0 6" fill="#334155" />\n`;
      svg += `    </marker>\n`;
      svg += `  </defs>\n`;
      svg += `  <style>\n`;
      svg += `    text { font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 600; text-anchor: middle; dominant-baseline: central; }\n`;
      svg += `    .edge-line { stroke: #334155; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }\n`;
      svg += `  </style>\n\n`;

      // Edges
      Object.values(this.model.edges).forEach(e => {
        const u = this.model.getNode(e.from);
        const v = this.model.getNode(e.to);
        if (!u || !v) return;

        const pStart = this.getNodePerimeterPoint(u, { x: v.x, y: v.y });
        const pEnd = this.getNodePerimeterPoint(v, { x: u.x, y: u.y });
        svg += `  <line class="edge-line" x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" />\n`;
        if (e.label) {
          const mx = (pStart.x + pEnd.x) / 2;
          const my = (pStart.y + pEnd.y) / 2;
          svg += `  <rect x="${mx - 15}" y="${my - 10}" width="30" height="18" fill="white" stroke="#cbd5e1" rx="3" />\n`;
          svg += `  <text x="${mx}" y="${my}" fill="#1e293b" font-size="11">${e.label}</text>\n`;
        }
      });

      // Nodes
      Object.values(this.model.nodes).forEach(n => {
        const halfW = n.width / 2;
        const halfH = n.height / 2;
        const fill = n.fillColor || '#ffffff';
        const stroke = n.borderColor || '#334155';

        if (n.shape === 'state' || n.shape === 'accepting' || n.shape === 'initial') {
          const r = Math.max(halfW, halfH);
          svg += `  <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
          if (n.shape === 'accepting' || n.isAccepting) {
            svg += `  <circle cx="${n.x}" cy="${n.y}" r="${r - 5}" fill="none" stroke="${stroke}" stroke-width="2" />\n`;
          }
        } else if (n.shape === 'decision') {
          svg += `  <polygon points="${n.x},${n.y - halfH} ${n.x + halfW},${n.y} ${n.x},${n.y + halfH} ${n.x - halfW},${n.y}" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
        } else if (n.shape === 'terminal') {
          svg += `  <rect x="${n.x - halfW}" y="${n.y - halfH}" width="${n.width}" height="${n.height}" rx="${halfH}" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
        } else {
          svg += `  <rect x="${n.x - halfW}" y="${n.y - halfH}" width="${n.width}" height="${n.height}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
        }

        svg += `  <text x="${n.x}" y="${n.y}" fill="${n.textColor || '#0f172a'}">${n.text}</text>\n`;
      });

      svg += `</svg>`;
      return svg;
    }
  }

  // Export to global window
  window.FlowchartModel = FlowchartModel;
  window.FlowchartPresets = Presets;
  window.FlowchartCanvasRenderer = FlowchartCanvasRenderer;

})(window);
