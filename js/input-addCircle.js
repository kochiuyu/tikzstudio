// AddCircle dynamically creates a new modern styled form card for circles
if (typeof window !== 'undefined' && typeof window.counter_circle === 'undefined') {
    window.counter_circle = 2;
}

function AddCircle(form) {
    if (!form) form = document.getElementById("circleform") || document.forms["circleform"];
    if (!form) return;

    var curC = typeof window.counter_circle !== 'undefined' ? window.counter_circle : 2;

    var card = document.createElement('div');
    card.className = 'item-card';
    card.id = 'circle_card_' + curC;

    card.innerHTML = 
      '<div class="item-card-header">' +
        '<span>Circle ' + curC + '</span>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" onclick="selectShapeOnCanvas(\'circle\', ' + curC + ')" title="Manipulate directly on canvas with drag handles">Canvas Edit</button>' +
          '<button type="button" id="' + curC + '" class="btn-modern btn-modern-danger btn-modern-sm" onclick="delCircle(this.id); DrawGraph();">Clear</button>' +
        '</div>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="form-label">Center:</span>' +
        '<span class="coord-box">(<input type="text" id="circle_x_' + curC + '" value="0">,<input type="text" id="circle_y_' + curC + '" value="0">)</span>' +
        '<span class="form-label" style="margin-left: 0.5rem;">Radius:</span>' +
        '<span class="coord-box"><input type="text" id="circle_r_' + curC + '" value="0" style="width: 46px;"></span>' +
      '</div>' +
      '<div class="options-row">' +
        '<label class="checkbox-label"><input type="checkbox" id="circleshow_' + curC + '" checked> Show</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="circledash_' + curC + '"> Dash</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="circlefill_' + curC + '"> Shade</label>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.5rem;">' +
        '<span class="form-label">Label:</span>' +
        '<input type="text" id="circlename_' + curC + '" class="input-modern" size="5" value="" placeholder="Label" style="width: 80px;">' +
        '<span class="form-label">Color:</span>' +
        '<select id="circleColor_' + curC + '" class="select-modern">' +
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
        var colSel = document.getElementById("circleColor_" + curC);
        if (colSel) window.enhanceColorControl(colSel);
    }

    // Attach listeners for live preview redraw
    var inputs = card.querySelectorAll('input, select');
    for (var k = 0; k < inputs.length; k++) {
        inputs[k].addEventListener('input', function() { if (typeof DrawGraph === 'function') DrawGraph(); });
        inputs[k].addEventListener('change', function() { if (typeof DrawGraph === 'function') DrawGraph(); });
    }

    // Scroll new card smoothly into view
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus on first input
    var firstInput = document.getElementById("circle_x_" + curC);
    if (firstInput) firstInput.select();

    window.counter_circle = curC + 1;

    if (typeof showToast === 'function') {
        showToast('Added Circle ' + curC);
    }
}
