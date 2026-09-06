// Modern Point and Label card management for TikZ Studio

function updatePointCardHeader(j) {
    var titleEl = document.getElementById("point_title_" + j);
    var nameEl = document.getElementById("p_name_" + j);
    if (!titleEl) return;
    if (nameEl && nameEl.value.trim()) {
        titleEl.textContent = nameEl.value.trim();
        titleEl.style.color = "var(--color-primary)";
    } else {
        titleEl.textContent = "(Empty)";
        titleEl.style.color = "var(--color-text-muted)";
    }
}

function RemovePoint(j) {
    if (typeof delP === 'function') {
        delP(j);
    } else {
        var p = document.getElementById("p_" + j); if (p) p.value = 0;
        var q = document.getElementById("q_" + j); if (q) q.value = 0;
        var n = document.getElementById("p_name_" + j); if (n) n.value = "";
        var show = document.getElementById("pointshow_" + j); if (show) show.checked = false;
        var title = document.getElementById("point_title_" + j); if (title) title.textContent = "(Empty)";
    }
    var card = document.getElementById("point_card_" + j);
    if (card && j > 3) {
        // If it was dynamically added beyond the first 3, remove card from DOM
        card.remove();
    } else if (card) {
        updatePointCardHeader(j);
    }
    if (typeof DrawGraph === 'function') DrawGraph();
    if (typeof showToast === 'function') showToast("Point " + j + " cleared");
}

function AddPoints(form) {
    var curP = ps_j;
    var container = document.getElementById("point-cards-container") || 
                    (form && form.querySelector('#point-cards-container')) || 
                    document.getElementById("pointform");

    var card = document.createElement('div');
    card.className = 'item-card';
    card.id = 'point_card_' + curP;
    card.innerHTML = 
      '<div class="item-card-header">' +
        '<div style="display: flex; align-items: center; gap: 0.4rem; min-width: 0;">' +
          '<span class="item-badge" style="background: rgba(14, 165, 233, 0.12); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.25);">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg> ' +
            'Point ' + curP +
          '</span>' +
          '<span class="item-title" id="point_title_' + curP + '" style="font-size: 0.8rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(Empty)</span>' +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 0.35rem;">' +
          '<button type="button" class="btn-item-delete" onclick="RemovePoint(' + curP + ')" title="Clear or remove this point">&times;</button>' +
        '</div>' +
      '</div>' +
      '<div class="item-card-body">' +
        '<div class="form-row" style="margin-bottom: 0.4rem;">' +
          '<span class="form-label" style="min-width: 65px;">Label Text:</span>' +
          '<input type="text" id="p_name_' + curP + '" class="input-modern" value="" placeholder="e.g. A, (2, 3), Max, \\alpha" style="flex: 1; font-weight: 500;" oninput="updatePointCardHeader(' + curP + '); DrawGraph();">' +
        '</div>' +
        '<div class="form-row" style="margin-bottom: 0.4rem;">' +
          '<span class="form-label" style="min-width: 65px;">Coords:</span>' +
          '<span class="coord-box">' +
            '(<input type="text" id="p_' + curP + '" value="0" style="width: 42px; text-align: center;" oninput="DrawGraph();">,' +
            '<input type="text" id="q_' + curP + '" value="0" style="width: 42px; text-align: center;" oninput="DrawGraph();">)' +
          '</span>' +
          '<span class="form-label" style="margin-left: 0.4rem;">Pos:</span>' +
          '<select id="pointpos_' + curP + '" class="select-modern" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onchange="DrawGraph();">' +
            '<option value="above_right" selected>Above Right</option>' +
            '<option value="above">Above</option>' +
            '<option value="right">Right</option>' +
            '<option value="below_right">Below Right</option>' +
            '<option value="below">Below</option>' +
            '<option value="below_left">Below Left</option>' +
            '<option value="left">Left</option>' +
            '<option value="above_left">Above Left</option>' +
            '<option value="center">Center</option>' +
          '</select>' +
        '</div>' +
        '<div class="card-controls" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.4rem; padding-top: 0.35rem; border-top: 1px solid var(--color-border);">' +
          '<div style="display: flex; align-items: center; gap: 0.45rem;">' +
            '<select id="pointColor_' + curP + '" class="select-modern" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onchange="DrawGraph();">' +
              '<option value="black" selected>Black</option>' +
              '<option value="blue">Blue</option>' +
              '<option value="red">Red</option>' +
              '<option value="green">Green</option>' +
              '<option value="purple">Purple</option>' +
              '<option value="orange">Orange</option>' +
              '<option value="teal">Teal</option>' +
            '</select>' +
            '<label class="checkbox-label" style="font-size: 0.75rem;" title="Render small filled dot at point coordinate">' +
              '<input type="checkbox" id="pointdot_' + curP + '" checked onchange="DrawGraph();"> Dot' +
            '</label>' +
            '<label class="checkbox-label" style="font-size: 0.75rem;" title="Show or hide this point/label">' +
              '<input type="checkbox" id="pointshow_' + curP + '" checked onchange="DrawGraph();"> Show' +
            '</label>' +
          '</div>' +
          '<button type="button" class="btn-tool-action" onclick="window.setDrawTool(\'point\', ' + curP + ')" title="Click on canvas to reposition this point" style="padding: 0.2rem 0.45rem; font-size: 0.72rem;">' +
            '📍 Pick on Canvas' +
          '</button>' +
        '</div>' +
      '</div>';

    if (container) {
        container.appendChild(card);
    }

    if (window.enhanceColorControl) {
        var colSel = document.getElementById("pointColor_" + curP);
        if (colSel) window.enhanceColorControl(colSel);
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    var nameInput = document.getElementById("p_name_" + curP);
    if (nameInput) nameInput.focus();

    ps_j++;

    if (typeof showToast === 'function') {
        showToast('Added Point ' + curP);
    }
}
