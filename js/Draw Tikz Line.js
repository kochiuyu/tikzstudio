// Create Tikz Straight Line with arrowheads, line weights, styles, colors & customizable node placement
function DrawLine(a, b, c, d, name, dash, lineColor, arrowEl, widthEl, styleEl, labelPosEl, labelAnchorEl) {
    var lineId = (a && a.id && a.id.indexOf('_') !== -1) ? a.id.split('_')[1] : null;

    var arrow = (arrowEl && arrowEl.value) || (lineId && document.getElementById("lineArrow_" + lineId)?.value) || 'none';
    var widthVal = (widthEl && widthEl.value) || (lineId && document.getElementById("lineWidth_" + lineId)?.value) || 'thin';
    var styleVal = (styleEl && styleEl.value) || (lineId && document.getElementById("lineStyle_" + lineId)?.value) || ((dash && dash.checked) ? 'dashed' : 'solid');
    var colVal = (lineColor && lineColor.value) || (lineId && document.getElementById("lineColor_" + lineId)?.value) || 'black';
    var labelPos = (labelPosEl && labelPosEl.value) || (lineId && document.getElementById("lineLabelPos_" + lineId)?.value) || 'end';
    var labelAnchor = (labelAnchorEl && labelAnchorEl.value) || (lineId && document.getElementById("lineLabelAnchor_" + lineId)?.value) || 'right';

    var opts = [];

    // Arrow options
    if (arrow === '->') opts.push("->");
    else if (arrow === '<-') opts.push("<-");
    else if (arrow === '<->') opts.push("<->");

    // Line thickness (omit 'thin' since it's the standard TikZ default)
    if (widthVal && widthVal !== 'thin') {
        opts.push(widthVal);
    }

    // Line style pattern
    if (styleVal === 'dashed' || (dash && dash.checked)) {
        opts.push("dashed");
    } else if (styleVal === 'dotted') {
        opts.push("dotted");
    } else if (styleVal === 'dashdotted') {
        opts.push("dashdotted");
    }

    // Color
    if (colVal && colVal !== 'black' && colVal !== '#0f172a' && colVal !== '#000000') {
        var tikzCol = window.toTikzColor ? window.toTikzColor(colVal) : colVal;
        opts.push(tikzCol);
    }

    var optStr = opts.length > 0 ? "[" + opts.join(", ") + "] " : " ";
    var line = "\\draw" + optStr + "(" + a.value + "," + b.value + ") -- (" + c.value + "," + d.value + ")";

    var labelName = name ? name.value.trim() : "";
    if (labelName) {
        var nodeOpts = [];

        if (labelPos === 'start') {
            nodeOpts.push("pos=0");
        } else if (labelPos === 'mid') {
            nodeOpts.push("pos=0.5");
        }

        if (labelAnchor === 'sloped') {
            nodeOpts.push("sloped", "above");
        } else if (labelAnchor) {
            nodeOpts.push(labelAnchor);
        }

        var nodeOptStr = nodeOpts.length > 0 ? "[" + nodeOpts.join(", ") + "]" : "";
        var content = (labelName.startsWith("$") && labelName.endsWith("$")) ? labelName : ("$" + labelName + "$");
        line += " node" + nodeOptStr + "{" + content + "}";
    }

    line += ";<br>";
    return line;
}


//Creat Tikz Curve
function DrawCurve(e, f, g, h, i, j, k, l, name, dash, curveColor) {
    var opts = [];
    if (dash && dash.checked) {
        opts.push("dashed");
    }
    var colVal = (curveColor && curveColor.value) ? curveColor.value : "black";
    if (colVal && colVal !== "black" && colVal !== "#0f172a" && colVal !== "#000000") {
        var tikzCol = window.toTikzColor ? window.toTikzColor(colVal) : colVal;
        opts.push(tikzCol);
    }
    var optStr = opts.length > 0 ? "[" + opts.join(", ") + "] " : " ";
    var line = "\\draw" + optStr;
    var labelPart = (name && name.value) ? " node[right]{$" + name.value + "$}" : "";
    return line + "(" + e.value + "," + f.value + ") ..controls (" + g.value + "," + h.value + ") and (" + i.value + "," + j.value + ") .. (" + k.value + "," + l.value + ")" + labelPart + ";<br>";
}

