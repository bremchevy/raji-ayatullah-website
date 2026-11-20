(function () {
  "use strict";

  var cards = Array.from(document.querySelectorAll("#work-grid > article"));
  var search = document.getElementById("work-search");
  var filters = Array.from(document.querySelectorAll("[data-filter]"));
  var activeFilter = "all";
  var result = document.getElementById("work-result");
  var empty = document.getElementById("work-empty");

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

  // Only decorative dimension lines respond to scroll. Content is always visible.
  if ("IntersectionObserver" in window) {
    var sections = Array.from(document.querySelectorAll("main > section[id]"));
    var navLinks = Array.from(document.querySelectorAll(".site-header nav a"));
    var traceObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
            traceObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    document.documentElement.classList.add("traces-ready");
    document.querySelectorAll(".page-section").forEach(function (section) {
      traceObserver.observe(section);
    });
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
    if (printClosedDetails !== null) return;
    printClosedDetails = Array.from(
      document.querySelectorAll("details:not([open])"),
    );
    printClosedDetails.forEach(function (detail) {
      detail.open = true;
    });
  });
  window.addEventListener("afterprint", function () {
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
