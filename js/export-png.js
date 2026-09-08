/**
 * High-Resolution PNG Exporter for TikZ Coordinate Graphs & Timelines
 * Exports diagrams as publication-ready high-resolution PNG images (300 DPI).
 */

(function(window) {
    'use strict';

    // State & Preferences
    var PNG_CONFIG = {
        scale: 3,             // 3x default (1800x1740 @ ~300 DPI)
        backgroundColor: '#ffffff', // Clean white background for LaTeX / papers
        includeGrid: 'auto'   // 'auto', 'yes', 'no'
    };

    // Load saved preferences from localStorage
    try {
        var savedScale = localStorage.getItem('tikz_png_scale');
        if (savedScale) PNG_CONFIG.scale = parseInt(savedScale, 10) || 3;
        var savedBg = localStorage.getItem('tikz_png_bg');
        if (savedBg) PNG_CONFIG.backgroundColor = savedBg;
        var savedGrid = localStorage.getItem('tikz_png_grid');
        if (savedGrid) PNG_CONFIG.includeGrid = savedGrid;
    } catch (e) {}

    /**
     * Download the current canvas drawing as a high-resolution PNG image
     */
    function downloadCanvasAsPNG(options) {
        options = options || {};
        var scale = options.scale || PNG_CONFIG.scale || 3;
        var bgColor = options.backgroundColor || PNG_CONFIG.backgroundColor || '#ffffff';
        var gridPref = options.includeGrid || PNG_CONFIG.includeGrid || 'auto';

        var srcCanvas = document.getElementById('myCanvas');
        if (!srcCanvas) {
            console.error('Canvas element #myCanvas not found.');
            return;
        }

        var baseWidth = srcCanvas.width || 600;
        var baseHeight = srcCanvas.height || 580;
        var exportWidth = Math.round(baseWidth * scale);
        var exportHeight = Math.round(baseHeight * scale);

        // Create temporary offscreen high-res canvas
        var exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        var exportCtx = exportCanvas.getContext('2d');

        if (!exportCtx) {
            console.error('Could not obtain 2D canvas context for export.');
            return;
        }

        // 1. Fill solid background (or leave transparent)
        if (bgColor && bgColor !== 'transparent') {
            exportCtx.fillStyle = bgColor;
            exportCtx.fillRect(0, 0, exportWidth, exportHeight);
        }

        // 2. Render diagram contents
        var isCoordinatePage = typeof window.DrawGraph === 'function';

        if (isCoordinatePage) {
            // Check grid preference
            var shouldDrawGrid = false;
            if (gridPref === 'yes') {
                shouldDrawGrid = true;
            } else if (gridPref === 'auto') {
                shouldDrawGrid = !!window.isGridDrawn;
            }

            if (shouldDrawGrid && typeof window.drawGrid === 'function') {
                try {
                    window.drawGrid(exportCanvas, scale);
                } catch (err) {
                    console.warn('Grid render error during PNG export:', err);
                }
            }

            // Draw full vector coordinate graph natively at high resolution
            try {
                window.DrawGraph(false, exportCanvas, scale);
            } catch (err) {
                console.warn('High-res vector redraw failed, falling back to scaled canvas copy:', err);
                // Fallback: draw directly from source canvas
                exportCtx.imageSmoothingEnabled = true;
                exportCtx.imageSmoothingQuality = 'high';
                exportCtx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
            }
        } else {
            // For Timeline or other pages: smooth high-quality supersampling
            exportCtx.imageSmoothingEnabled = true;
            exportCtx.imageSmoothingQuality = 'high';
            exportCtx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
        }

        // 3. Generate file and trigger download
        var pathname = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
        var pageType = pathname.includes('timeline') ? 'timeline' : 'coordinate_graph';
        var filename = 'tikz_' + pageType + '_' + exportWidth + 'x' + exportHeight + '.png';

        function triggerDownload(url) {
            var downloadLink = document.createElement('a');
            downloadLink.download = filename;
            downloadLink.href = url;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            showPngToast('PNG Exported: ' + exportWidth + ' \u00d7 ' + exportHeight + ' px (' + scale + 'x resolution)');
        }

        if (exportCanvas.toBlob) {
            exportCanvas.toBlob(function(blob) {
                if (!blob) {
                    // Fallback to data URL
                    triggerDownload(exportCanvas.toDataURL('image/png'));
                    return;
                }
                var blobUrl = URL.createObjectURL(blob);
                triggerDownload(blobUrl);
                setTimeout(function() {
                    URL.revokeObjectURL(blobUrl);
                }, 4000);
            }, 'image/png');
        } else {
            triggerDownload(exportCanvas.toDataURL('image/png'));
        }
    }

    /**
     * Show a brief toast notification for PNG download
     */
    function showPngToast(message) {
        var existing = document.getElementById('png-export-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'png-export-toast';
        toast.className = 'png-export-toast';
        toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
                          '<span>' + message + '</span>';
        document.body.appendChild(toast);

        setTimeout(function() {
            if (toast && toast.classList) toast.classList.add('show');
        }, 10);

        setTimeout(function() {
            if (toast && toast.classList) toast.classList.remove('show');
            setTimeout(function() {
                if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3200);
    }

    /**
     * Toggle PNG options dropdown menu
     */
    function togglePngExportOptions(evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        var menu = document.getElementById('png-options-menu');
        if (!menu) return;
        var isHidden = menu.style.display === 'none' || menu.style.display === '';
        menu.style.display = isHidden ? 'block' : 'none';

        if (isHidden) {
            // Sync controls with current config
            var scaleSelect = document.getElementById('png-scale-select');
            if (scaleSelect) scaleSelect.value = PNG_CONFIG.scale;
            var bgSelect = document.getElementById('png-bg-select');
            if (bgSelect) bgSelect.value = PNG_CONFIG.backgroundColor;
            var gridSelect = document.getElementById('png-grid-select');
            if (gridSelect) gridSelect.value = PNG_CONFIG.includeGrid;
        }
    }

    function updatePngScalePreference(val) {
        PNG_CONFIG.scale = parseInt(val, 10) || 3;
        try { localStorage.setItem('tikz_png_scale', PNG_CONFIG.scale); } catch (e) {}
    }

    function updatePngBgPreference(val) {
        PNG_CONFIG.backgroundColor = val;
        try { localStorage.setItem('tikz_png_bg', PNG_CONFIG.backgroundColor); } catch (e) {}
    }

    function updatePngGridPreference(val) {
        PNG_CONFIG.includeGrid = val;
        try { localStorage.setItem('tikz_png_grid', PNG_CONFIG.includeGrid); } catch (e) {}
    }

    /**
     * Download the current canvas drawing as an SVG vector-wrapper document
     */
    function downloadCanvasAsSVG(options) {
        options = options || {};
        var srcCanvas = document.getElementById('myCanvas');
        if (!srcCanvas) return;
        var w = srcCanvas.width || 600;
        var h = srcCanvas.height || 580;
        var dataUrl = srcCanvas.toDataURL('image/png');
        var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">\n' +
            '  <image width="' + w + '" height="' + h + '" xlink:href="' + dataUrl + '" />\n' +
            '</svg>\n';
        var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (options.filename || 'coordinate-graph') + '.svg';
        a.click();
        URL.revokeObjectURL(a.href);
        if (typeof showToast === 'function') showToast('Downloaded coordinate-graph.svg');
    }

    // Close options menu when clicking outside
    document.addEventListener('click', function(e) {
        var menu = document.getElementById('png-options-menu');
        var btn = document.getElementById('btn-png-options-toggle');
        if (menu && menu.style.display === 'block') {
            if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
                menu.style.display = 'none';
            }
        }
    });

    // Global exports
    window.downloadCanvasAsPNG = downloadCanvasAsPNG;
    window.downloadTimelineAsPNG = downloadCanvasAsPNG;
    window.downloadCanvasAsSVG = downloadCanvasAsSVG;
    window.togglePngExportOptions = togglePngExportOptions;
    window.updatePngScalePreference = updatePngScalePreference;
    window.updatePngBgPreference = updatePngBgPreference;
    window.updatePngGridPreference = updatePngGridPreference;
    window.PNG_CONFIG = PNG_CONFIG;

})(window);
