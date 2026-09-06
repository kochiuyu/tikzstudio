// Circle drawing and TikZ export functionality
function PrintCircle(ctx, cxEl, cyEl, rEl, name, dash, lineColor, fill) {
    var r = parseFloat(rEl ? rEl.value : 0) || 0;
    if (r <= 0) return;

    var cx = parseFloat(cxEl ? cxEl.value : 0) || 0;
    var cy = parseFloat(cyEl ? cyEl.value : 0) || 0;
    var curScale = typeof scale !== 'undefined' ? scale : 35;

    ctx.save();
    if (dash && dash.checked) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }

    var rawCol = (lineColor && lineColor.value) ? lineColor.value : "#000000";
    var strokeCol = window.normalizeToHex ? window.normalizeToHex(rawCol) : rawCol;

    // Optional translucent fill
    if (fill && fill.checked) {
        ctx.save();
        ctx.fillStyle = strokeCol;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(curScale * cx, curScale * cy, curScale * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Border outline
    ctx.beginPath();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2;
    ctx.arc(curScale * cx, curScale * cy, curScale * r, 0, Math.PI * 2);
    ctx.stroke();

    // Center or offset text label if provided
    if (name && name.value) {
        ctx.save();
        ctx.translate(curScale * cx, curScale * cy);
        ctx.scale(1, -1);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = strokeCol;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name.value, 0, 0);
        ctx.restore();
    }

    ctx.restore();
}

function DrawCircle(cxEl, cyEl, rEl, name, dash, lineColor, fill) {
    var cx = parseFloat(cxEl ? cxEl.value : 0) || 0;
    var cy = parseFloat(cyEl ? cyEl.value : 0) || 0;
    var r = parseFloat(rEl ? rEl.value : 0) || 0;
    if (r <= 0) return "";

    var isFill = fill && fill.checked;
    var options = [];
    var col = (lineColor && lineColor.value) ? lineColor.value : "black";
    var isNonDefaultCol = col && col !== "#000000" && col !== "#000" && col !== "black" && col !== "#0f172a";

    if (isFill) {
        if (!isNonDefaultCol) {
            options.push("fill=gray!20");
        } else {
            var fillTikz = window.toTikzColor ? window.toTikzColor(col, 'fill') : ('fill=' + col);
            options.push(fillTikz, "fill opacity=0.15");
        }
    }
    if (dash && dash.checked) {
        options.push("dashed");
    }
    if (isNonDefaultCol) {
        var circleCol = window.toTikzColor ? window.toTikzColor(col) : ('color=' + col);
        options.push(circleCol);
    } else {
        options.push("draw");
    }

    var optStr = options.length ? "[" + options.join(", ") + "]" : "";
    var cmd = isFill ? "\\filldraw " : "\\draw ";
    var code = cmd + optStr + " (" + cx + "," + cy + ") circle [radius=" + r + "];";
    if (name && name.value) {
        code += " % " + name.value;
    }
    return code + "<br>";
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
