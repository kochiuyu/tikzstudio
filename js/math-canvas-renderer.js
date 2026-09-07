/**
 * Math & MathML Canvas Rendering Engine for TikZ Studio
 * Renders MathML, TeX/LaTeX formulas, subscripts, superscripts, Greek letters,
 * fractions, and mathematical equations directly onto HTML5 Canvas with publication quality.
 */

(function (window) {
  'use strict';

  // Math Font Stacks
  var MATH_SERIF_FONT = '"STIX Two Math", "Cambria Math", "Latin Modern Math", "KaTeX_Math", "Times New Roman", Times, serif';
  var MATH_SANS_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Greek letter dictionary
  var GREEK_MAP = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'epsilon': 'ε',
    'zeta': 'ζ', 'eta': 'η', 'theta': 'θ', 'iota': 'ι', 'kappa': 'κ',
    'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ', 'pi': 'π', 'rho': 'ρ',
    'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ', 'chi': 'χ',
    'psi': 'ψ', 'omega': 'ω',
    'Gamma': 'Γ', 'Delta': 'Δ', 'Theta': 'Θ', 'Lambda': 'Λ', 'Xi': 'Ξ',
    'Pi': 'Π', 'Sigma': 'Σ', 'Upsilon': 'Υ', 'Phi': 'Φ', 'Psi': 'Ψ', 'Omega': 'Ω'
  };

  // Mathematical symbols dictionary
  var SYMBOL_MAP = {
    'cdot': '·', 'times': '×', 'div': '÷', 'pm': '±', 'mp': '∓',
    'le': '≤', 'leq': '≤', 'ge': '≥', 'geq': '≥', 'ne': '≠', 'neq': '≠',
    'approx': '≈', 'equiv': '≡', 'sim': '∼', 'infty': '∞', 'partial': '∂',
    'nabla': '∇', 'in': '∈', 'notin': '∉', 'subset': '⊂', 'cup': '∪', 'cap': '∩',
    'to': '→', 'rightarrow': '→', 'leftarrow': '←', 'Rightarrow': '⇒', 'Leftarrow': '⇐',
    'forall': '∀', 'exists': '∃', 'prime': '′', 'ast': '∗', 'star': '⋆'
  };

  // Multi-letter functions/abbreviations that should remain upright (roman) in math
  var UPRIGHT_WORDS = {
    'MR': 1, 'MC': 1, 'ATC': 1, 'AVC': 1, 'AFC': 1, 'TR': 1, 'TC': 1,
    'AR': 1, 'IS': 1, 'LM': 1, 'BP': 1, 'AD': 1, 'AS': 1, 'DWL': 1, 'BL': 1,
    'CS': 1, 'PS': 1, 'min': 1, 'max': 1, 'lim': 1, 'ln': 1, 'log': 1,
    'exp': 1, 'sin': 1, 'cos': 1, 'tan': 1, 'det': 1, 'dim': 1
  };

  // SVG / Image Cache for MathML and complex formulas
  var mathImageCache = {};

  /**
   * Check if a string contains MathML markup
   */
  function isMathML(text) {
    if (typeof text !== 'string') return false;
    var trimmed = text.trim();
    return trimmed.indexOf('<math') !== -1 ||
      trimmed.indexOf('<mrow') !== -1 ||
      trimmed.indexOf('<msub') !== -1 ||
      trimmed.indexOf('<msup') !== -1 ||
      trimmed.indexOf('<mfrac') !== -1 ||
      trimmed.indexOf('<msqrt') !== -1;
  }

  /**
   * Check if text contains math notation: $, _, ^, \, fractions, or MathML
   */
  function isMathText(text) {
    if (typeof text !== 'string') return false;
    if (isMathML(text)) return true;
    if (text.indexOf('$') !== -1) return true;
    if (text.indexOf('\\') !== -1) return true;
    if (text.indexOf('^') !== -1) return true;
    if (text.indexOf('_') !== -1) return true;
    if (text.indexOf('*') !== -1 && /[a-zA-Z]\*/.test(text)) return true;
    if (text.indexOf('\'') !== -1 && /[a-zA-Z]'/.test(text)) return true;
    // Common math symbols
    if (/[α-ωΑ-Ω≤≥≠≈×÷±∞∂]/.test(text)) return true;
    return false;
  }

  /**
   * Convert MathML string to an HTML/MathML representation for SVG
   */
  function wrapMathMLForSVG(mathml, fontSize, color) {
    var cleanMath = mathml.trim();
    if (cleanMath.indexOf('<math') === -1) {
      cleanMath = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">' + cleanMath + '</math>';
    } else if (cleanMath.indexOf('xmlns') === -1) {
      cleanMath = cleanMath.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
    }
    return (
      '<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:' + MATH_SERIF_FONT +
      '; font-size:' + fontSize + 'px; color:' + color +
      '; display:inline-block; vertical-align:middle; line-height:1.1; white-space:nowrap;">' +
      cleanMath +
      '</div>'
    );
  }

  /**
   * Parse MathML into visual tokens synchronously (fast fallback)
   */
  function parseMathMLToTokens(mathml) {
    // Basic synchronous parser for common MathML constructs:
    // <msub><mi>P</mi><mo>*</mo></msub>, <msup><mi>x</mi><mn>2</mn></msup>, <mfrac><mi>a</mi><mi>b</mi></mfrac>
    var tokens = [];
    var str = mathml.replace(/<math[^>]*>/gi, '').replace(/<\/math>/gi, '').trim();

    // Replace basic tags
    str = str.replace(/<msub>\s*<([a-z]+)>([^<]+)<\/\1>\s*<([a-z]+)>([^<]+)<\/\3>\s*<\/msub>/gi, function (_, t1, base, t2, sub) {
      return base + '_{' + sub + '}';
    });
    str = str.replace(/<msup>\s*<([a-z]+)>([^<]+)<\/\1>\s*<([a-z]+)>([^<]+)<\/\3>\s*<\/msup>/gi, function (_, t1, base, t2, sup) {
      return base + '^{' + sup + '}';
    });
    str = str.replace(/<msubsup>\s*<([a-z]+)>([^<]+)<\/\1>\s*<([a-z]+)>([^<]+)<\/\3>\s*<([a-z]+)>([^<]+)<\/\5>\s*<\/msubsup>/gi, function (_, t1, base, t2, sub, t3, sup) {
      return base + '_{' + sub + '}^{' + sup + '}';
    });
    str = str.replace(/<mfrac>\s*<([a-z]+)>([^<]+)<\/\1>\s*<([a-z]+)>([^<]+)<\/\3>\s*<\/mfrac>/gi, function (_, t1, num, t2, den) {
      return '\\frac{' + num + '}{' + den + '}';
    });
    // Strip remaining tags
    str = str.replace(/<[^>]+>/g, '');
    return parseTeXToTokens(str);
  }

  /**
   * Parse TeX / math notation into structured layout tokens
   */
  function parseTeXToTokens(rawText) {
    if (!rawText) return [];
    var text = rawText.trim();
    // Strip surrounding math mode $...$ or $$...$$
    if (text.startsWith('$$') && text.endsWith('$$') && text.length >= 4) {
      text = text.substring(2, text.length - 2).trim();
    } else if (text.startsWith('$') && text.endsWith('$') && text.length >= 2) {
      text = text.substring(1, text.length - 1).trim();
    }

    var tokens = [];
    var i = 0;
    var len = text.length;

    function readGroup(openChar, closeChar) {
      if (i >= len || text[i] !== openChar) return '';
      i++; // skip openChar
      var depth = 1;
      var start = i;
      while (i < len && depth > 0) {
        if (text[i] === openChar) depth++;
        else if (text[i] === closeChar) depth--;
        i++;
      }
      return text.substring(start, i - 1);
    }

    function readWord() {
      var start = i;
      while (i < len && /[a-zA-Z]/.test(text[i])) {
        i++;
      }
      return text.substring(start, i);
    }

    while (i < len) {
      var ch = text[i];

      // 1. Fractions: \frac{num}{den}
      if (text.substring(i, i + 5) === '\\frac') {
        i += 5;
        while (i < len && /\s/.test(text[i])) i++;
        var num = readGroup('{', '}');
        while (i < len && /\s/.test(text[i])) i++;
        var den = readGroup('{', '}');
        tokens.push({
          type: 'fraction',
          numerator: parseTeXToTokens(num),
          denominator: parseTeXToTokens(den)
        });
        continue;
      }

      // 2. Square Root: \sqrt{arg} or \sqrt[n]{arg}
      if (text.substring(i, i + 5) === '\\sqrt') {
        i += 5;
        while (i < len && /\s/.test(text[i])) i++;
        var rootArg = '';
        if (text[i] === '[') {
          readGroup('[', ']'); // skip optional degree
          while (i < len && /\s/.test(text[i])) i++;
        }
        if (text[i] === '{') {
          rootArg = readGroup('{', '}');
        } else if (i < len) {
          rootArg = text[i];
          i++;
        }
        tokens.push({
          type: 'sqrt',
          radicand: parseTeXToTokens(rootArg)
        });
        continue;
      }

      // 3. LaTeX commands / Greek / Symbols
      if (ch === '\\') {
        i++; // skip \
        var cmd = readWord();
        var symbolChar = GREEK_MAP[cmd] || SYMBOL_MAP[cmd] || cmd;
        // Check if immediately followed by sub/super
        var token = {
          type: 'text',
          text: symbolChar,
          isVariable: false
        };
        tokens.push(token);
        continue;
      }

      // 4. Subscript / Superscript
      if (ch === '_' || ch === '^') {
        var isSub = ch === '_';
        i++;
        var scriptVal = '';
        if (i < len && text[i] === '{') {
          scriptVal = readGroup('{', '}');
        } else if (i < len && text[i] === '\\') {
          i++;
          var subCmd = readWord();
          scriptVal = GREEK_MAP[subCmd] || SYMBOL_MAP[subCmd] || subCmd;
        } else if (i < len) {
          scriptVal = text[i];
          i++;
        }

        // Attach to previous token if available, otherwise create standalone script
        var prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;
        if (prev && prev.type === 'text') {
          if (isSub) {
            prev.sub = parseTeXToTokens(scriptVal);
          } else {
            prev.sup = parseTeXToTokens(scriptVal);
          }
        } else {
          var dummy = { type: 'text', text: '', isVariable: false };
          if (isSub) dummy.sub = parseTeXToTokens(scriptVal);
          else dummy.sup = parseTeXToTokens(scriptVal);
          tokens.push(dummy);
        }
        continue;
      }

      // 4b. Prime (') or trailing asterisk (*) on variables/identifiers (e.g. Q*, P*, MC', f')
      var prevTok = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      if (ch === '\'' && prevTok && prevTok.type === 'text') {
        if (!prevTok.sup) prevTok.sup = [];
        prevTok.sup.push({ type: 'text', text: '′', isVariable: false });
        i++;
        continue;
      }
      if (ch === '*' && prevTok && prevTok.type === 'text' && prevTok.isVariable) {
        if (!prevTok.sup) prevTok.sup = [];
        prevTok.sup.push({ type: 'text', text: '∗', isVariable: false });
        i++;
        continue;
      }

      // 5. Parentheses, brackets, equals, comma, operators
      if (/[\(\)\[\]\{\}\=,\+\-\*\/\<\>\:\;]/.test(ch)) {
        tokens.push({
          type: 'text',
          text: ch,
          isVariable: false
        });
        i++;
        continue;
      }

      // 6. Numbers
      if (/[0-9\.]/.test(ch)) {
        var numStart = i;
        while (i < len && /[0-9\.]/.test(text[i])) i++;
        tokens.push({
          type: 'text',
          text: text.substring(numStart, i),
          isVariable: false
        });
        continue;
      }

      // 7. Words / Identifiers (Variables vs. Upright terms)
      if (/[a-zA-Z]/.test(ch)) {
        var wordStart = i;
        while (i < len && /[a-zA-Z]/.test(text[i])) i++;
        var word = text.substring(wordStart, i);

        if (word.length === 1) {
          // Single letters (x, y, P, Q, r, C) are mathematical variables -> Italic
          tokens.push({
            type: 'text',
            text: word,
            isVariable: true
          });
        } else if (UPRIGHT_WORDS[word]) {
          // Known economics/math operators (MR, MC, ATC, AVC, IS, LM, BL) -> Upright
          tokens.push({
            type: 'text',
            text: word,
            isVariable: false
          });
        } else {
          // Generic multi-letter word
          tokens.push({
            type: 'text',
            text: word,
            isVariable: false
          });
        }
        continue;
      }

      // 8. Other characters (spaces, unicode symbols, etc.)
      tokens.push({
        type: 'text',
        text: ch,
        isVariable: false
      });
      i++;
    }

    return tokens;
  }

  /**
   * Layout tokens and compute bounding box dimensions
   */
  function layoutTokens(ctx, tokens, baseFontSize, fontFace) {
    var totalWidth = 0;
    var maxAscent = baseFontSize * 0.8;
    var maxDescent = baseFontSize * 0.2;
    var scriptSize = Math.max(9, Math.round(baseFontSize * 0.72));

    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];

      if (tok.type === 'text') {
        var style = tok.isVariable ? 'italic ' : 'normal ';
        ctx.font = style + baseFontSize + 'px ' + fontFace;
        var m = ctx.measureText(tok.text);
        tok.width = m.width;
        totalWidth += tok.width;

        // Subscript & Superscript width calculation
        var scriptWidth = 0;
        if (tok.sub) {
          layoutTokens(ctx, tok.sub, scriptSize, fontFace);
          var subW = 0;
          for (var s = 0; s < tok.sub.length; s++) subW += tok.sub[s].width;
          scriptWidth = Math.max(scriptWidth, subW);
        }
        if (tok.sup) {
          layoutTokens(ctx, tok.sup, scriptSize, fontFace);
          var supW = 0;
          for (var u = 0; u < tok.sup.length; u++) supW += tok.sup[u].width;
          scriptWidth = Math.max(scriptWidth, supW);
        }
        tok.scriptWidth = scriptWidth;
        totalWidth += scriptWidth;
      } else if (tok.type === 'fraction') {
        var fracSize = Math.max(9, Math.round(baseFontSize * 0.85));
        layoutTokens(ctx, tok.numerator, fracSize, fontFace);
        layoutTokens(ctx, tok.denominator, fracSize, fontFace);

        var numW = 0;
        for (var n = 0; n < tok.numerator.length; n++) numW += tok.numerator[n].width;
        var denW = 0;
        for (var d = 0; d < tok.denominator.length; d++) denW += tok.denominator[d].width;

        tok.width = Math.max(numW, denW) + 6;
        tok.numWidth = numW;
        tok.denWidth = denW;
        totalWidth += tok.width;
        maxAscent = Math.max(maxAscent, baseFontSize * 1.1);
        maxDescent = Math.max(maxDescent, baseFontSize * 0.8);
      } else if (tok.type === 'sqrt') {
        layoutTokens(ctx, tok.radicand, baseFontSize, fontFace);
        var radW = 0;
        for (var r = 0; r < tok.radicand.length; r++) radW += tok.radicand[r].width;
        tok.width = radW + 10;
        totalWidth += tok.width;
        maxAscent = Math.max(maxAscent, baseFontSize * 0.95);
      }
    }

    return {
      width: totalWidth,
      height: maxAscent + maxDescent,
      ascent: maxAscent,
      descent: maxDescent
    };
  }

  /**
   * Render tokens to canvas context at coordinates (startX, startY)
   */
  function renderTokens(ctx, tokens, startX, startY, baseFontSize, fontFace, color) {
    var curX = startX;
    var scriptSize = Math.max(9, Math.round(baseFontSize * 0.72));

    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];

      if (tok.type === 'text') {
        var style = tok.isVariable ? 'italic ' : 'normal ';
        ctx.font = style + baseFontSize + 'px ' + fontFace;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        if (tok.text) {
          ctx.fillText(tok.text, curX, startY);
          curX += tok.width;
        }

        // Subscript
        if (tok.sub) {
          var subY = startY + Math.round(baseFontSize * 0.35);
          renderTokens(ctx, tok.sub, curX, subY, scriptSize, fontFace, color);
        }

        // Superscript
        if (tok.sup) {
          var supY = startY - Math.round(baseFontSize * 0.45);
          renderTokens(ctx, tok.sup, curX, supY, scriptSize, fontFace, color);
        }

        curX += (tok.scriptWidth || 0);
      } else if (tok.type === 'fraction') {
        var fracSize = Math.max(9, Math.round(baseFontSize * 0.85));
        var fracCenter = curX + tok.width / 2;
        var barY = startY - Math.round(baseFontSize * 0.3);

        // Numerator
        var numX = fracCenter - tok.numWidth / 2;
        var numY = barY - Math.round(baseFontSize * 0.2);
        renderTokens(ctx, tok.numerator, numX, numY, fracSize, fontFace, color);

        // Bar line
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, Math.round(baseFontSize * 0.08));
        ctx.beginPath();
        ctx.moveTo(curX + 2, barY);
        ctx.lineTo(curX + tok.width - 2, barY);
        ctx.stroke();
        ctx.restore();

        // Denominator
        var denX = fracCenter - tok.denWidth / 2;
        var denY = barY + Math.round(baseFontSize * 0.55);
        renderTokens(ctx, tok.denominator, denX, denY, fracSize, fontFace, color);

        curX += tok.width;
      } else if (tok.type === 'sqrt') {
        var radX = curX + 10;
        var radY = startY;
        renderTokens(ctx, tok.radicand, radX, radY, baseFontSize, fontFace, color);

        // Square root radical sign
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.2, Math.round(baseFontSize * 0.08));
        ctx.beginPath();
        var rootTop = startY - baseFontSize * 0.85;
        var rootBottom = startY + baseFontSize * 0.15;
        ctx.moveTo(curX, startY - baseFontSize * 0.3);
        ctx.lineTo(curX + 3, startY - baseFontSize * 0.1);
        ctx.lineTo(curX + 6, rootBottom);
        ctx.lineTo(curX + 9, rootTop);
        ctx.lineTo(curX + tok.width - 1, rootTop);
        ctx.stroke();
        ctx.restore();

        curX += tok.width;
      }
    }
  }

  /**
   * Render MathML via SVG Image object (with memoization)
   */
  function drawMathMLImage(ctx, mathml, x, y, options) {
    options = options || {};
    var fontSize = options.fontSize || 16;
    var color = options.color || ctx.fillStyle || '#000000';
    var align = options.align || ctx.textAlign || 'left';
    var baseline = options.baseline || ctx.textBaseline || 'middle';

    var cacheKey = mathml + '_' + fontSize + '_' + color;
    var cached = mathImageCache[cacheKey];

    if (cached && cached.loaded && cached.img) {
      var drawX = x;
      var drawY = y;
      if (align === 'center') drawX -= cached.width / 2;
      else if (align === 'right') drawX -= cached.width;

      if (baseline === 'middle') drawY -= cached.height / 2;
      else if (baseline === 'bottom') drawY -= cached.height;

      ctx.drawImage(cached.img, drawX, drawY);
      return true;
    }

    if (!cached && typeof Image !== 'undefined') {
      // Create SVG with foreignObject
      var svgHtml = wrapMathMLForSVG(mathml, fontSize, color);
      var estimatedW = Math.max(40, mathml.length * fontSize * 0.6);
      var estimatedH = fontSize * 2.2;

      var svgData =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + estimatedW + '" height="' + estimatedH + '">' +
        '<foreignObject width="100%" height="100%">' +
        svgHtml +
        '</foreignObject>' +
        '</svg>';

      var img = new Image();
      var dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

      mathImageCache[cacheKey] = {
        img: img,
        loaded: false,
        width: estimatedW,
        height: estimatedH
      };

      img.onload = function () {
        mathImageCache[cacheKey].loaded = true;
        mathImageCache[cacheKey].width = img.width || estimatedW;
        mathImageCache[cacheKey].height = img.height || estimatedH;
        // Trigger graph redraw when async SVG image finishes loading
        if (typeof window.DrawGraph === 'function') {
          window.requestAnimationFrame(function () {
            window.DrawGraph();
          });
        }
      };
      img.src = dataUrl;
    }

    // Fall back to synchronous token parser while image loads
    var fallbackTokens = parseMathMLToTokens(mathml);
    drawMathTokens(ctx, fallbackTokens, x, y, options);
    return false;
  }

  /**
   * Measure dimensions of math text
   */
  function measureMathText(ctx, text, options) {
    if (!text) return { width: 0, height: 0, ascent: 0, descent: 0 };
    options = options || {};
    var fontSize = options.fontSize || 16;
    var fontFace = options.fontFace || MATH_SERIF_FONT;

    var tokens = isMathML(text) ? parseMathMLToTokens(text) : parseTeXToTokens(text);
    return layoutTokens(ctx, tokens, fontSize, fontFace);
  }

  /**
   * Helper to draw parsed tokens at (x, y) respecting alignments
   */
  function drawMathTokens(ctx, tokens, x, y, options) {
    options = options || {};
    var fontSize = options.fontSize || 16;
    var fontFace = options.fontFace || MATH_SERIF_FONT;
    var color = options.color || ctx.fillStyle || '#000000';
    var align = options.align || ctx.textAlign || 'left';
    var baseline = options.baseline || ctx.textBaseline || 'middle';

    ctx.save();
    var metrics = layoutTokens(ctx, tokens, fontSize, fontFace);

    // Compute origin X based on textAlign
    var drawX = x;
    if (align === 'center') {
      drawX = x - metrics.width / 2;
    } else if (align === 'right') {
      drawX = x - metrics.width;
    }

    // Compute alphabetic baseline Y based on textBaseline
    var baseLineY = y;
    if (baseline === 'top') {
      baseLineY = y + metrics.ascent;
    } else if (baseline === 'middle') {
      baseLineY = y + (metrics.ascent - metrics.descent) / 2;
    } else if (baseline === 'bottom') {
      baseLineY = y - metrics.descent;
    }

    renderTokens(ctx, tokens, drawX, baseLineY, fontSize, fontFace, color);
    ctx.restore();
    return metrics;
  }

  /**
   * Primary Public API: Draw Math, MathML, or formatted text on Canvas
   *
   * @param {CanvasRenderingContext2D} ctx - Target 2D canvas context
   * @param {string} text - Math string, MathML markup, or text label
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} options - Optional styling parameters:
   *        fontSize: number (default parsed from ctx.font or 16)
   *        color: string (default ctx.fillStyle)
   *        align: 'left' | 'center' | 'right' (default ctx.textAlign)
   *        baseline: 'top' | 'middle' | 'bottom' | 'alphabetic' (default ctx.textBaseline)
   *        forceMath: boolean
   */
  function drawMathText(ctx, text, x, y, options) {
    if (!ctx || text === undefined || text === null || text === '') return;
    options = options || {};

    // Auto-detect font size from current context font if not specified
    if (!options.fontSize) {
      var fontMatch = (ctx.font || '').match(/(\d+)px/);
      options.fontSize = fontMatch ? parseInt(fontMatch[1], 10) : 16;
    }

    // Direct MathML rendering branch
    if (isMathML(text)) {
      drawMathMLImage(ctx, text, x, y, options);
      return;
    }

    // Check if text benefits from math typesetting
    if (options.forceMath || isMathText(text)) {
      var tokens = parseTeXToTokens(text);
      drawMathTokens(ctx, tokens, x, y, options);
      return;
    }

    // Standard plain text fallback
    ctx.save();
    if (options.color) ctx.fillStyle = options.color;
    if (options.align) ctx.textAlign = options.align;
    if (options.baseline) ctx.textBaseline = options.baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Expose global methods
  window.drawMathText = drawMathText;
  window.measureMathText = measureMathText;
  window.isMathML = isMathML;
  window.isMathText = isMathText;

})(typeof window !== 'undefined' ? window : this);
