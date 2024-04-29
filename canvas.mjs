/**
 * @typedef {{x: number, y: number, radius: number, fillStyle: string, strokeStyle: string}} Circle
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
