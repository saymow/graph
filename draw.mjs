import { drawCircle, drawEdge as canvasDrawEdge } from "./canvas.mjs";
import {
  NORMAL_NODE_RADIUS,
  SPECIAL_NODE_RADIUS,
  NODE_TYPE,
} from "./constants.mjs";
import { getDistance } from "./utils.mjs";

function makeFinalNodeText(nodes, node) {
  const nodeIdx = nodes.indexOf(node);
  let count = 0;

  for (let idx = 0; idx < nodeIdx; idx++) {
    if (nodes[idx].type === NODE_TYPE.FINAL) {
      count++;
    }
  }

  return count.toString();
}

function makeNodeText(nodes, node) {
  let text = "";
  let count = 0;

  for (const item of nodes) {
    if (item.type === NODE_TYPE.FINAL) {
      text = text.concat(
        `${count}) ${getDistance(node.pos, item.pos).toFixed(2)}\n`
      );
      count++;
    }
  }

  return text;
}

function makeCircle(nodes, node, fillStyle, strokeStyle) {
  let text;
  let outerText;

  if (node.type === NODE_TYPE.FINAL) {
    text = makeFinalNodeText(nodes, node);
  } else {
    outerText = makeNodeText(nodes, node);
  }

  return {
    x: node.pos[0],
    y: node.pos[1],
    radius:
      node.type === NODE_TYPE.FINAL ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    fillStyle,
    strokeStyle,
    text,
    outerText,
  };
}

export function drawNode(ctx, nodes, node) {
  drawCircle(
    ctx,
    makeCircle(
      nodes,
      node,
      node.type === NODE_TYPE.FINAL ? "red" : "black",
      "black"
    )
  );
}

export function drawEdge(ctx, originNode, targetNode) {
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

export function drawHighlightedEdge(ctx, originNode, targetNode) {
  canvasDrawEdge(ctx, {
    a: {
      x: originNode.pos[0],
      y: originNode.pos[1],
    },
    b: {
      x: targetNode.pos[0],
      y: targetNode.pos[1],
    },
    color: "purple",
  });
}

export function drawHighlightedNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "purple", "black"));
}

export function drawDiscoveredNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "white", "black"));
}

export function drawVisitedNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "gray", "black"));
}

export function drawFoundNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "purple", "black"));
}

export function drawPathNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "#a54ba1bf", "black"));
}
