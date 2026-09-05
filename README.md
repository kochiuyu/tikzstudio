# TikZ Diagram Generator

A web-based interactive visual editor and generator for LaTeX TikZ 2D coordinate graphs, economics diagrams, and chronological timelines.

Designed for educators, researchers, students, and authors who want to quickly sketch mathematical figures, economics models, and timeline charts in their browser and immediately export publication-ready standard LaTeX `\begin{tikzpicture}` code.

---

## Key Features

### 1. 2D Coordinate Graph Studio (`Coordinate.html`)
- **Direct Canvas Sketching & Editing**:
  - Interactive drawing tools for **Straight Lines**, **Cubic Bézier Curves**, **Shaded Rectangles / Areas**, **Points & Labels**, and **Coordinate Axes**.
  - Visual draggable handles for curve control points ($C_1$, $C_2$) and endpoints ($P_1$, $P_2$) with live real-time Bézier spline rendering.
  - Direct on-canvas **Axis Resizing & Tick Placement**: Drag axis arrowheads and corner handles to scale coordinate boundaries, or click directly along the axes to place and drag ticks ($x_1, x_2, y_1, y_2$).
  - Floating confirmation and adjustment cards with instant two-way synchronization between canvas manipulation and sidebar inputs.
- **Grid Snapping & Precision**:
  - Toggleable snap-to-grid (`G`) with configurable half-unit snapping for clean alignments.
- **Pre-configured Economics & Math Templates**:
  - Instant presets for Supply & Demand, Solow Growth Model, Short-Run & Long-Run Cost Curves, IS-LM, and more.
- **Export Formats**:
  - Pure, standard LaTeX TikZ code ready to copy into Overleaf, TeXShop, or VS Code.
  - CSV coordinate export and import.

### 2. Timeline Studio (`Timeline.html`)
- Interactive horizontal and chronological timeline generator for historical sequences, economic events, and milestones.
- Customizable intervals, milestone callout tags, branch markers, and color themes.
- Instant TikZ code generation for inclusion in papers, lecture slides (Beamer), and documents.

### 3. Comprehensive Documentation & Help
- Interactive guides and visual walkthroughs accessible via **Docs & Help** (`Help-Coordinate.html` and `Help-Timeline.html`).

---

## Canvas Keyboard Shortcuts

| Key | Tool / Action | Description |
| :--- | :--- | :--- |
| **`A`** | Coordinate Axis | Activate axis mode (drag arrowheads/corner to adjust limits, click to add ticks) |
| **`R`** | Rectangle | Click and drag to create shaded boxes or coordinate areas |
| **`L`** | Line | Click and drag to create straight line segments |
| **`C`** | Curve | Multi-click workflow to define endpoints and shape Bézier curves |
| **`P`** | Point | Click anywhere on the grid to drop a labeled coordinate point |
| **`S`** | Select | Select and transform existing shapes directly on the canvas |
| **`G`** | Snap Grid | Toggle grid snapping on/off |
| **`Enter`** | Confirm | Confirm and save the currently active shape candidate |
| **`Esc`** | Cancel | Discard candidate shape, deselect, or cancel current drawing mode |
| **`Delete`** / **`Backspace`** | Delete | Remove the currently selected shape from canvas and form |

---

## Getting Started

### 1. Web / GitHub Pages (Static Hosting)
This tool runs client-side in any modern web browser without requiring external dependencies or background services.
- If hosted via GitHub Pages, visit your repository's URL (serves `index.html` as the landing page).
- You can also simply open `index.html` or `Coordinate.html` directly in your browser.

### 2. Local Node.js Development Server
To run locally with the included development server:

```bash
# Clone the repository
git clone https://github.com/kochiuyu/tikz.git
cd tikz

# Install dependencies
npm install

# Start the local server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using the Exported Code in LaTeX

Copy the generated code from the **TikZ Code** panel and paste it into your LaTeX document:

```latex
\documentclass{article}
\usepackage{tikz}

\begin{document}

\begin{figure}[htbp]
  \centering
  % --- Paste generated TikZ code below ---
  \begin{tikzpicture}[scale=0.8]
    % ... generated commands ...
  \end{tikzpicture}
  \caption{Diagram generated with TikZ Studio}
\end{figure}

\end{document}
```

---

## Contributing & Template Sharing

Contributions and new diagram templates are warmly welcomed! If you have developed useful TikZ templates for economics, mathematics, physics, or data science, feel free to open an issue or pull request to share them with the community.

---

## License

This project is open-source software licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for complete terms and conditions.
