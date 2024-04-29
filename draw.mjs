import { drawCircle, drawEdge as canvasDrawEdge } from "./canvas.mjs";
import { NORMAL_NODE_RADIUS, SPECIAL_NODE_RADIUS } from "./constants.mjs";

function makeCircle(node, fillStyle, strokeStyle) {
  return {
    x: node.pos[0],
    y: node.pos[1],
    radius: node.type === "final" ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    fillStyle,
    strokeStyle,
  };
}

export function drawNode(ctx, node) {
  drawCircle(
    ctx,
    makeCircle(node, node.type === "final" ? "red" : "black", "black")
  );
}

export function drawEdge(ctx, nodes, edge) {
  const [originNode, targetNode] = [nodes[edge[0]], nodes[edge[1]]];

  canvasDrawEdge(ctx, {
    a: {
      x: originNode.pos[0],
      y: originNode.pos[1],
    },
    b: {
      x: targetNode.pos[0],
      y: targetNode.pos[1],
    },
    color: "black",
  });
}

export function drawHighlightedNode(ctx, node) {
  drawCircle(ctx, makeCircle(node, "purple", "black"));
}

export function drawDiscoveredNode(ctx, node) {
  drawCircle(ctx, makeCircle(node, "white", "black"));
}

export function drawVisitedNode(ctx, node) {
  drawCircle(ctx, makeCircle(node, "gray", "black"));
}

export function drawFoundNode(ctx, node) {
  drawCircle(ctx, makeCircle(node, "purple", "black"));
}

export function drawPathNode(ctx, node) {
  drawCircle(ctx, makeCircle(node, "#a54ba1bf", "black"));
}
