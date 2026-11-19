(function () {
  var views = {
    gateway: document.getElementById("view-gateway"),
    developer: document.getElementById("view-developer"),
    evaluator: document.getElementById("view-evaluator"),
    freelance: document.getElementById("view-freelance"),
  };
  var current = "gateway";

  function showView(name, focus) {
    if (!Object.hasOwn(views, name)) name = "gateway";
    Object.keys(views).forEach(function (k) {
      views[k].hidden = k !== name;
    });
    current = name;
    document.body.setAttribute("data-view", name);
    var skip = document.querySelector(".skip-link");
    skip.href = {
      gateway: "#gateway-content",
      developer: "#overview",
      evaluator: "#eval-main",
      freelance: "#free-main",
    }[name];
    document.title =
      "Raji Ayatullah — " +
      {
        gateway: "Developer & AI Evaluation Specialist",
        developer: "Development & Selected Work",
        evaluator: "AI Evaluation Practice",
        freelance: "Freelance Product Development",
      }[name];
    if (focus) views[name].focus({ preventScroll: true });
    requestAnimationFrame(syncSections);
  }
  function go(name) {
    showView(name, true);
    history.pushState(
      { view: current },
      "",
      name === "gateway" ? location.pathname + location.search : "#" + name,
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(b.getAttribute("data-go"));
    });
  });
  function revealDestination(target) {
    var card = target.closest(".work-grid > article");
    if (card && card.hidden) {
      var controls = document.querySelector(
        '[data-work-controls="' + card.parentElement.id + '"]',
      );
      if (controls) controls.querySelector('[data-work-filter="all"]').click();
    }
    var disclosure = target.closest("details");
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement.closest("details");
    }
    target.classList.add("is-visible");
    var ancestor = target.parentElement;
    while (ancestor) {
      if (ancestor.classList.contains("reveal"))
        ancestor.classList.add("is-visible");
      ancestor = ancestor.parentElement;
    }
  }
  function restoreRoute() {
    var id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      id = "";
    }
    var target = document.getElementById(id);
    var v = target && target.closest('[id^="view-"]');
    var name = Object.hasOwn(views, id) ? id : v ? v.id.slice(5) : "gateway";
    showView(name, false);
    if (target) {
      revealDestination(target);
      requestAnimationFrame(function () {
        target.scrollIntoView();
      });
    } else window.scrollTo(0, 0);
  }
  window.addEventListener("popstate", restoreRoute);
  window.addEventListener("hashchange", restoreRoute);
  restoreRoute();

  var dev = document.getElementById("view-developer"),
    tBtn = document.getElementById("themeBtn"),
    tLabel = document.getElementById("themeLabel");
  function applyTheme(dark) {
    dev.setAttribute("data-theme", dark ? "dark" : "light");
    tLabel.textContent = dark ? "Dark" : "Light";
    tBtn.setAttribute("aria-pressed", String(dark));
    tBtn.setAttribute(
      "aria-label",
      "Switch to " + (dark ? "light" : "dark") + " theme",
    );
  }
  var preferred = null;
  try {
    preferred = localStorage.getItem("raji-theme");
  } catch (e) {}
  applyTheme(
    preferred
      ? preferred === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  tBtn.addEventListener("click", function () {
    var dark = dev.getAttribute("data-theme") !== "dark";
    applyTheme(dark);
    try {
      localStorage.setItem("raji-theme", dark ? "dark" : "light");
    } catch (e) {}
  });
  /* The same section/scroll feedback across all three perspectives. */
  var sectionNavs = Array.from(
    document.querySelectorAll(".gh-tabs, .eval-nav, .free-nav"),
  ).map(function (nav) {
    var header = nav.closest(".gh-sticky, .eval-header, .free-header");
    var track = document.createElement("div");
    track.className = "reading-progress";
    track.setAttribute("aria-hidden", "true");
    track.appendChild(document.createElement("span"));
    header.appendChild(track);
    return {
      nav: nav,
      header: header,
      view: nav.closest('[id^="view-"]'),
      progress: track.firstChild,
      links: Array.from(nav.querySelectorAll('a[href^="#"]')),
    };
  });
  function syncSections() {
    if (!sectionNavs) return;
    sectionNavs.forEach(function (item) {
      if (item.view.hidden) return;
      var offset = Math.ceil(item.header.getBoundingClientRect().height) + 24;
      document.documentElement.style.setProperty(
        "--section-offset",
        offset + "px",
      );
      var line = offset + 16;
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var active = null;
      item.links.forEach(function (link) {
        var target = document.getElementById(link.hash.slice(1));
        if (target && target.getBoundingClientRect().top <= line) active = link;
      });
      // Short final sections cannot always reach the sticky-header reading line.
      if (total > 0 && window.scrollY >= total - 2)
        active = item.links[item.links.length - 1];
      item.links.forEach(function (link) {
        link.classList.toggle("active", link === active);
        if (link === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      // Keep the current section visible in narrow, horizontally scrolling tabs.
      if (active && item.nav.scrollWidth > item.nav.clientWidth) {
        var navBounds = item.nav.getBoundingClientRect();
        var activeBounds = active.getBoundingClientRect();
        var shift =
          activeBounds.left < navBounds.left + 8
            ? activeBounds.left - navBounds.left - 8
            : activeBounds.right > navBounds.right - 8
              ? activeBounds.right - navBounds.right + 8
              : 0;
        if (shift) item.nav.scrollBy({ left: shift, behavior: "instant" });
      }
      item.progress.style.transform =
        "scaleX(" +
        (total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0) +
        ")";
    });
  }
  var scrollQueued = false;
  function queueSectionSync() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      syncSections();
    });
  }
  window.addEventListener("scroll", queueSectionSync, { passive: true });
  window.addEventListener("resize", queueSectionSync);
  document.addEventListener("toggle", queueSectionSync, true);
  if ("ResizeObserver" in window) {
    var headerObserver = new ResizeObserver(queueSectionSync);
    sectionNavs.forEach(function (item) {
      headerObserver.observe(item.header);
    });
  }
  syncSections();

  /* Real projects and capabilities remain distinct, without leaving the page. */
  document
    .querySelectorAll("[data-work-controls]")
    .forEach(function (controls) {
      var grid = document.getElementById(controls.dataset.workControls);
      var cards = Array.from(grid.children);
      var realProjects = [
        "proj-spacel",
        "proj-aurelia",
        "proj-pulse",
        "proj-nomad-eats",
        "proj-mindgarden",
      ];
      cards.forEach(function (card) {
        card.dataset.workKind =
          realProjects.includes(card.id) || card.id.startsWith("free-proj-")
            ? "project"
            : "capability";
      });
      var buttons = Array.from(controls.querySelectorAll("[data-work-filter]"));
      function filter(kind) {
        buttons.forEach(function (button) {
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.workFilter === kind),
          );
        });
        cards.forEach(function (card) {
          card.hidden = kind !== "all" && card.dataset.workKind !== kind;
        });
        var count = cards.filter(function (card) {
          return !card.hidden;
        }).length;
        controls.querySelector('[role="status"]').textContent =
          kind === "all"
            ? cards.filter(function (card) {
                return card.dataset.workKind === "project";
              }).length +
              " live projects · " +
              cards.filter(function (card) {
                return card.dataset.workKind === "capability";
              }).length +
              " capabilities"
            : count + (kind === "project" ? " live projects" : " capabilities");
        queueSectionSync();
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          filter(button.dataset.workFilter);
        });
      });
      controls.hidden = false;
      filter("all");
    });

  /* Progressive enhancement: content stays visible without observer support. */
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0 },
    );
    document
      .querySelectorAll(
        ".gh-container > section > .box, .gh-container .cta, .eval-sec, .free-sec, #free-work",
      )
      .forEach(function (section) {
        section.classList.add("reveal");
        revealObserver.observe(section);
      });
  }

  /* Printing includes content hidden only by interactive exploration. */
  var printState = null;
  window.addEventListener("beforeprint", function () {
    if (printState) return;
    printState = {
      details: Array.from(document.querySelectorAll("details")).map(
        function (el) {
          return { el: el, open: el.open };
        },
      ),
      cards: Array.from(document.querySelectorAll(".work-grid > article")).map(
        function (el) {
          return { el: el, hidden: el.hidden };
        },
      ),
    };
    printState.details.forEach(function (item) {
      item.el.open = true;
    });
    printState.cards.forEach(function (item) {
      item.el.hidden = false;
    });
  });
  window.addEventListener("afterprint", function () {
    if (!printState) return;
    printState.details.forEach(function (item) {
      item.el.open = item.open;
    });
    printState.cards.forEach(function (item) {
      item.el.hidden = item.hidden;
    });
    printState = null;
    queueSectionSync();
  });

  /* --- rubric (developer) --- */
  var rBtns = Array.prototype.slice.call(
      document.querySelectorAll("[data-rubric]"),
    ),
    rPanels = Array.prototype.slice.call(
      document.querySelectorAll("[data-panel]"),
    );
  rBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-rubric");
      rBtns.forEach(function (x) {
        x.setAttribute("aria-selected", x === b ? "true" : "false");
        x.tabIndex = x === b ? 0 : -1;
      });
      rPanels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== k;
      });
    });
  });

  /* Illustrative activity visualization and actual career workstreams. */
  (function () {
    var grid = document.getElementById("contribGrid"),
      monthsEl = document.getElementById("contribMonths"),
      totalEl = document.getElementById("contribTotal"),
      detail = document.getElementById("contribDetail"),
      tip = document.getElementById("contribTooltip"),
      wsRows = document.getElementById("wsRows");
    if (!grid || !detail || !tip) return;
    var pinned = null,
      tipTimer = null,
      lastPointer = "mouse";
    var MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var DAYS = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    function fmtDate(d) {
      return (
        DAYS[d.getDay()] +
        ", " +
        MONTHS[d.getMonth()] +
        " " +
        d.getDate() +
        ", " +
        d.getFullYear()
      );
    }
    function tracksFor(d) {
      var y = d.getFullYear(),
        list = ["Freelance AI & Technical", "Content Writing · Fiverr"];
      if (y >= 2021) list.push("Independent AI Research");
      if (y >= 2024 || (y === 2023 && d.getMonth() >= 6))
        list.push("AI Data Training & Evaluation");
      if (y >= 2026) list.push("Developer · Zynra Studio / spacel.app");
      return list;
    }
    function showTip(html, el) {
      tip.innerHTML = html;
      tip.hidden = false;
      var r = el.getBoundingClientRect(),
        tw = tip.offsetWidth,
        th = tip.offsetHeight;
      var x = r.left + r.width / 2;
      x = Math.max(tw / 2 + 8, Math.min(window.innerWidth - tw / 2 - 8, x));
      tip.style.left = x + "px";
      tip.style.top = Math.max(th + 14, r.top) + "px";
      requestAnimationFrame(function () {
        tip.classList.add("show");
      });
    }
    function hideTip() {
      if (tipTimer) {
        clearTimeout(tipTimer);
        tipTimer = null;
      }
      tip.classList.remove("show");
      tip.hidden = true;
    }
    function scheduleTipHide() {
      if (tipTimer) clearTimeout(tipTimer);
      tipTimer = setTimeout(hideTip, 1800);
    }
    function setDetail(title, sub, pin) {
      detail.innerHTML = "";
      var b = document.createElement("b");
      b.textContent = title;
      var s = document.createElement("span");
      s.className = "cd-sub";
      s.textContent = sub;
      detail.appendChild(b);
      detail.appendChild(s);
      detail.classList.toggle("is-pinned", !!pin);
    }
    function bindInteractive(el, getTitle, getSub) {
      function preview() {
        if (tipTimer) {
          clearTimeout(tipTimer);
          tipTimer = null;
        }
        showTip("<b>" + getTitle() + "</b><span>" + getSub() + "</span>", el);
        if (!pinned) setDetail(getTitle(), getSub(), false);
      }
      el.addEventListener("pointerdown", function (e) {
        lastPointer = e.pointerType || "mouse";
      });
      el.addEventListener("pointerenter", function (e) {
        if (
          e.pointerType &&
          e.pointerType !== "mouse" &&
          e.pointerType !== "pen"
        )
          return;
        preview();
      });
      el.addEventListener("focus", preview);
      el.addEventListener("pointerleave", function () {
        hideTip();
      });
      el.addEventListener("blur", hideTip);
      el.addEventListener("click", function () {
        if (pinned === el) {
          pinned = null;
          el.classList.remove("is-pinned");
          hideTip();
          setDetail(
            getTitle(),
            getSub() + " — unpinned. Click again to pin.",
            false,
          );
          return;
        }
        if (pinned) pinned.classList.remove("is-pinned");
        pinned = el;
        el.classList.add("is-pinned");
        setDetail(
          getTitle(),
          getSub() + " — pinned. Click it again to unpin.",
          true,
        );
        showTip("<b>" + getTitle() + "</b><span>" + getSub() + "</span>", el);
        if (lastPointer === "touch") scheduleTipHide();
      });
    }
    document.addEventListener("pointerdown", function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.closest(".contrib-cell,.ws-cell")) hideTip();
    });
    /* Build last 52 weeks, Sunday-aligned, ending today */
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end);
    start.setDate(start.getDate() - (52 * 7 - 1));
    var lastMonth = -1;
    for (var col = 0; col < 52; col++) {
      var colDate = new Date(start);
      colDate.setDate(colDate.getDate() + col * 7);
      var mSpan = document.createElement("span");
      if (colDate.getMonth() !== lastMonth) {
        mSpan.textContent = MONTHS[colDate.getMonth()];
        lastMonth = colDate.getMonth();
      }
      monthsEl.appendChild(mSpan);
      for (var row = 0; row < 7; row++) {
        (function (col, row) {
          var d = new Date(start);
          d.setDate(d.getDate() + col * 7 + row);
          var cell = document.createElement("button");
          cell.type = "button";
          cell.className = "contrib-cell";

          if (d > today) {
            cell.style.visibility = "hidden";
            cell.tabIndex = -1;
            cell.setAttribute("aria-hidden", "true");
            grid.appendChild(cell);
            return;
          }
          /* Deterministic pattern per date — busier on weekdays, busiest in the recent evaluation + building period */
          var seed =
            (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) *
              9301 +
            49297;
          var rnd = (seed % 233280) / 233280;
          var wd = d.getDay(),
            weekdayBoost = wd === 0 || wd === 6 ? -0.28 : 0.12;
          var recentBoost =
            d.getFullYear() >= 2026 ? 0.22 : d.getFullYear() >= 2025 ? 0.1 : 0;
          var score = rnd + weekdayBoost + recentBoost;
          var level =
            score < 0.28
              ? 0
              : score < 0.52
                ? 1
                : score < 0.72
                  ? 2
                  : score < 0.88
                    ? 3
                    : 4;
          cell.setAttribute("data-level", String(level));
          var tracks = tracksFor(d);
          var title = "Illustrative activity — " + fmtDate(d);
          var sub =
            "Example workstreams: " +
            tracks.join(" · ") +
            ". Not a measured daily record.";
          cell.setAttribute("aria-label", title + ". " + sub);
          bindInteractive(
            cell,
            function () {
              return title;
            },
            function () {
              return sub;
            },
          );
          grid.appendChild(cell);
        })(col, row);
      }
    }
    if (totalEl) totalEl.textContent = "Illustrative / last 12 months";
    window.addEventListener("scroll", hideTip, { passive: true });
    window.addEventListener("resize", hideTip);
    var contribScroller = document.querySelector(".contrib-scroll");
    if (contribScroller)
      contribScroller.addEventListener("scroll", hideTip, { passive: true });
    /* Workstreams by year — same tooltip / pin behaviour */
    var WS = [
      {
        name: "Freelance AI & Technical",
        period: "2020 — Present",
        from: 2020,
        level: 3,
        desc: "Full-stack web and app solutions, AI content evaluation, prompt engineering and research-backed fact-checking for clients.",
      },
      {
        name: "Content Writing · Fiverr",
        period: "Feb 2020 — Present",
        from: 2020,
        level: 2,
        desc: "High-calibre web content, proofreading and editing, with research to verify factual accuracy.",
      },
      {
        name: "Independent AI Research",
        period: "2021 — Present",
        from: 2021,
        level: 3,
        desc: "900+ hours of self-directed study, a personal evaluation framework, and written reports on model weaknesses.",
      },
      {
        name: "AI Data Training & Evaluation",
        period: "2024 — Present",
        from: 2024,
        level: 4,
        desc: "AI training, annotation, content evaluation, prompt-writing, research and QA for ChatGPT, Claude and Gemini — Outlier AI, Scale AI, Appen, OneForma and Test IO.",
      },
      {
        name: "Developer · Zynra / spacel.app",
        period: "2026 — Present",
        from: 2026,
        level: 4,
        desc: "Developer at Zynra Studio (from Jan 2026) and one of the main developers of spacel.app — its iOS and Android apps and its website.",
      },
    ];
    WS.forEach(function (ws, wi) {
      var rowEl = document.createElement("div");
      rowEl.className = "ws-row";
      var nm = document.createElement("div");
      nm.className = "ws-name";
      nm.textContent = ws.name;
      var per = document.createElement("span");
      per.textContent = ws.period;
      nm.appendChild(per);
      rowEl.appendChild(nm);
      var yrs = document.createElement("div");
      yrs.className = "ws-years";
      for (var y = 2020; y <= 2026; y++) {
        (function (y) {
          var active = y >= ws.from,
            lv = active ? ws.level : 0;
          var c = document.createElement("button");
          c.type = "button";
          c.className = "ws-cell";
          c.setAttribute("data-level", String(lv));
          c.textContent = String(y);
          var title = ws.name + " — " + y;
          var sub = active
            ? "Active · " + ws.period + ". " + ws.desc
            : "Not started yet — this track begins " + ws.from + ".";
          c.setAttribute("aria-label", title + ": " + sub);
          bindInteractive(
            c,
            function () {
              return title;
            },
            function () {
              return sub;
            },
          );
          yrs.appendChild(c);
        })(y);
      }
      rowEl.appendChild(yrs);
      wsRows.appendChild(rowEl);
    });
  })();

  /* Local portfolio search. No network requests or tracking. */
  var ghSearch = document.getElementById("ghSearch"),
    ghInput = document.getElementById("ghSearchInput"),
    ghResults = document.getElementById("ghSearchResults"),
    ghClear = document.getElementById("ghSearchClear"),
    ghKbd = document.getElementById("ghSearchKbd");
  var GH_ICONS = {
    repo: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.249.249 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25Z"/></svg>',
    role: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="5" r="3.2"/><path d="M2 14.5c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5Z"/></svg>',
    skill:
      '<svg viewBox="0 0 16 16" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1H8l7 7-6.5 6.5L1 7Zm4 .5a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 5 3Z"/></svg>',
    rubric:
      '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3h10v2H5Zm0 4h10v2H5Zm0 4h7v2H5ZM.9 4.6 0 3.7 1.5 2l1 1.1L4 1.5l.9.9L2.4 5.4Zm.2 4L.2 7.7 1.7 6l1 1.1L4.2 5.5l.9.9L2.6 9.4Zm.2 4-.9-.9L1.9 10l1 1.1 1.5-1.6.9.9-2.5 2.9Z"/></svg>',
    edu: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 2 0 6l8 4 8-4Zm-5.5 5.2V12c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5V7.2L8 9.7Z"/></svg>',
    cube: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1 15 5v6l-7 4-7-4V5Zm0 1.61L3.42 5 8 7.39 12.58 5ZM3 6.83v3.34l4 2.29V9.12Zm10 0-4 2.29v3.34l4-2.29Z"/></svg>',
    file: '<svg viewBox="0 0 16 16" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M4 .75A.75.75 0 0 1 4.75 0h4.5L13 3.75v11.5a.75.75 0 0 1-.75.75h-7.5A.75.75 0 0 1 4 15.25Zm5.5 1.69v2.81h2.81ZM5.5 1.5v13h6V6.75a.75.75 0 0 1-.75-.75H8.75a.75.75 0 0 1-.75-.75V1.5Z"/></svg>',
    mail: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1.75 2h12.5A1.75 1.75 0 0 1 16 3.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5A1.75 1.75 0 0 1 1.75 2Zm.72 1.5L8 8.06l5.53-4.56A.25.25 0 0 0 13.25 3.5H2.75a.25.25 0 0 0-.28 0Zm-.97 1.83v6.92c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.33L8.72 9.6a1 1 0 0 1-1.44 0Z"/></svg>',
    book: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/></svg>',
  };
  var SEARCH_INDEX = [
    {
      t: "Public evidence — live projects, code & criteria",
      s: "Freelance · Five live projects, four public repositories, eight criteria",
      k: "proof evidence public verifiable testimonials reviews live projects source code github repositories criteria framework",
      v: "freelance",
      g: "free-proof",
      c: "book",
    },
    {
      t: "Spacel — project study",
      s: "Case study · Development across iOS, Android and web",
      k: "case study spacel product development main core developer three 3 platforms mobile ios android website role scope",
      v: "developer",
      g: "case-spacel",
      c: "book",
    },
    {
      t: "AI evaluation — practice study",
      s: "Case study · Thousands of responses, five platforms, eight criteria",
      k: "case study ai evaluation outlier scale appen oneforma test io thousands responses rubric ranking comparison justification experience",
      v: "evaluator",
      g: "case-ai-evaluation",
      c: "book",
    },
    {
      t: "Overview — profile",
      s: "Section · Developer view",
      k: "overview readme summary profile about professional summary one profile two crafts",
      v: "developer",
      g: "overview",
      c: "book",
    },
    {
      t: "Download CV (PDF)",
      s: "File · PDF",
      k: "download cv resume pdf curriculum vitae",
      h: "assets/raji-ayatullah-cv.pdf",
      dl: true,
      sg: true,
      c: "file",
    },
    {
      t: "Contact — bremchevy@gmail.com",
      s: "Contact · Email",
      k: "contact email hire reach mail bremchevy gmail",
      h: "mailto:bremchevy@gmail.com",
      c: "mail",
    },
    {
      t: "spacel.app",
      s: "Pinned · Live site — spacel.app · iOS, Android & web — core developer",
      k: "spacel flagship ios android website mobile app core developer live site visit open spacel.app",
      v: "developer",
      g: "proj-spacel",
      sg: true,
      c: "repo",
    },
    {
      t: "ai-web-apps-and-automation",
      s: "Pinned repository · AI-powered web applications and automation tools",
      k: "ai web apps automation agents tools ai-powered applications",
      v: "developer",
      g: "proj-ai-web-apps",
      c: "repo",
    },
    {
      t: "scalable-mvp-builds",
      s: "Pinned repository · Scalable MVP builds — Next.js, Supabase, React",
      k: "scalable mvp builds next.js supabase react production delivery",
      v: "developer",
      g: "proj-mvp-builds",
      c: "repo",
    },
    {
      t: "ui-ux-product-designs",
      s: "Pinned repository · UI/UX-focused product designs",
      k: "ui ux product design designs performance retention prototyping",
      v: "developer",
      g: "proj-uiux-designs",
      c: "repo",
    },
    {
      t: "personal-ai-evaluation-framework",
      s: "Pinned repository · Rubric-based AI evaluation framework",
      k: "personal ai evaluation framework rubric ranking fact-checking qa responses",
      v: "developer",
      g: "proj-eval-framework",
      c: "repo",
    },
    {
      t: "Aurelia — AI Luxury Perfume Finder",
      s: "Pinned repository · Developer view · Live on Vercel",
      k: "aurelia perfume finder luxury fragrance scent aurelia-perfume-finder vercel live",
      v: "developer",
      g: "proj-aurelia",
      sg: true,
      c: "repo",
    },
    {
      t: "Pulse — Fitness Tracker",
      s: "Pinned repository · Developer view · Live on Vercel",
      k: "pulse fitness tracker workouts training progress pulse-fitness-tracker vercel live",
      v: "developer",
      g: "proj-pulse",
      sg: true,
      c: "repo",
    },
    {
      t: "Nomad Eats — Food Discovery",
      s: "Pinned repository · Developer view · Live on Vercel",
      k: "nomad eats food discovery restaurants dishes travelling nomad-eats-food-discovery vercel live",
      v: "developer",
      g: "proj-nomad-eats",
      sg: true,
      c: "repo",
    },
    {
      t: "MindGarden — AI Study Planner",
      s: "Pinned repository · Developer view · Live on Vercel",
      k: "mindgarden study planner ai tasks focus sessions revision mindgarden-study-planner vercel live",
      v: "developer",
      g: "proj-mindgarden",
      sg: true,
      c: "repo",
    },
    {
      t: "Aurelia — AI Luxury Perfume Finder",
      s: "Pinned project · AI Evaluator view · Live site",
      k: "aurelia perfume finder luxury fragrance scent vercel live evaluator pinned dossier",
      v: "evaluator",
      g: "eval-proj-aurelia",
      c: "repo",
    },
    {
      t: "Pulse — Fitness Tracker",
      s: "Pinned project · AI Evaluator view · Live site",
      k: "pulse fitness tracker workouts training vercel live evaluator pinned dossier",
      v: "evaluator",
      g: "eval-proj-pulse",
      c: "repo",
    },
    {
      t: "Nomad Eats — Food Discovery",
      s: "Pinned project · AI Evaluator view · Live site",
      k: "nomad eats food discovery restaurants vercel live evaluator pinned dossier",
      v: "evaluator",
      g: "eval-proj-nomad-eats",
      c: "repo",
    },
    {
      t: "MindGarden — AI Study Planner",
      s: "Pinned project · AI Evaluator view · Live site",
      k: "mindgarden study planner ai tasks focus vercel live evaluator pinned dossier",
      v: "evaluator",
      g: "eval-proj-mindgarden",
      c: "repo",
    },
    {
      t: "Aurelia — AI Luxury Perfume Finder",
      s: "Work · Freelance view · Live site",
      k: "aurelia perfume finder luxury fragrance scent vercel live freelance work studio",
      v: "freelance",
      g: "free-proj-aurelia",
      c: "repo",
    },
    {
      t: "Pulse — Fitness Tracker",
      s: "Work · Freelance view · Live site",
      k: "pulse fitness tracker workouts training vercel live freelance work studio",
      v: "freelance",
      g: "free-proj-pulse",
      c: "repo",
    },
    {
      t: "Nomad Eats — Food Discovery",
      s: "Work · Freelance view · Live site",
      k: "nomad eats food discovery restaurants vercel live freelance work studio",
      v: "freelance",
      g: "free-proj-nomad-eats",
      c: "repo",
    },
    {
      t: "MindGarden — AI Study Planner",
      s: "Work · Freelance view · Live site",
      k: "mindgarden study planner ai tasks focus vercel live freelance work studio",
      v: "freelance",
      g: "free-proj-mindgarden",
      c: "repo",
    },
    {
      t: "Developer — Zynra Studio",
      s: "Experience · Jan 2026 — Present",
      k: "zynra studio developer web products ai platforms ui ux mvps clients role job experience",
      v: "developer",
      g: "job-zynra",
      c: "role",
    },
    {
      t: "Developer — Spacel.app",
      s: "Experience · Core team",
      k: "spacel developer core team ios android apps website role job experience",
      v: "developer",
      g: "job-spacel",
      c: "role",
    },
    {
      t: "AI Data Trainer / Content Evaluator — Outlier AI · Scale AI · Appen · OneForma · Test IO",
      s: "Experience · 2024 — Present",
      k: "ai data trainer content evaluator outlier scale appen oneforma test io annotation prompt-writing research qa chatgpt claude gemini role job experience platforms",
      v: "developer",
      g: "job-trainer",
      c: "role",
    },
    {
      t: "AI Data Contributor — Outlier AI",
      s: "Experience · Jul 2024 — Present",
      k: "ai data contributor outlier rubrics side-by-side hallucinations reasoning failures justifications role job experience",
      v: "developer",
      g: "job-contributor",
      c: "role",
    },
    {
      t: "Freelance AI & Technical Digital Specialist — Self-Employed",
      s: "Experience · 2020 — Present",
      k: "freelance ai technical digital specialist self-employed prompt engineering fact-checked full-stack html css javascript react role job experience",
      v: "developer",
      g: "job-freelance",
      c: "role",
    },
    {
      t: "Independent AI Researcher & Systems Analyst — Self-Directed",
      s: "Experience · 2021 — Present",
      k: "independent ai researcher systems analyst self-directed 900 hours study evaluation framework model weaknesses role job experience",
      v: "developer",
      g: "job-researcher",
      c: "role",
    },
    {
      t: "Content Writer & Editor — Fiverr",
      s: "Experience · Feb 2020 — Present",
      k: "content writer editor fiverr web content proofreading editing research factual accuracy role job experience",
      v: "developer",
      g: "job-fiverr",
      c: "role",
    },
    {
      t: "React.js",
      s: "Skill · Development",
      k: "react react.js frontend javascript development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Next.js",
      s: "Skill · Development",
      k: "next next.js react framework development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Supabase",
      s: "Skill · Development",
      k: "supabase backend database development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "JavaScript",
      s: "Skill · Development",
      k: "javascript js development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "HTML & CSS",
      s: "Skill · Development",
      k: "html css development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Mobile apps — iOS & Android",
      s: "Skill · Development",
      k: "mobile apps ios android development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "APIs",
      s: "Skill · Development",
      k: "apis api integration development skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Response evaluation",
      s: "Skill · AI Evaluation",
      k: "response evaluation ai scoring rating skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Data annotation",
      s: "Skill · AI Evaluation",
      k: "data annotation labeling labelling skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Prompt writing & evaluation",
      s: "Skill · AI Evaluation",
      k: "prompt writing evaluation engineering skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Response ranking",
      s: "Skill · AI Evaluation",
      k: "response ranking comparison side-by-side skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Quality assurance (QA)",
      s: "Skill · AI Evaluation",
      k: "quality assurance qa testing skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Multimodal evaluation",
      s: "Skill · AI Evaluation",
      k: "multimodal image evaluation skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "AI systems & agents",
      s: "Skill · AI & Automation",
      k: "ai systems agents automation skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "UI/UX & product design",
      s: "Skill · Design",
      k: "ui ux product design prototyping skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Web3 apps",
      s: "Skill · Blockchain",
      k: "web3 blockchain apps smart contract skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Git",
      s: "Skill · Tools",
      k: "git version control github skill skills tools",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Cursor AI · Lovable AI · v0",
      s: "Skill · Tools",
      k: "cursor ai lovable ai v0 ai dev tools skill skills",
      v: "developer",
      g: "skills",
      c: "skill",
    },
    {
      t: "Rubric — Factual accuracy",
      s: "Evaluation rubric · Criterion 01 of 8",
      k: "rubric factual accuracy verified cross-referencing hallucinations misinformation unsupported claims criterion criteria",
      v: "developer",
      g: "rubric",
      r: "accuracy",
      c: "rubric",
    },
    {
      t: "Rubric — Instruction-following",
      s: "Evaluation rubric · Criterion 02 of 8",
      k: "rubric instruction following guidelines format scope constraints missed requirements criterion criteria",
      v: "developer",
      g: "rubric",
      r: "instruction",
      c: "rubric",
    },
    {
      t: "Rubric — Logical consistency",
      s: "Evaluation rubric · Criterion 03 of 8",
      k: "rubric logical consistency contradictions reasoning failures gaps criterion criteria",
      v: "developer",
      g: "rubric",
      r: "logic",
      c: "rubric",
    },
    {
      t: "Rubric — Communication quality",
      s: "Evaluation rubric · Criterion 04 of 8",
      k: "rubric communication quality clarity grammar tone criterion criteria",
      v: "developer",
      g: "rubric",
      r: "communication",
      c: "rubric",
    },
    {
      t: "Rubric — Reasoning quality",
      s: "Evaluation rubric · Criterion 05 of 8",
      k: "rubric reasoning quality chains steps conclusions side-by-side criterion criteria",
      v: "developer",
      g: "rubric",
      r: "reasoning",
      c: "rubric",
    },
    {
      t: "Rubric — Relevance",
      s: "Evaluation rubric · Criterion 06 of 8",
      k: "rubric relevance depth usefulness off-topic padded criterion criteria",
      v: "developer",
      g: "rubric",
      r: "relevance",
      c: "rubric",
    },
    {
      t: "Rubric — Completeness",
      s: "Evaluation rubric · Criterion 07 of 8",
      k: "rubric completeness multi-part unanswered stops short criterion criteria",
      v: "developer",
      g: "rubric",
      r: "completeness",
      c: "rubric",
    },
    {
      t: "Rubric — Safety",
      s: "Evaluation rubric · Criterion 08 of 8",
      k: "rubric safety guidelines breaches standing criterion criteria",
      v: "developer",
      g: "rubric",
      r: "safety",
      c: "rubric",
    },
    {
      t: "The rubric — eight inspections",
      s: "Section · AI Evaluator view",
      k: "rubric eight inspections evaluator dossier criteria factual accuracy safety method",
      v: "evaluator",
      g: "eval-rubric",
      c: "rubric",
    },
    {
      t: "How a verdict is reached — score, compare, justify",
      s: "Section · AI Evaluator view",
      k: "verdict method score compare rank justify evaluator steps process",
      v: "evaluator",
      g: "eval-method",
      c: "rubric",
    },
    {
      t: "B.Sc. Computer Science — University of Ibadan (2020)",
      s: "Education · First Class Honours",
      k: "bsc computer science university ibadan degree education first class honours distinction study 2020",
      v: "developer",
      g: "education",
      c: "edu",
    },
    {
      t: "Certifications — AI for Everyone, Google Cloud AI, Stanford ML & more",
      s: "Education · Certifications",
      k: "certifications ai for everyone coursera data annotation labeling udemy quality management qms google cloud ai stanford machine learning ibm data analytics aws machine learning foundations google digital marketing e-commerce education",
      v: "developer",
      g: "education",
      c: "edu",
    },
    {
      t: "Service — Full-stack web apps",
      s: "Services · Freelance view",
      k: "hire service full-stack web apps react next.js supabase apis html css javascript freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
    {
      t: "Service — Mobile apps",
      s: "Services · Freelance view",
      k: "hire service mobile apps ios android spacel freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
    {
      t: "Service — MVPs, fast",
      s: "Services · Freelance view",
      k: "hire service mvp rapid prototyping scalable delivery cursor lovable v0 freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
    {
      t: "Service — AI features & automation",
      s: "Services · Freelance view",
      k: "hire service ai features automation systems agents freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
    {
      t: "Service — UI/UX & product design",
      s: "Services · Freelance view",
      k: "hire service ui ux product design prototyping usability retention freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
    {
      t: "Service — AI evaluation for your product",
      s: "Services · Freelance view",
      k: "hire service ai evaluation product response ranking qa rubrics outlier scale appen freelance studio",
      v: "freelance",
      g: "free-services",
      c: "cube",
    },
  ];
  var ghActive = -1,
    ghCurrent = [];
  function ghCloseResults() {
    ghResults.hidden = true;
    ghInput.setAttribute("aria-expanded", "false");
    ghInput.removeAttribute("aria-activedescendant");
  }
  function ghEntryText(e) {
    return (e.t + " " + e.s + " " + e.k).toLowerCase();
  }
  function ghRunSearch(q) {
    q = (q || "").trim().toLowerCase();
    if (!q)
      return SEARCH_INDEX.filter(function (e) {
        return e.sg;
      });
    var toks = q.split(/\s+/),
      scored = [];
    SEARCH_INDEX.forEach(function (e, i) {
      var text = ghEntryText(e),
        ok = true;
      toks.forEach(function (tok) {
        if (text.indexOf(tok) === -1) ok = false;
      });
      if (!ok) return;
      var score = 0,
        title = e.t.toLowerCase();
      if (title.indexOf(q) === 0) score += 50;
      else if (title.indexOf(q) !== -1) score += 30;
      toks.forEach(function (tok) {
        if (title.indexOf(tok) !== -1) score += 10;
        if (e.k.toLowerCase().indexOf(tok) !== -1) score += 3;
      });
      scored.push({ e: e, score: score, i: i });
    });
    scored.sort(function (a, b) {
      return b.score - a.score || a.i - b.i;
    });
    return scored.slice(0, 10).map(function (x) {
      return x.e;
    });
  }
  function ghHighlight(el, text, q) {
    var query = (q || "").trim();
    if (!query) {
      el.textContent = text;
      return;
    }
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) {
      el.textContent = text;
      return;
    }
    el.appendChild(document.createTextNode(text.slice(0, idx)));
    var m = document.createElement("mark");
    m.textContent = text.slice(idx, idx + query.length);
    el.appendChild(m);
    el.appendChild(document.createTextNode(text.slice(idx + query.length)));
  }
  function ghMarkActive() {
    var btns = ghResults.querySelectorAll(".gh-result");
    Array.prototype.forEach.call(btns, function (b, i) {
      var on = i === ghActive;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.id = "search-option-" + i;
      if (on) ghInput.setAttribute("aria-activedescendant", b.id);
      if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest" });
    });
  }
  function ghRender() {
    var q = ghInput.value,
      res = ghRunSearch(q);
    ghCurrent = res;
    ghActive = res.length ? 0 : -1;
    ghResults.innerHTML = "";
    ghKbd.hidden = !!q;
    ghClear.hidden = !q;
    if (!res.length) {
      var d = document.createElement("div");
      d.className = "gh-no-results";
      var b = document.createElement("b");
      b.textContent = "No results found for \u201C" + q.trim() + "\u201D";
      var sp = document.createElement("span");
      sp.textContent =
        "Try a project (Aurelia, Pulse, spacel.app), a skill, a role, or a rubric criterion.";
      d.appendChild(b);
      d.appendChild(sp);
      ghResults.appendChild(d);
    } else {
      if (!q.trim()) {
        var h = document.createElement("div");
        h.className = "gh-results-head";
        h.textContent = "Suggested";
        ghResults.appendChild(h);
      }
      res.forEach(function (e, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gh-result";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", i === ghActive ? "true" : "false");
        var ic = document.createElement("span");
        ic.className = "gh-result-ic";
        ic.innerHTML = GH_ICONS[e.c] || GH_ICONS.book;
        var main = document.createElement("span");
        main.className = "gh-result-main";
        var tt = document.createElement("span");
        tt.className = "gh-result-title";
        ghHighlight(tt, e.t, q);
        var ss = document.createElement("span");
        ss.className = "gh-result-sub";
        ss.textContent = e.s;
        main.appendChild(tt);
        main.appendChild(ss);
        var key = document.createElement("span");
        key.className = "gh-result-key";
        key.textContent = "\u21B5";
        btn.appendChild(ic);
        btn.appendChild(main);
        btn.appendChild(key);
        btn.addEventListener("click", function () {
          ghGo(e);
        });
        btn.addEventListener("mousemove", function () {
          if (ghActive !== i) {
            ghActive = i;
            ghMarkActive();
          }
        });
        ghResults.appendChild(btn);
      });
      ghMarkActive();
    }
    ghResults.hidden = false;
    ghInput.setAttribute("aria-expanded", "true");
  }
  function ghFlash(el) {
    if (!el) return;
    el.classList.remove("search-hit");
    void el.offsetWidth;
    el.classList.add("search-hit");
    setTimeout(function () {
      el.classList.remove("search-hit");
    }, 2200);
  }
  function ghGo(e) {
    ghCloseResults();
    if (e.h) {
      var a = document.createElement("a");
      a.href = e.h;
      if (e.dl) a.setAttribute("download", "raji-ayatullah-cv.pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (e.dl) {
        ghInput.value = "";
        ghKbd.hidden = false;
        ghClear.hidden = true;
      }
      ghInput.blur();
      return;
    }
    var switched = e.v && e.v !== current;
    if (switched) go(e.v);
    setTimeout(
      function () {
        if (e.r) {
          var rb = document.querySelector('[data-rubric="' + e.r + '"]');
          if (rb) rb.click();
        }
        var el = e.g ? document.getElementById(e.g) : null;
        if (el) {
          revealDestination(el);
          syncSections();
          if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
          el.focus({ preventScroll: true });
          el.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          });
          ghFlash(el);
        }
        ghInput.blur();
      },
      switched ? 160 : 0,
    );
  }
  ghInput.addEventListener("input", ghRender);
  ghInput.addEventListener("focus", ghRender);
  ghInput.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      if (ghResults.hidden) ghRender();
      if (ghCurrent.length) {
        ghActive = (ghActive + 1) % ghCurrent.length;
        ghMarkActive();
      }
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      if (ghCurrent.length) {
        ghActive = (ghActive - 1 + ghCurrent.length) % ghCurrent.length;
        ghMarkActive();
      }
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      var e = ghCurrent[ghActive] || ghCurrent[0];
      if (e) ghGo(e);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      ghCloseResults();
      ghInput.blur();
    }
  });
  ghClear.addEventListener("click", function () {
    ghInput.value = "";
    ghInput.focus();
    ghRender();
  });
  document.addEventListener("click", function (ev) {
    if (!ghSearch.contains(ev.target)) ghCloseResults();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      var t = ev.target,
        tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (t && t.isContentEditable)
      )
        return;
      ev.preventDefault();
      if (current !== "developer") {
        go("developer");
        setTimeout(function () {
          ghInput.focus();
        }, 90);
      } else {
        ghInput.focus();
      }
    }
    if (ev.key === "Escape" && !ghResults.hidden) ghCloseResults();
  });

  /* --- copy email + email links --- */
  var toast = document.getElementById("toast"),
    timer = null;
  function showToast(msg) {
    if (msg) toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  async function copyAddress() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText("bremchevy@gmail.com");
        return true;
      }
      var field = document.createElement("textarea");
      field.value = "bremchevy@gmail.com";
      field.className = "clipboard-field";
      document.body.appendChild(field);
      field.select();
      var copied = false;
      try {
        copied = document.execCommand("copy");
      } finally {
        field.remove();
      }
      return copied;
    } catch (e) {
      return false;
    }
  }
  document.querySelectorAll(".copyBtn").forEach(function (b) {
    b.addEventListener("click", async function () {
      var ok = await copyAddress();
      showToast(
        ok
          ? "Email copied — bremchevy@gmail.com"
          : "Could not copy. Select the address: bremchevy@gmail.com",
      );
    });
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener("click", function () {
      showToast(
        "Opening your email app. You can also copy the address on this page.",
      );
    });
  });

  rBtns.forEach(function (b, i) {
    b.addEventListener("keydown", function (e) {
      var n = i;
      if (e.key === "ArrowDown" || e.key === "ArrowRight")
        n = (i + 1) % rBtns.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        n = (i + rBtns.length - 1) % rBtns.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = rBtns.length - 1;
      else return;
      e.preventDefault();
      rBtns[n].click();
      rBtns[n].focus();
    });
  });
  // Roving focus keeps the activity visualization out of the main tab sequence.
  var cells = Array.from(
    document.querySelectorAll(".contrib-cell:not([aria-hidden])"),
  );
  cells.forEach(function (c, i) {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener("keydown", function (e) {
      var n = i;
      if (e.key === "ArrowRight") n = i + 7;
      else if (e.key === "ArrowLeft") n = i - 7;
      else if (e.key === "ArrowDown") n = i + 1;
      else if (e.key === "ArrowUp") n = i - 1;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = cells.length - 1;
      else return;
      e.preventDefault();
      n = Math.max(0, Math.min(cells.length - 1, n));
      cells.forEach(function (x) {
        x.tabIndex = -1;
      });
      cells[n].tabIndex = 0;
      cells[n].focus();
    });
  });
  function tick() {
    var clock = document.getElementById("gwClock");
    if (clock)
      clock.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      }).format(new Date());
  }
  tick();
  setInterval(tick, 60000);

  /* A paper study, not a second navigation system. All motion is finite and
     input-led; a still, foldable illustration replaces flight for reduced motion. */
  (function initPaperBird() {
    var stage = document.getElementById("paperBird");
    if (!stage) return;
    var intro = stage.closest(".gw-intro"),
      action = stage.querySelector("[data-bird-action]"),
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)"),
      finePointer = window.matchMedia("(hover: hover) and (pointer: fine)"),
      frame = 0,
      restTimer = 0,
      flightTimer = 0,
      visible = true,
      pointerX = 0,
      pointerY = 0;

    function updatePrompt() {
      var open = stage.classList.contains("is-open");
      action.textContent = reduced.matches ? "Spread wings" : "Let it fly";
      stage.setAttribute(
        "aria-label",
        reduced.matches
          ? "Spread wings — paper bird"
          : "Let it fly — paper bird",
      );
      if (reduced.matches) stage.setAttribute("aria-pressed", String(open));
      else stage.removeAttribute("aria-pressed");
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      clearTimeout(restTimer);
      clearTimeout(flightTimer);
      // Clearing transient motion must not undo a deliberate static wing toggle.
      stage.classList.remove("is-curious", "is-flying");
      ["--bird-x", "--bird-y", "--bird-lean", "--bird-wing"].forEach(
        function (key) {
          stage.style.removeProperty(key);
        },
      );
      updatePrompt();
    }

    function canMove() {
      return !reduced.matches && !document.hidden && visible;
    }

    function settleAttention() {
      if (
        !stage.classList.contains("is-flying") &&
        !stage.classList.contains("is-open")
      )
        reset();
    }

    function curious() {
      if (!canMove() || stage.classList.contains("is-flying")) return;
      stage.classList.add("is-curious");
      clearTimeout(restTimer);
      restTimer = setTimeout(reset, 5000);
    }

    function followPointer(event) {
      if (!canMove() || !finePointer.matches || event.pointerType === "touch")
        return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame || stage.classList.contains("is-flying")) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        if (!canMove()) return;
        var rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = Math.max(
            -1,
            Math.min(
              1,
              (pointerX - rect.left - rect.width / 2) / (rect.width / 2),
            ),
          ),
          y = Math.max(
            -1,
            Math.min(
              1,
              (pointerY - rect.top - rect.height / 2) / (rect.height / 2),
            ),
          );
        stage.style.setProperty("--bird-x", (x * 7).toFixed(2) + "px");
        stage.style.setProperty("--bird-y", (y * 3).toFixed(2) + "px");
        stage.style.setProperty("--bird-lean", (x * 4).toFixed(2) + "deg");
        stage.style.setProperty("--bird-wing", (y * 4).toFixed(2) + "deg");
        curious();
      });
    }

    intro.addEventListener("pointermove", followPointer, { passive: true });
    intro.addEventListener("pointerleave", settleAttention);
    intro.addEventListener("focusin", curious);
    intro.addEventListener("focusout", function (event) {
      if (!intro.contains(event.relatedTarget)) settleAttention();
    });
    document.querySelectorAll(".gw-row").forEach(function (link) {
      link.addEventListener("pointerenter", function (event) {
        if (finePointer.matches && event.pointerType !== "touch") curious();
      });
      link.addEventListener("pointerleave", settleAttention);
      link.addEventListener("focus", curious);
      link.addEventListener("blur", settleAttention);
    });

    stage.addEventListener("click", function () {
      if (document.hidden) return;
      if (reduced.matches) {
        stage.classList.toggle("is-open");
        updatePrompt();
        return;
      }
      if (stage.classList.contains("is-flying")) return;
      reset();
      stage.classList.add("is-flying");
      // Also settle if a browser suppresses animationend during a route change.
      flightTimer = setTimeout(reset, 1550);
    });
    stage.addEventListener("animationend", function (event) {
      if (event.animationName === "paper-flight") reset();
    });
    reduced.addEventListener("change", function () {
      stage.classList.remove("is-open");
      reset();
    });
    finePointer.addEventListener("change", reset);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) reset();
    });
    window.addEventListener("pagehide", reset);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (!visible) reset();
        },
        { threshold: 0.05 },
      ).observe(stage);
    }
    updatePrompt();
    stage.disabled = false;
  })();

  document.addEventListener("keydown", function (e) {
    if (
      current !== "gateway" ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.target.closest("input,textarea,select,[contenteditable]")
    )
      return;
    var dest = { 1: "developer", 2: "evaluator", 3: "freelance" }[e.key];
    if (dest) {
      e.preventDefault();
      go(dest);
    }
  });
})();
