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
const sandbox_btn_el = document.querySelector("#sandbox-btn");
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

const addNodeSubject = new rxjs.Subject();
const addEdgeSubject = new rxjs.Subject();
const algorithmPresentationSubject = new rxjs.Subject();
const clickSubject = new rxjs.Subject();
const modeSubject = new rxjs.BehaviorSubject(MODE.SANDBOX);
const originNodeSubject = new rxjs.BehaviorSubject();
const algorithmSubject = new rxjs.BehaviorSubject();

let nodes = [];
let matrix = [];
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

function paint(originNode) {
  const originNodeIdx = nodes.indexOf(originNode);
  ctx.clearRect(0, 0, canvas_el.width, canvas_el.height);

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] === 1) {
        draw.drawEdge(ctx, nodes[i], nodes[j]);
      }
    }
  }

  for (let idx = 0; idx < nodes.length; idx++) {
    if (idx === originNodeIdx) {
      draw.drawHighlightedNode(ctx, nodes, nodes[idx]);
    } else {
      draw.drawNode(ctx, nodes, nodes[idx]);
    }
  }
}

addNodeSubject.subscribe((node) => creator.addNode(matrix, nodes, node));
addEdgeSubject.subscribe((edge) => creator.addEdge(matrix, edge));

modeSubject.subscribe((mode) => {
  let activeModeBtnEl;

  if (mode === MODE.SANDBOX) activeModeBtnEl = sandbox_btn_el;
  else if (mode === MODE.RUN) activeModeBtnEl = run_btn_el;
  else activeModeBtnEl = comparissons_btn_el;

  const modeBtnEls = [sandbox_btn_el, run_btn_el, comparissons_btn_el];

  modeBtnEls.forEach((modeBtnEl) => {
    if (modeBtnEl === activeModeBtnEl) {
      modeBtnEl.setAttribute("hightlight", "hightlight");
    } else {
      modeBtnEl.removeAttribute("hightlight");
    }
  });
});

rxjs
  .merge(originNodeSubject, modeSubject, addNodeSubject, addEdgeSubject)
  .subscribe(paint);

clickSubject
  .pipe(rxjs.operators.filter((payload) => payload.mode === MODE.SANDBOX))
  .subscribe(handleSandboxModeClick);

clickSubject
  .pipe(rxjs.operators.filter((payload) => payload.mode === MODE.RUN))
  .subscribe(handleRunModeClick);

clickSubject
  .pipe(rxjs.operators.filter((payload) => payload.mode === MODE.COMPARISSON))
  .subscribe(handleComparissonModeClick);

rxjs
  .combineLatest([originNodeSubject, modeSubject])
  .pipe(
    rxjs.operators.map(([origin, mode]) => ({
      origin,
      mode,
    })),
    rxjs.operators.filter((payload) => {
      return payload.mode === MODE.COMPARISSON && !!payload.origin;
    })
  )
  .subscribe(handleComparissonMode);

rxjs
  .combineLatest([originNodeSubject, modeSubject, algorithmSubject])
  .pipe(
    rxjs.operators.map(([origin, mode, algorithm]) => ({
      origin,
      mode,
      algorithm,
    })),
    rxjs.operators.filter((payload) => {
      return (
        payload.mode === MODE.RUN && !!payload.origin && !!payload.algorithm
      );
    })
  )
  .subscribe(handleRunMode);

rxjs
  .combineLatest([originNodeSubject, modeSubject, algorithmSubject])
  .pipe(
    rxjs.operators.map(([origin, mode, algorithm]) => ({
      origin,
      mode,
      algorithm,
    })),
    rxjs.operators.filter(
      (payload) =>
        payload.mode === MODE.COMPARISSON &&
        !!payload.origin &&
        !!payload.algorithm
    )
  )
  .subscribe(handleRunAlgorithmComparissonMode);

algorithmPresentationSubject
  .pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    )
  )
  .subscribe((event) => {
    const { type, payload } = event;

    switch (type) {
      case RUN_EVENT_TYPE.NODE:
        const { status, node } = payload;

        switch (status) {
          case NODE_STATUS.DISCOVERED:
            draw.drawDiscoveredNode(ctx, nodes, node);
            break;
          case NODE_STATUS.VISITED:
            draw.drawVisitedNode(ctx, nodes, node);
            break;
          case NODE_STATUS.FOUND:
            draw.drawFoundNode(ctx, nodes, node);
            break;
          case NODE_STATUS.PATH:
            draw.drawPathNode(ctx, nodes, node);
            break;
        }
        break;
      case RUN_EVENT_TYPE.EDGE:
        const { originNode, targetNode } = payload;

        draw.drawHighlightedEdge(ctx, originNode, targetNode);
        break;
    }
  });

algorithmPresentationSubject
  .pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    ),
    rxjs.operators.withLatestFrom(modeSubject),
    rxjs.operators.filter(
      ([event, mode]) => mode === MODE.RUN && event.type === RUN_EVENT_TYPE.END
    ),
    rxjs.operators.map(([event]) => event)
  )
  .subscribe((event) => handleOpenResultModal(event.payload.path));

originNodeSubject.subscribe((origin) => ({ origin }));

algorithmPresentationSubject
  .pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    ),
    rxjs.operators.withLatestFrom(modeSubject),
    rxjs.operators.withLatestFrom(originNodeSubject),
    rxjs.operators.filter((d) => {
      const [[event, mode], origin] = d;

      return (
        mode === MODE.COMPARISSON && origin && event.type === RUN_EVENT_TYPE.END
      );
    }),
    rxjs.operators.map(([, origin]) => ({ origin }))
  )
  .subscribe(handleComparissonMode);

function handleSandboxModeClick(payload) {
  const { position, targetIdx } = payload;

  originNodeSubject.pipe(rxjs.operators.take(1)).subscribe((originNode) => {
    if (payload.ctrlKey) {
      if (targetIdx === -1) {
        originNodeSubject.next(null);
        return;
      }

      if (!originNode) {
        originNodeSubject.next(nodes[targetIdx]);
      } else {
        const originNodeIdx = nodes.indexOf(originNode);
        const targetNodeIdx = targetIdx;

        addEdgeSubject.next([originNodeIdx, targetNodeIdx]);
        originNodeSubject.next(null);
      }
    } else {
      if (creator.getNode(nodes, position) !== -1) return;

      const type = payload.altKey ? NODE_TYPE.FINAL : NODE_TYPE.NORMAL;

      originNodeSubject.next(null);
      addNodeSubject.next({ type, pos: position });
    }
  });
}

function handleComparissonModeClick(payload) {
  if (!payload.target) return;
  originNodeSubject.next(payload.target);
}

function handleComparissonMode(payload) {
  const { origin: target } = payload;
  const targetIdx = nodes.indexOf(target);

  draw.drawHighlightedNode(ctx, nodes, target);

  comparisson_modal_container
    .querySelectorAll("li[data-id]")
    .forEach((algorithm_section) => {
      const algorithmName = algorithm_section.getAttribute("data-id");
      const algorithm = search.makeAlgorithm(algorithmName);
      const path = algorithm(
        nodes,
        matrix,
        targetIdx,
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
        .addEventListener("click", handleComparissonAlgorithmClick);
    });

  comparisson_modal_container.classList.add("open");
  window.addEventListener("click", handleFinishComparisson);
}

function runAlgorithmPresentation(algorithm, target) {
  const targetIdx = nodes.indexOf(target);

  draw.drawHighlightedNode(ctx, nodes, target);

  const path = algorithm(
    nodes,
    matrix,
    targetIdx,
    (idx) => {
      if (targetIdx === idx) return;
      algorithmPresentationSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.DISCOVERED, node: nodes[idx] },
      });
    },
    (idx) => {
      if (targetIdx === idx) return;
      algorithmPresentationSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.VISITED, node: nodes[idx] },
      });
    },
    (idx) => {
      algorithmPresentationSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.FOUND, node: nodes[idx] },
      });
    }
  );

  for (let idx = 0; idx < path.length; idx++) {
    if (idx !== 0 && idx !== path.length - 1) {
      algorithmPresentationSubject.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.PATH, node: nodes[path[idx]] },
      });
    }
    if (idx !== path.length - 1) {
      algorithmPresentationSubject.next({
        type: RUN_EVENT_TYPE.EDGE,
        payload: {
          originNode: nodes[path[idx]],
          targetNode: nodes[path[idx + 1]],
        },
      });
    }
  }

  algorithmPresentationSubject.next({
    type: RUN_EVENT_TYPE.END,
    payload: { path },
  });
}

function handleRunModeClick(payload) {
  if (!payload.target) return;
  originNodeSubject.next(payload.target);
}

function handleRunMode(payload) {
  const { algorithm, origin } = payload;
  runAlgorithmPresentation(algorithm, origin);
}

function handleRunAlgorithmComparissonMode(payload) {
  const { algorithm, origin } = payload;
  handleCloseComparissonModal();
  runAlgorithmPresentation(algorithm, origin);
  paint();
}

function handleFinishComparisson() {
  algorithmSubject.next(null);
  originNodeSubject.next(null);
  handleCloseComparissonModal();
}

function handleCloseComparissonModal() {
  comparisson_modal_container.classList.remove("open");

  comparisson_modal_container
    .querySelectorAll("button[data-id]")
    .forEach((button) => {
      button.removeEventListener("click", handleComparissonAlgorithmClick);
    });
  window.removeEventListener("click", handleFinishComparisson);
}

function handleComparissonAlgorithmClick(e) {
  e.stopPropagation();
  const algorithmName = e.target.getAttribute("data-id");

  algorithmSubject.next(search.makeAlgorithm(algorithmName));
}

function closeAlgorithmsModal() {
  algorithms_modal_container.classList.remove("open");

  window.removeEventListener("click", closeAlgorithmsModal);
  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.removeEventListener("click", handleAlgorithmButtonClick);
  });
}

function handleAlgorithmButtonClick(e) {
  const algorithmName = e.target.getAttribute("data-id");

  modeSubject.next(MODE.RUN);
  algorithmSubject.next(search.makeAlgorithm(algorithmName));
}

function handleCloseResultsModal() {
  originNodeSubject.next(null);
  algorithmSubject.next(null);

  result_modal_container.classList.remove("open");
  result_modal_container
    .querySelector('button[data-id="continue"]')
    .removeEventListener("click", handleCloseResultsModal);
}

function handleOpenResultModal(path) {
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
    .addEventListener("click", handleCloseResultsModal);
}

rxjs
  .fromEvent(container_el, "click")
  .pipe(
    rxjs.operators.tap((e) => e.stopPropagation()),
    rxjs.operators.withLatestFrom(modeSubject)
  )
  .subscribe((data) => {
    const [e, mode] = data;
    const position = [e.x, e.y];
    const targetIdx = creator.getNode(nodes, position);
    const payload = {
      mode,
      position,
      targetIdx,
      target: nodes[targetIdx],
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    };

    clickSubject.next(payload);
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

sandbox_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  algorithmSubject.next(null);
  originNodeSubject.next(null);
  modeSubject.next(MODE.SANDBOX);
});

run_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();

  algorithmSubject.next(null);
  originNodeSubject.next(null);

  algorithms_modal_container.classList.add("open");
  algorithms_modal_container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", handleAlgorithmButtonClick);
  });

  window.addEventListener("click", closeAlgorithmsModal);
});

comparissons_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();
  algorithmSubject.next(null);
  originNodeSubject.next(null);
  modeSubject.next(MODE.COMPARISSON);
});

clear_btn_el.addEventListener("click", (e) => {
  e.stopPropagation();

  modeSubject.next(MODE.SANDBOX);
  matrix = [];
  nodes = [];
});

(() => {
  setUpCanvas();

  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
