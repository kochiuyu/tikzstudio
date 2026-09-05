// AddLine creates new modern styled form card for drawing straight line
function AddLine(form) {
    if (!form) form = document.getElementById("lineform") || document.myform;

    var curI = counter_i;
    var rr = 1;
    var rr1 = 2;

    var card = document.createElement('div');
    card.className = 'item-card';
    card.id = 'line_card_' + curI;

    card.innerHTML = 
      '<div class="item-card-header">' +
        '<span style="font-weight: 600;">Line ' + curI + '</span>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" onclick="selectShapeOnCanvas(\'line\', ' + curI + ')" title="Manipulate directly on canvas with drag handles">Canvas Edit</button>' +
          '<button type="button" id="' + curI + '" class="btn-modern btn-modern-danger btn-modern-sm" onclick="del(this.id); DrawGraph();">Clear</button>' +
        '</div>' +
      '</div>' +
      '<div id="line_telemetry_' + curI + '" class="telemetry-pill" style="margin: 0.25rem 0 0.4rem 0; font-size: 0.72rem; padding: 0.2rem 0.5rem; background: var(--color-bg-alt, #f8fafc); border: 1px solid var(--color-border, #e2e8f0); border-radius: 4px; display: inline-block; font-family: monospace; color: var(--color-text, #334155);">L: 0.00 u | Slope: 0 (0°)</div>' +
      '<div class="form-row">' +
        '<span class="form-label" style="min-width: 48px;">Coords:</span>' +
        '<span class="coord-box">(<input type="text" id="a_' + curI + '" value="0">,<input type="text" id="b_' + curI + '" value="0">)</span>' +
        '<span style="color: var(--color-text-muted); font-weight: bold;">&mdash;</span>' +
        '<span class="coord-box">(<input type="text" id="c_' + curI + '" value="0">,<input type="text" id="d_' + curI + '" value="0">)</span>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.4rem; gap: 0.35rem; flex-wrap: wrap;">' +
        '<span class="form-label" style="min-width: 42px;">Arrow:</span>' +
        '<select id="lineArrow_' + curI + '" class="select-modern" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="none" selected>None (--)</option>' +
          '<option value="->">Forward (-&gt;)</option>' +
          '<option value="<-">Reverse (&lt;-)</option>' +
          '<option value="<->">Both (&lt;-&gt;)</option>' +
        '</select>' +
        '<span class="form-label" style="min-width: 40px; margin-left: 0.25rem;">Width:</span>' +
        '<select id="lineWidth_' + curI + '" class="select-modern" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="ultra thin">Ultra Thin</option>' +
          '<option value="thin" selected>Thin</option>' +
          '<option value="semithick">Semithick</option>' +
          '<option value="thick">Thick</option>' +
          '<option value="very thick">Very Thick</option>' +
        '</select>' +
        '<span class="form-label" style="min-width: 38px; margin-left: 0.25rem;">Style:</span>' +
        '<select id="lineStyle_' + curI + '" class="select-modern" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="solid" selected>Solid</option>' +
          '<option value="dashed">Dashed</option>' +
          '<option value="dotted">Dotted</option>' +
          '<option value="dashdotted">Dash-Dot</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.4rem; gap: 0.35rem; flex-wrap: wrap;">' +
        '<span class="form-label" style="min-width: 42px;">Label:</span>' +
        '<input type="text" id="linename_' + curI + '" class="input-modern" size="5" value="" placeholder="Name" style="width: 70px;">' +
        '<span class="form-label" style="min-width: 30px; margin-left: 0.2rem;">Pos:</span>' +
        '<select id="lineLabelPos_' + curI + '" class="select-modern" title="Position along line" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="end" selected>End</option>' +
          '<option value="mid">Mid</option>' +
          '<option value="start">Start</option>' +
        '</select>' +
        '<span class="form-label" style="min-width: 44px; margin-left: 0.2rem;">Anchor:</span>' +
        '<select id="lineLabelAnchor_' + curI + '" class="select-modern" title="Label anchor alignment" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="right" selected>Right</option>' +
          '<option value="above">Above</option>' +
          '<option value="below">Below</option>' +
          '<option value="left">Left</option>' +
          '<option value="above right">Above Right</option>' +
          '<option value="above left">Above Left</option>' +
          '<option value="below right">Below Right</option>' +
          '<option value="below left">Below Left</option>' +
          '<option value="sloped">Sloped</option>' +
        '</select>' +
        '<span class="form-label" style="min-width: 36px; margin-left: 0.2rem;">Color:</span>' +
        '<select id="lineColor_' + curI + '" class="select-modern" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">' +
          '<option value="black" selected>black</option>' +
          '<option value="yellow">yellow</option>' +
          '<option value="red">red</option>' +
          '<option value="blue">blue</option>' +
          '<option value="purple">purple</option>' +
          '<option value="brown">brown</option>' +
          '<option value="orange">orange</option>' +
          '<option value="green">green</option>' +
        '</select>' +
      '</div>' +
      '<div class="options-row" style="margin-top: 0.4rem;">' +
        '<label class="checkbox-label"><input type="checkbox" id="lineshow_' + curI + '" checked> Show</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyOne" id="mouseDL_' + curI + '" onclick="test(' + (curI - rr) + ')"> Mouse Draw</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="lin_' + curI + '" onclick="test1(' + (3 * (curI - rr)) + ')"> All</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="LP1_' + curI + '" onclick="test1(' + (3 * curI - rr1) + ')"> Pt 1</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="LP2_' + curI + '" onclick="test1(' + (3 * curI - rr) + ')"> Pt 2</label>' +
        '<input type="checkbox" id="linedash_' + curI + '" style="display:none;">' +
      '</div>';

    form.appendChild(card);

    // Sync lineStyle with linedash checkbox
    var styleSel = document.getElementById("lineStyle_" + curI);
    var dashCb = document.getElementById("linedash_" + curI);
    if (styleSel && dashCb) {
        styleSel.addEventListener('change', function() {
            dashCb.checked = (styleSel.value === 'dashed');
        });
    }

    // Attach listeners for live preview redraw and telemetry
    var inputs = card.querySelectorAll('input, select');
    for (var k = 0; k < inputs.length; k++) {
        inputs[k].addEventListener('input', function() {
            if (typeof updateLineTelemetry === 'function') updateLineTelemetry(curI);
            DrawGraph();
        });
        inputs[k].addEventListener('change', function() {
            if (typeof updateLineTelemetry === 'function') updateLineTelemetry(curI);
            DrawGraph();
        });
    }

    if (typeof updateLineTelemetry === 'function') updateLineTelemetry(curI);

    // Scroll new card smoothly into view
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus on first input
    var firstInput = document.getElementById("a_" + curI);
    if (firstInput) firstInput.select();

    counter_i++;

    if (typeof showToast === 'function') {
        showToast('Added Line ' + curI);
    }
}