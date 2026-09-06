// Global variable fallbacks
if (typeof window !== 'undefined') {
    if (typeof window.counter_i === 'undefined') window.counter_i = 5;
    if (typeof window.counter_j === 'undefined') window.counter_j = 3;
    if (typeof window.counter_z === 'undefined') window.counter_z = 2;
    if (typeof window.counter_circle === 'undefined') window.counter_circle = 2;
    if (typeof window.scale === 'undefined') window.scale = 35;
    if (typeof window.x_offset === 'undefined') window.x_offset = 28;
    if (typeof window.y_offset === 'undefined') window.y_offset = 28;
    if (typeof window.ps_j === 'undefined') window.ps_j = 4;
    if (typeof window.mouse_history === 'undefined') window.mouse_history = [];
    if (typeof window.drawingline === 'undefined') window.drawingline = true;
    if (typeof window.onlyonepoint === 'undefined') window.onlyonepoint = false;
    if (typeof window.nowColor === 'undefined') window.nowColor = "#FFFFFF";
}

// main function to draw canvas and produce tikz code
function DrawGraph(isEample, customCanvas, scaleMultiplier) {
	var isExport = !!customCanvas;
	var mult = scaleMultiplier || 1;
	
	var axEl = document.getElementById("axisColor");
	var axCol = (axEl && axEl.value) ? axEl.value : 'black';
	var axTikzCol = (axCol !== 'black' && axCol !== '#0f172a' && axCol !== '#000000') ? (window.toTikzColor ? window.toTikzColor(axCol) : axCol) : '';
	var axOpts = ['thick', '<->'];
	if (axTikzCol) axOpts.push(axTikzCol);
	var nodeColOpt = axTikzCol ? (', ' + axTikzCol) : '';
	var axis = "\\draw[" + axOpts.join(', ') + "] (0,"+ document.getElementById("ysize").value+") node[above" + nodeColOpt + "]{$"+document.getElementById("yname").value+"$}--(0,0)--("+document.getElementById("xsize").value+",0) node[right" + nodeColOpt + "]{$"+document.getElementById("xname").value+"$}; % Axis and Label<br>";
	var lines="";
	var curves="";
	var rects="";
	var circles="";
	
	if (isEample) {
		var xsizeEl = document.getElementById("xsize");
		var ysizeEl = document.getElementById("ysize");
		var xnameEl = document.getElementById("xname");
		var ynameEl = document.getElementById("yname");
		var originEl = document.getElementById("label_origin_name");

		if (xsizeEl && (!xsizeEl.value || xsizeEl.value == 0)) xsizeEl.value = 10;
		if (ysizeEl && (!ysizeEl.value || ysizeEl.value == 0)) ysizeEl.value = 10;
		if (xnameEl && !xnameEl.value) xnameEl.value = 'Q';
		if (ynameEl && !ynameEl.value) ynameEl.value = 'P';
		if (originEl && !originEl.value) originEl.value = '0';

		var myxsize = xsizeEl ? xsizeEl.value : 10;
		var myysize = ysizeEl ? ysizeEl.value : 10;
		var myxname = xnameEl ? xnameEl.value : 'Q';
		var myyname = ynameEl ? ynameEl.value : 'P';
	} else {
		var myxsize = document.getElementById("xsize") ? document.getElementById("xsize").value : 10;
		var myysize = document.getElementById("ysize") ? document.getElementById("ysize").value : 10;
		var myxname = document.getElementById("xname") ? document.getElementById("xname").value : 'x';
		var myyname = document.getElementById("yname") ? document.getElementById("yname").value : 'y';
	}

    //drawing canvas below
    var cnv = customCanvas || document.getElementById("myCanvas");//get Canvas object
    if (!cnv) return;
    var ctx = cnv.getContext("2d");//get corresponding CanvasRenderingContext2D object
    var logicalHeight = isExport ? (cnv.height / mult) : cnv.height;

    if (!isExport) {
        window.isGridDrawn = false;
        ctx.restore();
        ctx.restore();
    }
    ctx.font = "20px Arial";
	
    if (!isExport) {
        var bgcanvas = document.getElementById("bgcanvas");
        mouse_history = [];
        if (bgcanvas) {
            var bgctx = bgcanvas.getContext("2d");
            bgctx.clearRect(0,0,bgctx.width, bgctx.height);
        }
        drawMousePoint();
        ctx.clearRect(0, 0, cnv.width, cnv.height);
    }

    if (isExport && mult !== 1) {
        ctx.save();
        ctx.scale(mult, mult);
    }

    var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? parseFloat(scale) : 35);
    var scaleInput = document.getElementById("graph_scale");
    if (scaleInput && !isNaN(parseFloat(scaleInput.value))) {
        curScale = parseFloat(scaleInput.value);
    }
    window.scale = curScale;
    scale = curScale;

    var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
    var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);
    window.x_offset = curXOffset;
    x_offset = curXOffset;
    window.y_offset = curYOffset;
    y_offset = curYOffset;

    ctx.save();
    //Draw axis
    var axHex = window.normalizeToHex ? window.normalizeToHex(axCol) : (axCol === 'black' ? '#0f172a' : axCol);
    ctx.strokeStyle = axHex;
    ctx.fillStyle = axHex;
    ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
    ctx.beginPath();
    //define the start-point coordinate of the straight
    ctx.moveTo(0, scale * myysize);
    //define the end-point coordinate value of the straight
    ctx.lineTo(0, 0);
    ctx.lineTo(scale * myxsize, 0);
    //print the straight along the order of coordinate
    ctx.stroke();

    //y-arrow
    //ctx.save();
    if(document.getElementById("ysize").value!=0){
		//alert('111');
		ctx.beginPath();
		ctx.moveTo(0, scale * document.getElementById("ysize").value);
		ctx.lineTo(-5.5, scale * document.getElementById("ysize").value - 11);
		ctx.lineTo(5.5, scale * document.getElementById("ysize").value - 11);
		ctx.lineTo(0, scale * document.getElementById("ysize").value);
		ctx.closePath();
		ctx.fillStyle = axHex;
		ctx.fill();
		ctx.stroke();
	} else if (isEample) {
		//alert('222');
		ctx.beginPath();
		ctx.moveTo(0, scale * myysize);
		ctx.lineTo(-5.5, scale * myysize - 11);
		ctx.lineTo(5.5, scale * myysize - 11);
		ctx.lineTo(0, scale * myysize);
		ctx.closePath();
		ctx.fillStyle = axHex;
		ctx.fill();
		ctx.stroke();
	}
    //x-arrow
    //ctx.save();
	if(document.getElementById("xsize").value!=0){
		ctx.beginPath();
		ctx.moveTo(scale * document.getElementById("xsize").value, 0);
		ctx.lineTo(scale * document.getElementById("xsize").value - 11, 5.5);
		ctx.lineTo(scale * document.getElementById("xsize").value - 11, -5.5);
		ctx.lineTo(scale * document.getElementById("xsize").value, 0);
		ctx.closePath();
		ctx.fillStyle = axHex;
		ctx.fill();
		ctx.stroke();
	} else if (isEample) {
		ctx.beginPath();
		ctx.moveTo(scale * myxsize, 0);
		ctx.lineTo(scale * myxsize - 11, 5.5);
		ctx.lineTo(scale * myxsize - 11, -5.5);
		ctx.lineTo(scale * myxsize, 0);
		ctx.closePath();
		ctx.fillStyle = axHex;
		ctx.fill();
		ctx.stroke();
	}
    //x-axis name
    ctx.save();
    ctx.translate(scale * myxsize + 10, -10);
    ctx.scale(1, -1);
    ctx.fillStyle = axHex;
    ctx.fillText(myxname, 0, 0);
    ctx.restore();
    //y axis name
    ctx.save();
    ctx.translate(-10, scale * myysize + 10);
    ctx.scale(1, -1);
    ctx.fillStyle = axHex;
    ctx.fillText(myyname, 0, 0);
    ctx.restore();
	
    for (var j = 1; j < counter_i; j++) {
        if (typeof updateLineTelemetry === 'function') updateLineTelemetry(j);
        var lineshowEl = document.getElementById("lineshow_" + j);
        if (lineshowEl && lineshowEl.checked) {
            var aEl = document.getElementById("a_" + j);
            var bEl = document.getElementById("b_" + j);
            var cEl = document.getElementById("c_" + j);
            var dEl = document.getElementById("d_" + j);
            var nameEl = document.getElementById("linename_" + j);
            var dashEl = document.getElementById("linedash_" + j);
            var colEl = document.getElementById("lineColor_" + j);
            var arrowEl = document.getElementById("lineArrow_" + j);
            var widthEl = document.getElementById("lineWidth_" + j);
            var styleEl = document.getElementById("lineStyle_" + j);
            var labelPosEl = document.getElementById("lineLabelPos_" + j);
            var labelAnchorEl = document.getElementById("lineLabelAnchor_" + j);
            if (aEl && bEl && cEl && dEl) {
                PrintLine(ctx, aEl, bEl, cEl, dEl, nameEl, dashEl, colEl, arrowEl, widthEl, styleEl, labelPosEl, labelAnchorEl);
                if (aEl.value != 0 || bEl.value != 0 || cEl.value != 0 || dEl.value != 0) {
                    lines += DrawLine(aEl, bEl, cEl, dEl, nameEl, dashEl, colEl, arrowEl, widthEl, styleEl, labelPosEl, labelAnchorEl);
                }
            }
        }
    }
    for (var j = 1; j < counter_j; j++) {
        var curveshowEl = document.getElementById("curveshow_" + j);
        if (curveshowEl && curveshowEl.checked) {
            var eEl = document.getElementById("e_" + j);
            var fEl = document.getElementById("f_" + j);
            var gEl = document.getElementById("g_" + j);
            var hEl = document.getElementById("h_" + j);
            var iEl = document.getElementById("i_" + j);
            var jEl = document.getElementById("j_" + j);
            var kEl = document.getElementById("k_" + j);
            var lEl = document.getElementById("l_" + j);
            var curvenameEl = document.getElementById("curvename_" + j);
            var curvedashEl = document.getElementById("curvedash_" + j);
            var curveguideEl = document.getElementById("curveguide_" + j);
            var curveColorEl = document.getElementById("curveColor_" + j) || document.getElementById("curvecolor_" + j);
            if (eEl && fEl && gEl && hEl && iEl && jEl && kEl && lEl) {
                PrintCurve(ctx, eEl, fEl, gEl, hEl, iEl, jEl, kEl, lEl, curvenameEl, curvedashEl, curveguideEl, curveColorEl);
                if (eEl.value != 0 || fEl.value != 0 || gEl.value != 0 || hEl.value != 0 || iEl.value != 0 || jEl.value != 0 || kEl.value != 0 || lEl.value != 0) {
                    curves += DrawCurve(eEl, fEl, gEl, hEl, iEl, jEl, kEl, lEl, curvenameEl, curvedashEl, curveColorEl);
                }
            }
        }
    }
    for (var z = 1; z < counter_z; z++) {
        var rectshowEl = document.getElementById("retangularshow_" + z);
        if (rectshowEl && rectshowEl.checked) {
            var rEl = document.getElementById("r_" + z);
            var sEl = document.getElementById("s_" + z);
            var tEl = document.getElementById("t_" + z);
            var uEl = document.getElementById("u_" + z);
            var rNameEl = document.getElementById("retangularname_" + z);
            var rDashEl = document.getElementById("retangulardash_" + z);
            var rColEl = document.getElementById("retangularColor_" + z);
            var rFillEl = document.getElementById("retangularfill_" + z);
            if (rEl && sEl && tEl && uEl) {
                PrintRectangle(ctx, rEl, sEl, tEl, uEl, rNameEl, rDashEl, rColEl, rFillEl);
                if (rEl.value != 0 || sEl.value != 0 || tEl.value != 0 || uEl.value != 0) {
                    rects += DrawRectangle(rEl, sEl, tEl, uEl, rNameEl, rDashEl, rColEl, rFillEl);
                }
            }
        }
    }

    var maxCircles = typeof counter_circle !== 'undefined' ? counter_circle : 2;
    for (var c = 1; c < maxCircles; c++) {
        var cshowEl = document.getElementById("circleshow_" + c);
        if (cshowEl && cshowEl.checked) {
            var cxEl = document.getElementById("circle_x_" + c);
            var cyEl = document.getElementById("circle_y_" + c);
            var crEl = document.getElementById("circle_r_" + c);
            var cnameEl = document.getElementById("circlename_" + c);
            var cdashEl = document.getElementById("circledash_" + c);
            var ccolEl = document.getElementById("circleColor_" + c);
            var cfillEl = document.getElementById("circlefill_" + c);
            if (cxEl && cyEl && crEl) {
                if (typeof PrintCircle === 'function') {
                    PrintCircle(ctx, cxEl, cyEl, crEl, cnameEl, cdashEl, ccolEl, cfillEl);
                }
                if (parseFloat(crEl.value) > 0 && typeof DrawCircle === 'function') {
                    circles += DrawCircle(cxEl, cyEl, crEl, cnameEl, cdashEl, ccolEl, cfillEl);
                }
            }
        }
    }
 	
	axis += "\\node [below left] at (0,0) {$"+document.getElementById("label_origin_name").value+"$};%Origin</br>";
	if(document.getElementById("label_x_1_name").value!=""){
	axis += "\\node [below] at ("+document.getElementById("label_x_1").value+",0) {$"+document.getElementById("label_x_1_name").value+"$}; % X-Lable 1<br>";
	}
	if(document.getElementById("label_x_2_name").value!=""){
	axis += "\\node [below] at ("+document.getElementById("label_x_2").value+",0) {$"+document.getElementById("label_x_2_name").value+"$}; % X-Lable 2<br>";                
	}
	if(document.getElementById("label_y_1_name").value!=""){
	axis += "\\node [left] at (0,"+document.getElementById("label_y_1").value+") {$"+document.getElementById("label_y_1_name").value+"$}; %Y-Lable 1<br>";
	}
	if(document.getElementById("label_y_2_name").value!=""){
	axis += "\\node [left] at (0,"+document.getElementById("label_y_2").value+") {$"+document.getElementById("label_y_2_name").value+"$}; % Y-Lable 2<br>";
	}

	var pointsTikz = "";
	for (var j = 1; j < ps_j; j++) {
		var pEl = document.getElementById("p_" + j);
		var qEl = document.getElementById("q_" + j);
		var pNameEl = document.getElementById("p_name_" + j);
		var showEl = document.getElementById("pointshow_" + j);
		var colorEl = document.getElementById("pointColor_" + j);
		var dotEl = document.getElementById("pointdot_" + j);
		var posEl = document.getElementById("pointpos_" + j);

		var isShown = !showEl || showEl.checked;
		if (pEl && qEl && isShown) {
			var px = parseFloat(pEl.value) || 0;
			var py = parseFloat(qEl.value) || 0;
			var pName = pNameEl ? pNameEl.value.trim() : "";
			var pCol = (colorEl && colorEl.value) ? colorEl.value : "black";
			var hasDot = !dotEl || dotEl.checked;
			var pPos = posEl ? posEl.value : "above_right";

			if (pName !== "" || px !== 0 || py !== 0) {
				var tikzAnchor = pPos.replace('_', ' ');
				var tikzCol = (pCol === 'black' || pCol === '#0f172a' || pCol === '#000000') ? '' : (window.toTikzColor ? window.toTikzColor(pCol) : pCol);
				if (hasDot) {
					var colPart = tikzCol ? '[' + tikzCol + '] ' : '';
					var nodePart = pName ? ' node[' + tikzAnchor + (tikzCol ? ',' + tikzCol : '') + ']{$' + pName + '$}' : '';
					pointsTikz += "\\filldraw " + colPart + "(" + px + "," + py + ") circle (1.5pt)" + nodePart + "; % Point " + j + "<br>";
				} else if (pName) {
					var nodeOpts = tikzAnchor + (tikzCol ? ',' + tikzCol : '');
					pointsTikz += "\\node [" + nodeOpts + "] at (" + px + "," + py + ") {$" + pName + "$}; % Label " + j + "<br>";
				}
			}
		}
	}

	document.getElementById("answer").innerHTML = axis + lines + curves + rects + circles + pointsTikz;
	
	ctx.restore();
    // restore initial coordinate system
    //drawing label beyond axis
    //draw origin
    ctx.save();
    ctx.transform(1, 0, 0, -1, x_offset - 16, logicalHeight - (y_offset - 16));
    ctx.scale(1, -1);
    ctx.fillText(document.getElementById("label_origin_name").value, 0, 0);
    ctx.restore();

    //draw x-axis tick notch & label 1
    if (document.getElementById("label_x_1_name").value != "" || parseFloat(document.getElementById("label_x_1").value) > 0) {
        ctx.save();
        ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
        ctx.beginPath();
        ctx.moveTo(document.getElementById("label_x_1").value * scale, -5);
        ctx.lineTo(document.getElementById("label_x_1").value * scale, 5);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.save();
    ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - (y_offset - 18));
    ctx.translate(document.getElementById("label_x_1").value * scale, 0);
    ctx.scale(1, -1);
    ctx.fillText(document.getElementById("label_x_1_name").value, 0, 0);
    ctx.restore();

    //draw x-axis tick notch & label 2
    if (document.getElementById("label_x_2_name").value != "" || parseFloat(document.getElementById("label_x_2").value) > 0) {
        ctx.save();
        ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
        ctx.beginPath();
        ctx.moveTo(document.getElementById("label_x_2").value * scale, -5);
        ctx.lineTo(document.getElementById("label_x_2").value * scale, 5);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.save();
    ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - (y_offset - 18));
    ctx.translate(document.getElementById("label_x_2").value * scale, 0);
    ctx.scale(1, -1);
    ctx.fillText(document.getElementById("label_x_2_name").value, 0, 0);
    ctx.restore();

    //draw y-axis tick notch & label 1
    if (document.getElementById("label_y_1_name").value != "" || parseFloat(document.getElementById("label_y_1").value) > 0) {
        ctx.save();
        ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
        ctx.beginPath();
        ctx.moveTo(-5, document.getElementById("label_y_1").value * scale);
        ctx.lineTo(5, document.getElementById("label_y_1").value * scale);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.save();
    ctx.transform(1, 0, 0, -1, x_offset - 20, logicalHeight - y_offset);
    ctx.translate(0, document.getElementById("label_y_1").value * scale);
    ctx.scale(1, -1);
    ctx.fillText(document.getElementById("label_y_1_name").value, 0, 0);
    ctx.restore();

    //draw y-axis tick notch & label 2
    if (document.getElementById("label_y_2_name").value != "" || parseFloat(document.getElementById("label_y_2").value) > 0) {
        ctx.save();
        ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
        ctx.beginPath();
        ctx.moveTo(-5, document.getElementById("label_y_2").value * scale);
        ctx.lineTo(5, document.getElementById("label_y_2").value * scale);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.save();
    ctx.transform(1, 0, 0, -1, x_offset - 20, logicalHeight - y_offset);
    ctx.translate(0, document.getElementById("label_y_2").value * scale);
    ctx.scale(1, -1);
    ctx.fillText(document.getElementById("label_y_2_name").value, 0, 0);
    ctx.restore();
	
	// Draw points & labels on canvas
	for (var j = 1; j < ps_j; j++) {
		var pEl = document.getElementById("p_" + j);
		var qEl = document.getElementById("q_" + j);
		var pNameEl = document.getElementById("p_name_" + j);
		var showEl = document.getElementById("pointshow_" + j);
		var colorEl = document.getElementById("pointColor_" + j);
		var dotEl = document.getElementById("pointdot_" + j);
		var posEl = document.getElementById("pointpos_" + j);

		var isShown = !showEl || showEl.checked;
		if (pEl && qEl && isShown) {
			var px = parseFloat(pEl.value) || 0;
			var py = parseFloat(qEl.value) || 0;
			var pName = pNameEl ? pNameEl.value.trim() : "";
			var pCol = (colorEl && colorEl.value) ? colorEl.value : "black";
			var hasDot = !dotEl || dotEl.checked;
			var pPos = posEl ? posEl.value : "above_right";

			if (pName !== "" || px !== 0 || py !== 0) {
				ctx.save();
				ctx.transform(1, 0, 0, -1, x_offset, logicalHeight - y_offset);
				ctx.translate(px * scale, py * scale);

				// Draw dot marker if enabled
				var pColHex = window.normalizeToHex ? window.normalizeToHex(pCol) : (pCol === 'black' ? '#0f172a' : pCol);
				if (hasDot) {
					ctx.beginPath();
					ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
					ctx.fillStyle = pColHex;
					ctx.fill();
					ctx.strokeStyle = '#ffffff';
					ctx.lineWidth = 1;
					ctx.stroke();
				}

				// Draw text upright with anchor positioning
				if (pName) {
					ctx.scale(1, -1); // flip Y for text
					ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
					ctx.fillStyle = pColHex;

					var textX = 6, textY = -6;
					var align = "left", baseline = "bottom";

					if (pPos === 'above_right') {
						textX = 6; textY = -6; align = "left"; baseline = "bottom";
					} else if (pPos === 'above') {
						textX = 0; textY = -7; align = "center"; baseline = "bottom";
					} else if (pPos === 'above_left') {
						textX = -6; textY = -6; align = "right"; baseline = "bottom";
					} else if (pPos === 'right') {
						textX = 8; textY = 0; align = "left"; baseline = "middle";
					} else if (pPos === 'left') {
						textX = -8; textY = 0; align = "right"; baseline = "middle";
					} else if (pPos === 'below_right') {
						textX = 6; textY = 12; align = "left"; baseline = "top";
					} else if (pPos === 'below') {
						textX = 0; textY = 12; align = "center"; baseline = "top";
					} else if (pPos === 'below_left') {
						textX = -6; textY = 12; align = "right"; baseline = "top";
					} else if (pPos === 'center') {
						textX = 0; textY = 0; align = "center"; baseline = "middle";
					}

					ctx.textAlign = align;
					ctx.textBaseline = baseline;
					ctx.fillText(pName, textX, textY);
				}
				ctx.restore();
			}
		}
	}

    if (isExport && mult !== 1) {
        ctx.restore();
    }

    // Auto-redraw grid if enabled
    if (!isExport && window.isGridEnabled && typeof window.drawGrid === 'function') {
        window.drawGrid();
    }
}

// Global legacy fallback helper functions
function getMousePos(cnv, evt) {
    var rect = cnv.getBoundingClientRect();
    var curScale = typeof window.scale !== 'undefined' ? window.scale : (scale || 35);
    var curXOffset = typeof window.x_offset !== 'undefined' ? window.x_offset : (x_offset || 28);
    var curYOffset = typeof window.y_offset !== 'undefined' ? window.y_offset : (y_offset || 28);
    return {
        x: Math.round(((evt.clientX - rect.left - curXOffset) / curScale) * 100) / 100,
        y: Math.round(((cnv.height - (evt.clientY - rect.top) - curYOffset) / curScale) * 100) / 100
    };
}

    //draw mouse point
    function drawMousePoint(){
        var ncv = document.getElementById("bgcanvas");
        if (!ncv) return;
        var context = ncv.getContext("2d");
        if (!context) return;
        context.clearRect(0, 0, ncv.width || 600, ncv.height || 580);
        var pointonscreen = 4;
        var isDrawingLine = (typeof drawingline !== 'undefined') ? drawingline : true;
        var isOnlyOne = (typeof onlyonepoint !== 'undefined') ? onlyonepoint : false;
        var history = (typeof mouse_history !== 'undefined') ? mouse_history : [];
        var curScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : 35);
        var curXOffset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
        var curYOffset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);

        if(isDrawingLine){    //if drawline take last two point to draw
            pointonscreen = 2;
        }

        if(isOnlyOne){
            pointonscreen = 1;
        }
        for(var i = history.length - 1,j=0; j < pointonscreen&&i>=0 ;i--,j++){
            var p = history[i];
            //context.moveTo(p['x'], p['y']);
            context.beginPath();
            context.strokeStyle = "#FFFFFF";
            var vy = Math.abs(p.y*curScale+curYOffset-580);
            context.arc(curXOffset+p.x*curScale, vy,1,0,2*Math.PI,true);
            context.closePath();
            context.fill();
        }
    }

    function putMousePoints(p){
        if (typeof mouse_history === 'undefined') {
            if (typeof window !== 'undefined') window.mouse_history = [];
            else mouse_history = [];
        }
        var lastindex = mouse_history.length - 1;
        if(lastindex>=0 && mouse_history[lastindex].x == p.x && mouse_history[lastindex].y == p.y){
            return;
        }
        mouse_history[mouse_history.length] = p;
    }

    //draw individual points
    function doPointL1(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_i; j++) {
            var dl = document.getElementById("mouseDL_" + j);
            var lp = document.getElementById("LP1_" + j);
            if (dl && dl.checked && lp && lp.checked) {
                var x0 = document.getElementById("a_" + j);
                var y0 = document.getElementById("b_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    function doPointL2(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_i; j++) {
            var lp = document.getElementById("LP2_" + j);
            if (lp && lp.checked) {
                var x0 = document.getElementById("c_" + j);
                var y0 = document.getElementById("d_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    function doPointC1(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_j; j++) {
            var cp = document.getElementById("CP1_" + j);
            if (cp && cp.checked) {
                var x0 = document.getElementById("e_" + j);
                var y0 = document.getElementById("f_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    function doPointC2(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_j; j++) {
            var cp = document.getElementById("CP2_" + j);
            if (cp && cp.checked) {
                var x0 = document.getElementById("g_" + j);
                var y0 = document.getElementById("h_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    function doPointC3(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_j; j++) {
            var cp = document.getElementById("CP3_" + j);
            if (cp && cp.checked) {
                var x0 = document.getElementById("i_" + j);
                var y0 = document.getElementById("j_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    function doPointC4(evt) {
        var mousePos = getMousePos(cnv, evt);
        for (var j = 1; j < counter_j; j++) {
            var cp = document.getElementById("CP4_" + j);
            if (cp && cp.checked) {
                var x0 = document.getElementById("k_" + j);
                var y0 = document.getElementById("l_" + j);
                if (x0 && y0) {
                    x0.value = mousePos.x;
                    y0.value = mousePos.y;
                    putMousePoints({x:mousePos.x,y:mousePos.y});
                    drawMousePoint();
                }
            }
        }
    }

    //draw all points
    var points = 0;
    var dots = 0;
	var points1=0;

    function doPoint(evt) {
        var mousePos = getMousePos(cnv, evt);
		
        //for Line Points
		for (var j = 1; j < counter_i; j++) {
            var dl = document.getElementById("mouseDL_" + j);
            var lin = document.getElementById("lin_" + j);
            if (dl && dl.checked && lin && lin.checked) {
                if (points == 0) {
                    var x0 = document.getElementById("a_" + j);
                    var y0 = document.getElementById("b_" + j);
                    if (x0 && y0) {
                        x0.value = mousePos.x;
                        y0.value = mousePos.y;
                        points = 1;
                    }
                } else if (points == 1) {
                    var x1 = document.getElementById("c_" + j);
                    var y1 = document.getElementById("d_" + j);
                    if (x1 && y1) {
                        x1.value = mousePos.x;
                        y1.value = mousePos.y;
                        points = 0;
                    }
                }
                putMousePoints({x:mousePos.x,y:mousePos.y});
                drawMousePoint();
            }
        }
		
		//for rectangle
        for (var j = 1; j < counter_z; j++) {
            var dr = document.getElementById("mouseDR_" + j);
            var rshow = document.getElementById("retangularshow_" + j);
            if (dr && dr.checked && rshow && rshow.checked) {
                if (points1 == 0) {
                    var x0 = document.getElementById("r_" + j);
                    var y0 = document.getElementById("s_" + j);
                    if (x0 && y0) {
                        x0.value = mousePos.x;
                        y0.value = mousePos.y;
                        points1 = 1;
                    }
                } else if (points1 == 1) {
                    var x1 = document.getElementById("t_" + j);
                    var y1 = document.getElementById("u_" + j);
                    if (x1 && y1) {
                        x1.value = mousePos.x;
                        y1.value = mousePos.y;
                        points1 = 0;
                    }
                }
                putMousePoints({x:mousePos.x,y:mousePos.y});
                drawMousePoint();
            }
        }

        //for Curve Points
        for (var j = 1; j < counter_j; j++) {
            var dc = document.getElementById("mouseDC_" + j);
            var cm = document.getElementById("cm_" + j);
            if (dc && dc.checked && cm && cm.checked) {
                if (dots == 0) {
                    var cx0 = document.getElementById("e_" + j);
                    var cy0 = document.getElementById("f_" + j);
                    if (cx0 && cy0) {
                        cx0.value = mousePos.x;
                        cy0.value = mousePos.y;
                        dots = 1;
                    }
                } else if (dots == 1) {
                    var cx1 = document.getElementById("g_" + j);
                    var cy1 = document.getElementById("h_" + j);
                    if (cx1 && cy1) {
                        cx1.value = mousePos.x;
                        cy1.value = mousePos.y;
                        dots = 2;
                    }
                } else if (dots == 2) {
                    var cx2 = document.getElementById("i_" + j);
                    var cy2 = document.getElementById("j_" + j);
                    if (cx2 && cy2) {
                        cx2.value = mousePos.x;
                        cy2.value = mousePos.y;
                        dots = 3;
                    }
                } else if (dots == 3) {
                    var cx3 = document.getElementById("k_" + j);
                    var cy3 = document.getElementById("l_" + j);
                    if (cx3 && cy3) {
                        cx3.value = mousePos.x;
                        cy3.value = mousePos.y;
                        dots = 0;
                    }
                }
                putMousePoints({x:mousePos.x,y:mousePos.y});
                drawMousePoint();
            }
        }
    }

if (typeof window !== 'undefined') {
    window.DrawGraph = DrawGraph;
    window.getMousePos = getMousePos;
    window.drawMousePoint = drawMousePoint;
    window.putMousePoints = putMousePoints;
    window.doPoint = doPoint;
}