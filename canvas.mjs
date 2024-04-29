/**
 * @typedef {{x: number, y: number, radius: number, fillStyle: string, strokeStyle: string, text?: string, outerText?: string}} Circle
 * @typedef {{a: {x: number, y: number }, b: {x: number, y: number }, color: string}} Edge
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Circle} circle
 */
export function drawCircle(ctx, circle) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
  ctx.fillStyle = circle.fillStyle;
  ctx.strokeStyle = circle.strokeStyle;
  ctx.stroke();
  ctx.fill();

  if (circle.text) {
    ctx.font = "16pt Calibri";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(circle.text, circle.x, circle.y + circle.radius / 2);
  }

  if (circle.outerText) {
    const lines = circle.outerText.split("\n");
    const lineHeight = 16;

    ctx.font = "12pt Calibri";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";

    for (let idx = 0; idx < lines.length; idx++) {
      ctx.fillText(
        lines[idx],
        circle.x + circle.radius * 2,
        circle.y + idx * lineHeight
      );
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Edge} edge
 */
export function drawEdge(ctx, edge) {
  ctx.moveTo(edge.a.x, edge.a.y);
  ctx.lineTo(edge.b.x, edge.b.y);
  ctx.strokeStyle = edge.color;
  ctx.strokeWidth = 100;
  ctx.lineCap = "round";
  ctx.stroke();
}
