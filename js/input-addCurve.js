// AddCurve creates new modern styled form card for drawing Bézier curve
function AddCurve(form) {
    if (!form) form = document.getElementById("curveform") || document.myform2;

    var curJ = counter_j;
    var rr = 1;
    var rr1 = 2;
    var rr2 = 3;
    var rr3 = 4;

    var card = document.createElement('div');
    card.className = 'item-card';
    card.id = 'curve_card_' + curJ;

    card.innerHTML = 
      '<div class="item-card-header">' +
        '<span>Curve ' + curJ + '</span>' +
        '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" onclick="selectShapeOnCanvas(\'curve\', ' + curJ + ')" title="Manipulate directly on canvas with drag handles">Canvas Edit</button>' +
        '<button type="button" id="' + curJ + '" class="btn-modern btn-modern-danger btn-modern-sm" onclick="delC(this.id); DrawGraph();">Clear</button>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="form-label">Start / Ctrl / End:</span>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="coord-box">P1: (<input type="text" id="e_' + curJ + '" value="0">,<input type="text" id="f_' + curJ + '" value="0">)</span>' +
        '<span class="coord-box">C1: (<input type="text" id="g_' + curJ + '" value="0">,<input type="text" id="h_' + curJ + '" value="0">)</span>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="coord-box">C2: (<input type="text" id="i_' + curJ + '" value="0">,<input type="text" id="j_' + curJ + '" value="0">)</span>' +
        '<span class="coord-box">P2: (<input type="text" id="k_' + curJ + '" value="0">,<input type="text" id="l_' + curJ + '" value="0">)</span>' +
      '</div>' +
      '<div class="options-row">' +
        '<label class="checkbox-label"><input type="checkbox" id="curveshow_' + curJ + '" checked> Show</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="mouseDC_' + curJ + '" name="onlyOne" onclick="test2(' + (curJ - rr) + ')"> Mouse Draw</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="cm_' + curJ + '" name="onlyPC" onclick="test3(' + (5 * (curJ - rr)) + ')"> All</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="CP1_' + curJ + '" name="onlyPC" onclick="test3(' + (5 * curJ - rr3) + ')" value="1"> P1</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="CP2_' + curJ + '" name="onlyPC" onclick="test3(' + (5 * curJ - rr2) + ')" value="2"> C1</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="CP3_' + curJ + '" name="onlyPC" onclick="test3(' + (5 * curJ - rr1) + ')" value="3"> C2</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="CP4_' + curJ + '" name="onlyPC" onclick="test3(' + (5 * curJ - rr) + ')" value="4"> P2</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="curvedash_' + curJ + '"> Dash</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="curveguide_' + curJ + '"> Guides</label>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.5rem;">' +
        '<span class="form-label">Label:</span>' +
        '<input type="text" id="curvename_' + curJ + '" class="input-modern" size="5" value="" placeholder="Name" style="width: 80px;">' +
        '<span class="form-label">Color:</span>' +
        '<select id="curveColor_' + curJ + '" class="select-modern">' +
          '<option value="black" selected>black</option>' +
          '<option value="yellow">yellow</option>' +
          '<option value="red">red</option>' +
          '<option value="blue">blue</option>' +
          '<option value="purple">purple</option>' +
          '<option value="brown">brown</option>' +
          '<option value="orange">orange</option>' +
          '<option value="green">green</option>' +
        '</select>' +
      '</div>';

    form.appendChild(card);

    if (window.enhanceColorControl) {
        var colSel = document.getElementById("curveColor_" + curJ) || document.getElementById("curvecolor_" + curJ);
        if (colSel) window.enhanceColorControl(colSel);
    }

    // Attach listeners for live preview redraw
    var inputs = card.querySelectorAll('input, select');
    for (var k = 0; k < inputs.length; k++) {
        inputs[k].addEventListener('input', function() { DrawGraph(); });
        inputs[k].addEventListener('change', function() { DrawGraph(); });
    }

    // Scroll new card smoothly into view
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus on first input
    var firstInput = document.getElementById("e_" + curJ);
    if (firstInput) firstInput.select();

    counter_j++;

    if (typeof showToast === 'function') {
        showToast('Added Curve ' + curJ);
    }
}
