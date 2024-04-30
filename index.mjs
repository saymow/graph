import * as creator from "./creator.mjs";
import * as draw from "./draw.mjs";
import * as search from "./search.mjs";
import { computePathDistance } from "./utils.mjs";
import {
  LOCAL_STORAGE_KEY,
  NODE_TYPE,
  NODE_STATUS,
  RUN_EVENT_TYPE,
  MODE,
} from "./constants.mjs";

const container_el = document.querySelector("#app");
const save_btn_el = document.querySelector("#save-btn");
const load_btn_el = document.querySelector("#load-btn");
const run_btn_el = document.querySelector("#run-btn");
const clear_btn_el = document.querySelector("#clear-btn");
const comparissons_btn_el = document.querySelector("#comparissons-btn");
const canvas_el = document.querySelector("canvas");
const algorithms_modal_container = document.querySelector(
  "#algorithm-modal-container"
);
const result_modal_container = document.querySelector(
  "#result-modal-container"
);
const comparisson_modal_container = document.querySelector(
  "#algorithm-comparissons-modal-container"
);
const ctx = canvas_el.getContext("2d");

const nodesSubject = new rxjs.Subject();
const edgesSubject = new rxjs.Subject();
const runSubject = new rxjs.Subject();

let nodes = [];
let matrix = [];
let origin_node;
let mode = MODE.SANDBOX;
let algorithm;

function setUpCanvas() {
  canvas_el.width = canvas_el.clientWidth;
  canvas_el.height = canvas_el.clientHeight;
}

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
edgesSubject.subscribe((edge) => creator.addEdge(matrix, edge));
nodesSubject.subscribe(() => paint());
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
    } else if (type === RUN_EVENT_TYPE.EDGE) {
      const { originNode, targetNode } = payload;
      draw.drawHighlightedEdge(ctx, originNode, targetNode);
    } else {
      handleOpenResultModel(payload.path);
    }
  });

function handleSandboxMode(e) {
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

      edgesSubject.next([origin_node, target_node]);
      origin_node = null;
    }
  } else {
    origin_node = null;

    if (node !== -1) {
      origin_node = null;
      return;
    }

    const type = e.altKey ? NODE_TYPE.FINAL : NODE_TYPE.NORMAL;

    nodesSubject.next({ type, pos });
  }
}

function runAlgorithm() {
  if (!origin_node || !algorithm) return;

  const nodeIdx = nodes.indexOf(origin_node);

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

  runSubject.next({ type: RUN_EVENT_TYPE.END, payload: { path } });
}

function handleRunMode(e) {
  const pos = [e.x, e.y];
  const nodeIdx = creator.getNode(nodes, pos);

  if (origin_node || nodeIdx === -1 || nodes[nodeIdx] === NODE_TYPE.FINAL)
    return;

  origin_node = nodes[nodeIdx];
  runAlgorithm();
}

function handleCloseComparissonModal() {
  comparisson_modal_container.classList.remove("open");
  comparisson_modal_container
    .querySelectorAll("button[data-id]")
    .forEach((button) => {
      button.removeEventListener("click", handleComparissonRunAlgorithm);
    });
  window.removeEventListener("click", handleCloseComparissonModal);
}

function handleComparissonRunAlgorithm(e) {
  handleSelectAlgorithm(e);
  runAlgorithm();
}

function handleComparissonMode(e) {
  const pos = [e.x, e.y];
  const nodeIdx = creator.getNode(nodes, pos);

  if (origin_node || nodeIdx === -1 || nodes[nodeIdx] === NODE_TYPE.FINAL)
    return;

  origin_node = nodes[nodeIdx];
  draw.drawHighlightedNode(ctx, nodes, origin_node);

  comparisson_modal_container
    .querySelectorAll("li[data-id]")
    .forEach((algorithm_section) => {
      const algorithmName = algorithm_section.getAttribute("data-id");
      const algorithm = search.makeAlgorithm(algorithmName);
      const path = algorithm(
        nodes,
        matrix,
        nodeIdx,
        () => {},
        () => {},
        () => {}
      );

      const nodes_path = path.map((nodeIdx) => nodes[nodeIdx]);
      const nodes_count = path.length - 1;
      const distance = computePathDistance(nodes_path).toFixed(2);

      algorithm_section.querySelector('[data-id="nodes"]').textContent =
        nodes_count;
      algorithm_section.querySelector('[data-id="distance"]').textContent =
        distance;
      algorithm_section
        .querySelector("button")
        .addEventListener("click", handleComparissonRunAlgorithm);
    });

  comparisson_modal_container.classList.add("open");
  window.addEventListener("click", handleCloseComparissonModal);
}

function closeAlgorithmsModal() {
  algorithms_modal_container.classList.remove("open");

  window.removeEventListener("click", closeAlgorithmsModal);
  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.removeEventListener("click", handleSelectAlgorithm);
  });
}

function handleSelectAlgorithm(e) {
  mode = MODE.RUN;
  const algorithmName = e.target.getAttribute("data-id");
  algorithm = search.makeAlgorithm(algorithmName);
}

function handleCloseResultsModel() {
  origin_node = null;
  mode = MODE.SANDBOX;

  paint();

  result_modal_container.classList.remove("open");
  result_modal_container
    .querySelector('button[data-id="continue"]')
    .removeEventListener("click", handleCloseResultsModel);
}

function handleOpenResultModel(path) {
  const nodes_path = path.map((nodeIdx) => nodes[nodeIdx]);
  const nodes_count = path.length - 1;
  const distance = computePathDistance(nodes_path).toFixed(2);

  result_modal_container.querySelector('[data-id="nodes"]').textContent =
    nodes_count;
  result_modal_container.querySelector('[data-id="distance"]').textContent =
    distance;
  result_modal_container.classList.add("open");

  result_modal_container
    .querySelector('button[data-id="continue"]')
    .addEventListener("click", handleCloseResultsModel);
}

container_el.addEventListener("click", (e) => {
  e.stopPropagation();

  if (mode === MODE.RUN) handleRunMode(e);
  else if (mode === MODE.SANDBOX) handleSandboxMode(e);
  else if (mode === MODE.COMPARISSON) handleComparissonMode(e);
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

run_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  origin_node = null;

  algorithms_modal_container.classList.add("open");

  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", handleSelectAlgorithm);
  });

  window.addEventListener("click", closeAlgorithmsModal);
});

comparissons_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();

  mode = MODE.COMPARISSON;
});

clear_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  mode = MODE.SANDBOX;

  matrix = [];
  nodes = [];
  paint();
});

(() => {
  setUpCanvas();

  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
