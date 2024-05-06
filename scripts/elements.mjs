export const makeOptionEl = (algorithm) => {
  const liEl = document.createElement("li");
  const buttonEl = document.createElement("button");

  buttonEl.textContent = algorithm.name;
  buttonEl.setAttribute("data-id", algorithm.id);
  liEl.appendChild(buttonEl);

  return liEl;
};

export const makeAlgorithmInformationEl = (
  algorithm,
  info,
  iterations,
  handleRunClick
) => {
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
  const iterationsArticleEl = document.createElement("article");
  const iterationsArticleKeyEl = document.createElement("span");
  const iterationsArticleValueEl = document.createElement("span");
  const runArticleEl = document.createElement("article");
  const nodesArticleBtnEl = document.createElement("button");

  articleEl.classList.add("data-container");

  h3El.textContent = algorithm.name;

  nodesArticleKeyEl.textContent = "Nodes";
  nodesArticleValueEl.textContent = info.nodesCount;
  nodesArticleEl.appendChild(nodesArticleKeyEl);
  nodesArticleEl.appendChild(nodesArticleValueEl);

  distanceArticleKeyEl.textContent = "Distance";
  distanceArticleValueEl.textContent = info.distance;
  distanceArticleEl.appendChild(distanceArticleKeyEl);
  distanceArticleEl.appendChild(distanceArticleValueEl);

  finalNodeArticleKeyEl.textContent = "Final Node";
  finalNodeArticleValueEl.textContent = info.finalNode;
  finalNodeArticleEl.appendChild(finalNodeArticleKeyEl);
  finalNodeArticleEl.appendChild(finalNodeArticleValueEl);

  iterationsArticleKeyEl.textContent = "Iterations";
  iterationsArticleValueEl.textContent = iterations;
  iterationsArticleEl.appendChild(iterationsArticleKeyEl);
  iterationsArticleEl.appendChild(iterationsArticleValueEl);

  nodesArticleBtnEl.textContent = "Run";
  nodesArticleBtnEl.setAttribute("data-id", algorithm.id);
  nodesArticleBtnEl.addEventListener("click", handleRunClick);
  runArticleEl.appendChild(nodesArticleBtnEl);

  headerEl.appendChild(h3El);

  sectionEl.appendChild(nodesArticleEl);
  sectionEl.appendChild(distanceArticleEl);
  sectionEl.appendChild(finalNodeArticleEl);
  sectionEl.appendChild(iterationsArticleEl);
  sectionEl.appendChild(runArticleEl);

  articleEl.appendChild(headerEl);
  articleEl.appendChild(sectionEl);
  liEl.appendChild(articleEl);

  return liEl;
};
