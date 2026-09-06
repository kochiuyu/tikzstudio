// Infinite, adaptive grid rendering for 2D Cartesian plane
function drawGrid(customCnv, scaleMultiplier, forceState) {
    var isExport = !!scaleMultiplier && scaleMultiplier !== 1;
    if (!customCnv) {
        if (typeof forceState === 'boolean') {
            window.isGridEnabled = forceState;
        } else {
            window.isGridEnabled = !window.isGridEnabled;
        }
        window.isGridDrawn = window.isGridEnabled;

        var gridBtn = document.getElementById("btn-toggle-grid");
        if (gridBtn) {
            if (window.isGridEnabled) {
                gridBtn.classList.add("active");
            } else {
                gridBtn.classList.remove("active");
            }
        }

        if (!window.isGridEnabled) {
            var bgcanvas = document.getElementById("bgcanvas");
            if (bgcanvas) {
                var bgctx = bgcanvas.getContext("2d");
                bgctx.clearRect(0, 0, bgcanvas.width, bgcanvas.height);
            }
            if (typeof DrawGraph === 'function') DrawGraph();
            return;
        }
    }

    var cnv = customCnv || document.getElementById("bgcanvas") || document.getElementById("myCanvas");
    if (!cnv) return;

    var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : 35);
    var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
    var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);

    var mult = scaleMultiplier || 1;
    var logicalWidth = isExport ? (cnv.width / mult) : cnv.width;
    var logicalHeight = isExport ? (cnv.height / mult) : cnv.height;

    var ctx = cnv.getContext('2d');
    ctx.save();
    if (isExport) {
        ctx.scale(mult, mult);
    }
    if (!customCnv) {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    }

    ctx.globalCompositeOperation = "destination-over";

    // Transform to Cartesian math coordinates origin
    ctx.transform(1, 0, 0, -1, curXOffset, logicalHeight - curYOffset);

    // Visible mathematical bounds on canvas
    var minX = -curXOffset / curScale;
    var maxX = (logicalWidth - curXOffset) / curScale;
    var minY = -curYOffset / curScale;
    var maxY = (logicalHeight - curYOffset) / curScale;

    // Expand bounds slightly for clean rendering across viewport edges
    var startX = Math.floor(minX) - 1;
    var endX = Math.ceil(maxX) + 1;
    var startY = Math.floor(minY) - 1;
    var endY = Math.ceil(maxY) + 1;

    // Choose grid step based on zoom scale
    var step = 1;
    if (curScale < 12) step = 5;
    else if (curScale < 22) step = 2;

    // 1. Major grid lines
    ctx.strokeStyle = "#e2e8f0"; // slate-200
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (var x = Math.floor(startX / step) * step; x <= endX; x += step) {
        ctx.moveTo(x * curScale, startY * curScale);
        ctx.lineTo(x * curScale, endY * curScale);
    }

    for (var y = Math.floor(startY / step) * step; y <= endY; y += step) {
        ctx.moveTo(startX * curScale, y * curScale);
        ctx.lineTo(endX * curScale, y * curScale);
    }
    ctx.stroke();

    // 2. Subtle minor sub-grid lines when zoomed in
    if (curScale >= 45) {
        var subStep = curScale >= 85 ? 0.25 : 0.5;
        ctx.strokeStyle = "#f1f5f9"; // soft slate-100
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (var sx = Math.floor(startX / subStep) * subStep; sx <= endX; sx += subStep) {
            if (Math.abs(sx % step) > 0.001) {
                ctx.moveTo(sx * curScale, startY * curScale);
                ctx.lineTo(sx * curScale, endY * curScale);
            }
        }
        for (var sy = Math.floor(startY / subStep) * subStep; sy <= endY; sy += subStep) {
            if (Math.abs(sy % step) > 0.001) {
                ctx.moveTo(startX * curScale, sy * curScale);
                ctx.lineTo(endX * curScale, sy * curScale);
            }
        }
        ctx.stroke();
    }

    // 3. Infinite Axis Reference Lines (X=0 and Y=0) across full canvas
    ctx.strokeStyle = "#cbd5e1"; // slate-300
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    // Y-axis line
    ctx.moveTo(0, startY * curScale);
    ctx.lineTo(0, endY * curScale);
    // X-axis line
    ctx.moveTo(startX * curScale, 0);
    ctx.lineTo(endX * curScale, 0);
    ctx.stroke();

    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
}

if (typeof window !== 'undefined') {
    window.drawGrid = drawGrid;
    window.isGridEnabled = false;
    window.isGridDrawn = false;
}
