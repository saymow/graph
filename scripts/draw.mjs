import { Ctx } from "./context.mjs";
import { drawCircle, drawEdge as canvasDrawEdge } from "./canvas.mjs";
import {
  NORMAL_NODE_RADIUS,
  SPECIAL_NODE_RADIUS,
  NODE_TYPE,
  RUN_EVENT_TYPE,
  NODE_STATUS,
} from "./constants.mjs";
import { getDistance } from "./utils.mjs";

export function makeFinalNodeText(nodes, node) {
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
        `${count}) ${getDistance(node.position, item.position).toFixed(2)}\n`
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
    x: node.position[0],
    y: node.position[1],
    radius:
      node.type === NODE_TYPE.FINAL ? SPECIAL_NODE_RADIUS : NORMAL_NODE_RADIUS,
    fillStyle,
    strokeStyle,
    text,
    outerText,
  };
}

function drawNode(ctx, nodes, node) {
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

function drawEdge(ctx, originNode, targetNode) {
  canvasDrawEdge(ctx, {
    a: {
      x: originNode.position[0],
      y: originNode.position[1],
    },
    b: {
      x: targetNode.position[0],
      y: targetNode.position[1],
    },
    color: "black",
  });
}

function drawHighlightedEdge(ctx, originNode, targetNode) {
  canvasDrawEdge(
    ctx,
    {
      a: {
        x: originNode.position[0],
        y: originNode.position[1],
      },
      b: {
        x: targetNode.position[0],
        y: targetNode.position[1],
      },
      color: "purple",
    },
    3
  );
}

export function drawHighlightedNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "purple", "black"));
}

function drawDiscoveredNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "white", "black"));
}

function drawVisitedNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "gray", "black"));
}

function drawFoundNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "purple", "black"));
}

function drawPathNode(ctx, nodes, node) {
  drawCircle(ctx, makeCircle(nodes, node, "#a54ba1bf", "black"));
}

export function paint(graph, originNode) {
  const originNodeIdx = graph.nodes.indexOf(originNode);
  Ctx().canvasCtx.clearRect(0, 0, Ctx().canvasEl.width, Ctx().canvasEl.height);

  for (let i = 0; i < graph.matrix.length; i++) {
    for (let j = 0; j < graph.matrix.length; j++) {
      if (graph.matrix[i][j] === 1) {
        drawEdge(Ctx().canvasCtx, graph.nodes[i], graph.nodes[j]);
      }
    }
  }

  for (let idx = 0; idx < graph.nodes.length; idx++) {
    if (idx === originNodeIdx) {
      drawHighlightedNode(Ctx().canvasCtx, graph.nodes, graph.nodes[idx]);
    } else {
      drawNode(Ctx().canvasCtx, graph.nodes, graph.nodes[idx]);
    }
  }
}

export function paintAlgorithmPresentation(data) {
  const { nodes } = data.graph;
  const { type, payload } = data.event;

  switch (type) {
    case RUN_EVENT_TYPE.NODE:
      switch (payload.status) {
        case NODE_STATUS.DISCOVERED:
          drawDiscoveredNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.VISITED:
          drawVisitedNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.FOUND:
          drawFoundNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.PATH:
          drawPathNode(Ctx().canvasCtx, nodes, payload.node);
          break;
      }
      break;
    case RUN_EVENT_TYPE.EDGE:
      drawHighlightedEdge(
        Ctx().canvasCtx,
        payload.originNode,
        payload.targetNode
      );
      break;
  }
}
