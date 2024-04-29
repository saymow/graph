import * as creator from "./creator.mjs";
import * as draw from "./draw.mjs";
import * as search from "./search.mjs";
import { NODE_TYPE, NODE_STATUS } from "./constants.mjs";

const container_el = document.querySelector("#app");
const save_btn_el = document.querySelector("#save-btn");
const load_btn_el = document.querySelector("#load-btn");
const run_btn_el = document.querySelector("#run-btn");
const canvas_el = document.querySelector("canvas");
const ctx = canvas_el.getContext("2d");

const LOCAL_STORAGE_KEY = "@GRAPH";

let nodes = [];
let matrix = [];

const nodesSubject = new rxjs.Subject();
const edgesSubject = new rxjs.Subject();
const runSubject = new rxjs.Subject();

nodesSubject.subscribe((node) => creator.addNode(matrix, nodes, node));
nodesSubject.subscribe((node) => draw.drawNode(ctx, node));
edgesSubject.subscribe((edge) => creator.addEdge(matrix, edge));
edgesSubject.subscribe((edge) => draw.drawEdge(ctx, nodes, edge));

runSubject
  .pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    )
  )
  .subscribe((event) => {
    const { status, node } = event;

    if (status === NODE_STATUS.DISCOVERED) draw.drawDiscoveredNode(ctx, node);
    else if (status === NODE_STATUS.VISITED) draw.drawVisitedNode(ctx, node);
    else if (status === NODE_STATUS.FOUND) draw.drawFoundNode(ctx, node);
    else if (status === NODE_STATUS.PATH) draw.drawPathNode(ctx, node);
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

function load(config) {
  nodes = config.nodes;
  matrix = config.matrix;

  for (const node of nodes) draw.drawNode(ctx, node);

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] === 1) {
        draw.drawEdge(ctx, nodes, [i, j]);
      }
    }
  }
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

  draw.drawHighlightedNode(ctx, origin_node);

  const path = search.bfs(
    nodes,
    matrix,
    nodeIdx,
    (idx) => {
      if (nodeIdx === idx) return;
      runSubject.next({ status: NODE_STATUS.DISCOVERED, node: nodes[idx] });
    },
    (idx) => {
      if (nodeIdx === idx) return;
      runSubject.next({ status: NODE_STATUS.VISITED, node: nodes[idx] });
    },
    (idx) => {
      runSubject.next({ status: NODE_STATUS.FOUND, node: nodes[idx] });
    }
  );

  const nodes_in_between_path = path.slice(1, path.length - 1);

  for (const idx of nodes_in_between_path) {
    runSubject.next({ status: NODE_STATUS.PATH, node: nodes[idx] });
  }
}

let origin_node;
let is_run_mode = false;

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

run_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  is_run_mode = !is_run_mode;
  origin_node = null;

  if (is_run_mode) run_btn_el.innerText = "Creator Mode";
  else run_btn_el.innerText = "Run Mode";
});

(() => {
  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
