//function to draw curve on browser

function PrintCurve(ctx, e, f, g, h, i, j, k, l, name, dash, guide, curveColor) {

    ctx.save();

    if (dash.checked) {

        ctx.setLineDash([5, 5]);

    } else {

        ctx.setLineDash([]);

    }

    ctx.beginPath();

    ctx.strokeStyle = curveColor&&curveColor.value?curveColor.value:"#000000";

    ctx.moveTo(scale * e.value, scale * f.value);

    ctx.bezierCurveTo(scale * g.value, scale * h.value, scale * i.value, scale * j.value, scale * k.value, scale * l.value);

    ctx.stroke();


    if (guide.checked) {

        ctx.setLineDash([5, 5]);

        ctx.moveTo(scale * e.value, scale * f.value);

        ctx.lineTo(scale * g.value, scale * h.value);


        ctx.lineTo(scale * i.value, scale * j.value);

        ctx.lineTo(scale * k.value, scale * l.value);

        ctx.stroke();


        ctx.setLineDash([]);

    }

    ctx.restore();


    ctx.save();

    //put the label of the line

    ctx.translate(scale * k.value + 10, scale * l.value - 5);

    ctx.scale(1, -1);

    var cCol = (curveColor && curveColor.value) ? curveColor.value : "#000000";
    ctx.fillStyle = cCol;
    ctx.font = "14px Arial, sans-serif";
    if (window.drawMathText) {
        window.drawMathText(ctx, name.value, 0, 0, { fontSize: 14, color: cCol, align: "left", baseline: "middle" });
    } else {
        ctx.fillText(name.value, 0, 0);
    }

    ctx.restore();

}
