// draw the straight line on the canvas on the browser with arrowheads, stroke thickness, patterns & flexible label anchors
function PrintLine(ctx, a, b, c, d, name, dash, lineColor, arrowEl, widthEl, styleEl, labelPosEl, labelAnchorEl) {
    if (!ctx || !a || !b || !c || !d) return;

    var lineId = (a.id && a.id.indexOf('_') !== -1) ? a.id.split('_')[1] : null;

    var arrow = (arrowEl && arrowEl.value) || (lineId && document.getElementById("lineArrow_" + lineId)?.value) || 'none';
    var widthVal = (widthEl && widthEl.value) || (lineId && document.getElementById("lineWidth_" + lineId)?.value) || 'thin';
    var styleVal = (styleEl && styleEl.value) || (lineId && document.getElementById("lineStyle_" + lineId)?.value) || ((dash && dash.checked) ? 'dashed' : 'solid');
    var labelPos = (labelPosEl && labelPosEl.value) || (lineId && document.getElementById("lineLabelPos_" + lineId)?.value) || 'end';
    var labelAnchor = (labelAnchorEl && labelAnchorEl.value) || (lineId && document.getElementById("lineLabelAnchor_" + lineId)?.value) || 'right';

    var x1 = scale * parseFloat(a.value);
    var y1 = scale * parseFloat(b.value);
    var x2 = scale * parseFloat(c.value);
    var y2 = scale * parseFloat(d.value);

    var col = (lineColor && lineColor.value) ? lineColor.value : 'black';
    var labelText = (name && name.value) ? name.value : '';

    // Line thickness (pt to px equivalent on canvas)
    var strokeW = 1.4;
    if (widthVal === 'ultra thin') strokeW = 0.8;
    else if (widthVal === 'thin') strokeW = 1.4;
    else if (widthVal === 'semithick') strokeW = 2.0;
    else if (widthVal === 'thick') strokeW = 2.8;
    else if (widthVal === 'very thick') strokeW = 3.8;

    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = strokeW;

    // Pattern
    if (styleVal === 'dashed' || (dash && dash.checked)) {
        ctx.setLineDash([6, 4]);
    } else if (styleVal === 'dotted') {
        ctx.setLineDash([2, 3]);
    } else if (styleVal === 'dashdotted') {
        ctx.setLineDash([6, 3, 2, 3]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Helper: draw arrow head
    function drawCanvasArrowHead(tipX, tipY, fromX, fromY) {
        var angle = Math.atan2(tipY - fromY, tipX - fromX);
        var arrowLen = Math.max(9, 8 + strokeW * 1.5);
        var arrowSpread = Math.PI / 6; // 30 degrees

        ctx.save();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
            tipX - arrowLen * Math.cos(angle - arrowSpread),
            tipY - arrowLen * Math.sin(angle - arrowSpread)
        );
        ctx.lineTo(
            tipX - 0.75 * arrowLen * Math.cos(angle),
            tipY - 0.75 * arrowLen * Math.sin(angle)
        );
        ctx.lineTo(
            tipX - arrowLen * Math.cos(angle + arrowSpread),
            tipY - arrowLen * Math.sin(angle + arrowSpread)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Forward arrow (pointing to P2)
    if (arrow === '->' || arrow === '<->') {
        drawCanvasArrowHead(x2, y2, x1, y1);
    }
    // Reverse arrow (pointing to P1)
    if (arrow === '<-' || arrow === '<->') {
        drawCanvasArrowHead(x1, y1, x2, y2);
    }

    // Render Label
    if (labelText) {
        // Base coordinate according to position (start, mid, end)
        var t = 1.0;
        if (labelPos === 'start') t = 0.0;
        else if (labelPos === 'mid') t = 0.5;

        var lx = (1 - t) * x1 + t * x2;
        var ly = (1 - t) * y1 + t * y2;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(1, -1); // flip Y into standard screen space (+x right, +y down)

        ctx.fillStyle = col;
        ctx.font = "14px Arial, sans-serif";

        if (labelAnchor === 'sloped') {
            // Angle in Cartesian (+y up)
            var cartesianAngle = Math.atan2(y2 - y1, x2 - x1);
            // In screen space (+y down), angle is -cartesianAngle
            var screenAngle = -cartesianAngle;
            // Normalize so text is read left to right
            if (screenAngle > Math.PI / 2) screenAngle -= Math.PI;
            else if (screenAngle < -Math.PI / 2) screenAngle += Math.PI;

            ctx.rotate(screenAngle);
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(labelText, 0, -5);
        } else {
            var ox = 0, oy = 0;
            var align = "left", baseline = "middle";

            if (labelAnchor === 'right') { ox = 8; oy = 0; align = "left"; baseline = "middle"; }
            else if (labelAnchor === 'left') { ox = -8; oy = 0; align = "right"; baseline = "middle"; }
            else if (labelAnchor === 'above') { ox = 0; oy = -8; align = "center"; baseline = "bottom"; }
            else if (labelAnchor === 'below') { ox = 0; oy = 8; align = "center"; baseline = "top"; }
            else if (labelAnchor === 'above right' || labelAnchor === 'above_right') { ox = 6; oy = -6; align = "left"; baseline = "bottom"; }
            else if (labelAnchor === 'above left' || labelAnchor === 'above_left') { ox = -6; oy = -6; align = "right"; baseline = "bottom"; }
            else if (labelAnchor === 'below right' || labelAnchor === 'below_right') { ox = 6; oy = 6; align = "left"; baseline = "top"; }
            else if (labelAnchor === 'below left' || labelAnchor === 'below_left') { ox = -6; oy = 6; align = "right"; baseline = "top"; }

            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.fillText(labelText, ox, oy);
        }

        ctx.restore();
    }
}