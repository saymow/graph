import * as creator from "./creator.mjs";
import * as draw from "./draw.mjs";
import * as algorithms from "./algorithms-metadata.mjs";
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

  const containerEl = document.querySelector('[data-id="algorithm-metrics"]');

  containerEl.innerHTML = "";
  algorithms.getAll().forEach((algorithm) => {
    const path = algorithm.handle(
      nodes,
      matrix,
      targetIdx,
      () => {},
      () => {},
      () => {}
    );

    const { distance, nodesCount, finalNode } = getPathInformation(path);

    const liEl = document.createElement("li");
    const articleEl = document.createElement("article");
    const headerEl = document.createElement("header");
    const h3El = document.createElement("h3");
    const sectionEl = document.createElement("section");
    const nodesArticleEl = document.createElement("article");
    const nodesArticleKeyEl = document.createElement("span");
    const nodesArticleValueEl = document.createElement("span");
    const distanceArticleEl = document.createElement("article");
    const distanceArticleKeyEl = document.createElement("span");
    const distanceArticleValueEl = document.createElement("span");
    const finalNodeArticleEl = document.createElement("article");
    const finalNodeArticleKeyEl = document.createElement("span");
    const finalNodeArticleValueEl = document.createElement("span");
    const runArticleEl = document.createElement("article");
    const nodesArticleBtnEl = document.createElement("button");

    articleEl.classList.add("data-container");

    h3El.textContent = algorithm.name;

    nodesArticleKeyEl.textContent = "Nodes";
    nodesArticleValueEl.textContent = nodesCount;
    nodesArticleEl.appendChild(nodesArticleKeyEl);
    nodesArticleEl.appendChild(nodesArticleValueEl);

    distanceArticleKeyEl.textContent = "Distance";
    distanceArticleValueEl.textContent = distance;
    distanceArticleEl.appendChild(distanceArticleKeyEl);
    distanceArticleEl.appendChild(distanceArticleValueEl);

    finalNodeArticleKeyEl.textContent = "Final Node";
    finalNodeArticleValueEl.textContent = finalNode;
    finalNodeArticleEl.appendChild(finalNodeArticleKeyEl);
    finalNodeArticleEl.appendChild(finalNodeArticleValueEl);

    nodesArticleBtnEl.textContent = "Run";
    nodesArticleBtnEl.setAttribute("data-id", algorithm.id);
    nodesArticleBtnEl.addEventListener(
      "click",
      handleComparissonAlgorithmClick
    );
    runArticleEl.appendChild(nodesArticleBtnEl);

    headerEl.appendChild(h3El);

    sectionEl.appendChild(nodesArticleEl);
    sectionEl.appendChild(distanceArticleEl);
    sectionEl.appendChild(finalNodeArticleEl);
    sectionEl.appendChild(runArticleEl);

    articleEl.appendChild(headerEl);
    articleEl.appendChild(sectionEl);
    liEl.appendChild(articleEl);
    containerEl.appendChild(liEl);
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
  runAlgorithmPresentation(algorithm.handle, origin);
}

function handleRunAlgorithmComparissonMode(payload) {
  const { algorithm, origin } = payload;
  handleCloseComparissonModal();
  runAlgorithmPresentation(algorithm.handle, origin);
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

  algorithmSubject.next(algorithms.makeAlgorithm(algorithmName));
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
  algorithmSubject.next(algorithms.makeAlgorithm(algorithmName));
}

function handleCloseResultsModal() {
  originNodeSubject.next(null);
  algorithmSubject.next(null);

  result_modal_container.classList.remove("open");
  result_modal_container
    .querySelector('button[data-id="continue"]')
    .removeEventListener("click", handleCloseResultsModal);
}

function getPathInformation(path) {
  const finalNode = nodes[path[0]];

  if (finalNode.type === NODE_TYPE.NORMAL) {
    return null;
  }

  const nodesPath = path.map((nodeIdx) => nodes[nodeIdx]);
  const nodesCount = path.length - 1;
  const distance = computePathDistance(nodesPath).toFixed(2);
  const finalNodeText = draw.makeFinalNodeText(nodes, finalNode);

  return { nodesCount, distance, finalNode: finalNodeText };
}

function handleOpenResultModal(path) {
  const { finalNode, nodesCount, distance } = getPathInformation(path);

  result_modal_container.querySelector('[data-id="nodes"]').textContent =
    nodesCount;
  result_modal_container.querySelector('[data-id="distance"]').textContent =
    distance;
  result_modal_container.querySelector('[data-id="final-node"]').textContent =
    finalNode;
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

function loadAlgorithmsOptions() {
  const containerEl = document.querySelector('[data-id="algorithm-options"]');

  algorithms.getAll().forEach((algorithm) => {
    const liEl = document.createElement("li");
    const buttonEl = document.createElement("button");

    buttonEl.textContent = algorithm.name;
    buttonEl.setAttribute("data-id", algorithm.id);
    liEl.appendChild(buttonEl);
    containerEl.appendChild(buttonEl);
  });
}

(() => {
  setUpCanvas();

  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  loadAlgorithmsOptions();

  if (config) {
    load(JSON.parse(config));
  }
})();
