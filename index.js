const container_el = document.querySelector("#app");
const save_btn_el = document.querySelector("#save-btn");
const load_btn_el = document.querySelector("#load-btn");
const run_btn_el = document.querySelector("#run-btn");
const canvas_el = document.querySelector("canvas");
const ctx = canvas_el.getContext("2d");

let nodes = [];
let matrix = [];

const nodesSubject = new rxjs.Subject();
const edgesSubject = new rxjs.Subject();

const NORMAL_NODE_RADIUS = 5;
const SPECIAL_NODE_RADIUS = 10;
const LOCAL_STORAGE_KEY = "@GRAPH";

function setUpCanvas() {
  canvas_el.width = canvas_el.clientWidth;
  canvas_el.height = canvas_el.clientHeight;
}

function addNode(type, pos) {
  nodesSubject.next({ type, pos });
}

function isWithin(rect, pos) {
  const [a_x, a_y] = rect[0];
  const [b_x, b_y] = rect[1];
  const [x, y] = pos;

  return a_x <= x && b_x >= x && a_y <= y && b_y >= y;
}

function getNode(pos) {
  return nodes.findIndex((node) => {
    const [x, y] = node.pos;

    return isWithin(
      [
        [x - SPECIAL_NODE_RADIUS, y - SPECIAL_NODE_RADIUS],
        [x + SPECIAL_NODE_RADIUS, y + SPECIAL_NODE_RADIUS],
      ],
      pos
    );
  });
}

function addEdge(edge) {
  console.log("addEdge: ", edge);
  edgesSubject.next(edge);
}

function drawNode(node) {
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
  ctx.fillStyle = type === "final" ? "red" : "black";
  ctx.stroke();
  ctx.fill();
}

function drawEdge(edge) {
  const [originNode, targetNode] = [nodes[edge[0]], nodes[edge[1]]];

  ctx.moveTo(originNode.pos[0], originNode.pos[1]);
  ctx.lineTo(targetNode.pos[0], targetNode.pos[1]);
  ctx.strokeStyle = "black";
  ctx.strokeWidth = 100;
  ctx.lineCap = "round";
  ctx.stroke();
}

function load(config) {
  nodes = config.nodes;
  matrix = config.matrix;

  for (const node of nodes) drawNode(node);

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] === 1) {
        drawEdge([i, j]);
      }
    }
  }
}

nodesSubject.subscribe((node) => {
  nodes.push(node);

  for (const row of matrix) {
    row.push(0);
  }

  matrix.push(Array(matrix.length + 1).fill(0));
});

nodesSubject.subscribe(drawNode);

edgesSubject.subscribe((edge) => {
  const [origin_node, target_node] = edge;
  matrix[origin_node][target_node] = 1;
});

edgesSubject.subscribe(drawEdge);

let origin_node;
let is_rurnning = false;

container_el.addEventListener("click", (e) => {
  const pos = [e.x, e.y];
  const node = getNode(pos);
  if (is_rurnning) {
  } else {
    if (e.ctrlKey) {
      if (node !== -1) {
        if (origin_node === null) {
          origin_node = getNode(pos);
        } else {
          const target_node = getNode(pos);

          addEdge([origin_node, target_node]);
          origin_node = null;
        }
      }
    } else {
      if (node === -1) {
        origin_node = null;
        const type = e.altKey ? "final" : "normal";

        addNode(type, pos);
      }
    }
  }
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
  is_rurnning = true;
});

(() => {
  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
