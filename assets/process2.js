(function () {
  "use strict";
  var root = document.documentElement;
  var section = document.querySelector("#process");
  if (!section || root.dataset.process2Demo !== "one-block") return;
  var steps = section.querySelector(".steps3");
  if (!steps || steps.children.length !== 3) return;
  var cards = Array.from(steps.children);
  var header = document.querySelector(".site-header");
  var api = window.portfolioMotion || {
    request: function (read, write) {
      requestAnimationFrame(function (now) {
        var state = read(now);
        if (state) write(state);
      });
    },
    watch: function () {},
    near: function () { return true; },
    style: function (element, name, value) {
      element.style.setProperty(name, String(value));
    },
  };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var scene = document.createElement("div");
  var stage = document.createElement("div");
  var art = document.createElement("div");
  scene.className = "process2-scene";
  stage.className = "process2-stage";
  art.className = "process2-art";
  art.setAttribute("aria-hidden", "true");
  art.innerHTML = '<p>ONE PERSON / SAME OWNER, EVERY FORM</p><svg viewBox="0 0 1000 320" focusable="false"><path class="process2-block" fill="var(--blue)"/><path class="process2-crease" fill="none" stroke="var(--paper)" stroke-width="9" stroke-linejoin="round"/></svg>';
  // Preserve the original heading and all three semantic steps. Only the
  // decorative shape morphs; every description remains visible together.
  steps.before(scene);
  scene.append(stage);
  stage.append(art, steps);
  var block = art.querySelector(".process2-block");
  var crease = art.querySelector(".process2-crease");
  var enabled = false;
  var printing = false;
  var queued = false;
  var geometry = null;
  var lastPhase = null;
  var lastActive = null;
  var forms = [
    [[330, 70], [500, 70], [670, 70], [670, 230], [500, 230], [330, 230]],
    [[350, 35], [500, 35], [650, 35], [650, 265], [500, 265], [350, 265]],
    [[500, 30], [650, 105], [650, 235], [500, 290], [350, 215], [350, 85]],
  ];
  var creases = [
    [[330, 70], [500, 170], [670, 70], [330, 230], [445, 145], [670, 230], [555, 145]],
    [[390, 75], [610, 75], [610, 225], [390, 225], [390, 75], [500, 75], [500, 225]],
    [[350, 85], [500, 160], [650, 105], [500, 160], [500, 290], [500, 160], [500, 30]],
  ];

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }
  function measure() {
    var top = (header ? header.offsetHeight : 60) + 16;
    stage.style.setProperty("--process2-top", top + "px");
    enabled = !reduced.matches && !printing;
    root.classList.toggle("process2-enabled", enabled);
    // Use stable viewport space and actual text fit, not a toolbar-sensitive
    // height gate or smaller text to force the scene into a short screen.
    if (enabled && (
      stage.scrollHeight > stage.clientHeight + 1 ||
      stage.scrollWidth > stage.clientWidth + 1 ||
      cards.some(function (card) { return card.scrollWidth > card.clientWidth + 1; })
    )) {
      enabled = false;
      root.classList.remove("process2-enabled");
    }
    geometry = enabled ? {
      top: top,
      travel: Math.max(1, scene.offsetHeight - stage.offsetHeight),
    } : null;
    lastPhase = null;
    queue();
  }
  function read() {
    queued = false;
    if (!enabled || document.hidden || !geometry ||
        (lastPhase !== null && !api.near(scene))) return null;
    var progress = clamp(
      (geometry.top - scene.getBoundingClientRect().top) / geometry.travel,
    );
    var phase = progress < 0.16 ? 0 :
      progress < 0.34 ? (progress - 0.16) / 0.18 :
      progress < 0.66 ? 1 :
      progress < 0.84 ? 1 + (progress - 0.66) / 0.18 : 2;
    return { phase: phase, active: Math.round(phase) };
  }
  function interpolate(first, second, progress) {
    return first.map(function (point, index) {
      return point.map(function (value, axis) {
        return Math.round((value + (second[index][axis] - value) * progress) * 1000) / 1000;
      });
    });
  }
  function draw(state) {
    if (state.phase === lastPhase) return;
    lastPhase = state.phase;
    if (state.active !== lastActive) {
      lastActive = state.active;
      cards.forEach(function (card, index) {
        api.style(card, "--process2-ink", index === state.active ? "var(--blue)" : "var(--line)");
      });
    }
    var index = Math.min(1, Math.floor(state.phase));
    var progress = state.phase - index;
    block.setAttribute("d", interpolate(forms[index], forms[index + 1], progress).map(function (point, index) {
      return (index ? "L" : "M") + point.join(" ");
    }).join(" ") + " Z");
    crease.setAttribute("d", interpolate(creases[index], creases[index + 1], progress).map(function (point, index) {
      return ([0, 3, 5].includes(index) ? "M" : "L") + point.join(" ");
    }).join(" "));
  }
  function queue() {
    if (!queued && enabled && !document.hidden &&
        (lastPhase === null || api.near(scene))) {
      queued = true;
      api.request(read, draw);
    }
  }
  api.watch(scene, queue);
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", measure);
  addEventListener("load", measure);
  addEventListener("pageshow", measure);
  document.addEventListener("visibilitychange", queue);
  reduced.addEventListener("change", measure);
  addEventListener("beforeprint", function () {
    printing = true;
    measure();
  });
  addEventListener("afterprint", function () {
    printing = false;
    // Firefox can still expose print geometry within the afterprint event.
    requestAnimationFrame(measure);
  });
  if (header && "ResizeObserver" in window) {
    new ResizeObserver(measure).observe(header);
  }
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
