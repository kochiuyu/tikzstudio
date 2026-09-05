function pt() {
    var axisCP = "";
    var curveCP = "";
    var lineCP = "";
    var rectangleCP = "";

    var axisLable = "Axis and Lable: </br>";
    var xsize = document.getElementById("xsize");
    var ysize = document.getElementById("ysize");
    var xname = document.getElementById("xname");
    var yname = document.getElementById("yname");

    if (xsize && xsize.value != 0) {
        axisCP += "&nbsp; X-Axis:(" + xsize.value + ",0) Name:[" + (xname ? xname.value : "") + "]</br>";
    }
    if (ysize && ysize.value != 0) {
        axisCP += "&nbsp; Y-Axis:(0," + ysize.value + ") Name:[" + (yname ? yname.value : "") + "]</br>";
    }
    var lx1 = document.getElementById("label_x_1");
    var lx1Name = document.getElementById("label_x_1_name");
    if (lx1Name && lx1Name.value != "" && lx1) {
        axisCP += "&nbsp; X-Lable_1:(0," + lx1.value + ")</br>";
    }
    var lx2 = document.getElementById("label_x_2");
    var lx2Name = document.getElementById("label_x_2_name");
    if (lx2Name && lx2Name.value != "" && lx2) {
        axisCP += "&nbsp; X-Lable_2:(" + lx2.value + ",0)</br>";
    }
    var ly1 = document.getElementById("label_y_1");
    var ly1Name = document.getElementById("label_y_1_name");
    if (ly1Name && ly1Name.value != "" && ly1) {
        axisCP += "&nbsp; Y-Lable_1:(0," + ly1.value + ")</br>";
    }
    var ly2 = document.getElementById("label_y_2");
    var ly2Name = document.getElementById("label_y_2_name");
    if (ly2Name && ly2Name.value != "" && ly2) {
        axisCP += "&nbsp; Y-Lable_2:(0," + ly2.value + ")</br>";
    }

    var axisLableCEl = document.getElementById("axisLableC");
    if (axisLableCEl) axisLableCEl.innerHTML = axisLable;
    var axisCopyEl = document.getElementById("axisCopy");
    if (axisCopyEl) axisCopyEl.innerHTML = axisCP;

    for (var j = 1; j < counter_i; j++) {
        var lineshowEl = document.getElementById("lineshow_" + j);
        if (lineshowEl && lineshowEl.checked) {
            var dashEl = document.getElementById("linedash_" + j);
            var dashCP = (dashEl && dashEl.checked) ? " [dash] " : "";
            var lineLable = "</br>Straight Line: </br>";
            var a = document.getElementById("a_" + j);
            var b = document.getElementById("b_" + j);
            var c = document.getElementById("c_" + j);
            var d = document.getElementById("d_" + j);
            var linename = document.getElementById("linename_" + j);
            var lineColor = document.getElementById("lineColor_" + j);
            var arrowEl = document.getElementById("lineArrow_" + j);
            var widthEl = document.getElementById("lineWidth_" + j);
            var styleEl = document.getElementById("lineStyle_" + j);
            var posEl = document.getElementById("lineLabelPos_" + j);
            var ancEl = document.getElementById("lineLabelAnchor_" + j);

            var arrowCP = (arrowEl && arrowEl.value !== 'none') ? "&nbsp;Arrow[" + arrowEl.value + "]" : "";
            var widthCP = (widthEl && widthEl.value !== 'thin') ? "&nbsp;Width[" + widthEl.value + "]" : "";
            var styleCP = (styleEl && styleEl.value !== 'solid') ? "&nbsp;Style[" + styleEl.value + "]" : dashCP;
            var posCP = (posEl && posEl.value !== 'end') ? "&nbsp;Pos[" + posEl.value + "]" : "";
            var ancCP = (ancEl && ancEl.value !== 'right') ? "&nbsp;Anchor[" + ancEl.value + "]" : "";

            if (a && b && c && d) {
                lineCP += "&nbsp; Straight Line_" + j + ":(" + a.value + "," + b.value + ")--(" + c.value + "," + d.value + ")&nbsp;Name[" + (linename ? linename.value : "") + "]&nbsp;Color[" + (lineColor ? lineColor.value : "black") + "]" + arrowCP + widthCP + styleCP + posCP + ancCP + "</br>";
            }
            var lineLableCEl = document.getElementById("lineLableC");
            if (lineLableCEl) lineLableCEl.innerHTML = lineLable;
            var lineCopyEl = document.getElementById("lineCopy");
            if (lineCopyEl) lineCopyEl.innerHTML = lineCP;
        }
    }

    for (var j = 1; j < counter_j; j++) {
        var curveshowEl = document.getElementById("curveshow_" + j);
        if (curveshowEl && curveshowEl.checked) {
            var curvedashEl = document.getElementById("curvedash_" + j);
            var dashCP2 = (curvedashEl && curvedashEl.checked) ? " [dash]" : "";
            var curveLable = "</br>Curve:</br>";
            var e = document.getElementById("e_" + j);
            var f = document.getElementById("f_" + j);
            var g = document.getElementById("g_" + j);
            var h = document.getElementById("h_" + j);
            var i = document.getElementById("i_" + j);
            var k = document.getElementById("k_" + j);
            var l = document.getElementById("l_" + j);
            var curvename = document.getElementById("curvename_" + j);
            var curveColor = document.getElementById("curveColor_" + j) || document.getElementById("curvecolor_" + j);
            if (e && f && g && h && i && k && l) {
                curveCP += "&nbsp; Curve_" + j + ":(" + e.value + "," + f.value + ")--(" + g.value + "," + h.value + ")--(" + i.value + "," + (document.getElementById("j_" + j) ? document.getElementById("j_" + j).value : "0") + ")--(" + k.value + "," + l.value + ")&nbsp;Name[" + (curvename ? curvename.value : "") + "]&nbsp;Color[" + (curveColor ? curveColor.value : "black") + "]&nbsp;" + dashCP2 + "</br>";
            }
            var curveLableCEl = document.getElementById("curveLableC");
            if (curveLableCEl) curveLableCEl.innerHTML = curveLable;
            var curveCopyEl = document.getElementById("curveCopy");
            if (curveCopyEl) curveCopyEl.innerHTML = curveCP;
        }
    }

    for (var z = 1; z < counter_z; z++) {
        var retshowEl = document.getElementById("retangularshow_" + z);
        if (retshowEl && retshowEl.checked) {
            var retdashEl = document.getElementById("retangulardash_" + z);
            var dashCP3 = (retdashEl && retdashEl.checked) ? " [dash] " : "";
            var rectangleLable = "</br>Rectangle: </br>";
            var r = document.getElementById("r_" + z);
            var s = document.getElementById("s_" + z);
            var t = document.getElementById("t_" + z);
            var u = document.getElementById("u_" + z);
            var retname = document.getElementById("retangularname_" + z);
            var retColor = document.getElementById("retangularColor_" + z);
            if (r && s && t && u) {
                rectangleCP += "&nbsp; Rectangle_" + z + ":(" + r.value + "," + s.value + ")--(" + t.value + "," + u.value + ")&nbsp;Name[" + (retname ? retname.value : "") + "]&nbsp;Color[" + (retColor ? retColor.value : "black") + "]&nbsp;" + dashCP3 + "</br>";
            }
            var rectangleLableCEl = document.getElementById("rectangleLableC");
            if (rectangleLableCEl) rectangleLableCEl.innerHTML = rectangleLable;
            var rectangleCopyEl = document.getElementById("rectangleCopy");
            if (rectangleCopyEl) rectangleCopyEl.innerHTML = rectangleCP;
        }
    }

    var circleCP = "";
    var maxCircles = typeof counter_circle !== 'undefined' ? counter_circle : 2;
    for (var c = 1; c < maxCircles; c++) {
        var circleshowEl = document.getElementById("circleshow_" + c);
        if (circleshowEl && circleshowEl.checked) {
            var circledashEl = document.getElementById("circledash_" + c);
            var dashCP4 = (circledashEl && circledashEl.checked) ? " [dash] " : "";
            var circleLable = "</br>Circle: </br>";
            var cx = document.getElementById("circle_x_" + c);
            var cy = document.getElementById("circle_y_" + c);
            var cr = document.getElementById("circle_r_" + c);
            var circlename = document.getElementById("circlename_" + c);
            var circleColor = document.getElementById("circleColor_" + c);
            if (cx && cy && cr) {
                circleCP += "&nbsp; Circle_" + c + ": Center(" + cx.value + "," + cy.value + ") Radius[" + cr.value + "]&nbsp;Name[" + (circlename ? circlename.value : "") + "]&nbsp;Color[" + (circleColor ? circleColor.value : "black") + "]&nbsp;" + dashCP4 + "</br>";
            }
            var circleLableCEl = document.getElementById("circleLableC");
            if (circleLableCEl) circleLableCEl.innerHTML = circleLable;
            var circleCopyEl = document.getElementById("circleCopy");
            if (circleCopyEl) circleCopyEl.innerHTML = circleCP;
        }
    }
}
