// AddRec creates new modern styled form card for drawing rectangle
function AddRec(form) {
    if (!form) form = document.getElementById("Retangularform") || document.myform3;

    var curZ = counter_z;
    var rr = 1;

    var card = document.createElement('div');
    card.className = 'item-card';
    card.id = 'rectangle_card_' + curZ;

    card.innerHTML = 
      '<div class="item-card-header">' +
        '<span>Rectangle ' + curZ + '</span>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button type="button" class="btn-modern btn-modern-secondary btn-modern-sm" onclick="selectShapeOnCanvas(\'rectangle\', ' + curZ + ')" title="Manipulate directly on canvas with drag handles">Canvas Edit</button>' +
          '<button type="button" id="' + curZ + '" class="btn-modern btn-modern-danger btn-modern-sm" onclick="delR(this.id); DrawGraph();">Clear</button>' +
        '</div>' +
      '</div>' +
      '<div class="form-row">' +
        '<span class="form-label">Coords:</span>' +
        '<span class="coord-box">(<input type="text" id="r_' + curZ + '" value="0">,<input type="text" id="s_' + curZ + '" value="0">)</span>' +
        '<span style="color: var(--color-text-muted); font-weight: bold;">&mdash;</span>' +
        '<span class="coord-box">(<input type="text" id="t_' + curZ + '" value="0">,<input type="text" id="u_' + curZ + '" value="0">)</span>' +
      '</div>' +
      '<div class="options-row">' +
        '<label class="checkbox-label"><input type="checkbox" id="retangularshow_' + curZ + '" checked> Show</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyOne" id="mouseDR_' + curZ + '" onclick="test4(' + (curZ - rr) + ')"> Mouse Draw</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyPR" id="retangular_' + curZ + '" onclick="test5(' + (3 * (curZ - rr)) + ')"> All</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyPR" id="RP1_' + curZ + '" onclick="test5(' + (3 * curZ - 2) + ')"> Pt 1</label>' +
        '<label class="checkbox-label"><input type="checkbox" name="onlyPR" id="RP2_' + curZ + '" onclick="test5(' + (3 * curZ - 1) + ')"> Pt 2</label>' +
        '<label class="checkbox-label"><input type="checkbox" id="retangulardash_' + curZ + '"> Dash</label>' +
      '</div>' +
      '<div class="form-row" style="margin-top: 0.5rem;">' +
        '<span class="form-label">Label:</span>' +
        '<input type="text" id="retangularname_' + curZ + '" class="input-modern" size="5" value="" placeholder="Name" style="width: 80px;">' +
        '<span class="form-label">Color:</span>' +
        '<select id="retangularColor_' + curZ + '" class="select-modern">' +
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
    var firstInput = document.getElementById("r_" + curZ);
    if (firstInput) firstInput.select();

    counter_z++;

    if (typeof showToast === 'function') {
        showToast('Added Rectangle ' + curZ);
    }
}
