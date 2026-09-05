function test(cb) {
    drawingline = true;
    cleanCheckbox("curveform");
    cleanCheckbox("Retangularform");
    var form = document.myform || document.getElementById("lineform");
    if (!form || !form.onlyOne) return;
    var elements = form.onlyOne;
    if (!elements.length) elements = [elements];
    var isNowChecked = false;
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == cb);
            if (j == cb && elements[j].checked) isNowChecked = true;
        }
    }
    var lineIdx = cb + 1;
    var showEl = document.getElementById("lineshow_" + lineIdx);
    if (showEl && isNowChecked) showEl.checked = true;

    if (isNowChecked && window.activateDrawingMode) {
        window.activateDrawingMode('line', lineIdx, 'all');
    } else if (!isNowChecked && window.deactivateDrawingMode) {
        window.deactivateDrawingMode();
    }
}

// For rectangle point (All, Pt 1, Pt 2)
function test5(op) {
    cleanCheckbox("lineform");
    cleanCheckbox("curveform");
    drawingline = true;
    if (op % 3 !== 0) {
        onlyonepoint = true;
    } else {
        onlyonepoint = false;
    }
    var form = document.myform3 || document.getElementById("Retangularform");
    if (!form || !form.onlyPR) return;
    var elements = form.onlyPR;
    if (!elements.length) elements = [elements];
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == op);
        }
    }
    var rectIdx = Math.floor(op / 3) + 1;
    var sub = (op % 3 === 1) ? 'p1' : (op % 3 === 2 ? 'p2' : 'all');
    var showEl = document.getElementById("retangularshow_" + rectIdx);
    if (showEl) showEl.checked = true;
    var drawCb = document.getElementById("mouseDR_" + rectIdx);
    if (drawCb) drawCb.checked = true;

    if (window.activateDrawingMode) {
        window.activateDrawingMode('rectangle', rectIdx, sub);
    }
}

// For line point (All, Pt 1, Pt 2)
function test1(ad) {
    cleanCheckbox("curveform");
    cleanCheckbox("Retangularform");
    drawingline = true;
    if (ad % 3 !== 0) {
        onlyonepoint = true;
    } else {
        onlyonepoint = false;
    }
    var form = document.myform || document.getElementById("lineform");
    if (!form || !form.onlyP) return;
    var elements = form.onlyP;
    if (!elements.length) elements = [elements];
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == ad);
        }
    }
    var lineIdx = Math.floor(ad / 3) + 1;
    var sub = (ad % 3 === 1) ? 'p1' : (ad % 3 === 2 ? 'p2' : 'all');
    var showEl = document.getElementById("lineshow_" + lineIdx);
    if (showEl) showEl.checked = true;
    var drawCb = document.getElementById("mouseDL_" + lineIdx);
    if (drawCb) drawCb.checked = true;

    if (window.activateDrawingMode) {
        window.activateDrawingMode('line', lineIdx, sub);
    }
}

function test2(ef) {
    drawingline = false;
    onlyonepoint = false;
    cleanCheckbox("lineform");
    cleanCheckbox("Retangularform");
    var form = document.myform2 || document.getElementById("curveform");
    if (!form || !form.onlyOne) return;
    var elements = form.onlyOne;
    if (!elements.length) elements = [elements];
    var isNowChecked = false;
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == ef);
            if (j == ef && elements[j].checked) isNowChecked = true;
        }
    }
    var curveIdx = ef + 1;
    var showEl = document.getElementById("curveshow_" + curveIdx);
    if (showEl && isNowChecked) showEl.checked = true;

    if (isNowChecked && window.activateDrawingMode) {
        window.activateDrawingMode('curve', curveIdx, 'all');
    } else if (!isNowChecked && window.deactivateDrawingMode) {
        window.deactivateDrawingMode();
    }
}

function test4(cb) {
    cleanCheckbox("curveform");
    cleanCheckbox("lineform");
    var form = document.myform3 || document.getElementById("Retangularform");
    if (!form || !form.onlyOne) return;
    var elements = form.onlyOne;
    if (!elements.length) elements = [elements];
    var isNowChecked = false;
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == cb);
            if (j == cb && elements[j].checked) isNowChecked = true;
        }
    }
    var rectIdx = cb + 1;
    var showEl = document.getElementById("retangularshow_" + rectIdx);
    if (showEl && isNowChecked) showEl.checked = true;

    var allPointCb = document.getElementById("retangular_" + rectIdx);
    if (allPointCb && isNowChecked) allPointCb.checked = true;

    if (isNowChecked && window.activateDrawingMode) {
        window.activateDrawingMode('rectangle', rectIdx, 'all');
    } else if (!isNowChecked && window.deactivateDrawingMode) {
        window.deactivateDrawingMode();
    }
}

function cleanCheckbox(formid) {
    var form = document.getElementById(formid);
    if (!form) return;
    var cks = form.getElementsByTagName("input");
    for (var i = 0; i < cks.length; i++) {
        if (cks[i].type != "checkbox" || (cks[i].id && (cks[i].id.indexOf("lineshow") >= 0
            || cks[i].id.indexOf("curveshow") >= 0 || cks[i].id.indexOf("retangularshow") >= 0
            || cks[i].id.indexOf("linedash") >= 0 || cks[i].id.indexOf("retangulardash") >= 0 || cks[i].id.indexOf("curvedash") >= 0))) {
            continue;
        }
        cks[i].checked = false;
    }
}

// For curve point
function test3(mn) {
    drawingline = false;
    if (!isNaN(mn) && mn % 5 != 0) {
        onlyonepoint = true;
    } else {
        onlyonepoint = false;
    }
    cleanCheckbox("lineform");
    cleanCheckbox("Retangularform");
    var form = document.myform2 || document.getElementById("curveform");
    if (!form || !form.onlyPC) return;
    var elements = form.onlyPC;
    if (!elements.length) elements = [elements];
    for (var j = 0; j < elements.length; j++) {
        if (elements[j]) {
            elements[j].checked = (j == mn);
        }
    }
    var curveIdx = Math.floor(mn / 5) + 1;
    var sub = (mn % 5 === 0) ? 'all' : ('p' + (mn % 5));
    var showEl = document.getElementById("curveshow_" + curveIdx);
    if (showEl) showEl.checked = true;
    var drawCb = document.getElementById("mouseDC_" + curveIdx);
    if (drawCb) drawCb.checked = true;

    if (window.activateDrawingMode) {
        window.activateDrawingMode('curve', curveIdx, sub);
    }
}
