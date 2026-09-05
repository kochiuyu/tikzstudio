function PrintRectangle(ctx, a, b, c, d, name, dash, lineColor) {
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
    
    ctx.beginPath();
    ctx.strokeStyle = (lineColor && lineColor.value) ? lineColor.value : "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(scale * minX, scale * minY, scale * width, scale * height);
    
    if (name && name.value) {
        ctx.save();
        ctx.translate(scale * (minX + width / 2), scale * (minY + height / 2));
        ctx.scale(1, -1);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = (lineColor && lineColor.value) ? lineColor.value : "#000000";
        ctx.fillText(name.value, 0, 0);
        ctx.restore();
    }
    
    ctx.restore();
}

function DrawRectangle(a, b, c, d, name, dash, lineColor) {
    var x1 = parseFloat(a.value) || 0;
    var y1 = parseFloat(b.value) || 0;
    var x2 = parseFloat(c.value) || 0;
    var y2 = parseFloat(d.value) || 0;
    var options = [];
    if (dash && dash.checked) {
        options.push("dashed");
    }
    if (lineColor && lineColor.value && lineColor.value !== "#000000" && lineColor.value !== "#000") {
        options.push("draw=" + lineColor.value);
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
