/**
 * Modern UI enhancements for TikZ Studio
 * Maintains 100% backward-compatibility with original scripts while adding modern interactivity.
 */

function showToast(message) {
  var toast = document.getElementById('modern-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'modern-toast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> ' + message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

function copyLatexCode() {
  var answerEl = document.getElementById('answer');
  var codeContent = '';
  
  var pre = document.querySelector('.code-viewport pre') || document.querySelector('pre.line-numbers');
  if (pre) {
    codeContent = pre.innerText || pre.textContent;
  } else if (answerEl) {
    codeContent = "\\documentclass{minimal}\n\\usepackage{tikz}\n\\begin{document}\n\\begin{tikzpicture}\n" + 
      (answerEl.innerText || answerEl.textContent) + 
      "\n\\end{tikzpicture}\n\\end{document}";
  }
  
  // Strip HTML entities or clean line breaks
  codeContent = codeContent.replace(/\r\n/g, '\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeContent).then(function() {
      showToast('LaTeX TikZ code copied to clipboard!');
      updateCopyButtonFeedback();
    }).catch(function() {
      legacyCopy(codeContent);
    });
  } else {
    legacyCopy(codeContent);
  }
}

function legacyCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('LaTeX TikZ code copied to clipboard!');
    updateCopyButtonFeedback();
  } catch (err) {
    alert('Please copy manually:\n' + text);
  }
  document.body.removeChild(textarea);
}

function updateCopyButtonFeedback() {
  var btns = document.querySelectorAll('.btn-copy, #copy-to-clipboard');
  btns.forEach(function(btn) {
    var originalHTML = btn.getAttribute('data-original-html');
    if (!originalHTML) {
      btn.setAttribute('data-original-html', btn.innerHTML);
      originalHTML = btn.innerHTML;
    }
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
    btn.style.borderColor = '#10b981';
    btn.style.color = '#34d399';
    setTimeout(function() {
      btn.innerHTML = originalHTML;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  });
}

function downloadTexFile(filename) {
  var pre = document.querySelector('.code-viewport pre') || document.querySelector('pre.line-numbers');
  var codeContent = pre ? (pre.innerText || pre.textContent) : '';
  if (!codeContent) {
    var answerEl = document.getElementById('answer');
    codeContent = "\\documentclass{minimal}\n\\usepackage{tikz}\n\\begin{document}\n\\begin{tikzpicture}\n" + 
      (answerEl ? (answerEl.innerText || answerEl.textContent) : '') + 
      "\n\\end{tikzpicture}\n\\end{document}";
  }
  var blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = (filename || 'tikz_diagram') + '.tex';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Downloaded .tex file');
}

// Live canvas coordinate tracker
function initCanvasHud() {
  var canvas = document.getElementById('myCanvas');
  var hud = document.getElementById('canvas-coord-hud');
  if (!canvas || !hud) return;

  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;
    
    // Scale and offsets from global scope if present
    var currentScale = (typeof window.scale !== 'undefined') ? window.scale : ((typeof scale !== 'undefined') ? scale : 35);
    var cur_x_offset = (typeof window.x_offset !== 'undefined') ? window.x_offset : ((typeof x_offset !== 'undefined') ? x_offset : 28);
    var cur_y_offset = (typeof window.y_offset !== 'undefined') ? window.y_offset : ((typeof y_offset !== 'undefined') ? y_offset : 28);

    // Calculate Cartesian coordinate
    var graphX = ((mouseX - cur_x_offset) / currentScale).toFixed(2);
    var graphY = ((canvas.height - cur_y_offset - mouseY) / currentScale).toFixed(2);
    var zoomPct = Math.round((currentScale / 35) * 100);

    hud.textContent = 'Cursor: (' + graphX + ', ' + graphY + ') | ' + zoomPct + '%';
  });

  canvas.addEventListener('mouseleave', function() {
    hud.textContent = 'Cursor: (x, y)';
  });
}

// Switch modern tabs in sidebar
function switchStudioTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-panel').forEach(function(panel) {
    if (panel.id === tabId) {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initCanvasHud();
  
  // Wire up copy buttons
  var copyBtn = document.getElementById('copy-to-clipboard');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyLatexCode);
  }
  
  var copyBtnModern = document.getElementById('btn-copy-code');
  if (copyBtnModern) {
    copyBtnModern.addEventListener('click', copyLatexCode);
  }

  var downloadBtn = document.getElementById('btn-download-tex');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      downloadTexFile('diagram');
    });
  }

  // Bind tab buttons
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.getAttribute('data-tab');
      if (target) switchStudioTab(target);
    });
  });
});
