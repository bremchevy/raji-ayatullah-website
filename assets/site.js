(function () {
  "use strict";

  var cards = Array.from(document.querySelectorAll("#work-grid > article"));
  var search = document.getElementById("work-search");
  var filters = Array.from(document.querySelectorAll("[data-filter]"));
  var activeFilter = "all";
  var result = document.getElementById("work-result");
  var empty = document.getElementById("work-empty");
  var previewVideos = Array.from(document.querySelectorAll(".project-video"));
  var previewMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var previewConnection = navigator.connection;
  var previewPaused =
    previewMotion.matches ||
    Boolean(previewConnection && previewConnection.saveData);
  var previewsPrinting = false;
  var previewObserver = null;

  function shouldPlayPreview(video) {
    return (
      !previewPaused &&
      !previewsPrinting &&
      !document.hidden &&
      video.dataset.inView === "true" &&
      video.dataset.blocked !== "true" &&
      video.dataset.failed !== "true" &&
      !video.closest("[hidden]")
    );
  }
  function syncPreviews() {
    previewVideos.forEach(function (video) {
      if (!shouldPlayPreview(video)) {
        video.pause();
        video.classList.add("poster-only");
        return;
      }
      // Keep video bytes off the initial page load and out of hidden cards.
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      video.muted = true;
      var playback = video.play();
      if (playback)
        playback.catch(function (error) {
          // Low Power Mode may block even muted autoplay. Keep the original
          // still image, never replace it with a Play overlay.
          if (error.name === "NotAllowedError") {
            video.dataset.blocked = "true";
            video.classList.add("poster-only");
          }
        });
    });
  }
  previewVideos.forEach(function (video) {
    video.muted = true;
    if (!("IntersectionObserver" in window)) video.dataset.inView = "true";
    video.addEventListener("playing", function () {
      // Safari can queue "playing" after rejecting play(), while still paused.
      if (!video.paused) delete video.dataset.blocked;
      if (!shouldPlayPreview(video)) video.pause();
      video.classList.toggle("poster-only", video.paused);
    });
    video.addEventListener("pause", function () {
      video.classList.add("poster-only");
    });
    video.addEventListener("error", function () {
      video.dataset.failed = "true";
      video.classList.add("poster-only");
    });
  });
  if ("IntersectionObserver" in window) {
    previewObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.dataset.inView = String(
            entry.isIntersecting && entry.intersectionRatio >= 0.15,
          );
        });
        syncPreviews();
      },
      { threshold: 0.15 },
    );
    previewVideos.forEach(function (video) {
      previewObserver.observe(video);
    });
  }
  document.addEventListener("visibilitychange", function () {
    // Retry once when returning from Settings (for example after Low Power
    // Mode is switched off), without an idle loop or a manual-play control.
    if (!document.hidden) {
      previewVideos.forEach(function (video) {
        delete video.dataset.blocked;
      });
    }
    syncPreviews();
  });
  function respectPreviewPreferences() {
    previewPaused =
      previewMotion.matches ||
      Boolean(previewConnection && previewConnection.saveData);
    syncPreviews();
  }
  previewMotion.addEventListener("change", respectPreviewPreferences);
  if (previewConnection && previewConnection.addEventListener) {
    previewConnection.addEventListener("change", respectPreviewPreferences);
  }

  function searchText(value) {
    return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }
  function filterWork() {
    var query = searchText(search.value);
    var count = 0;
    cards.forEach(function (card) {
      var matches =
        (activeFilter === "all" || card.dataset.kind === activeFilter) &&
        searchText(card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) count += 1;
    });
    filters.forEach(function (button) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === activeFilter),
      );
    });
    result.textContent = count + " of " + cards.length + " items";
    empty.hidden = count !== 0;
    syncPreviews();
  }
  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      filterWork();
    });
  });
  search.addEventListener("input", filterWork);
  document.getElementById("reset-work").addEventListener("click", function () {
    activeFilter = "all";
    search.value = "";
    filterWork();
    search.focus();
  });

  // Old shared links now lead into the same page, not a hidden perspective.
  var aliases = {
    gateway: "home",
    developer: "home",
    evaluator: "evidence",
    freelance: "services",
    overview: "home",
    "selected-work": "work",
    "paper-study-title": "work",
    projects: "work",
    "developer-work": "work",
    "freelance-work": "work",
    "free-work": "work",
    "eval-projects": "work",
    "developer-proof": "evidence",
    "eval-proof": "evidence",
    "free-proof": "evidence",
    "eval-rubric": "criteria",
    rubric: "criteria",
    "free-services": "services",
    "free-process": "process",
    "free-contact": "contact",
    "eval-contact": "contact",
    "gh-contact": "contact",
    "developer-contact": "contact",
    "proof-title": "evidence",
    "case-spacel-title": "case-spacel",
    "case-evaluation-title": "case-ai-evaluation",
    "eval-method": "evaluation-method",
    "eval-exp": "experience",
    "eval-edu": "education",
    "eval-skills": "skills",
    "free-proj-spacel": "proj-spacel",
    "free-proj-aurelia": "proj-aurelia",
    "free-proj-pulse": "proj-pulse",
    "free-proj-nomad-eats": "proj-nomad-eats",
    "free-proj-mindgarden": "proj-mindgarden",
    "proj-eval-framework": "proj-evaluation",
    "proj-ai-web-apps": "proj-ai-apps",
    "proj-mvp-builds": "proj-mvps",
    "proj-uiux-designs": "proj-design",
  };
  function revealHash() {
    var key;
    try {
      key = decodeURIComponent(location.hash.slice(1));
    } catch (_) {
      return;
    }
    if (!key) return;
    var target = document.getElementById(aliases[key] || key);
    if (!target) return;
    var changed = false;
    for (var element = target; element; element = element.parentElement) {
      if (element.tagName === "DETAILS" && !element.open) {
        element.open = true;
        changed = true;
      }
    }
    if (aliases[key] || changed) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }
  window.addEventListener("hashchange", revealHash);
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href^='#']");
    if (link && link.hash === location.hash) revealHash();
  });
  revealHash();

  // Blueprint ink follows scroll in both directions. Content never waits for it.
  var blueprintTargets = Array.from(
    document.querySelectorAll(".section-heading, #work-grid > article"),
  );
  var blueprintFrame = 0;
  var blueprintInk = "http://www.w3.org/2000/svg";
  cards.forEach(function (card) {
    var frame = document.createElementNS(blueprintInk, "svg");
    frame.setAttribute("class", "blueprint-frame");
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("focusable", "false");
    var outline = document.createElementNS(blueprintInk, "rect");
    // Use viewport units, not a stretched viewBox: normalized dashes must
    // follow the rendered perimeter even on very wide or tall cards.
    outline.setAttribute("width", "100%");
    outline.setAttribute("height", "100%");
    outline.setAttribute("pathLength", "1");
    frame.appendChild(outline);
    card.appendChild(frame);
  });

  function drawBlueprints() {
    blueprintFrame = 0;
    if (previewMotion.matches || document.hidden) return;
    var viewport = window.innerHeight;
    // Batch layout reads before updating ink; no work runs while scroll is idle.
    var positions = blueprintTargets.map(function (target) {
      return target.getBoundingClientRect();
    });
    blueprintTargets.forEach(function (target, index) {
      var bounds = positions[index];
      if (!bounds.width || !bounds.height) return;
      var progress = Math.max(
        0,
        Math.min(1, (viewport * 0.9 - bounds.top) / (viewport * 0.55)),
      ).toFixed(3);
      if (target.style.getPropertyValue("--blueprint-progress") !== progress)
        target.style.setProperty("--blueprint-progress", progress);
    });
  }
  function queueBlueprintDraw() {
    if (!previewMotion.matches && !document.hidden && !blueprintFrame)
      blueprintFrame = requestAnimationFrame(drawBlueprints);
  }
  function respectBlueprintMotion() {
    // Without JS, or with reduced motion, every line is already fully drawn.
    document.documentElement.classList.toggle(
      "blueprint-ready",
      !previewMotion.matches,
    );
    drawBlueprints();
  }
  window.addEventListener("scroll", queueBlueprintDraw, { passive: true });
  window.addEventListener("resize", queueBlueprintDraw);
  window.addEventListener("load", queueBlueprintDraw);
  window.addEventListener("afterprint", queueBlueprintDraw);
  document.addEventListener("visibilitychange", queueBlueprintDraw);
  document.addEventListener("toggle", queueBlueprintDraw, true);
  // Filtering and opening records can move sections without a scroll event.
  if ("ResizeObserver" in window) {
    new ResizeObserver(queueBlueprintDraw).observe(
      document.querySelector("main"),
    );
  }
  if ("MutationObserver" in window) {
    new MutationObserver(queueBlueprintDraw).observe(
      document.getElementById("work-grid"),
      { subtree: true, attributes: true, attributeFilter: ["hidden"] },
    );
  }
  if (document.fonts) document.fonts.ready.then(queueBlueprintDraw);
  if (previewMotion.addEventListener)
    previewMotion.addEventListener("change", respectBlueprintMotion);
  else previewMotion.addListener(respectBlueprintMotion);
  respectBlueprintMotion();

  // Navigation visibility is independent of the decorative drawing.
  if ("IntersectionObserver" in window) {
    var sections = Array.from(document.querySelectorAll("main > section[id]"));
    var navLinks = Array.from(document.querySelectorAll(".site-header nav a"));
    var visible = new Map();
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible.set(entry.target.id, entry.isIntersecting);
        });
        var current = sections.find(function (section) {
          return visible.get(section.id);
        });
        navLinks.forEach(function (link) {
          if (current && link.hash === "#" + current.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  var toast = document.getElementById("toast");
  var toastTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toastTimer = setTimeout(function () {
      toast.textContent = "";
    }, 6000);
  }
  function fallbackCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:-9999px";
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (_) {
      /* Report failure below. */
    }
    field.remove();
    return copied;
  }
  document
    .getElementById("copy-email")
    .addEventListener("click", async function () {
      var button = this;
      var copied = false;
      button.disabled = true;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText("bremchevy@gmail.com");
          copied = true;
        } else copied = fallbackCopy("bremchevy@gmail.com");
      } catch (_) {
        copied = fallbackCopy("bremchevy@gmail.com");
      } finally {
        button.disabled = false;
        button.focus({ preventScroll: true });
      }
      notify(
        copied ? "Email copied." : "Couldn’t copy. Email: bremchevy@gmail.com",
      );
    });

  // Print the full record, then restore the reader's exact disclosure state.
  var printClosedDetails = null;
  window.addEventListener("beforeprint", function () {
    previewsPrinting = true;
    syncPreviews();
    if (printClosedDetails !== null) return;
    printClosedDetails = Array.from(
      document.querySelectorAll("details:not([open])"),
    );
    printClosedDetails.forEach(function (detail) {
      detail.open = true;
    });
  });
  window.addEventListener("afterprint", function () {
    previewsPrinting = false;
    syncPreviews();
    if (printClosedDetails === null) return;
    printClosedDetails.forEach(function (detail) {
      detail.open = false;
    });
    printClosedDetails = null;
  });

  // Browsers can restore form values on history navigation; keep the grid in sync.
  window.addEventListener("pageshow", filterWork);
  filterWork();
})();
