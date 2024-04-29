import { NORMAL_NODE_RADIUS, SPECIAL_NODE_RADIUS } from "./constants.mjs";

export function drawHighlightedNode(ctx, node) {
  const {
    type,
    pos: [x, y],
  } = node;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "purple";
  ctx.stroke();
  ctx.fill();
}

export function drawDiscoveredNode(ctx, node) {
  const {
    type,
    pos: [x, y],
  } = node;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "white";
  ctx.stroke();
  ctx.fill();
}

export function drawVisitedNode(ctx, node) {
  const {
    type,
    pos: [x, y],
  } = node;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "gray";
  ctx.stroke();
  ctx.fill();
}

export function drawFoundNode(ctx, node) {
  const {
    type,
    pos: [x, y],
  } = node;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "purple";
  ctx.stroke();
  ctx.fill();
}

export function drawPathNode(ctx, node) {
  const {
    type,
    pos: [x, y],
  } = node;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "#a54ba1bf";
  ctx.stroke();
  ctx.fill();
}
