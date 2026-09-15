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

window.tikzSnippetOnly = false;

function toggleCodeFontSize() {
  var viewports = document.querySelectorAll('.code-viewport, #tikz-output-code');
  var isLarge = false;
  viewports.forEach(function(vp) {
    if (vp.classList.contains('code-font-lg')) {
      vp.classList.remove('code-font-lg');
      isLarge = false;
    } else {
      vp.classList.add('code-font-lg');
      isLarge = true;
    }
  });
  var btn = document.getElementById('btn-toggle-code-font');
  if (btn) {
    btn.textContent = isLarge ? 'Size: Large' : 'Size: Standard';
  }
}

function formatTikzHighlight(rawTikz) {
  if (!rawTikz) return "";
  var lines = rawTikz.split(/<br\s*\/?>|\r?\n/gi);
  return lines.map(function(line) {
    if (!line.trim()) return "";
    var commentIdx = line.indexOf("%");
    var codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    var commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";

    // Highlight LaTeX commands: \command
    codePart = codePart.replace(/(\\[a-zA-Z]+)/g, '<span class="token-cmd">$1</span>');
    // Highlight options: [...]
    codePart = codePart.replace(/(\[[^\]]+\])/g, '<span class="token-opt">$1</span>');
    // Highlight coordinates: (x,y)
    codePart = codePart.replace(/(\([-0-9\.\s,a-zA-Z\+\*\/]+\))/g, '<span class="token-coord">$1</span>');
    // Highlight math: $...$
    codePart = codePart.replace(/(\$[^$]+\$)/g, '<span class="token-math">$1</span>');

    if (commentPart) {
      return codePart + '<span class="token-comment">' + commentPart + '</span>';
    }
    return codePart;
  }).join("<br>\n");
}

window.formatTikzHighlight = formatTikzHighlight;
window.toggleCodeFontSize = toggleCodeFontSize;

function setTikzExportMode(snippetOnly) {
  window.tikzSnippetOnly = !!snippetOnly;
  
  var btnStandalone = document.getElementById('btn-tikz-standalone');
  var btnSnippet = document.getElementById('btn-tikz-snippet');
  if (btnStandalone && btnSnippet) {
    if (window.tikzSnippetOnly) {
      btnStandalone.classList.remove('active');
      btnSnippet.classList.add('active');
    } else {
      btnStandalone.classList.add('active');
      btnSnippet.classList.remove('active');
    }
  }

  // Toggle visible preamble and postamble in viewport
  var preambles = document.querySelectorAll('.tikz-preamble-wrapper');
  var postambles = document.querySelectorAll('.tikz-postamble-wrapper');
  preambles.forEach(function(el) {
    el.style.display = window.tikzSnippetOnly ? 'none' : 'inline';
  });
  postambles.forEach(function(el) {
    el.style.display = window.tikzSnippetOnly ? 'none' : 'inline';
  });
}

function getLatexCode(snippetOnly) {
  var useSnippet = typeof snippetOnly === 'boolean' ? snippetOnly : window.tikzSnippetOnly;
  var answerEl = document.getElementById('answer');
  var innerTikz = '';

  if (answerEl) {
    var clone = answerEl.cloneNode(true);
    var brs = clone.querySelectorAll('br');
    brs.forEach(function(br) {
      br.replaceWith('\n');
    });
    innerTikz = (clone.textContent || '').trim();
  }

  if (useSnippet) {
    return "\\begin{tikzpicture}\n" + innerTikz + "\n\\end{tikzpicture}";
  }

  return "% TikZ Diagram generated with TikZ Studio\n" +
    "\\documentclass[border=8pt,tikz]{standalone}\n" +
    "\\usepackage{tikz}\n" +
    "\\usetikzlibrary{arrows.meta, positioning, calc}\n" +
    "\\usepackage{amsmath,amssymb}\n" +
    "\\usepackage{xcolor}\n\n" +
    "\\begin{document}\n" +
    "\\begin{tikzpicture}\n" +
    innerTikz + "\n" +
    "\\end{tikzpicture}\n" +
    "\\end{document}\n";
}

function openInOverleaf() {
  var fullDoc = getLatexCode(false); // Overleaf requires compilable standalone document
  var form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';
  var input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'snip';
  input.value = fullDoc;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  showToast('Opening project in Overleaf...');
}

function copyLatexCode() {
  var codeContent = getLatexCode(window.tikzSnippetOnly);
  codeContent = codeContent.replace(/\r\n/g, '\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeContent).then(function() {
      showToast(window.tikzSnippetOnly ? 'tikzpicture snippet copied!' : 'Standalone LaTeX document copied!');
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
    showToast(window.tikzSnippetOnly ? 'tikzpicture snippet copied!' : 'Standalone LaTeX document copied!');
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
  var codeContent = getLatexCode(window.tikzSnippetOnly);
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
