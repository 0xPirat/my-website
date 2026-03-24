export function initEstimator() {
  const estimator = document.querySelector("[data-estimator]");
  const estimatePrice = document.getElementById("estimate-price");
  const estimateWeeks = document.getElementById("estimate-weeks");
  const estimateSummary = document.getElementById("estimate-summary");
  const estimateFeatures = document.getElementById("estimate-features");
  const estimateSelection = document.getElementById("estimate-selection");

  if (
    !estimator ||
    !estimatePrice ||
    !estimateWeeks ||
    !estimateSummary ||
    !estimateFeatures ||
    !estimateSelection
  ) {
    return;
  }

  const groups = estimator.querySelectorAll(".choice-group");
  const euro = new Intl.NumberFormat("de-DE");

  const renderEstimate = () => {
    let totalPrice = 0;
    let totalWeeks = 0;
    const labels = [];
    const features = [];

    groups.forEach((group) => {
      const active = group.querySelector(".choice-button.is-active");

      if (!active) {
        return;
      }

      totalPrice += Number(active.dataset.price || 0);
      totalWeeks += Number(active.dataset.weeks || 0);
      labels.push(active.dataset.label || active.textContent.trim());

      const itemFeatures = (active.dataset.features || "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);

      features.push(...itemFeatures);
    });

    const safeWeeks = Math.max(1, totalWeeks);
    const summary = `${labels.join(" / ")}.`;

    estimatePrice.textContent = `${euro.format(totalPrice)} EUR`;
    estimateWeeks.textContent = `${safeWeeks} ${
      safeWeeks === 1 ? "Woche" : "Wochen"
    }`;
    estimateSummary.textContent = summary;
    estimateSelection.value = summary;

    estimateFeatures.innerHTML = "";

    features.slice(0, 5).forEach((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      estimateFeatures.appendChild(item);
    });
  };

  groups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".choice-button");

      if (!button) {
        return;
      }

      group
        .querySelectorAll(".choice-button")
        .forEach((item) => item.classList.remove("is-active"));

      button.classList.add("is-active");
      renderEstimate();
    });
  });

  renderEstimate();
}
