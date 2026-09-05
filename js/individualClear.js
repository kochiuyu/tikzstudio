function delR(id) {
    var r = document.getElementById("r_" + id); if (r) r.value = 0;
    var s = document.getElementById("s_" + id); if (s) s.value = 0;
    var t = document.getElementById("t_" + id); if (t) t.value = 0;
    var u = document.getElementById("u_" + id); if (u) u.value = 0;
    var n = document.getElementById("retangularname_" + id); if (n) n.value = "";
    var c = document.getElementById("retangularColor_" + id); if (c) c.value = "black";
}

function del(id) {
    var a = document.getElementById("a_" + id); if (a) a.value = 0;
    var b = document.getElementById("b_" + id); if (b) b.value = 0;
    var c = document.getElementById("c_" + id); if (c) c.value = 0;
    var d = document.getElementById("d_" + id); if (d) d.value = 0;
    var n = document.getElementById("linename_" + id); if (n) n.value = "";
    var col = document.getElementById("lineColor_" + id); if (col) col.value = "black";
    var arr = document.getElementById("lineArrow_" + id); if (arr) arr.value = "none";
    var wid = document.getElementById("lineWidth_" + id); if (wid) wid.value = "thin";
    var sty = document.getElementById("lineStyle_" + id); if (sty) sty.value = "solid";
    var dsh = document.getElementById("linedash_" + id); if (dsh) dsh.checked = false;
    var lpos = document.getElementById("lineLabelPos_" + id); if (lpos) lpos.value = "end";
    var lanc = document.getElementById("lineLabelAnchor_" + id); if (lanc) lanc.value = "right";
    if (typeof updateLineTelemetry === 'function') updateLineTelemetry(id);
}

function delC(id) {
    var e = document.getElementById("e_" + id); if (e) e.value = 0;
    var f = document.getElementById("f_" + id); if (f) f.value = 0;
    var g = document.getElementById("g_" + id); if (g) g.value = 0;
    var h = document.getElementById("h_" + id); if (h) h.value = 0;
    var i = document.getElementById("i_" + id); if (i) i.value = 0;
    var j = document.getElementById("j_" + id); if (j) j.value = 0;
    var k = document.getElementById("k_" + id); if (k) k.value = 0;
    var l = document.getElementById("l_" + id); if (l) l.value = 0;
    var n = document.getElementById("curvename_" + id); if (n) n.value = "";
    var col = document.getElementById("curveColor_" + id) || document.getElementById("curvecolor_" + id);
    if (col) col.value = "black";
}

function delP(id) {
    var p = document.getElementById("p_" + id); if (p) p.value = 0;
    var q = document.getElementById("q_" + id); if (q) q.value = 0;
    var n = document.getElementById("p_name_" + id); if (n) n.value = "";
    var col = document.getElementById("pointColor_" + id); if (col) col.value = "black";
    var show = document.getElementById("pointshow_" + id); if (show) show.checked = false;
    var dot = document.getElementById("pointdot_" + id); if (dot) dot.checked = true;
    var pos = document.getElementById("pointpos_" + id); if (pos) pos.value = "above_right";
    var title = document.getElementById("point_title_" + id); if (title) title.textContent = "(Empty)";
}

function delCircle(id) {
    var x = document.getElementById("circle_x_" + id); if (x) x.value = 0;
    var y = document.getElementById("circle_y_" + id); if (y) y.value = 0;
    var r = document.getElementById("circle_r_" + id); if (r) r.value = 0;
    var n = document.getElementById("circlename_" + id); if (n) n.value = "";
    var col = document.getElementById("circleColor_" + id); if (col) col.value = "black";
    var dash = document.getElementById("circledash_" + id); if (dash) dash.checked = false;
    var fill = document.getElementById("circlefill_" + id); if (fill) fill.checked = false;
    var show = document.getElementById("circleshow_" + id); if (show) show.checked = false;
}
