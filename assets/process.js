(function () {
  "use strict";
  var root = document.documentElement;
  var section = document.querySelector("#process");
  if (!section || root.dataset.processDemo !== "sheet-flip") return;
  var steps = section.querySelector(".steps3");
  var header = document.querySelector(".site-header");
  if (!steps || !header) return;
  var cards = Array.from(steps.children);
  var motion = matchMedia("(prefers-reduced-motion: reduce)");
  var scene = document.createElement("div");
  scene.className = "process-scene";
  var stage = document.createElement("div");
  stage.className = "process-stage";
  var status = document.createElement("div");
  status.className = "process-status";
  status.setAttribute("aria-hidden", "true");
  var number = document.createElement("strong");
  var caption = document.createElement("span");
  number.textContent = "01";
  caption.textContent = "DEFINE / THE IDEA";
  status.append(number, caption);
  // Keep the full-size original section heading outside the pinned sheets.
  // All three original steps remain in their original semantic reading order.
  steps.before(scene);
  scene.append(stage);
  stage.append(status, steps);
  cards.forEach(function (card, index) {
    card.style.zIndex = String(10 - index);
  });
  var pending = false;
  var printing = false;
  var frame = window.portfolioMotion;
  var geometry = null;
  var lastPhase = null;

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }
  function measure() {
    stage.style.setProperty("--process-header", header.offsetHeight + "px");
    root.classList.toggle("process-enabled", !motion.matches);
    scene.classList.toggle("process-active", !motion.matches && !printing);
    if (scene.classList.contains("process-active")) {
      scene.classList.add("process-measuring");
      // Measure the real text at its existing size. Never clip copy or shrink
      // typography to force a sticky scene into short screens or Page Zoom.
      var fits =
        stage.scrollHeight <= stage.clientHeight + 1 &&
        stage.scrollWidth <= stage.clientWidth + 1 &&
        cards.every(function (card) {
          var title = card.querySelector("h3");
          var label = card.querySelector(".n");
          return (
            card.scrollHeight <= card.clientHeight + 1 &&
            card.scrollWidth <= card.clientWidth + 1 &&
            title.offsetTop >= label.offsetTop + label.offsetHeight + 20
          );
        });
      scene.classList.remove("process-measuring");
      scene.classList.toggle("process-active", fits);
    }
    if (!scene.classList.contains("process-active")) {
      cards.forEach(function (card) {
        frame.removeStyle(card, "--process-transform");
      });
      geometry = null;
    } else {
      // These dimensions change on resize/font/header changes, not scroll.
      geometry = {
        top: parseFloat(getComputedStyle(stage).top),
        travel: Math.max(1, scene.offsetHeight - stage.offsetHeight),
      };
    }
    lastPhase = null;
    queue();
  }
  function read() {
    pending = false;
    if (
      motion.matches ||
      printing ||
      document.hidden ||
      !geometry ||
      (lastPhase !== null && !frame.near(scene))
    )
      return;
    return {
      progress: clamp(
        (geometry.top - scene.getBoundingClientRect().top) / geometry.travel,
      ),
    };
  }
  function draw(state) {
    var p = state.progress;
    var phase =
      p < 0.18
        ? 0
        : p < 0.32
          ? (p - 0.18) / 0.14
          : p < 0.68
            ? 1
            : p < 0.82
              ? 1 + (p - 0.68) / 0.14
              : 2;
    if (phase === lastPhase) return;
    lastPhase = phase;
    var active = Math.min(2, Math.floor(phase + 0.25));
    frame.text(number, String(active + 1).padStart(2, "0"));
    frame.text(
      caption,
      ["DEFINE / THE IDEA", "BUILD / EVERY PHASE", "DELIVER / REFINE"][active],
    );
    cards.forEach(function (card, index) {
      var ahead = clamp(index - phase);
      var behind = clamp(phase - index);
      frame.style(
        card,
        "--process-transform",
        "translate3d(0," +
          (ahead * 140 - behind * 540) +
          "px," +
          -ahead * 320 +
          "px) rotateX(" +
          (ahead * 75 - behind * 100) +
          "deg) scale(" +
          (1 - ahead * 0.15) +
          ")",
      );
    });
  }
  function queue() {
    if (
      !pending &&
      !document.hidden &&
      !motion.matches &&
      !printing &&
      geometry &&
      (lastPhase === null || frame.near(scene))
    ) {
      pending = true;
      frame.request(read, draw);
    }
  }
  window.addEventListener("scroll", queue, { passive: true });
  frame.watch(scene, queue);
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  window.addEventListener("pageshow", measure);
  window.addEventListener("beforeprint", function () {
    printing = true;
    measure();
  });
  window.addEventListener("afterprint", function () {
    printing = false;
    requestAnimationFrame(measure);
  });
  document.addEventListener("visibilitychange", queue);
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(header);
  if (document.fonts) document.fonts.ready.then(measure);
  motion.addEventListener("change", measure);
  measure();
})();
