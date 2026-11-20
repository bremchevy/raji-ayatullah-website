(function () {
  "use strict";

  var root = document.documentElement;
  var modes = (root.dataset.nextDemo || "").split(/\s+/);
  var assemblyEnabled = modes.includes("answer-assembly");
  var checklistEnabled = modes.includes("answer-checklist");
  if (!modes.includes("work-depth") && !assemblyEnabled && !checklistEnabled)
    return;
  var motion = matchMedia("(prefers-reduced-motion: reduce)");
  var work = document.getElementById("work-grid");
  var cards = modes.includes("work-depth") ? Array.from(work.children) : [];
  var cells = cards.map(function (card) {
    var cell = element("div", "next-depth-cell");
    if (card.classList.contains("featured-project"))
      cell.classList.add("next-featured");
    card.before(cell);
    cell.append(card);
    return cell;
  });
  var rubric = document.getElementById("criteria");
  var items =
    assemblyEnabled || checklistEnabled ? Array.from(rubric.children) : [];
  var heading = document.querySelector(".framework-heading");
  var answer = items.length ? element("div", "next-answer") : null;
  var stage = element("div", "next-answer-stage");
  var label = element("div", "next-label");
  var phase = element("span", "", "01 / ASSEMBLE THE BLUEPRINT");
  var counter = element("strong", "", "00/08");
  var spine = element("div", "next-spine");
  var reading = items.some(function (item) {
    return item.open;
  });
  var keyboardReading = false;
  var answerProgress = 0;
  var resumeProgress = null;
  var printing = false;
  var pending = false;
  var frame = window.portfolioMotion;
  var answerGeometry = null;
  var lastAnswerProgress = null;
  label.setAttribute("aria-hidden", "true");
  spine.setAttribute("aria-hidden", "true");
  label.append(phase, counter);
  if (answer) {
    heading.before(answer);
    answer.append(stage);
    stage.append(label, heading, rubric);
    rubric.append(spine);
  }
  if (checklistEnabled)
    items.forEach(function (item) {
      var tick = element("span", "next-tick", "✓");
      tick.setAttribute("aria-hidden", "true");
      item.querySelector(".criterion-title").before(tick);
    });

  function element(tag, className, text) {
    var node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }
  function clearAnswer() {
    lastAnswerProgress = null;
    items.forEach(function (item) {
      [
        "--next-transform",
        "--next-fill",
        "--next-color",
        "--next-plate",
        "--next-lock",
        "--next-checked",
      ].forEach(function (property) {
        frame.removeStyle(item, property);
      });
    });
  }
  function measure() {
    cells.forEach(function (cell, index) {
      cell.hidden = cards[index].hidden;
    });
    if (!answer) {
      queue();
      return;
    }
    if (motion.matches || printing || reading) {
      answer.classList.remove("next-answer-active");
    } else {
      // Fit the real content against stable 100svh, including loaded fonts and
      // enlarged text. Never hide the last row to force a pinned scene to fit.
      answer.classList.add("next-answer-active");
      answer.classList.add("next-answer-measuring");
      var fits = stage.scrollHeight <= stage.clientHeight + 1;
      if (fits) {
        var first = items[0];
        var last = items[items.length - 1];
        var start = first.offsetTop + first.offsetHeight / 2;
        var end = last.offsetTop + last.offsetHeight / 2;
        spine.style.top = start + "px";
        spine.style.height = end - start + "px";
      }
      answer.classList.remove("next-answer-measuring");
      answer.classList.toggle("next-answer-active", fits);
    }
    if (!answer.classList.contains("next-answer-active")) {
      clearAnswer();
      answerGeometry = null;
    } else {
      answerGeometry = {
        top: parseFloat(getComputedStyle(stage).top),
        travel: Math.max(
          1,
          answer.getBoundingClientRect().height - stage.offsetHeight,
        ),
      };
      lastAnswerProgress = null;
    }
    queue();
  }
  function read() {
    pending = false;
    if (motion.matches || document.hidden || printing) return;
    var viewport = innerHeight;
    var width = root.clientWidth;
    var positions = cells.map(function (cell) {
      return cell.hidden || !frame.near(cell)
        ? null
        : cell.getBoundingClientRect();
    });
    var bounds =
      answerGeometry && frame.near(answer)
        ? answer.getBoundingClientRect()
        : null;
    return {
      viewport: viewport,
      width: width,
      positions: positions,
      answer: bounds,
    };
  }
  function draw(state) {
    var positions = state.positions;

    // Geometry is read from untransformed wrappers, then all transforms write.
    cards.forEach(function (card, index) {
      if (!positions[index]) return;
      var p = clamp(
        (state.viewport * 0.95 - positions[index].top) /
          (state.viewport * 0.65),
      );
      var q = 1 - p;
      frame.style(
        card,
        "--next-depth",
        "perspective(1000px) translateZ(" +
          -620 * q +
          "px) rotateX(" +
          32 * q +
          "deg) rotateY(" +
          (index % 2 ? -1 : 1) * 24 * q +
          "deg) scale(" +
          (0.5 + 0.5 * p) +
          ")",
      );
    });
    if (!state.answer) return;
    var progress = clamp(
      (answerGeometry.top - state.answer.top) / answerGeometry.travel,
    );
    answerProgress = progress;
    if (progress === lastAnswerProgress) return;
    lastAnswerProgress = progress;
    var assembly = assemblyEnabled
      ? clamp(progress / (checklistEnabled ? 0.42 : 0.9))
      : 1;
    var ink = checklistEnabled
      ? clamp(
          (progress - (assemblyEnabled ? 0.5 : 0)) /
            (assemblyEnabled ? 0.4 : 0.9),
        )
      : 0;
    var locked = 0;
    var checked = 0;
    items.forEach(function (item, index) {
      var lock = clamp(assembly * 1.65 - index * 0.09);
      var fill = clamp(ink * 8.6 - index);
      var complete = fill === 1;
      if (lock === 1) locked += 1;
      if (complete) checked += 1;
      frame.style(
        item,
        "--next-transform",
        "translate3d(" +
          (index % 2 ? 1 : -1) * (1 - lock) * state.width * 0.72 +
          "px," +
          (1 - lock) * 60 +
          "px,0) rotate(" +
          (index % 2 ? 1 : -1) * (1 - lock) * 16 +
          "deg) scale(" +
          (0.65 + 0.35 * lock) +
          ")",
      );
      frame.style(item, "--next-lock", lock);
      frame.style(item, "--next-fill", fill);
      frame.style(item, "--next-checked", complete ? 1 : 0);
      frame.style(
        item,
        "--next-color",
        complete ? "var(--paper)" : "var(--ink)",
      );
      // Paper labels keep partial ink wipes readable at any scroll stop.
      frame.style(
        item,
        "--next-plate",
        complete ? "transparent" : "var(--paper)",
      );
    });
    var inInk = checklistEnabled && (!assemblyEnabled || progress >= 0.5);
    frame.text(
      phase,
      inInk
        ? (assemblyEnabled ? "02" : "01") + " / INK THE QUALITY CHECK"
        : "01 / ASSEMBLE THE BLUEPRINT",
    );
    frame.text(
      counter,
      String(inInk ? checked : locked).padStart(2, "0") + "/08",
    );
    frame.style(spine, "transform", "scaleY(" + assembly + ")");
  }
  function queue() {
    if (
      !pending &&
      !motion.matches &&
      !document.hidden &&
      !printing &&
      (cells.some(function (cell) {
        return !cell.hidden && frame.near(cell);
      }) ||
        (answerGeometry && frame.near(answer)))
    ) {
      pending = true;
      frame.request(read, draw);
    }
  }
  function hashTarget(hash) {
    var key;
    try {
      key = decodeURIComponent(hash.slice(1));
    } catch (_) {
      return null;
    }
    if (key === "rubric" || key === "eval-rubric") key = "criteria";
    return document.getElementById(key);
  }
  function linkedCriterion(target) {
    return target && (target === rubric || rubric.contains(target));
  }
  function updateReading(item) {
    if (!answer || printing) return;
    var wasReading = reading;
    reading =
      keyboardReading ||
      items.some(function (criterion) {
        return criterion.open;
      }) ||
      Boolean(linkedCriterion(hashTarget(location.hash)));
    if (
      reading &&
      !wasReading &&
      answer.classList.contains("next-answer-active")
    )
      resumeProgress = answerProgress;
    measure();
    // Native disclosures remain the reading interface. Do not re-pin a closed
    // panel until keyboard focus leaves it. Pointer close restores the scene.
    if (!reading && wasReading && resumeProgress !== null) {
      if (answer.classList.contains("next-answer-active")) {
        // Re-pinning adds the scene's scroll travel back to the document.
        // Browser scroll anchoring otherwise follows the closed disclosure
        // past the sticky range. Restore the original visual progress instead.
        var bounds = answer.getBoundingClientRect();
        var top = parseFloat(getComputedStyle(stage).top);
        window.scrollTo({
          top:
            scrollY +
            bounds.top -
            top +
            resumeProgress * Math.max(1, bounds.height - stage.offsetHeight),
          behavior: "instant",
        });
      }
      resumeProgress = null;
    }
    if (reading && !wasReading && item) {
      requestAnimationFrame(function () {
        item.querySelector("summary").scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
      });
    }
  }
  function revealAnswerHash() {
    if (!answer || printing) return;
    var wasReading = reading;
    var target = hashTarget(location.hash);
    updateReading();
    // Fragment jumps bypass the decorative assembly. Reposition other native
    // targets too if restoring the scene changed the page's height above them.
    if (target && (linkedCriterion(target) || wasReading !== reading)) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }
  if (answer)
    rubric.addEventListener(
      "toggle",
      function (event) {
        updateReading(event.target.open ? event.target : null);
      },
      true,
    );
  if (answer)
    rubric.addEventListener("focusin", function (event) {
      keyboardReading = event.target.matches(":focus-visible");
      updateReading(event.target.closest(".criterion"));
    });
  if (answer) {
    rubric.addEventListener("focusout", function (event) {
      if (!rubric.contains(event.relatedTarget)) {
        var nextFocus = event.relatedTarget;
        keyboardReading = false;
        updateReading();
        // Keyboard focus outside the scene takes priority over its saved
        // progress. Re-pinning must not strand the newly focused control.
        requestAnimationFrame(function () {
          if (
            nextFocus &&
            document.activeElement === nextFocus &&
            nextFocus.matches(":focus-visible") &&
            !nextFocus.closest(".site-header")
          )
            nextFocus.scrollIntoView({ behavior: "instant", block: "nearest" });
        });
      }
    });
    window.addEventListener("hashchange", revealAnswerHash);
    window.addEventListener("load", revealAnswerHash);
    window.addEventListener("pageshow", revealAnswerHash);
    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[href^='#']");
      if (link && link.hash === location.hash) revealAnswerHash();
    });
  }
  function respectMotion() {
    root.classList.toggle("next-enabled", !motion.matches);
    if (motion.matches) {
      cards.forEach(function (card) {
        frame.removeStyle(card, "--next-depth");
      });
      clearAnswer();
    }
    measure();
  }
  window.addEventListener("scroll", queue, { passive: true });
  cells.forEach(function (cell) {
    frame.watch(cell, queue);
  });
  if (answer) frame.watch(answer, queue);
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  window.addEventListener("pageshow", measure);
  window.addEventListener("beforeprint", function () {
    printing = true;
  });
  window.addEventListener("afterprint", function () {
    printing = false;
    requestAnimationFrame(function () {
      updateReading();
      measure();
    });
  });
  document.addEventListener("visibilitychange", queue);
  if ("MutationObserver" in window) {
    var observer = new MutationObserver(measure);
    cards.forEach(function (card) {
      observer.observe(card, { attributes: true, attributeFilter: ["hidden"] });
    });
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(measure).observe(document.querySelector(".site-header"));
    new ResizeObserver(queue).observe(document.querySelector("main"));
  }
  if (document.fonts) document.fonts.ready.then(measure);
  motion.addEventListener("change", respectMotion);
  respectMotion();
  revealAnswerHash();
})();
