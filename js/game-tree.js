/**
 * TikZ Studio - Game Tree & Decision Tree Engine
 * Interactive Extensive-Form Game & Decision Tree Builder with TikZ LaTeX generation
 */

(function (window) {
  'use strict';

  // ID generator
  let idCounter = 1;
  function uniqueId(prefix = 'node') {
    return prefix + '_' + (idCounter++);
  }

  class GameTreeModel {
    constructor() {
      this.rootId = null;
      this.nodes = {}; // id -> Node
      this.infoSets = []; // array of { id, nodeIds: [], label, style }
      this.orientation = 'vertical'; // 'vertical' (top-down) or 'horizontal' (left-right)
      this.levelDistance = 90;
      this.siblingDistance = 65;
      this.nodeRadius = 14;
      this.defaultColors = {
        player1: '#3b82f6', // Blue
        player2: '#10b981', // Emerald
        player3: '#8b5cf6', // Violet
        nature: '#f59e0b',  // Amber
        terminal: '#475569',// Slate
        equilibrium: '#ef4444' // Red
      };
      this.title = 'Game Tree Diagram';
    }

    createNode(data = {}) {
      const id = data.id || uniqueId();
      const node = {
        id: id,
        parentId: data.parentId || null,
        children: data.children || [],
        type: data.type || 'decision', // 'decision', 'chance', 'terminal'
        player: data.player !== undefined ? data.player : 'P_1', // Player label e.g. P_1, P_2, Nature
        action: data.action || '',       // Action leading to this node (from parent)
        prob: data.prob || '',           // Probability leading to this node
        payoff: data.payoff || '',       // Payoffs if terminal e.g. "(3, 1)"
        isEquilibrium: !!data.isEquilibrium, // Highlighted branch
        branchStyle: data.branchStyle || 'solid', // 'solid', 'dashed'
        color: data.color || null,
        // Computed layout coordinates
        x: 0,
        y: 0,
        mod: 0
      };
      this.nodes[id] = node;
      return node;
    }

    addBranch(parentId, branchData = {}) {
      const parent = this.nodes[parentId];
      if (!parent) return null;

      // If parent was terminal, turn into decision node
      if (parent.type === 'terminal') {
        parent.type = 'decision';
        parent.payoff = '';
      }

      const child = this.createNode({
        parentId: parentId,
        type: branchData.type || 'terminal',
        action: branchData.action || (parent.children.length === 0 ? 'L' : 'R'),
        prob: branchData.prob || '',
        payoff: branchData.payoff || (branchData.type === 'terminal' ? '(0, 0)' : ''),
        player: branchData.player || (parent.player === 'P_1' ? 'P_2' : 'P_1'),
        isEquilibrium: !!branchData.isEquilibrium
      });

      parent.children.push(child.id);
      return child;
    }

    deleteNode(nodeId) {
      if (nodeId === this.rootId) return false; // Can't delete root
      const node = this.nodes[nodeId];
      if (!node) return false;

      // Remove from parent
      if (node.parentId && this.nodes[node.parentId]) {
        const parent = this.nodes[node.parentId];
        parent.children = parent.children.filter(id => id !== nodeId);
        if (parent.children.length === 0) {
          parent.type = 'terminal';
          if (!parent.payoff) parent.payoff = '(0, 0)';
        }
      }

      // Recursively collect all descendant IDs
      const toDelete = [];
      const collect = (currId) => {
        toDelete.push(currId);
        const curr = this.nodes[currId];
        if (curr && curr.children) {
          curr.children.forEach(collect);
        }
      };
      collect(nodeId);

      // Clean info sets
      this.infoSets.forEach(is => {
        is.nodeIds = is.nodeIds.filter(id => !toDelete.includes(id));
      });
      this.infoSets = this.infoSets.filter(is => is.nodeIds.length >= 2);

      toDelete.forEach(id => {
        delete this.nodes[id];
      });

      return true;
    }

    addInfoSet(nodeIds, label = '', style = 'dashed-curve') {
      if (!Array.isArray(nodeIds) || nodeIds.length < 2) return null;
      const isId = 'info_' + uniqueId('');
      const infoSet = {
        id: isId,
        nodeIds: [...new Set(nodeIds)],
        label: label,
        style: style // 'dashed-curve' or 'bubble'
      };
      this.infoSets.push(infoSet);
      return infoSet;
    }

    removeInfoSet(infoSetId) {
      this.infoSets = this.infoSets.filter(is => is.id !== infoSetId);
    }

    // Compute layout coordinates (Tidy Tree)
    computeLayout() {
      if (!this.rootId || !this.nodes[this.rootId]) return;

      const root = this.nodes[this.rootId];
      const isHorizontal = this.orientation === 'horizontal';

      // 1. Assign depth and level
      const assignDepths = (node, depth) => {
        node.depth = depth;
        if (node.children) {
          node.children.forEach(cid => {
            if (this.nodes[cid]) assignDepths(this.nodes[cid], depth + 1);
          });
        }
      };
      assignDepths(root, 0);

      // 2. Compute X positions for leaves and center parents
      let nextLeafX = 0;
      const layoutX = (node) => {
        if (!node.children || node.children.length === 0) {
          node.treeX = nextLeafX;
          nextLeafX += this.siblingDistance;
        } else {
          node.children.forEach(cid => {
            if (this.nodes[cid]) layoutX(this.nodes[cid]);
          });
          const validChildren = node.children.map(cid => this.nodes[cid]).filter(Boolean);
          if (validChildren.length > 0) {
            const first = validChildren[0].treeX;
            const last = validChildren[validChildren.length - 1].treeX;
            node.treeX = (first + last) / 2;
          } else {
            node.treeX = nextLeafX;
            nextLeafX += this.siblingDistance;
          }
        }
      };
      layoutX(root);

      // 3. Center whole tree relative to root at 0
      const rootXOffset = root.treeX;
      Object.values(this.nodes).forEach(n => {
        const shiftedX = (n.treeX || 0) - rootXOffset;
        const depthY = (n.depth || 0) * this.levelDistance;

        if (isHorizontal) {
          n.x = depthY;
          n.y = shiftedX;
        } else {
          n.x = shiftedX;
          n.y = depthY;
        }
      });
    }

    // Get bounding box of all nodes
    getBounds() {
      const nodes = Object.values(this.nodes);
      if (nodes.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 };

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      });

      const pad = 60;
      return {
        minX: minX - pad,
        maxX: maxX + pad,
        minY: minY - pad,
        maxY: maxY + pad,
        width: Math.max(200, (maxX - minX) + pad * 2),
        height: Math.max(200, (maxY - minY) + pad * 2)
      };
    }

    // Generate TikZ Code
    generateTikZ() {
      if (!this.rootId || !this.nodes[this.rootId]) return '% Empty tree';

      this.computeLayout();
      const isHorizontal = this.orientation === 'horizontal';

      let out = '';
      out += '\\begin{tikzpicture}[\n';
      out += '  scale=1.1,\n';
      out += '  font=\\small,\n';
      out += '  >=stealth,\n';
      out += '  decision/.style={circle, draw=blue!70!black, fill=blue!8, thick, inner sep=2pt, minimum size=20pt},\n';
      out += '  chance/.style={circle, fill=amber!90!black, draw=amber!90!black, inner sep=2pt, minimum size=8pt},\n';
      out += '  terminal/.style={inner sep=1.5pt},\n';
      out += '  branch/.style={thick, draw=gray!80!black},\n';
      out += '  eq_branch/.style={very thick, draw=red!80!black},\n';
      out += '  info_set/.style={thick, dashed, draw=gray!60!black}\n';
      out += ']\n\n';

      // Map node ID to coordinates in cm (scale down canvas pixels to ~1cm per 70px)
      const scaleFactor = 0.025;
      const coordMap = {};

      Object.values(this.nodes).forEach(node => {
        // TikZ coordinate system: Y is up (+y), canvas Y is down (+y)
        const tikzX = (node.x * scaleFactor).toFixed(2);
        const tikzY = (-node.y * scaleFactor).toFixed(2);
        coordMap[node.id] = { x: tikzX, y: tikzY };
      });

      // 1. Draw Information Sets (underneath branches for clean look)
      if (this.infoSets.length > 0) {
        out += '  % Information Sets (Imperfect Information)\n';
        this.infoSets.forEach(is => {
          const validNodes = is.nodeIds.filter(id => this.nodes[id] && coordMap[id]);
          if (validNodes.length >= 2) {
            for (let i = 0; i < validNodes.length - 1; i++) {
              const u = validNodes[i];
              const v = validNodes[i + 1];
              const bendDir = isHorizontal ? 'bend left=20' : 'bend right=15';
              const labelOpt = is.label ? ` node[midway, fill=white, inner sep=1pt]{$${is.label}$}` : '';
              out += `  \\draw[info_set] (${coordMap[u].x}, ${coordMap[u].y}) to[${bendDir}]${labelOpt} (${coordMap[v].x}, ${coordMap[v].y});\n`;
            }
          }
        });
        out += '\n';
      }

      // 2. Draw Branches (edges from parent to child)
      out += '  % Branches / Actions\n';
      Object.values(this.nodes).forEach(node => {
        if (!node.children || node.children.length === 0) return;

        node.children.forEach(cid => {
          const child = this.nodes[cid];
          if (!child || !coordMap[child.id] || !coordMap[node.id]) return;

          const pCoord = `(${coordMap[node.id].x}, ${coordMap[node.id].y})`;
          const cCoord = `(${coordMap[child.id].x}, ${coordMap[child.id].y})`;
          const branchStyle = child.isEquilibrium ? 'eq_branch' : 'branch';

          // Action & Prob label positioning
          let labelTikz = '';
          const actionText = child.action ? `$${child.action}$` : '';
          const probText = child.prob ? `\\footnotesize$${child.prob}$` : '';

          // Determine label placement based on geometry
          const dx = child.x - node.x;
          const dy = child.y - node.y;
          let actionPos = 'above left';
          let probPos = 'below right';

          if (isHorizontal) {
            if (dy < -10) { actionPos = 'above'; probPos = 'below'; }
            else if (dy > 10) { actionPos = 'below'; probPos = 'above'; }
            else { actionPos = 'above'; probPos = 'below'; }
          } else {
            if (dx < -10) { actionPos = 'above left'; probPos = 'below left'; }
            else if (dx > 10) { actionPos = 'above right'; probPos = 'below right'; }
            else { actionPos = 'left'; probPos = 'right'; }
          }

          if (actionText && probText) {
            labelTikz = ` node[midway, ${actionPos}]{${actionText}} node[midway, ${probPos}]{${probText}}`;
          } else if (actionText) {
            labelTikz = ` node[midway, ${actionPos}]{${actionText}}`;
          } else if (probText) {
            labelTikz = ` node[midway, ${probPos}]{${probText}}`;
          }

          out += `  \\draw[${branchStyle}] ${pCoord} -- ${cCoord}${labelTikz};\n`;
        });
      });
      out += '\n';

      // 3. Draw Nodes
      out += '  % Decision, Chance, and Terminal Nodes\n';
      Object.values(this.nodes).forEach(node => {
        const coord = `(${coordMap[node.id].x}, ${coordMap[node.id].y})`;

        if (node.type === 'decision') {
          const playerLabel = node.player ? `$${node.player}$` : '';
          out += `  \\node[decision] at ${coord} {${playerLabel}}; % ${node.id}\n`;
        } else if (node.type === 'chance') {
          const chanceLabel = node.player ? ` node[above=4pt]{\\footnotesize $${node.player}$}` : '';
          out += `  \\node[chance] at ${coord} {};${chanceLabel}\n`;
        } else if (node.type === 'terminal') {
          const payoffText = node.payoff ? `$${node.payoff}$` : '';
          const termPos = isHorizontal ? 'right=2pt' : 'below=2pt';
          out += `  \\node[terminal, ${termPos}] at ${coord} {${payoffText}};\n`;
        }
      });

      out += '\\end{tikzpicture}';
      return out;
    }

    // Export JSON
    toJSON() {
      return {
        title: this.title,
        orientation: this.orientation,
        levelDistance: this.levelDistance,
        siblingDistance: this.siblingDistance,
        rootId: this.rootId,
        nodes: this.nodes,
        infoSets: this.infoSets
      };
    }

    // Load JSON
    fromJSON(data) {
      if (!data || !data.nodes || !data.rootId) return false;
      this.title = data.title || 'Game Tree Diagram';
      this.orientation = data.orientation || 'vertical';
      this.levelDistance = data.levelDistance || 90;
      this.siblingDistance = data.siblingDistance || 65;
      this.rootId = data.rootId;
      this.nodes = data.nodes;
      this.infoSets = data.infoSets || [];
      this.computeLayout();
      return true;
    }
  }

  // Classic Presets
  const Presets = {
    'market-entry': () => {
      const tree = new GameTreeModel();
      tree.title = 'Market Entry Deterrence (Subgame Perfect)';
      tree.orientation = 'vertical';
      tree.levelDistance = 90;
      tree.siblingDistance = 110;

      // Root: Entrant
      const r = tree.createNode({ type: 'decision', player: 'E', action: '' });
      tree.rootId = r.id;

      // Entrant branches: Stay Out (terminal) or Enter
      const nOut = tree.addBranch(r.id, {
        action: '\\text{Stay Out}',
        type: 'terminal',
        payoff: '(0, 2)'
      });

      const nEnter = tree.addBranch(r.id, {
        action: '\\text{Enter}',
        type: 'decision',
        player: 'I',
        isEquilibrium: true
      });

      // Incumbent branches: Fight or Accommodate
      tree.addBranch(nEnter.id, {
        action: '\\text{Fight}',
        type: 'terminal',
        payoff: '(-1, -1)'
      });

      tree.addBranch(nEnter.id, {
        action: '\\text{Accommodate}',
        type: 'terminal',
        payoff: '(1, 1)',
        isEquilibrium: true
      });

      tree.computeLayout();
      return tree;
    },

    'spence-signaling': () => {
      const tree = new GameTreeModel();
      tree.title = 'Job Market Signaling (Spence Model)';
      tree.orientation = 'vertical';
      tree.levelDistance = 85;
      tree.siblingDistance = 80;

      // Nature moves first: High or Low ability worker
      const nature = tree.createNode({ type: 'chance', player: '\\mathcal{N}', action: '' });
      tree.rootId = nature.id;

      // Branch 1: High Ability Worker
      const highWorker = tree.addBranch(nature.id, {
        action: '\\theta_H',
        prob: 'p',
        type: 'decision',
        player: 'W'
      });

      // Branch 2: Low Ability Worker
      const lowWorker = tree.addBranch(nature.id, {
        action: '\\theta_L',
        prob: '1-p',
        type: 'decision',
        player: 'W'
      });

      // High Worker decisions: Edu (e=1) or No Edu (e=0)
      const f1 = tree.addBranch(highWorker.id, { action: 'e=1', type: 'decision', player: 'F' });
      const f2 = tree.addBranch(highWorker.id, { action: 'e=0', type: 'decision', player: 'F' });

      // Low Worker decisions: Edu (e=1) or No Edu (e=0)
      const f3 = tree.addBranch(lowWorker.id, { action: 'e=1', type: 'decision', player: 'F' });
      const f4 = tree.addBranch(lowWorker.id, { action: 'e=0', type: 'decision', player: 'F' });

      // Firm decisions after e=1 (High wage vs Low wage)
      tree.addBranch(f1.id, { action: 'w_H', type: 'terminal', payoff: '(w_H - c_H, y_H - w_H)' });
      tree.addBranch(f1.id, { action: 'w_L', type: 'terminal', payoff: '(w_L - c_H, y_H - w_L)' });

      tree.addBranch(f2.id, { action: 'w_H', type: 'terminal', payoff: '(w_H, y_H - w_H)' });
      tree.addBranch(f2.id, { action: 'w_L', type: 'terminal', payoff: '(w_L, y_H - w_L)' });

      tree.addBranch(f3.id, { action: 'w_H', type: 'terminal', payoff: '(w_H - c_L, y_L - w_H)' });
      tree.addBranch(f3.id, { action: 'w_L', type: 'terminal', payoff: '(w_L - c_L, y_L - w_L)' });

      tree.addBranch(f4.id, { action: 'w_H', type: 'terminal', payoff: '(w_H, y_L - w_H)' });
      tree.addBranch(f4.id, { action: 'w_L', type: 'terminal', payoff: '(w_L, y_L - w_L)' });

      // Information Sets: Firm doesn't know worker ability when seeing e=1, nor when seeing e=0
      tree.addInfoSet([f1.id, f3.id], 'I_{e=1}');
      tree.addInfoSet([f2.id, f4.id], 'I_{e=0}');

      tree.computeLayout();
      return tree;
    },

    'centipede': () => {
      const tree = new GameTreeModel();
      tree.title = '4-Stage Centipede Game';
      tree.orientation = 'horizontal';
      tree.levelDistance = 95;
      tree.siblingDistance = 65;

      const n1 = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = n1.id;

      // P1 stage 1: Take (terminal) or Pass
      tree.addBranch(n1.id, { action: 'T', type: 'terminal', payoff: '(1, 0)' });
      const n2 = tree.addBranch(n1.id, { action: 'P', type: 'decision', player: 'P_2' });

      // P2 stage 2: Take or Pass
      tree.addBranch(n2.id, { action: 'T', type: 'terminal', payoff: '(0, 3)' });
      const n3 = tree.addBranch(n2.id, { action: 'P', type: 'decision', player: 'P_1' });

      // P1 stage 3: Take or Pass
      tree.addBranch(n3.id, { action: 'T', type: 'terminal', payoff: '(3, 2)' });
      const n4 = tree.addBranch(n3.id, { action: 'P', type: 'decision', player: 'P_2' });

      // P2 stage 4: Take or Pass
      tree.addBranch(n4.id, { action: 'T', type: 'terminal', payoff: '(2, 5)' });
      tree.addBranch(n4.id, { action: 'P', type: 'terminal', payoff: '(4, 4)' });

      tree.computeLayout();
      return tree;
    },

    'sequential-dilemma': () => {
      const tree = new GameTreeModel();
      tree.title = "Sequential Prisoner's Dilemma";
      tree.orientation = 'vertical';
      tree.levelDistance = 90;
      tree.siblingDistance = 90;

      const p1 = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = p1.id;

      const p2_coop = tree.addBranch(p1.id, { action: 'C', type: 'decision', player: 'P_2' });
      const p2_defect = tree.addBranch(p1.id, { action: 'D', type: 'decision', player: 'P_2', isEquilibrium: true });

      // If P1 played C
      tree.addBranch(p2_coop.id, { action: 'C', type: 'terminal', payoff: '(3, 3)' });
      tree.addBranch(p2_coop.id, { action: 'D', type: 'terminal', payoff: '(0, 5)', isEquilibrium: false });

      // If P1 played D
      tree.addBranch(p2_defect.id, { action: 'C', type: 'terminal', payoff: '(5, 0)' });
      tree.addBranch(p2_defect.id, { action: 'D', type: 'terminal', payoff: '(1, 1)', isEquilibrium: true });

      tree.computeLayout();
      return tree;
    },

    'ultimatum': () => {
      const tree = new GameTreeModel();
      tree.title = 'Ultimatum Bargaining Game';
      tree.orientation = 'vertical';
      tree.levelDistance = 95;
      tree.siblingDistance = 85;

      const prop = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = prop.id;

      // Offers: Fair (5:5) or Greedy (8:2)
      const respFair = tree.addBranch(prop.id, { action: 's=5', type: 'decision', player: 'P_2' });
      const respGreedy = tree.addBranch(prop.id, { action: 's=2', type: 'decision', player: 'P_2', isEquilibrium: true });

      // After fair offer
      tree.addBranch(respFair.id, { action: 'A', type: 'terminal', payoff: '(5, 5)' });
      tree.addBranch(respFair.id, { action: 'R', type: 'terminal', payoff: '(0, 0)' });

      // After greedy offer
      tree.addBranch(respGreedy.id, { action: 'A', type: 'terminal', payoff: '(8, 2)', isEquilibrium: true });
      tree.addBranch(respGreedy.id, { action: 'R', type: 'terminal', payoff: '(0, 0)' });

      tree.computeLayout();
      return tree;
    },

    'matching-pennies-imperfect': () => {
      const tree = new GameTreeModel();
      tree.title = 'Matching Pennies (Simultaneous / Imperfect Info)';
      tree.orientation = 'vertical';
      tree.levelDistance = 90;
      tree.siblingDistance = 90;

      const p1 = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = p1.id;

      const p2_h = tree.addBranch(p1.id, { action: 'H', type: 'decision', player: 'P_2' });
      const p2_t = tree.addBranch(p1.id, { action: 'T', type: 'decision', player: 'P_2' });

      // P2 choices from H
      tree.addBranch(p2_h.id, { action: 'H', type: 'terminal', payoff: '(1, -1)' });
      tree.addBranch(p2_h.id, { action: 'T', type: 'terminal', payoff: '(-1, 1)' });

      // P2 choices from T
      tree.addBranch(p2_t.id, { action: 'H', type: 'terminal', payoff: '(-1, 1)' });
      tree.addBranch(p2_t.id, { action: 'T', type: 'terminal', payoff: '(1, -1)' });

      // Information Set for P2: does not observe P1's choice
      tree.addInfoSet([p2_h.id, p2_t.id], 'P_2');

      tree.computeLayout();
      return tree;
    },

    'rubinstein-bargaining': () => {
      const tree = new GameTreeModel();
      tree.title = 'Rubinstein Alternating-Offer Bargaining (3 Stages)';
      tree.orientation = 'horizontal';
      tree.levelDistance = 110;
      tree.siblingDistance = 65;

      // t=0: Player 1 offers s_1
      const p1_0 = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = p1_0.id;

      // P2 either Accepts offer or Rejects
      const p2_0 = tree.addBranch(p1_0.id, { action: 's_1', type: 'decision', player: 'P_2' });
      tree.addBranch(p2_0.id, { action: '\\text{Accept}', type: 'terminal', payoff: '(1 - s_1, s_1)' });

      // If Reject, at t=1 discount factor delta applies; P2 makes counter-offer s_2
      const p1_1 = tree.addBranch(p2_0.id, { action: '\\text{Reject}', type: 'decision', player: 'P_1' });
      const p2_counter = tree.addBranch(p1_1.id, { action: 's_2', type: 'decision', player: 'P_1' });
      tree.addBranch(p2_counter.id, { action: '\\text{Accept}', type: 'terminal', payoff: '(\\delta s_2, \\delta (1 - s_2))' });

      // If Reject again, t=2 final round
      const p1_final = tree.addBranch(p2_counter.id, { action: '\\text{Reject}', type: 'decision', player: 'P_2' });
      tree.addBranch(p1_final.id, { action: '\\text{Accept}', type: 'terminal', payoff: '(\\delta^2 (1 - s_3), \\delta^2 s_3)' });
      tree.addBranch(p1_final.id, { action: '\\text{Breakdown}', type: 'terminal', payoff: '(0, 0)' });

      tree.computeLayout();
      return tree;
    },

    'principal-agent': () => {
      const tree = new GameTreeModel();
      tree.title = 'Principal-Agent Contracting (Moral Hazard)';
      tree.orientation = 'vertical';
      tree.levelDistance = 90;
      tree.siblingDistance = 80;

      // Principal chooses contract
      const principal = tree.createNode({ type: 'decision', player: '\\text{Prin}' });
      tree.rootId = principal.id;

      // Offer Contract
      const agent = tree.addBranch(principal.id, { action: 'w(y)', type: 'decision', player: '\\text{Agent}', isEquilibrium: true });
      tree.addBranch(principal.id, { action: '\\text{No Deal}', type: 'terminal', payoff: '(0, \\bar{u})' });

      // Agent chooses High or Low effort
      const natHigh = tree.addBranch(agent.id, { action: 'e_H', type: 'chance', player: '\\mathcal{N}', isEquilibrium: true });
      const natLow = tree.addBranch(agent.id, { action: 'e_L', type: 'chance', player: '\\mathcal{N}' });

      // Nature outcome for High Effort (Good vs Bad output)
      tree.addBranch(natHigh.id, { action: 'y_G', prob: 'p_H', type: 'terminal', payoff: '(y_G - w_H, u(w_H) - c_H)', isEquilibrium: true });
      tree.addBranch(natHigh.id, { action: 'y_B', prob: '1 - p_H', type: 'terminal', payoff: '(y_B - w_L, u(w_L) - c_H)' });

      // Nature outcome for Low Effort
      tree.addBranch(natLow.id, { action: 'y_G', prob: 'p_L', type: 'terminal', payoff: '(y_G - w_H, u(w_H) - c_L)' });
      tree.addBranch(natLow.id, { action: 'y_B', prob: '1 - p_L', type: 'terminal', payoff: '(y_B - w_L, u(w_L) - c_L)' });

      tree.computeLayout();
      return tree;
    },

    'stackelberg-duopoly': () => {
      const tree = new GameTreeModel();
      tree.title = 'Stackelberg Sequential Duopoly';
      tree.orientation = 'vertical';
      tree.levelDistance = 95;
      tree.siblingDistance = 90;

      // Leader firm commits to output first
      const leader = tree.createNode({ type: 'decision', player: 'L' });
      tree.rootId = leader.id;

      const foll_high = tree.addBranch(leader.id, { action: 'q_L^H', type: 'decision', player: 'F', isEquilibrium: true });
      const foll_low = tree.addBranch(leader.id, { action: 'q_L^L', type: 'decision', player: 'F' });

      // If Leader produced High quantity
      tree.addBranch(foll_high.id, { action: 'q_F^H', type: 'terminal', payoff: '(2, 2)' });
      tree.addBranch(foll_high.id, { action: 'q_F^L', type: 'terminal', payoff: '(4, 1)', isEquilibrium: true });

      // If Leader produced Low quantity
      tree.addBranch(foll_low.id, { action: 'q_F^H', type: 'terminal', payoff: '(1, 4)' });
      tree.addBranch(foll_low.id, { action: 'q_F^L', type: 'terminal', payoff: '(3, 3)' });

      tree.computeLayout();
      return tree;
    },

    'beer-quiche': () => {
      const tree = new GameTreeModel();
      tree.title = 'Beer-Quiche Signaling Game (Cho-Kreps)';
      tree.orientation = 'vertical';
      tree.levelDistance = 85;
      tree.siblingDistance = 75;

      // Nature picks Player 1 type: Surly (0.9) vs Wimp (0.1)
      const nature = tree.createNode({ type: 'chance', player: '\\mathcal{N}' });
      tree.rootId = nature.id;

      const surly = tree.addBranch(nature.id, { action: '\\text{Surly}', prob: '0.9', type: 'decision', player: 'P_1' });
      const wimp = tree.addBranch(nature.id, { action: '\\text{Wimp}', prob: '0.1', type: 'decision', player: 'P_1' });

      // Surly can eat Beer (preferred +1) or Quiche (0)
      const b_s = tree.addBranch(surly.id, { action: '\\text{Beer}', type: 'decision', player: 'P_2', isEquilibrium: true });
      const q_s = tree.addBranch(surly.id, { action: '\\text{Quiche}', type: 'decision', player: 'P_2' });

      // Wimp can eat Beer (0) or Quiche (preferred +1)
      const b_w = tree.addBranch(wimp.id, { action: '\\text{Beer}', type: 'decision', player: 'P_2', isEquilibrium: true });
      const q_w = tree.addBranch(wimp.id, { action: '\\text{Quiche}', type: 'decision', player: 'P_2' });

      // P2 decisions after observing Beer
      tree.addBranch(b_s.id, { action: '\\text{Duel}', type: 'terminal', payoff: '(1, 0)' });
      tree.addBranch(b_s.id, { action: '\\text{No Duel}', type: 'terminal', payoff: '(3, 1)', isEquilibrium: true });
      tree.addBranch(b_w.id, { action: '\\text{Duel}', type: 'terminal', payoff: '(0, 0)' });
      tree.addBranch(b_w.id, { action: '\\text{No Duel}', type: 'terminal', payoff: '(2, 1)', isEquilibrium: true });

      // P2 decisions after observing Quiche
      tree.addBranch(q_s.id, { action: '\\text{Duel}', type: 'terminal', payoff: '(0, 0)' });
      tree.addBranch(q_s.id, { action: '\\text{No Duel}', type: 'terminal', payoff: '(2, 1)' });
      tree.addBranch(q_w.id, { action: '\\text{Duel}', type: 'terminal', payoff: '(1, 0)' });
      tree.addBranch(q_w.id, { action: '\\text{No Duel}', type: 'terminal', payoff: '(3, 1)' });

      // Info sets: P2 only knows if breakfast was Beer or Quiche, not true type
      tree.addInfoSet([b_s.id, b_w.id], 'I_{\\text{Beer}}');
      tree.addInfoSet([q_s.id, q_w.id], 'I_{\\text{Quiche}}');

      tree.computeLayout();
      return tree;
    },

    'trust-game': () => {
      const tree = new GameTreeModel();
      tree.title = 'Trust / Investment Game (Berg et al.)';
      tree.orientation = 'vertical';
      tree.levelDistance = 90;
      tree.siblingDistance = 90;

      const investor = tree.createNode({ type: 'decision', player: 'P_1' });
      tree.rootId = investor.id;

      // Investor either keeps endowment (10, 10) or transfers 10 (tripled to 30)
      tree.addBranch(investor.id, { action: '\\text{Keep}', type: 'terminal', payoff: '(10, 10)' });
      const trustee = tree.addBranch(investor.id, { action: '\\text{Invest}', type: 'decision', player: 'P_2' });

      // Trustee either Keeps all 40 or Shares 15 back
      tree.addBranch(trustee.id, { action: '\\text{Keep All}', type: 'terminal', payoff: '(0, 40)' });
      tree.addBranch(trustee.id, { action: '\\text{Share Fairly}', type: 'terminal', payoff: '(15, 25)', isEquilibrium: true });

      tree.computeLayout();
      return tree;
    }
  };

  // Canvas Viewport Renderer
  class GameTreeCanvasRenderer {
    constructor(canvas, model) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.model = model;

      // Viewport transform
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;

      // Interactive state
      this.selectedNodeId = null;
      this.hoveredNodeId = null;
      this.isPanning = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.mouseDownPos = { x: 0, y: 0 };
      this.hasMovedSignificantly = false;

      this.initEvents();
      this.fitToScreen();
    }

    // Convert mouse/touch client coordinates into exact canvas pixel buffer coordinates
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

    initEvents() {
      const c = this.canvas;

      const handlePointerDown = (e) => {
        const coords = this.getCanvasCoords(e);
        this.lastMouseX = coords.x;
        this.lastMouseY = coords.y;
        this.mouseDownPos = { x: coords.x, y: coords.y };
        this.hasMovedSignificantly = false;

        // Middle button, right button, or Shift key -> Pan canvas
        if (e.button === 1 || e.button === 2 || e.shiftKey) {
          this.isPanning = true;
          e.preventDefault();
          return;
        }

        // Hit test to see if user clicked directly on a node, payoff, or branch
        const worldPos = this.screenToWorld(coords.x, coords.y);
        const hitNode = this.hitTest(worldPos.x, worldPos.y);

        if (hitNode) {
          this.selectedNodeId = hitNode.id;
          if (window.onGameTreeNodeSelected) {
            window.onGameTreeNodeSelected(hitNode);
          }
          this.render();
        } else {
          this.isPanning = true;
        }
      };

      const handlePointerMove = (e) => {
        const coords = this.getCanvasCoords(e);

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

        // Hover test
        const worldPos = this.screenToWorld(coords.x, coords.y);
        const hitNode = this.hitTest(worldPos.x, worldPos.y);
        const prevHover = this.hoveredNodeId;
        this.hoveredNodeId = hitNode ? hitNode.id : null;

        if (prevHover !== this.hoveredNodeId) {
          c.style.cursor = hitNode ? 'pointer' : 'default';
          this.render();
        }
      };

      const handlePointerUp = (e) => {
        if (!this.hasMovedSignificantly && this.isPanning) {
          // If it was a quick click without moving, re-evaluate hit test
          const coords = this.getCanvasCoords(e);
          const worldPos = this.screenToWorld(coords.x, coords.y);
          const hitNode = this.hitTest(worldPos.x, worldPos.y);
          if (hitNode) {
            this.selectedNodeId = hitNode.id;
            if (window.onGameTreeNodeSelected) {
              window.onGameTreeNodeSelected(hitNode);
            }
            this.render();
          }
        }
        this.isPanning = false;
      };

      // Mouse Listeners
      c.addEventListener('mousedown', handlePointerDown);
      c.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);

      // Touch Listeners
      c.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          handlePointerDown(e);
        }
      }, { passive: false });

      c.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          handlePointerMove(e);
        }
      }, { passive: false });

      c.addEventListener('touchend', (e) => {
        handlePointerUp(e);
      });

      c.addEventListener('contextmenu', (e) => e.preventDefault());

      // Wheel zoom (centered at mouse coordinates)
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const coords = this.getCanvasCoords(e);

        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        const newScale = Math.min(Math.max(0.3, this.scale * zoomFactor), 3.0);

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

    // Distance from point to line segment
    distanceToSegment(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      return Math.hypot(px - projX, py - projY);
    }

    // Comprehensive hit testing: Decision nodes, Nature nodes, Terminal nodes, Payoffs, and Branches
    hitTest(wx, wy) {
      if (!this.model || !this.model.nodes) return null;

      let closestNode = null;
      let minDistanceSq = Infinity;
      const isHorizontal = this.model.orientation === 'horizontal';

      // 1. Check all nodes first (highest priority)
      for (const node of Object.values(this.model.nodes)) {
        const dx = wx - node.x;
        const dy = wy - node.y;
        const distSq = dx * dx + dy * dy;

        let clickRadius = this.model.nodeRadius + 8; // ~22px
        if (node.type === 'chance') {
          clickRadius = 18;
        } else if (node.type === 'terminal') {
          clickRadius = 24;
        }

        if (distSq <= clickRadius * clickRadius) {
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestNode = node;
          }
        }

        // For terminal nodes, also check payoff text area
        if (node.type === 'terminal' && node.payoff) {
          const payoffX = isHorizontal ? node.x + 22 : node.x;
          const payoffY = isHorizontal ? node.y : node.y + 20;
          const pdx = Math.abs(wx - payoffX);
          const pdy = Math.abs(wy - payoffY);

          if (pdx <= 32 && pdy <= 20) {
            const pDistSq = (wx - payoffX) * (wx - payoffX) + (wy - payoffY) * (wy - payoffY);
            if (pDistSq < minDistanceSq) {
              minDistanceSq = pDistSq;
              closestNode = node;
            }
          }
        }
      }

      if (closestNode) {
        return closestNode;
      }

      // 2. If no direct node hit, check if user clicked a branch or its action/probability label!
      // Clicking a branch selects the child/destination node of that branch
      let closestBranchChild = null;
      let minBranchDist = Infinity;

      Object.values(this.model.nodes).forEach(parentNode => {
        if (!parentNode.children || parentNode.children.length === 0) return;

        parentNode.children.forEach(cid => {
          const childNode = this.model.nodes[cid];
          if (!childNode) return;

          // Check branch action/probability label position
          const midX = (parentNode.x + childNode.x) / 2;
          const midY = (parentNode.y + childNode.y) / 2;
          const dx = childNode.x - parentNode.x;
          const dy = childNode.y - parentNode.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;

          const actionX = midX + nx * 14;
          const actionY = midY + ny * 14;
          const probX = midX - nx * 14;
          const probY = midY - ny * 14;

          const dAction = Math.hypot(wx - actionX, wy - actionY);
          const dProb = Math.hypot(wx - probX, wy - probY);

          if (dAction <= 22 && dAction < minBranchDist) {
            minBranchDist = dAction;
            closestBranchChild = childNode;
          }
          if (dProb <= 22 && dProb < minBranchDist) {
            minBranchDist = dProb;
            closestBranchChild = childNode;
          }

          // Check distance from point to line segment
          const dSegment = this.distanceToSegment(wx, wy, parentNode.x, parentNode.y, childNode.x, childNode.y);
          if (dSegment <= 14 && dSegment < minBranchDist) {
            minBranchDist = dSegment;
            closestBranchChild = childNode;
          }
        });
      });

      return closestBranchChild;
    }

    fitToScreen() {
      this.model.computeLayout();
      const bounds = this.model.getBounds();
      const cw = this.canvas.width;
      const ch = this.canvas.height;

      const scaleX = (cw - 80) / bounds.width;
      const scaleY = (ch - 80) / bounds.height;
      this.scale = Math.min(Math.max(0.4, Math.min(scaleX, scaleY)), 1.25);

      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      this.panX = cw / 2 - centerX * this.scale;
      this.panY = ch / 2 - centerY * this.scale;

      this.render();
    }

    render() {
      const ctx = this.ctx;
      const cw = this.canvas.width;
      const ch = this.canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      // Draw subtle background grid dots
      ctx.save();
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, cw, ch);

      // Subtle dot grid
      const gridSize = 25 * this.scale;
      const offsetX = this.panX % gridSize;
      const offsetY = this.panY % gridSize;

      ctx.fillStyle = '#cbd5e1';
      for (let x = offsetX; x < cw; x += gridSize) {
        for (let y = offsetY; y < ch; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      // 1. Draw Information Sets (dashed connector bends or bubbles)
      this.renderInfoSets(ctx);

      // 2. Draw Branches
      this.renderBranches(ctx);

      // 3. Draw Nodes
      this.renderNodes(ctx);

      ctx.restore();
    }

    renderInfoSets(ctx) {
      const isHorizontal = this.model.orientation === 'horizontal';

      this.model.infoSets.forEach(is => {
        const validNodes = is.nodeIds.map(id => this.model.nodes[id]).filter(Boolean);
        if (validNodes.length < 2) return;

        ctx.save();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);

        for (let i = 0; i < validNodes.length - 1; i++) {
          const u = validNodes[i];
          const v = validNodes[i + 1];

          // Compute control point for nice arch/bend
          const midX = (u.x + v.x) / 2;
          const midY = (u.y + v.y) / 2;
          const dist = Math.hypot(v.x - u.x, v.y - u.y);
          const bend = Math.min(30, dist * 0.25);

          let cpX = midX;
          let cpY = midY;
          if (isHorizontal) {
            cpX += bend;
          } else {
            cpY += bend;
          }

          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.quadraticCurveTo(cpX, cpY, v.x, v.y);
          ctx.stroke();

          // Label
          if (is.label) {
            ctx.save();
            ctx.setLineDash([]);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#475569';
            if (window.drawMathText) {
              window.drawMathText(ctx, is.label, cpX, cpY, { fontSize: 12, color: '#475569', align: 'center', baseline: 'middle' });
            } else {
              ctx.fillText(is.label, cpX, cpY);
            }
            ctx.restore();
          }
        }

        ctx.restore();
      });
    }

    renderBranches(ctx) {
      const isHorizontal = this.model.orientation === 'horizontal';

      Object.values(this.model.nodes).forEach(node => {
        if (!node.children || node.children.length === 0) return;

        node.children.forEach(cid => {
          const child = this.model.nodes[cid];
          if (!child) return;

          const isBranchSelected = (child.id === this.selectedNodeId);
          const isBranchHovered = (child.id === this.hoveredNodeId);

          ctx.save();

          // Equilibrium branch highlight
          if (child.isEquilibrium) {
            ctx.strokeStyle = '#ef4444'; // Red
            ctx.lineWidth = isBranchSelected ? 4.5 : 3.5;
            ctx.setLineDash([]);
          } else if (child.branchStyle === 'dashed') {
            ctx.strokeStyle = isBranchSelected ? '#4f46e5' : (isBranchHovered ? '#6366f1' : '#64748b');
            ctx.lineWidth = isBranchSelected ? 3 : 2;
            ctx.setLineDash([4, 4]);
          } else {
            ctx.strokeStyle = isBranchSelected ? '#4f46e5' : (isBranchHovered ? '#6366f1' : '#334155');
            ctx.lineWidth = isBranchSelected ? 3.5 : (isBranchHovered ? 2.5 : 2);
            ctx.setLineDash([]);
          }

          if (isBranchSelected) {
            ctx.shadowColor = 'rgba(79, 70, 229, 0.4)';
            ctx.shadowBlur = 6;
          }

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(child.x, child.y);
          ctx.stroke();
          ctx.restore();

          // Draw action and probability text along the branch
          const midX = (node.x + child.x) / 2;
          const midY = (node.y + child.y) / 2;

          const dx = child.x - node.x;
          const dy = child.y - node.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len; // Normal vector
          const ny = dx / len;

          const offsetDist = 14;
          const actionX = midX + nx * offsetDist;
          const actionY = midY + ny * offsetDist;
          const probX = midX - nx * offsetDist;
          const probY = midY - ny * offsetDist;

          ctx.save();
          if (child.action) {
            const actCol = child.isEquilibrium ? '#dc2626' : (isBranchSelected ? '#4338ca' : '#1e293b');
            ctx.font = isBranchSelected ? 'bold 13px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
            if (window.drawMathText) {
              window.drawMathText(ctx, child.action, actionX, actionY, { fontSize: isBranchSelected ? 14 : 13, color: actCol, align: 'center', baseline: 'middle' });
            } else {
              ctx.fillStyle = actCol;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(child.action, actionX, actionY);
            }
          }

          if (child.prob) {
            ctx.font = '11px Inter, sans-serif';
            if (window.drawMathText) {
              window.drawMathText(ctx, child.prob, probX, probY, { fontSize: 11, color: isBranchSelected ? '#4338ca' : '#64748b', align: 'center', baseline: 'middle' });
            } else {
              ctx.fillStyle = isBranchSelected ? '#4338ca' : '#64748b';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(child.prob, probX, probY);
            }
          }
          ctx.restore();
        });
      });
    }

    renderNodes(ctx) {
      const isHorizontal = this.model.orientation === 'horizontal';

      Object.values(this.model.nodes).forEach(node => {
        const isSelected = node.id === this.selectedNodeId;
        const isHovered = node.id === this.hoveredNodeId;
        const r = this.model.nodeRadius;

        ctx.save();
        ctx.translate(node.x, node.y);

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Draw node according to type
        if (node.type === 'decision') {
          // Circle decision node
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = node.color || '#eff6ff'; // Light blue
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#4f46e5' : '#2563eb';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Player label inside or above
          if (node.player) {
            const playerCol = isSelected ? '#312e81' : '#1e3a8a';
            ctx.font = 'bold 12px Inter, sans-serif';
            if (window.drawMathText) {
              window.drawMathText(ctx, node.player, 0, 0, { fontSize: 12, color: playerCol, align: 'center', baseline: 'middle' });
            } else {
              ctx.fillStyle = playerCol;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(node.player, 0, 0);
            }
          }
        } else if (node.type === 'chance') {
          // Solid dot or small circle for nature / chance
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#d97706'; // Amber
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (node.player) {
            ctx.font = '11px Inter, sans-serif';
            if (window.drawMathText) {
              window.drawMathText(ctx, node.player, 0, -12, { fontSize: 11, color: '#b45309', align: 'center', baseline: 'bottom' });
            } else {
              ctx.fillStyle = '#b45309';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(node.player, 0, -12);
            }
          }
        } else if (node.type === 'terminal') {
          // Terminal node: small tick marker or dot
          ctx.beginPath();
          ctx.arc(0, 0, isSelected ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#4f46e5' : '#475569';
          ctx.fill();

          // Payoff text
          if (node.payoff) {
            const offset = isHorizontal ? { x: 8, y: 0, align: 'left', base: 'middle' } : { x: 0, y: 13, align: 'center', base: 'top' };
            
            // Highlight background if selected or hovered
            if (isSelected || isHovered) {
              ctx.save();
              ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.12)' : 'rgba(148, 163, 184, 0.15)';
              ctx.strokeStyle = isSelected ? '#6366f1' : '#cbd5e1';
              ctx.lineWidth = 1;
              const approxW = Math.max(38, (node.payoff.length || 4) * 8.5);
              const bx = isHorizontal ? offset.x - 3 : offset.x - approxW / 2;
              const by = isHorizontal ? offset.y - 10 : offset.y - 2;
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(bx, by, approxW, 20, 4);
                ctx.fill();
                ctx.stroke();
              } else {
                ctx.fillRect(bx, by, approxW, 20);
                ctx.strokeRect(bx, by, approxW, 20);
              }
              ctx.restore();
            }

            ctx.font = 'bold 12px Inter, sans-serif';
            const textCol = isSelected ? '#312e81' : '#0f172a';
            if (window.drawMathText) {
              window.drawMathText(ctx, node.payoff, offset.x, offset.y, { fontSize: 13, color: textCol, align: offset.align, baseline: offset.base });
            } else {
              ctx.fillStyle = textCol;
              ctx.textAlign = offset.align;
              ctx.textBaseline = offset.base;
              ctx.fillText(node.payoff, offset.x, offset.y);
            }
          }
        }

        ctx.restore();
      });
    }

    exportSVG() {
      this.model.computeLayout();
      const bounds = this.model.getBounds();
      const w = Math.ceil(bounds.width);
      const h = Math.ceil(bounds.height);
      const isHorizontal = this.model.orientation === 'horizontal';

      let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${bounds.minX} ${bounds.minY} ${w} ${h}">\n`;
      svg += `  <style>\n`;
      svg += `    text { font-family: Inter, system-ui, sans-serif; }\n`;
      svg += `    .decision-node { fill: #eff6ff; stroke: #2563eb; stroke-width: 2; }\n`;
      svg += `    .chance-node { fill: #d97706; }\n`;
      svg += `    .branch { stroke: #334155; stroke-width: 2; stroke-linecap: round; }\n`;
      svg += `    .eq-branch { stroke: #ef4444; stroke-width: 3.5; stroke-linecap: round; }\n`;
      svg += `    .info-set { stroke: #64748b; stroke-width: 2; stroke-dasharray: 5,4; fill: none; }\n`;
      svg += `  </style>\n\n`;

      // 1. Info sets
      this.model.infoSets.forEach(is => {
        const nodes = is.nodeIds.map(id => this.model.nodes[id]).filter(Boolean);
        for (let i = 0; i < nodes.length - 1; i++) {
          const u = nodes[i], v = nodes[i + 1];
          const midX = (u.x + v.x) / 2;
          const midY = (u.y + v.y) / 2 + (isHorizontal ? 0 : 25);
          svg += `  <path class="info-set" d="M ${u.x} ${u.y} Q ${midX} ${midY} ${v.x} ${v.y}" />\n`;
        }
      });

      // 2. Branches
      Object.values(this.model.nodes).forEach(node => {
        if (!node.children) return;
        node.children.forEach(cid => {
          const c = this.model.nodes[cid];
          if (!c) return;
          const cls = c.isEquilibrium ? 'eq-branch' : 'branch';
          svg += `  <line class="${cls}" x1="${node.x}" y1="${node.y}" x2="${c.x}" y2="${c.y}" />\n`;

          const midX = (node.x + c.x) / 2;
          const midY = (node.y + c.y) / 2;
          if (c.action) {
            svg += `  <text x="${midX}" y="${midY - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="${c.isEquilibrium ? '#dc2626' : '#1e293b'}">${c.action}</text>\n`;
          }
          if (c.prob) {
            svg += `  <text x="${midX}" y="${midY + 14}" text-anchor="middle" font-size="10" fill="#64748b">${c.prob}</text>\n`;
          }
        });
      });

      // 3. Nodes
      Object.values(this.model.nodes).forEach(n => {
        if (n.type === 'decision') {
          svg += `  <circle class="decision-node" cx="${n.x}" cy="${n.y}" r="${this.model.nodeRadius}" />\n`;
          if (n.player) {
            svg += `  <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">${n.player}</text>\n`;
          }
        } else if (n.type === 'chance') {
          svg += `  <circle class="chance-node" cx="${n.x}" cy="${n.y}" r="5" />\n`;
          if (n.player) {
            svg += `  <text x="${n.x}" y="${n.y - 8}" text-anchor="middle" font-size="11" fill="#b45309">${n.player}</text>\n`;
          }
        } else if (n.type === 'terminal') {
          svg += `  <circle cx="${n.x}" cy="${n.y}" r="2" fill="#475569" />\n`;
          if (n.payoff) {
            svg += `  <text x="${n.x}" y="${n.y + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">${n.payoff}</text>\n`;
          }
        }
      });

      svg += `</svg>`;
      return svg;
    }
  }

  // Export to window
  window.GameTreeModel = GameTreeModel;
  window.GameTreeCanvasRenderer = GameTreeCanvasRenderer;
  window.GameTreePresets = Presets;

})(window);
