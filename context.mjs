import { MODE } from "./constants.mjs";

const containerEl = document.querySelector("#app");
const sandboxBtnEl = document.querySelector("#sandbox-btn");
const saveBtnEl = document.querySelector("#save-btn");
const loadBtnEl = document.querySelector("#load-btn");
const runBtnEl = document.querySelector("#run-btn");
const clearBtnEl = document.querySelector("#clear-btn");
const comparissonsBtnEl = document.querySelector("#comparissons-btn");
const canvasEl = document.querySelector("canvas");
const algorithmsModalContainerEl = document.querySelector(
  "#algorithm-modal-container"
);
const algorithmsModalEl = document.querySelector(
  "#algorithm-modal"
);
const resultModalContainerEl = document.querySelector(
  "#result-modal-container"
);
const resultModalEl = document.querySelector(
  "#result-modal"
);
const comparissonModalContainerEl = document.querySelector(
  "#algorithm-comparissons-modal-container"
);
const comparissonModalEl = document.querySelector(
  "#algorithm-comparissons-modal"
);
const canvasCtx = canvasEl.getContext("2d");

const $addNode = new rxjs.Subject();
const $addEdge = new rxjs.Subject();
const $algorithmPresentation = new rxjs.Subject();
const $click = new rxjs.Subject();
const $mode = new rxjs.BehaviorSubject(MODE.SANDBOX);
const $originNode = new rxjs.BehaviorSubject();
const $algorithm = new rxjs.BehaviorSubject();

export const Ctx = () => ({
  containerEl,
  sandboxBtnEl,
  saveBtnEl,
  loadBtnEl,
  runBtnEl,
  clearBtnEl,
  comparissonsBtnEl,
  canvasEl,
  algorithmsModalEl,
  algorithmsModalContainerEl,
  comparissonModalEl,
  resultModalEl,
  resultModalContainerEl,
  comparissonModalContainerEl,
  canvasCtx,
  $addNode,
  $addEdge,
  $algorithmPresentation,
  $click,
  $mode,
  $originNode,
  $algorithm,
});
