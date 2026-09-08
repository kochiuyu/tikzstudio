# TikZ Diagram Generator

A web-based interactive visual editor and LaTeX code generator for scientific, academic, and technical diagrams.

Designed for researchers, educators, students, and authors who need to quickly create publication-ready mathematical figures, extensive-form game trees, finite state machines, process flowcharts, Venn & Euler diagrams, and chronological timelines with immediate standard LaTeX `\begin{tikzpicture}` code export.

---

## The Studio Suite

TikZ Diagram Generator provides five specialized studios accessible from the main landing page (`index.html`):

### 1. 2D Coordinate Graph Studio (`Coordinate.html`)
- **Interactive Canvas Drawing**:
  - Direct sketching of **Straight Lines**, **Cubic Bézier Curves**, **Circles**, **Shaded Areas / Rectangles**, **Points & Labels**, and **Coordinate Axes**.
  - Draggable on-canvas handles for Bézier control points ($C_1$, $C_2$), curve endpoints, circle centers and radii, and rectangular boundaries.
  - Direct on-canvas **Axis Resizing & Tick Placement**: Drag axis arrowheads to scale limits, or click directly along the axes to position and drag tick marks ($x_1, x_2, y_1, y_2$).
  - Full two-way synchronization between visual canvas manipulation and the parameter control sidebar.
- **Precision & Alignment**:
  - Toggleable snap-to-grid (`G`) with configurable half-unit snapping.
- **Built-in Model Library (17 Presets)**:
  - *Microeconomics*: Supply & Demand, Monopoly & Deadweight Loss, Cournot Duopoly Reaction Curves, Edgeworth Box & Contract Curve, Consumer Utility Maximization, Firm Cost Curves (MC, ATC, AVC), Production Possibility Frontier (PPF), Negative Externality & Pigouvian Tax.
  - *Macroeconomics*: IS-LM Equilibrium, Keynesian Cross (45°), Solow-Swan Economic Growth, AD-AS Macroeconomic Model.
  - *Math & Stats*: Normal Distribution (Gaussian), Logistic Growth Sigmoid Curve, Trigonometric Unit Circle, Lorenz Curve & Gini Inequality.
  - *Physics*: Projectile Motion Kinematic Trajectory.
- **Data & Export**:
  - Standard LaTeX TikZ code, high-resolution PNG export, CSV coordinate data import/export, and JSON diagram save/load.

### 2. Game Tree Studio (`GameTree.html`)
- **Extensive-Form Game Theory Trees**:
  - Supports **Decision Nodes** (custom player colors and labels), **Chance / Nature Nodes** ($\mathcal{N}$) with branch probabilities, and **Terminal Nodes** with payoff vectors.
  - **Information Sets**: Render dashed curves linking nodes to represent imperfect information and simultaneous moves.
  - **Equilibrium Paths**: Highlight subgame-perfect Nash equilibria (SPNE) or backward induction paths with bold colored strokes and custom styling.
  - Automatic tree layout calculation with customizable level and sibling distances; supports both horizontal and vertical tree orientations.
- **Categorized Game Theory Presets (11 Models)**:
  - *Industrial Organization*: Market Entry Deterrence, Stackelberg Sequential Duopoly.
  - *Information Economics & Signaling*: Spence Job Market Signaling, Beer-Quiche Signaling Game (Cho-Kreps), Principal-Agent Contracting (Moral Hazard).
  - *Bargaining & Multistage*: Rubinstein Alternating-Offer Bargaining, Ultimatum Bargaining Game, 4-Stage Centipede Game.
  - *Classic Dilemmas & Experiments*: Sequential Prisoner's Dilemma, Matching Pennies (Imperfect Info), Trust / Investment Game (Berg et al.).
- **TikZ Code Export**:
  - Generates clean standard TikZ code and modern `forest` package syntax for compact LaTeX representation.

### 3. Flowchart & State Machine Studio (`Flowchart.html`)
- **Automata & Process Diagramming**:
  - **Finite State Machines (FSM)**: Initial states with entry arrows, standard states, and double-circle accepting/terminal states.
  - **Algorithm & Process Flowcharts**: Start/End terminals, process boxes, decision diamonds, and input/output parallelograms.
  - **Flexible Edge Routing**: Straight connectors, orthogonal horizontal/vertical routing, curved arcs (bend left/right), and self-loops (above, below, left, right).
  - Direct on-canvas node dragging, interactive connection anchor snapping, and inline label editing.
- **Categorized Presets (11 Models + Blank Canvases)**:
  - *Finite State Machines & Automata*: Modulo-3 Binary Counter (DFA), Even/Odd Parity Bit Checker (DFA), Regex Pattern Matcher for $(a|b)^*abb$ (NFA), Turnstile Controller FSM, TCP 3-Way Handshake Connection, Traffic Light State Controller.
  - *Process & Algorithm Flowcharts*: Euclidean GCD Algorithm, Git Branching & CI/CD Pipeline, Producer-Consumer Synchronization with Mutex & Bounded Buffer, User Authentication & 2FA Flow, Order Processing & Payment Pipeline.
- **TikZ Library Integration**:
  - Generates TikZ code utilizing `automata`, `positioning`, and `shapes.geometric` libraries.

### 4. Venn & Euler Diagram Studio (`Venn.html`)
- **Set Theory & Logic Diagrams**:
  - Supports **2-Set Venn**, **3-Set Venn**, and **Euler Diagrams** (subsets and disjoint configurations).
  - **Interactive Region Shading**: Click any bounded region to toggle shading, select custom fill colors, and adjust transparency.
  - Automatic mathematical LaTeX set notation generation for shaded areas (e.g., $A \cap B$, $(A \cup B)^c$, $A \setminus B$, $A \Delta B$).
  - Customizable circle dimensions, positions, stroke widths, and text label offsets.
- **Categorized Logic Presets (15 Models)**:
  - *2-Set Diagrams*: Intersection ($A \cap B$), Union ($A \cup B$), Relative Difference ($A \setminus B$), Symmetric Difference ($A \Delta B$), De Morgan's Laws, Conditional Probability ($P(A \mid B)$), Medical Diagnostic Test & Bayes' Rule (TP, FP, TN, FN).
  - *3-Set Diagrams*: Triple Intersection ($A \cap B \cap C$), Pairwise Intersections, Boolean Search Query Logic $((A \cup B) \cap C)$, 3-Set Symmetric Difference (XOR), Categorical Syllogism Validity (Venn S-M-P), Inclusion-Exclusion Cardinalities.
  - *Euler & Set Relations*: Subset / Inclusion ($A \subset B$), Partial Overlap (Particular Affirmative), Disjoint / Mutually Exclusive ($A \cap B = \emptyset$).
- **TikZ Scope Generation**:
  - Outputs robust TikZ `\begin{scope}` clipping paths to ensure accurate, artifact-free shaded regions in standard LaTeX engines (pdfLaTeX, XeLaTeX, LuaLaTeX).

### 5. Timeline Studio (`Timeline.html`)
- **Chronological Sequence Visualizer**:
  - Generates horizontal and vertical chronological timelines for history, science, technology, and project milestones.
  - Configurable start and end years, custom tick step intervals, alternating milestone chips, and customizable theme palettes.
- **Curated Timeline Templates (7 Presets)**:
  - 20th Century World Milestones (1900–2000)
  - Space Race & Lunar Exploration (1955–1975)
  - History of Artificial Intelligence (1950–2024)
  - Evolution of Computing Architecture (1940–2020)
  - Global Economic & Monetary Milestones (1910–2025)
  - Scientific Revolutions & Discoveries (1540–1915)
  - Academic Grant & PhD Roadmap (2024–2028)

---

## Centralized Documentation (`Help.html`)

A unified **Docs & Help Center** (`Help.html`) is accessible from the top navigation bar of every page, featuring:
- Step-by-step visual guides for all five studios.
- Complete keyboard shortcut listings.
- LaTeX document preamble requirements and compilation troubleshooting.
- Advanced TikZ styling tips (font scaling, opacity blending, color palettes).

---

## Canvas Keyboard Shortcuts

| Key | Action / Tool | Studio |
| :--- | :--- | :--- |
| **`A`** | Coordinate Axis Tool (drag arrowheads/corner to scale, click to add ticks) | Coordinate |
| **`L`** | Straight Line Tool | Coordinate |
| **`C`** | Bézier Curve Tool (click endpoints, adjust control handles) | Coordinate |
| **`O`** | Circle Tool (click center and drag radius) | Coordinate |
| **`R`** | Rectangle / Shaded Area Tool | Coordinate |
| **`P`** | Labeled Coordinate Point Tool | Coordinate |
| **`S`** | Select / Move / Inspect Tool | Coordinate, Flowchart, GameTree, Venn |
| **`G`** | Toggle Grid Snapping on/off | Coordinate |
| **`Enter`** | Confirm active shape candidate | Coordinate |
| **`Esc`** | Cancel active tool or deselect item | All Studios |
| **`Delete`** / **`Backspace`** | Delete selected node, edge, shape, or chip | All Studios |

---

## LaTeX Integration & Preamble Setup

Copy the generated TikZ code from the editor's code panel into your LaTeX document. Ensure your document preamble includes the necessary packages:

```latex
\documentclass{article}

% --- Core TikZ Package ---
\usepackage{tikz}

% --- Required TikZ Libraries (Flowcharts, Automata, Positioning, Math) ---
\usetikzlibrary{arrows.meta, positioning, calc, automata, shapes.geometric}

% --- Forest Package (Recommended for Game Trees) ---
\usepackage{forest}

% --- Color Support ---
\usepackage{xcolor}

\begin{document}

\begin{figure}[htbp]
  \centering
  % --- Paste generated TikZ code here ---
  \begin{tikzpicture}[scale=1.0, >=Stealth]
    % ... generated commands ...
  \end{tikzpicture}
  \caption{Diagram generated with TikZ Diagram Studio}
  \label{fig:diagram}
\end{figure}

\end{document}
```

---

## Getting Started & Local Development

The suite is built entirely with modern client-side standards (HTML5 Canvas, CSS3, ES6 JavaScript) and has no required backend or build step to run in production.

### Quick Start (Browser)
Simply open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge), or serve via GitHub Pages.

### Local Development Server
To run with hot-reload and testing tools:

```bash
# Clone repository
git clone https://github.com/kochiuyu/tikz.git
cd tikz

# Install dependencies
npm install

# Start local dev server
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Contributing

Contributions, bug reports, and new template suggestions are welcome! If you have created useful diagram templates for economics, computer science, mathematics, or physics, feel free to open a pull request or issue.

---

## License

This project is open-source software licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for details.

