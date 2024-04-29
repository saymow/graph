import * as creator from "./creator.mjs";
import * as draw from "./draw.mjs";
import * as search from "./search.mjs";
import { NODE_TYPE, NODE_STATUS, RUN_EVENT_TYPE } from "./constants.mjs";

const container_el = document.querySelector("#app");
const save_btn_el = document.querySelector("#save-btn");
const load_btn_el = document.querySelector("#load-btn");
const run_btn_el = document.querySelector("#run-btn");
const canvas_el = document.querySelector("canvas");
const algorithms_modal_container = document.querySelector(
  "#algorithm-modal-container"
);
const ctx = canvas_el.getContext("2d");

const LOCAL_STORAGE_KEY = "@GRAPH";

let nodes = [];
let matrix = [];

const nodesSubject = new rxjs.Subject();
const edgesSubject = new rxjs.Subject();
const runSubject = new rxjs.Subject();

function load(config) {
  nodes = config.nodes;
  matrix = config.matrix;
  paint();
}

function paint() {
  ctx.clearRect(0, 0, canvas_el.width, canvas_el.height);

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] === 1) {
        draw.drawEdge(ctx, nodes[i], nodes[j]);
      }
    }
  }

  for (const node of nodes) {
    draw.drawNode(ctx, nodes, node);
  }
}

nodesSubject.subscribe((node) => creator.addNode(matrix, nodes, node));
nodesSubject.subscribe(() => paint());
edgesSubject.subscribe((edge) => creator.addEdge(matrix, edge));
edgesSubject.subscribe((edge) => {
  const [originNode, targetNode] = [nodes[edge[0]], nodes[edge[1]]];

  draw.drawEdge(ctx, originNode, targetNode);
});

runSubject
  .pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    )
  )
  .subscribe((event) => {
    const { type, payload } = event;

    if (type === RUN_EVENT_TYPE.NODE) {
      const { status, node } = payload;

      if (status === NODE_STATUS.DISCOVERED)
        draw.drawDiscoveredNode(ctx, nodes, node);
      else if (status === NODE_STATUS.VISITED)
        draw.drawVisitedNode(ctx, nodes, node);
      else if (status === NODE_STATUS.FOUND)
        draw.drawFoundNode(ctx, nodes, node);
      else if (status === NODE_STATUS.PATH) draw.drawPathNode(ctx, nodes, node);
    } else {
      const { originNode, targetNode } = payload;
      draw.drawHighlightedEdge(ctx, originNode, targetNode);
    }
  });

function setUpCanvas() {
  canvas_el.width = canvas_el.clientWidth;
  canvas_el.height = canvas_el.clientHeight;
}

function emitAddNode(type, pos) {
  nodesSubject.next({ type, pos });
}

function emitAddEdge(edge) {
  edgesSubject.next(edge);
}

function handleCreatorMode(e) {
  const pos = [e.x, e.y];
  const node = creator.getNode(nodes, pos);

  if (e.ctrlKey) {
    if (node === -1) {
      origin_node = null;
      return;
    }

    if (origin_node === null) {
      origin_node = node;
    } else {
      const target_node = node;

      emitAddEdge([origin_node, target_node]);
      origin_node = null;
    }
  } else {
    origin_node = null;

    if (node !== -1) {
      origin_node = null;
      return;
    }

    const type = e.altKey ? NODE_TYPE.FINAL : NODE_TYPE.NORMAL;

    emitAddNode(type, pos);
  }
}

function handleRunMode(e) {
  const pos = [e.x, e.y];
  const nodeIdx = creator.getNode(nodes, pos);

  if (origin_node || nodeIdx === -1 || nodes[nodeIdx] === NODE_TYPE.FINAL)
    return;

  origin_node = nodes[nodeIdx];

  draw.drawHighlightedNode(ctx, nodes, origin_node);

  const path = algorithm(
    nodes,
    matrix,
    nodeIdx,
    (idx) => {
      if (nodeIdx === idx) return;
      runSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.DISCOVERED, node: nodes[idx] },
      });
    },
    (idx) => {
      if (nodeIdx === idx) return;
      runSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.VISITED, node: nodes[idx] },
      });
    },
    (idx) => {
      runSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.FOUND, node: nodes[idx] },
      });
    }
  );

  for (let idx = 0; idx < path.length; idx++) {
    if (idx !== 0 && idx !== path.length - 1) {
      runSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.PATH, node: nodes[path[idx]] },
      });
    }
    if (idx !== path.length - 1) {
      runSubject.next({
        type: RUN_EVENT_TYPE.EDGE,
        payload: {
          originNode: nodes[path[idx]],
          targetNode: nodes[path[idx + 1]],
        },
      });
    }
  }
}

let origin_node;
let is_run_mode = false;
let algorithm;

container_el.addEventListener("click", (e) => {
  if (is_run_mode) handleRunMode(e);
  else handleCreatorMode(e);
});

save_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();

  const data = JSON.stringify({
    nodes,
    matrix,
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, data);

  navigator.clipboard.writeText(data);

  alert("Graph is copied");
});

load_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();

  const config = JSON.parse(window.prompt("Enter graph: "));
  load(config);
});

setUpCanvas();

function closeAlgorithmsModal() {
  algorithms_modal_container.classList.remove("open");

  window.removeEventListener("click", closeAlgorithmsModal);
  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.removeEventListener("click", handleSelectAlgorithm);
  });
}

function handleSelectAlgorithm(e) {
  const algorithmName = e.target.getAttribute("data-id");
  algorithm = search.makeAlgorithm(algorithmName);
}

run_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  is_run_mode = !is_run_mode;
  origin_node = null;

  algorithms_modal_container.classList.add("open");

  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", handleSelectAlgorithm);
  });

  window.addEventListener("click", closeAlgorithmsModal);
});

(() => {
  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
