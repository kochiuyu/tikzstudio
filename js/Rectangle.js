function PrintRectangle(ctx, a, b, c, d, name, dash, lineColor, fill) {
    ctx.save();
    if (dash && dash.checked) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }
    
    var x1 = parseFloat(a.value) || 0;
    var y1 = parseFloat(b.value) || 0;
    var x2 = parseFloat(c.value) || 0;
    var y2 = parseFloat(d.value) || 0;
    
    var minX = Math.min(x1, x2);
    var minY = Math.min(y1, y2);
    var width = Math.abs(x2 - x1);
    var height = Math.abs(y2 - y1);
    
    var colVal = (lineColor && lineColor.value) ? lineColor.value : "#000000";
    var colHex = window.normalizeToHex ? window.normalizeToHex(colVal) : colVal;

    if (fill && fill.checked) {
        ctx.save();
        ctx.fillStyle = colHex;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(scale * minX, scale * minY, scale * width, scale * height);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.strokeStyle = colHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(scale * minX, scale * minY, scale * width, scale * height);
    
    if (name && name.value) {
        ctx.save();
        ctx.translate(scale * (minX + width / 2), scale * (minY + height / 2));
        ctx.scale(1, -1);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = colHex;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (window.drawMathText) {
            window.drawMathText(ctx, name.value, 0, 4, { fontSize: 13, color: colHex, align: "center", baseline: "middle" });
        } else {
            ctx.fillText(name.value, 0, 4);
        }
        ctx.restore();
    }
    
    ctx.restore();
}

function DrawRectangle(a, b, c, d, name, dash, lineColor, fill) {
    var x1 = parseFloat(a.value) || 0;
    var y1 = parseFloat(b.value) || 0;
    var x2 = parseFloat(c.value) || 0;
    var y2 = parseFloat(d.value) || 0;
    var options = [];
    var colVal = (lineColor && lineColor.value) ? lineColor.value : "#000000";
    var isNonDefaultCol = colVal && colVal !== "#000000" && colVal !== "#000" && colVal !== "black" && colVal !== "#0f172a";

    if (fill && fill.checked) {
        if (!isNonDefaultCol) {
            options.push("fill=gray!20");
        } else {
            var fillTikz = window.toTikzColor ? window.toTikzColor(colVal, 'fill') : ('fill=' + colVal);
            options.push(fillTikz, "fill opacity=0.18");
        }
    }

    if (dash && dash.checked) {
        options.push("dashed");
    }
    if (isNonDefaultCol) {
        var strokeTikz = window.toTikzColor ? window.toTikzColor(colVal) : ('color=' + colVal);
        options.push(strokeTikz);
    } else {
        options.push("draw");
    }
    var optStr = options.length ? "[" + options.join(", ") + "]" : "";
    var code = "\\draw " + optStr + " (" + x1 + "," + y1 + ") rectangle (" + x2 + "," + y2 + ");";
    if (name && name.value) {
        code += " % " + name.value;
    }
    return code + "<br>";
}
