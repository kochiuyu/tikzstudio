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
        '<span>Line ' + curI + '</span>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" onclick="selectShapeOnCanvas(\'line\', ' + curI + ')" title="Manipulate directly on canvas with drag handles">Canvas Edit</button>' +
          '<button type="button" id="' + curI + '" class="btn-modern btn-modern-danger btn-modern-sm" onclick="del(this.id); DrawGraph();">Clear</button>' +
        '</div>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="form-label">Coords:</span>' +
        '<span class="coord-box">(<input type="text" id="a_' + curI + '" value="0">,<input type="text" id="b_' + curI + '" value="0">)</span>' +
        '<span style="color: var(--color-text-muted); font-weight: bold;">&mdash;</span>' +
        '<span class="coord-box">(<input type="text" id="c_' + curI + '" value="0">,<input type="text" id="d_' + curI + '" value="0">)</span>' +
      '</div>' +
      '<div class="options-row">' +
        '<label class="checkbox-label"><input type="checkbox" id="lineshow_' + curI + '" checked> Show</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyOne" id="mouseDL_' + curI + '" onclick="test(' + (curI - rr) + ')"> Mouse Draw</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="lin_' + curI + '" onclick="test1(' + (3 * (curI - rr)) + ')"> All</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="LP1_' + curI + '" onclick="test1(' + (3 * curI - rr1) + ')"> Pt 1</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyP" id="LP2_' + curI + '" onclick="test1(' + (3 * curI - rr) + ')"> Pt 2</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="linedash_' + curI + '"> Dash</label>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.5rem;">' +
        '<span class="form-label">Label:</span>' +
        '<input type="text" id="linename_' + curI + '" class="input-modern" size="5" value="" placeholder="Name" style="width: 80px;">' +
        '<span class="form-label">Color:</span>' +
        '<select id="lineColor_' + curI + '" class="select-modern">' +
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

    // Attach listeners for live preview redraw
    var inputs = card.querySelectorAll('input, select');
    for (var k = 0; k < inputs.length; k++) {
        inputs[k].addEventListener('input', function() { DrawGraph(); });
        inputs[k].addEventListener('change', function() { DrawGraph(); });
    }

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