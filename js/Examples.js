/**
 * Popular Scientific & Economic Example Models
 * Fully integrates with TikZ Studio interactive tools (Lines, Curves, Rectangles, Circles, Points, Axes, Colors)
 */

function ensureLineCount(n) {
  while (typeof counter_i !== 'undefined' && counter_i <= n) {
    if (typeof AddLine === 'function') AddLine();
    else break;
  }
}

function ensureCurveCount(n) {
  while (typeof counter_j !== 'undefined' && counter_j <= n) {
    if (typeof AddCurve === 'function') AddCurve();
    else break;
  }
}

function ensureRectCount(n) {
  while (typeof counter_z !== 'undefined' && counter_z <= n) {
    if (typeof AddRec === 'function') AddRec();
    else break;
  }
}

function ensureCircleCount(n) {
  while (typeof counter_circle !== 'undefined' && counter_circle <= n) {
    if (typeof AddCircle === 'function') AddCircle();
    else break;
  }
}

function ensurePointCount(n) {
  while (typeof ps_j !== 'undefined' && ps_j <= n) {
    if (typeof AddPoints === 'function') AddPoints();
    else break;
  }
}

function setColorSelectValue(selectEl, colorVal) {
  if (!selectEl) return;
  var found = false;
  for (var i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].value.toLowerCase() === colorVal.toLowerCase()) {
      selectEl.selectedIndex = i;
      found = true;
      break;
    }
  }
  if (!found) {
    var opt = document.createElement('option');
    opt.value = colorVal;
    opt.textContent = colorVal;
    selectEl.appendChild(opt);
    selectEl.selectedIndex = selectEl.options.length - 1;
  }
  if (selectEl._colorPickerTrigger && typeof selectEl._colorPickerTrigger.update === 'function') {
    selectEl._colorPickerTrigger.update();
  }
}

function resetAllCanvasElements() {
  // 1. Reset Lines
  var maxLines = typeof counter_i !== 'undefined' ? counter_i : 5;
  for (var r = 1; r < maxLines; r++) {
    var a = document.getElementById("a_" + r); if (a) a.value = 0;
    var b = document.getElementById("b_" + r); if (b) b.value = 0;
    var c = document.getElementById("c_" + r); if (c) c.value = 0;
    var d = document.getElementById("d_" + r); if (d) d.value = 0;
    var nm = document.getElementById("linename_" + r); if (nm) nm.value = "";
    var show = document.getElementById("lineshow_" + r); if (show) show.checked = false;
    var dash = document.getElementById("linedash_" + r); if (dash) dash.checked = false;
    var arrow = document.getElementById("lineArrow_" + r); if (arrow) arrow.value = "none";
    var width = document.getElementById("lineWidth_" + r); if (width) width.value = "thin";
    var style = document.getElementById("lineStyle_" + r); if (style) style.value = "solid";
    var col = document.getElementById("lineColor_" + r); if (col) setColorSelectValue(col, "black");
    var pos = document.getElementById("lineLabelPos_" + r); if (pos) pos.value = "end";
    var anc = document.getElementById("lineLabelAnchor_" + r); if (anc) anc.value = "right";
    if (typeof updateLineTelemetry === 'function') updateLineTelemetry(r);
  }

  // 2. Reset Curves
  var maxCurves = typeof counter_j !== 'undefined' ? counter_j : 3;
  for (var j = 1; j < maxCurves; j++) {
    var elE = document.getElementById("e_" + j); if (elE) elE.value = 0;
    var elF = document.getElementById("f_" + j); if (elF) elF.value = 0;
    var elG = document.getElementById("g_" + j); if (elG) elG.value = 0;
    var elH = document.getElementById("h_" + j); if (elH) elH.value = 0;
    var elI = document.getElementById("i_" + j); if (elI) elI.value = 0;
    var elJ = document.getElementById("j_" + j); if (elJ) elJ.value = 0;
    var elK = document.getElementById("k_" + j); if (elK) elK.value = 0;
    var elL = document.getElementById("l_" + j); if (elL) elL.value = 0;
    var cnm = document.getElementById("curvename_" + j); if (cnm) cnm.value = "";
    var cshow = document.getElementById("curveshow_" + j); if (cshow) cshow.checked = false;
    var cdash = document.getElementById("curvedash_" + j); if (cdash) cdash.checked = false;
    var cguide = document.getElementById("curveguide_" + j); if (cguide) cguide.checked = false;
    var ccol = document.getElementById("curveColor_" + j); if (ccol) setColorSelectValue(ccol, "black");
  }

  // 3. Reset Rectangles
  var maxRects = typeof counter_z !== 'undefined' ? counter_z : 2;
  for (var z = 1; z < maxRects; z++) {
    var elR = document.getElementById("r_" + z); if (elR) elR.value = 0;
    var elS = document.getElementById("s_" + z); if (elS) elS.value = 0;
    var elT = document.getElementById("t_" + z); if (elT) elT.value = 0;
    var elU = document.getElementById("u_" + z); if (elU) elU.value = 0;
    var rnm = document.getElementById("retangularname_" + z); if (rnm) rnm.value = "";
    var rshow = document.getElementById("retangularshow_" + z); if (rshow) rshow.checked = false;
    var rdash = document.getElementById("retangulardash_" + z); if (rdash) rdash.checked = false;
    var rfill = document.getElementById("retangularfill_" + z); if (rfill) rfill.checked = false;
    var rcol = document.getElementById("retangularColor_" + z); if (rcol) setColorSelectValue(rcol, "black");
  }

  // 4. Reset Circles
  var maxCircles = typeof counter_circle !== 'undefined' ? counter_circle : 2;
  for (var c = 1; c < maxCircles; c++) {
    var cx = document.getElementById("circle_x_" + c); if (cx) cx.value = 0;
    var cy = document.getElementById("circle_y_" + c); if (cy) cy.value = 0;
    var cr = document.getElementById("circle_r_" + c); if (cr) cr.value = 0;
    var cirm = document.getElementById("circlename_" + c); if (cirm) cirm.value = "";
    var cirshow = document.getElementById("circleshow_" + c); if (cirshow) cirshow.checked = false;
    var cirdash = document.getElementById("circledash_" + c); if (cirdash) cirdash.checked = false;
    var cirfill = document.getElementById("circlefill_" + c); if (cirfill) cirfill.checked = false;
    var circol = document.getElementById("circleColor_" + c); if (circol) setColorSelectValue(circol, "black");
  }

  // 5. Reset Points
  var maxPoints = typeof ps_j !== 'undefined' ? ps_j : 4;
  for (var p = 1; p < maxPoints; p++) {
    var elP = document.getElementById("p_" + p); if (elP) elP.value = 0;
    var elQ = document.getElementById("q_" + p); if (elQ) elQ.value = 0;
    var pnm = document.getElementById("p_name_" + p); if (pnm) pnm.value = "";
    var pshow = document.getElementById("pointshow_" + p); if (pshow) pshow.checked = false;
    var pcol = document.getElementById("pointColor_" + p) || document.getElementById("p_col_" + p); if (pcol) setColorSelectValue(pcol, "black");
    var ppos = document.getElementById("p_pos_" + p); if (ppos) ppos.value = "above";
    if (typeof updatePointCardHeader === 'function') updatePointCardHeader(p);
  }

  // 6. Reset Axes & Ticks
  var xs = document.getElementById("xsize"); if (xs) xs.value = 10;
  var ys = document.getElementById("ysize"); if (ys) ys.value = 10;
  var xn = document.getElementById("xname"); if (xn) xn.value = "x";
  var yn = document.getElementById("yname"); if (yn) yn.value = "y";
  var orig = document.getElementById("label_origin_name"); if (orig) orig.value = "0";
  var axcol = document.getElementById("axisColor"); if (axcol) setColorSelectValue(axcol, "black");

  var lx1 = document.getElementById("label_x_1"); if (lx1) lx1.value = 0;
  var lx1n = document.getElementById("label_x_1_name"); if (lx1n) lx1n.value = "";
  var lx2 = document.getElementById("label_x_2"); if (lx2) lx2.value = 0;
  var lx2n = document.getElementById("label_x_2_name"); if (lx2n) lx2n.value = "";
  var ly1 = document.getElementById("label_y_1"); if (ly1) ly1.value = 0;
  var ly1n = document.getElementById("label_y_1_name"); if (ly1n) ly1n.value = "";
  var ly2 = document.getElementById("label_y_2"); if (ly2) ly2.value = 0;
  var ly2n = document.getElementById("label_y_2_name"); if (ly2n) ly2n.value = "";

  // Reset layer manager to clear canvas shapes
  if (window.layerManager && typeof window.layerManager.syncFromDOM === 'function') {
    window.layerManager.syncFromDOM(true);
  }
}

function setLine(idx, x1, y1, x2, y2, name, opts) {
  ensureLineCount(idx);
  var a = document.getElementById("a_" + idx); if (a) a.value = x1;
  var b = document.getElementById("b_" + idx); if (b) b.value = y1;
  var c = document.getElementById("c_" + idx); if (c) c.value = x2;
  var d = document.getElementById("d_" + idx); if (d) d.value = y2;
  var nm = document.getElementById("linename_" + idx); if (nm) nm.value = name || "";
  var show = document.getElementById("lineshow_" + idx); if (show) show.checked = true;

  opts = opts || {};
  var dash = document.getElementById("linedash_" + idx); if (dash) dash.checked = !!opts.dashed;
  var arrow = document.getElementById("lineArrow_" + idx); if (arrow) arrow.value = opts.arrow || "none";
  var width = document.getElementById("lineWidth_" + idx); if (width) width.value = opts.width || "thin";
  var style = document.getElementById("lineStyle_" + idx); if (style) style.value = opts.style || (opts.dashed ? "dashed" : "solid");
  var col = document.getElementById("lineColor_" + idx); if (col && opts.color) setColorSelectValue(col, opts.color);
  var pos = document.getElementById("lineLabelPos_" + idx); if (pos && opts.labelPos) pos.value = opts.labelPos;
  var anc = document.getElementById("lineLabelAnchor_" + idx); if (anc && opts.labelAnchor) anc.value = opts.labelAnchor;

  if (typeof updateLineTelemetry === 'function') updateLineTelemetry(idx);
}

function setCurve(idx, e, f, g, h, i, j, k, l, name, opts) {
  ensureCurveCount(idx);
  var elE = document.getElementById("e_" + idx); if (elE) elE.value = e;
  var elF = document.getElementById("f_" + idx); if (elF) elF.value = f;
  var elG = document.getElementById("g_" + idx); if (elG) elG.value = g;
  var elH = document.getElementById("h_" + idx); if (elH) elH.value = h;
  var elI = document.getElementById("i_" + idx); if (elI) elI.value = i;
  var elJ = document.getElementById("j_" + idx); if (elJ) elJ.value = j;
  var elK = document.getElementById("k_" + idx); if (elK) elK.value = k;
  var elL = document.getElementById("l_" + idx); if (elL) elL.value = l;
  var nm = document.getElementById("curvename_" + idx); if (nm) nm.value = name || "";
  var show = document.getElementById("curveshow_" + idx); if (show) show.checked = true;

  opts = opts || {};
  var dash = document.getElementById("curvedash_" + idx); if (dash) dash.checked = !!opts.dashed;
  var guide = document.getElementById("curveguide_" + idx); if (guide) guide.checked = !!opts.guide;
  var col = document.getElementById("curveColor_" + idx); if (col && opts.color) setColorSelectValue(col, opts.color);
}

function setRectangle(idx, r, s, t, u, name, opts) {
  ensureRectCount(idx);
  var elR = document.getElementById("r_" + idx); if (elR) elR.value = r;
  var elS = document.getElementById("s_" + idx); if (elS) elS.value = s;
  var elT = document.getElementById("t_" + idx); if (elT) elT.value = t;
  var elU = document.getElementById("u_" + idx); if (elU) elU.value = u;
  var nm = document.getElementById("retangularname_" + idx); if (nm) nm.value = name || "";
  var show = document.getElementById("retangularshow_" + idx); if (show) show.checked = true;

  opts = opts || {};
  var dash = document.getElementById("retangulardash_" + idx); if (dash) dash.checked = !!opts.dashed;
  var fill = document.getElementById("retangularfill_" + idx); if (fill) fill.checked = !!opts.fill;
  var col = document.getElementById("retangularColor_" + idx); if (col && opts.color) setColorSelectValue(col, opts.color);
}

function setCircle(idx, cx, cy, rad, name, opts) {
  ensureCircleCount(idx);
  var elX = document.getElementById("circle_x_" + idx); if (elX) elX.value = cx;
  var elY = document.getElementById("circle_y_" + idx); if (elY) elY.value = cy;
  var elR = document.getElementById("circle_r_" + idx); if (elR) elR.value = rad;
  var nm = document.getElementById("circlename_" + idx); if (nm) nm.value = name || "";
  var show = document.getElementById("circleshow_" + idx); if (show) show.checked = true;

  opts = opts || {};
  var dash = document.getElementById("circledash_" + idx); if (dash) dash.checked = !!opts.dashed;
  var fill = document.getElementById("circlefill_" + idx); if (fill) fill.checked = !!opts.fill;
  var col = document.getElementById("circleColor_" + idx); if (col && opts.color) setColorSelectValue(col, opts.color);
}

function setPoint(idx, p, q, name, opts) {
  ensurePointCount(idx);
  var elP = document.getElementById("p_" + idx); if (elP) elP.value = p;
  var elQ = document.getElementById("q_" + idx); if (elQ) elQ.value = q;
  var nm = document.getElementById("p_name_" + idx); if (nm) nm.value = name || "";
  var show = document.getElementById("pointshow_" + idx); if (show) show.checked = true;

  opts = opts || {};
  var col = document.getElementById("pointColor_" + idx) || document.getElementById("p_col_" + idx);
  if (col && opts.color) setColorSelectValue(col, opts.color);
  var pos = document.getElementById("p_pos_" + idx); if (pos && opts.pos) pos.value = opts.pos;

  if (typeof updatePointCardHeader === 'function') updatePointCardHeader(idx);
}

function setAxes(opts) {
  opts = opts || {};
  var xs = document.getElementById("xsize"); if (xs) xs.value = opts.xsize || 10;
  var ys = document.getElementById("ysize"); if (ys) ys.value = opts.ysize || 10;
  var xn = document.getElementById("xname"); if (xn) xn.value = opts.xname || "x";
  var yn = document.getElementById("yname"); if (yn) yn.value = opts.yname || "y";
  var orig = document.getElementById("label_origin_name"); if (orig) orig.value = opts.origin || "0";
  var col = document.getElementById("axisColor");
  if (col && opts.axisColor) setColorSelectValue(col, opts.axisColor);

  if (opts.ticks) {
    if (opts.ticks.x1 !== undefined) {
      var lx1 = document.getElementById("label_x_1"); if (lx1) lx1.value = opts.ticks.x1;
      var lx1n = document.getElementById("label_x_1_name"); if (lx1n) lx1n.value = opts.ticks.x1_name || "";
    }
    if (opts.ticks.x2 !== undefined) {
      var lx2 = document.getElementById("label_x_2"); if (lx2) lx2.value = opts.ticks.x2;
      var lx2n = document.getElementById("label_x_2_name"); if (lx2n) lx2n.value = opts.ticks.x2_name || "";
    }
    if (opts.ticks.y1 !== undefined) {
      var ly1 = document.getElementById("label_y_1"); if (ly1) ly1.value = opts.ticks.y1;
      var ly1n = document.getElementById("label_y_1_name"); if (ly1n) ly1n.value = opts.ticks.y1_name || "";
    }
    if (opts.ticks.y2 !== undefined) {
      var ly2 = document.getElementById("label_y_2"); if (ly2) ly2.value = opts.ticks.y2;
      var ly2n = document.getElementById("label_y_2_name"); if (ly2n) ly2n.value = opts.ticks.y2_name || "";
    }
  }
}

// ----------------------------------------------------
// 14 Curated Popular Example Models
// ----------------------------------------------------

/** 1. Supply & Demand Equilibrium */
function Example_SupplyDemand() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Q", yname: "P", origin: "0",
    ticks: { x1: 5, x1_name: "Q^*", y1: 5, y1_name: "P^*" }
  });
  setLine(1, 1, 1, 9, 9, "S", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(2, 1, 9, 9, 1, "D", { color: "#dc2626", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 0, 5, 5, 5, "", { dashed: true, color: "#64748b" });
  setLine(4, 5, 0, 5, 5, "", { dashed: true, color: "#64748b" });
  setPoint(1, 5, 5, "E(Q^*, P^*)", { color: "#0f172a", pos: "above" });
}

/** 2. IS-LM Macroeconomic Equilibrium */
function Example_ISLM() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Y", yname: "r", origin: "0",
    ticks: { x1: 5, x1_name: "Y^*", y1: 5, y1_name: "r^*" }
  });
  setLine(1, 1.5, 8.5, 8.5, 1.5, "IS", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(2, 1.5, 1.5, 8.5, 8.5, "LM", { color: "#16a34a", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 0, 5, 5, 5, "", { dashed: true, color: "#64748b" });
  setLine(4, 5, 0, 5, 5, "", { dashed: true, color: "#64748b" });
  setPoint(1, 5, 5, "E(Y^*, r^*)", { color: "#0f172a", pos: "above" });
}

/** 3. Monopoly Pricing & Deadweight Loss */
function Example_Monopoly() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Q", yname: "P", origin: "0",
    ticks: { x1: 3, x1_name: "Q_m", x2: 5, x2_name: "Q_c", y1: 6, y1_name: "P_m", y2: 4, y2_name: "P_c" }
  });
  setLine(1, 0.5, 8.5, 8.5, 0.5, "D", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(2, 0.5, 8.0, 4.5, 0.0, "MR", { color: "#9333ea", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 0.5, 1.75, 8.5, 5.75, "MC", { color: "#dc2626", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(4, 0, 6, 3, 6, "", { dashed: true, color: "#64748b" });
  setLine(5, 3, 0, 3, 6, "", { dashed: true, color: "#64748b" });
  setLine(6, 0, 3, 3, 3, "", { dashed: true, color: "#64748b" });
  setLine(7, 5, 0, 5, 4, "", { dashed: true, color: "#64748b" });
  setLine(8, 0, 4, 5, 4, "", { dashed: true, color: "#64748b" });
  setRectangle(1, 0, 3, 3, 6, "Economic Profit", { fill: true, dashed: true, color: "#3b82f6" });
  setPoint(1, 3, 6, "E_m(Q_m, P_m)", { color: "#0f172a", pos: "above" });
  setPoint(2, 3, 3, "MR=MC", { color: "#9333ea", pos: "below" });
  setPoint(3, 5, 4, "E_c(Q_c, P_c)", { color: "#16a34a", pos: "above" });
}

/** 4. Consumer Utility Maximization */
function Example_UtilityMax() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "x_1", yname: "x_2", origin: "0",
    ticks: { x1: 4, x1_name: "x_1^*", y1: 4, y1_name: "x_2^*" }
  });
  setLine(1, 0, 8, 8, 0, "BL", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(2, 0, 4, 4, 4, "", { dashed: true, color: "#64748b" });
  setLine(3, 4, 0, 4, 4, "", { dashed: true, color: "#64748b" });
  setCurve(1, 1.5, 8.0, 2.7, 4.8, 4.8, 2.7, 8.0, 1.5, "U_2", { color: "#9333ea" });
  setCurve(2, 1.0, 6.5, 2.0, 3.8, 3.8, 2.0, 6.5, 1.0, "U_1", { color: "#64748b", dashed: true });
  setCurve(3, 2.2, 9.2, 3.5, 5.8, 5.8, 3.5, 9.2, 2.2, "U_3", { color: "#64748b", dashed: true });
  setPoint(1, 4, 4, "E(x_1^*, x_2^*)", { color: "#0f172a", pos: "above" });
}

/** 5. Firm Cost Curves (MC, ATC, AVC) */
function Example_CostCurves() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "q", yname: "C, P", origin: "0",
    ticks: { x1: 5.0, x1_name: "q_{min}", x2: 6.5, x2_name: "q^*", y1: 6.0, y1_name: "P^*", y2: 4.5, y2_name: "ATC_{min}" }
  });
  setCurve(1, 1.5, 3.2, 2.6, 1.2, 5.8, 4.6, 8.5, 8.8, "MC", { color: "#dc2626" });
  setCurve(2, 1.5, 8.5, 3.5, 2.5, 6.5, 4.5, 8.5, 6.5, "ATC", { color: "#2563eb" });
  setCurve(3, 1.5, 5.5, 3.0, 1.2, 5.5, 2.6, 8.5, 4.8, "AVC", { color: "#16a34a", dashed: true });
  setLine(1, 0, 6.0, 9.0, 6.0, "P = MR = AR", { color: "#d97706", width: "semithick", labelPos: "end", labelAnchor: "above" });
  setLine(2, 6.5, 0, 6.5, 6.0, "", { dashed: true, color: "#64748b" });
  setLine(3, 5.0, 0, 5.0, 4.5, "", { dashed: true, color: "#64748b" });
  setLine(4, 0, 4.5, 5.0, 4.5, "", { dashed: true, color: "#64748b" });
  setPoint(1, 6.5, 6.0, "q^* (P=MC)", { color: "#0f172a", pos: "above" });
  setPoint(2, 5.0, 4.5, "Min ATC", { color: "#2563eb", pos: "below" });
}

/** 6. Keynesian Cross (45-Degree Model) */
function Example_KeynesianCross() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Y (Output)", yname: "AE", origin: "0",
    ticks: { x1: 6, x1_name: "Y^*", y1: 6, y1_name: "AE^*", y2: 3, y2_name: "A_0" }
  });
  setLine(1, 0, 0, 9, 9, "Y = AE", { color: "#94a3b8", style: "dashed", labelPos: "end", labelAnchor: "right" });
  setLine(2, 0, 3, 9, 7.5, "AE = C+I+G", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 6, 0, 6, 6, "", { dashed: true, color: "#64748b" });
  setLine(4, 0, 6, 6, 6, "", { dashed: true, color: "#64748b" });
  setPoint(1, 6, 6, "E(Y^*)", { color: "#0f172a", pos: "above" });
  setPoint(2, 0, 3, "A_0", { color: "#2563eb", pos: "right" });
}

/** 7. Solow-Swan Economic Growth Model */
function Example_SolowGrowth() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "k", yname: "y, i", origin: "0",
    ticks: { x1: 5, x1_name: "k^*", y1: 4, y1_name: "i^*", y2: 7, y2_name: "y^*" }
  });
  // Output per worker: y = f(k), precisely passes through (5.0, 7.0) at t=0.5
  setCurve(1, 0, 0, 3.5, 8.8, 6.833, 7.033, 9, 8.5, "y = f(k)", { color: "#2563eb" });
  // Investment per worker: s*f(k), precisely passes through (5.0, 4.0) at t=0.5
  setCurve(2, 0, 0, 3.5, 5.0, 6.833, 3.933, 9, 5.2, "s \\cdot f(k)", { color: "#16a34a" });
  // Break-even investment ray (delta+n)k with slope 0.8: passes through (5.0, 4.0) exactly
  setLine(1, 0, 0, 9, 7.2, "(\\delta+n)k", { color: "#dc2626", width: "semithick", labelPos: "end", labelAnchor: "right" });
  // Steady state vertical dashed projection from k* through investment to output
  setLine(2, 5, 0, 5, 7, "", { dashed: true, color: "#64748b" });
  // Horizontal projection to steady-state investment i*
  setLine(3, 0, 4, 5, 4, "", { dashed: true, color: "#64748b" });
  // Horizontal projection to steady-state output y*
  setLine(4, 0, 7, 5, 7, "", { dashed: true, color: "#64748b" });
  // Steady-state equilibrium point where actual investment = break-even investment
  setPoint(1, 5, 4, "k^* \\text{ (Steady State)}", { color: "#16a34a", pos: "below" });
  // Steady-state output point on production curve f(k)
  setPoint(2, 5, 7, "y^* = f(k^*)", { color: "#2563eb", pos: "above" });
}

/** 8. AD-AS Macroeconomic Equilibrium */
function Example_ADAS() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Y (Real GDP)", yname: "P (Price Level)", origin: "0",
    ticks: { x1: 5, x1_name: "Y_P", y1: 5, y1_name: "P_0" }
  });
  setLine(1, 5, 0, 5, 9, "LRAS", { color: "#dc2626", width: "thick", labelPos: "end", labelAnchor: "above" });
  setLine(2, 1, 1.5, 9, 8.5, "SRAS", { color: "#16a34a", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 1, 8.5, 9, 1.5, "AD", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(4, 0, 5, 5, 5, "", { dashed: true, color: "#64748b" });
  setPoint(1, 5, 5, "E_0 (Full Employment)", { color: "#0f172a", pos: "above" });
}

/** 9. Production Possibility Frontier (PPF) */
function Example_PPF() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Consumer Goods (X)", yname: "Capital Goods (Y)", origin: "0",
    ticks: { x1: 3.5, x1_name: "X_A", x2: 6.5, x2_name: "X_B", y1: 7.2, y1_name: "Y_A", y2: 4.2, y2_name: "Y_B" }
  });
  // Strictly concave PPF curve passing exactly through (3.5, 7.2) and (6.5, 4.2)
  setCurve(1, 0, 8.5, 3.3, 7.7, 6.1, 6.5, 8.5, 0, "PPF", { color: "#0284c7" });
  setLine(1, 0, 7.2, 3.5, 7.2, "", { dashed: true, color: "#94a3b8" });
  setLine(2, 3.5, 0, 3.5, 7.2, "", { dashed: true, color: "#94a3b8" });
  setLine(3, 0, 4.2, 6.5, 4.2, "", { dashed: true, color: "#94a3b8" });
  setLine(4, 6.5, 0, 6.5, 4.2, "", { dashed: true, color: "#94a3b8" });
  setPoint(1, 3.5, 7.2, "A (Efficient)", { color: "#16a34a", pos: "above" });
  setPoint(2, 6.5, 4.2, "B (Efficient)", { color: "#16a34a", pos: "above" });
  setPoint(3, 3, 3, "C (Inefficient)", { color: "#d97706", pos: "below" });
  setPoint(4, 7.5, 7.5, "D (Unattainable)", { color: "#dc2626", pos: "above" });
}

/** 10. Negative Externality & Pigouvian Tax */
function Example_Externality() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Q", yname: "P, Cost", origin: "0",
    ticks: { x1: 4.0, x1_name: "Q_{opt}", x2: 6.0, x2_name: "Q_m", y1: 4.0, y1_name: "P_m", y2: 6.0, y2_name: "P_{opt}" }
  });
  setLine(1, 1, 9, 9, 1, "MSB = MPB", { color: "#2563eb", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(2, 1, 1.5, 9, 5.5, "PMC", { color: "#16a34a", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(3, 1, 4.5, 9, 8.5, "SMC = PMC + MEC", { color: "#dc2626", width: "semithick", labelPos: "end", labelAnchor: "right" });
  setLine(4, 4.0, 0, 4.0, 6.0, "", { dashed: true, color: "#64748b" });
  setLine(5, 0, 6.0, 4.0, 6.0, "", { dashed: true, color: "#64748b" });
  setLine(6, 6.0, 0, 6.0, 4.0, "", { dashed: true, color: "#64748b" });
  setLine(7, 0, 4.0, 6.0, 4.0, "", { dashed: true, color: "#64748b" });
  setLine(8, 4.0, 3.0, 4.0, 6.0, "t = MEC", { color: "#9333ea", width: "thick", labelPos: "mid", labelAnchor: "left" });
  setPoint(1, 4.0, 6.0, "Social Optimum", { color: "#dc2626", pos: "above" });
  setPoint(2, 6.0, 4.0, "Market Outcome", { color: "#16a34a", pos: "below" });
}

/** 11. Normal Distribution (Gaussian Bell Curve) */
function Example_NormalDist() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "x (\\sigma)", yname: "f(x)", origin: "0",
    ticks: { x1: 3.6, x1_name: "\\mu-\\sigma", x2: 6.4, x2_name: "\\mu+\\sigma", y1: 8.0, y1_name: "\\text{Peak}" }
  });
  setCurve(1, 0.5, 0.1, 2.1, 0.4, 4.8, 8.0, 5.0, 8.0, "", { color: "#2563eb" });
  setCurve(2, 5.0, 8.0, 5.2, 8.0, 7.9, 0.4, 9.5, 0.1, "f(x)", { color: "#2563eb" });
  setLine(1, 5.0, 0, 5.0, 8.0, "\\mu (Mean)", { color: "#dc2626", style: "dashed", width: "semithick", labelPos: "end", labelAnchor: "above" });
  setLine(2, 3.6, 0, 3.6, 4.85, "", { color: "#64748b", style: "dotted" });
  setLine(3, 6.4, 0, 6.4, 4.85, "", { color: "#64748b", style: "dotted" });
  setLine(4, 3.6, 4.85, 6.4, 4.85, "68.2\\% Area", { color: "#9333ea", arrow: "<->", width: "semithick", labelPos: "mid", labelAnchor: "above" });
  setPoint(1, 5.0, 8.0, "\\mu", { color: "#dc2626", pos: "above" });
  setPoint(2, 3.6, 4.85, "-\\sigma", { color: "#2563eb", pos: "left" });
  setPoint(3, 6.4, 4.85, "+\\sigma", { color: "#2563eb", pos: "right" });
}

/** 12. Trigonometric Unit Circle */
function Example_UnitCircle() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "x", yname: "y", origin: "O"
  });
  setCircle(1, 5, 5, 3.5, "x^2+y^2=1", { color: "#2563eb", fill: true });
  setLine(1, 1, 5, 9, 5, "", { color: "#94a3b8", style: "dashed" });
  setLine(2, 5, 1, 5, 9, "", { color: "#94a3b8", style: "dashed" });
  setLine(3, 5, 5, 7.47, 7.47, "r=1", { color: "#dc2626", arrow: "->", width: "thick", labelPos: "mid", labelAnchor: "above" });
  setLine(4, 7.47, 5, 7.47, 7.47, "\\sin\\theta", { color: "#16a34a", style: "dashed", width: "semithick", labelPos: "mid", labelAnchor: "right" });
  setLine(5, 5, 5, 7.47, 5, "\\cos\\theta", { color: "#d97706", width: "semithick", labelPos: "mid", labelAnchor: "below" });
  setPoint(1, 7.47, 7.47, "P(\\cos\\theta, \\sin\\theta)", { color: "#dc2626", pos: "above" });
  setPoint(2, 5, 5, "(0,0)", { color: "#0f172a", pos: "below" });
}

/** 13. Lorenz Curve & Gini Inequality */
function Example_LorenzGini() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Cumulative % Population", yname: "Cumulative % Income", origin: "0",
    ticks: { x1: 9, x1_name: "100\\%", y1: 9, y1_name: "100\\%" }
  });
  setLine(1, 0, 0, 9, 9, "Equality Line (45^\\circ)", { color: "#94a3b8", style: "dashed", labelPos: "end", labelAnchor: "right" });
  setCurve(1, 0, 0, 3.5, 0.8, 6.8, 3.2, 9, 9, "Lorenz Curve L(p)", { color: "#9333ea" });
  setPoint(1, 4.5, 3.2, "Area A", { color: "#ef4444", pos: "above" });
  setPoint(2, 6.5, 1.8, "Area B", { color: "#3b82f6", pos: "below" });
  setPoint(3, 9, 9, "(100%, 100%)", { color: "#0f172a", pos: "above" });
}

/** 14. Physics: Projectile Motion Trajectory */
function Example_Projectile() {
  resetAllCanvasElements();
  setAxes({
    xsize: 10, ysize: 10, xname: "Distance x (m)", yname: "Height y (m)", origin: "0",
    ticks: { x1: 4, x1_name: "x_{apex}", x2: 8, x2_name: "Range R", y1: 6, y1_name: "H_{max}" }
  });
  // Mathematically exact parabola y = (4*H/R^2)*x*(R - x) degree-elevated to cubic Bézier
  setCurve(1, 0, 0, 2.67, 8.0, 5.33, 8.0, 8, 0, "Trajectory y(x)", { color: "#2563eb" });
  // Launch velocity vector v0 tangent to trajectory at launch (slope = 3.0)
  setLine(1, 0, 0, 1.8, 5.4, "v_0", { color: "#dc2626", arrow: "->", width: "very thick", labelPos: "end", labelAnchor: "above" });
  setLine(2, 4, 0, 4, 6.0, "", { color: "#64748b", style: "dashed" });
  setLine(3, 0, 6.0, 4, 6.0, "", { color: "#64748b", style: "dashed" });
  setPoint(1, 4, 6.0, "Apex (v_y = 0)", { color: "#0f172a", pos: "above" });
  setPoint(2, 8, 0, "Landing R", { color: "#16a34a", pos: "above" });
}

// ----------------------------------------------------
// Model Registry & Loader
// ----------------------------------------------------

window.EXAMPLE_MODELS = [
  {
    id: "supply-demand",
    name: "Supply & Demand",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Competitive market equilibrium with upward supply, downward demand, and dashed projections to equilibrium price and quantity.",
    fn: Example_SupplyDemand
  },
  {
    id: "is-lm",
    name: "IS-LM Model",
    category: "macro",
    badge: "Macroeconomics",
    badgeColor: "#10b981",
    desc: "Goods and money market equilibrium showing the intersection of downward IS curve and upward LM curve.",
    fn: Example_ISLM
  },
  {
    id: "monopoly",
    name: "Monopoly & DWL",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Monopoly pricing showing Demand, Marginal Revenue, Marginal Cost, shaded economic profit, and deadweight loss.",
    fn: Example_Monopoly
  },
  {
    id: "utility-max",
    name: "Utility Maximization",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Consumer choice theory with a linear budget line tangent to convex indifference curves U1, U2, and U3.",
    fn: Example_UtilityMax
  },
  {
    id: "cost-curves",
    name: "Firm Cost Curves",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Cost structure with U-shaped ATC and AVC, Nike-swoosh MC cutting ATC at its minimum, and market price P=MR.",
    fn: Example_CostCurves
  },
  {
    id: "keynesian-cross",
    name: "Keynesian Cross (45°)",
    category: "macro",
    badge: "Macroeconomics",
    badgeColor: "#10b981",
    desc: "Aggregate expenditure model with the 45-degree guideline Y=AE, autonomous expenditure A0, and equilibrium income.",
    fn: Example_KeynesianCross
  },
  {
    id: "solow-growth",
    name: "Solow Growth Model",
    category: "macro",
    badge: "Macroeconomics",
    badgeColor: "#10b981",
    desc: "Solow-Swan economic growth model with production function f(k), investment curve s·f(k), and depreciation ray.",
    fn: Example_SolowGrowth
  },
  {
    id: "ad-as",
    name: "AD-AS Equilibrium",
    category: "macro",
    badge: "Macroeconomics",
    badgeColor: "#10b981",
    desc: "Aggregate Demand and Aggregate Supply with vertical LRAS at potential GDP, upward SRAS, and downward AD.",
    fn: Example_ADAS
  },
  {
    id: "ppf",
    name: "Production Possibility (PPF)",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Concave production possibility frontier with efficient boundary points, inefficient interior, and unattainable coordinates.",
    fn: Example_PPF
  },
  {
    id: "externality",
    name: "Negative Externality & Tax",
    category: "micro",
    badge: "Microeconomics",
    badgeColor: "#3b82f6",
    desc: "Market failure with Private Marginal Cost (PMC) vs Social Marginal Cost (SMC) and the Pigouvian tax wedge.",
    fn: Example_Externality
  },
  {
    id: "normal-dist",
    name: "Normal Distribution",
    category: "math",
    badge: "Math & Stats",
    badgeColor: "#8b5cf6",
    desc: "Gaussian bell curve with mean μ, standard deviation bounds μ±σ, inflection points, and 68.2% area width.",
    fn: Example_NormalDist
  },
  {
    id: "unit-circle",
    name: "Trigonometric Unit Circle",
    category: "math",
    badge: "Math & Geometry",
    badgeColor: "#8b5cf6",
    desc: "Unit circle x²+y²=1 with radial vector r=1 at θ=45°, perpendicular sine and cosine coordinate projections.",
    fn: Example_UnitCircle
  },
  {
    id: "lorenz-gini",
    name: "Lorenz Curve & Gini",
    category: "math",
    badge: "Economics & Stats",
    badgeColor: "#8b5cf6",
    desc: "Income distribution model with the 45-degree line of perfect equality, convex Lorenz curve, and Gini regions A and B.",
    fn: Example_LorenzGini
  },
  {
    id: "projectile",
    name: "Projectile Motion",
    category: "physics",
    badge: "Physics",
    badgeColor: "#f59e0b",
    desc: "Kinematics trajectory showing launch velocity vector v0, parabolic flight path, apex maximum height, and horizontal range.",
    fn: Example_Projectile
  }
];

function loadExampleModel(modelId) {
  var model = window.EXAMPLE_MODELS.find(function(m) { return m.id === modelId; });
  if (!model) {
    console.warn("Model not found:", modelId);
    return;
  }
  model.fn();

  // Initiate canvas layers for the newly loaded example model
  if (window.layerManager && typeof window.layerManager.initForExample === 'function') {
    window.layerManager.initForExample(model);
  } else if (window.layerManager && typeof window.layerManager.syncFromDOM === 'function') {
    window.layerManager.syncFromDOM(true);
  }

  if (typeof DrawGraph === 'function') {
    DrawGraph();
  }
  if (window.coordinateHistory && typeof window.coordinateHistory.push === 'function') {
    window.coordinateHistory.push('Load Template: ' + model.name);
  }
  if (typeof showToast === 'function') {
    showToast('Loaded ' + model.name + ' template');
  }
}

// Backward Compatibility aliases
function Example1() { loadExampleModel('supply-demand'); }
function Example2() { loadExampleModel('solow-growth'); }
function Example3() { loadExampleModel('cost-curves'); }
function Example4() { loadExampleModel('utility-max'); }
function clearAllinput() { resetAllCanvasElements(); }
