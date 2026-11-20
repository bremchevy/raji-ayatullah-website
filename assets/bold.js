(function () {
  "use strict";

  var root = document.documentElement;
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var header = document.querySelector(".site-header");
  var main = document.querySelector("main");
  var home = document.getElementById("home");
  var deck = document.querySelector(".services");
  var serviceCards = Array.from(deck.children);
  var deckHold = 0.65;
  var headerHeight = 68;
  var deckLength = 1;
  var ticking = false;
  var lastY = scrollY;
  var lastTime = performance.now();
  var velocity = 0;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function progress(bounds, top, distance) {
    return clamp((top - bounds.top) / Math.max(1, distance), 0, 1);
  }

  // A decorative prologue, outside main: Skip to content and #home bypass it.
  var hero = element("div", "bold-hero");
  var stage = element("div", "bold-hero-stage");
  stage.setAttribute("aria-hidden", "true");
  var meta = element("div", "bold-hero-meta");
  meta.append(
    element("span", "", "RA / INDEPENDENT DEVELOPER"),
    element("span", "", "SCROLL TO ENTER ↓"),
  );
  var heroType = element("div", "bold-hero-type", "RAJI.");
  var after = element("div", "bold-hero-after");
  after.append(
    element("span", "", "01 / THROUGH THE BLUEPRINT"),
    element("strong", "", "Ideas. Built. Shipped."),
    element("span", "", "RAJI AYATULLAH / SELECTED WORK ↓"),
  );
  stage.append(
    meta,
    heroType,
    element("div", "bold-hero-meta", "PRODUCT ENGINEERING × AI EVALUATION"),
    after,
  );
  var skip = element("a", "bold-skip", "Skip intro ↘");
  skip.href = "#home";
  hero.append(skip, stage);
  main.before(hero);

  var deckStage = element("div", "bold-deck-stage");
  serviceCards.forEach(function (card, index) {
    card.style.zIndex = index + 1;
    deckStage.append(card);
  });
  deck.append(deckStage);

  var marquee = element("div", "bold-marquee");
  marquee.setAttribute("aria-hidden", "true");
  var marqueeStage = element("div", "bold-marquee-stage");
  marqueeStage.append(
    element(
      "div",
      "bold-marquee-label",
      "RA / PRACTICE IN MOTION — SCROLL TO ACCELERATE",
    ),
  );
  var terms = [
    "FULL-STACK / MOBILE / ",
    "AI SYSTEMS / EVALUATION / ",
    "DESIGN / BUILD / SHIP / ",
  ];
  var marqueeLines = terms.map(function (text) {
    var line = element("div", "bold-marquee-line");
    for (var index = 0; index < 4; index++)
      line.append(element("span", "", text));
    marqueeStage.append(line);
    return line;
  });
  marqueeStage.append(
    element("div", "bold-marquee-foot", "ONE PERSON. EVERY PHASE. ↗"),
  );
  marquee.append(marqueeStage);
  document.getElementById("process").before(marquee);

  function measure() {
    if (motion.matches) return;
    headerHeight = Math.ceil(header.getBoundingClientRect().height);
    root.style.setProperty("--motion-header", headerHeight + "px");
    // Match the stages' stable 100svh, not innerHeight: Safari toolbar changes
    // must not resize earlier scenes and move a native hash target mid-scroll.
    var viewportHeight = stage.offsetHeight + headerHeight;
    hero.style.setProperty(
      "--hero-travel",
      Math.max(900, viewportHeight * 2.75) + "px",
    );
    marquee.style.setProperty(
      "--marquee-travel",
      Math.max(900, viewportHeight * 2.15) + "px",
    );

    // Never clip real service copy to fit a scene. Short landscapes and large
    // text/zoom use the original readable grid instead of the pinned deck.
    deck.classList.toggle("deck-active", viewportHeight - headerHeight >= 500);
    if (deck.classList.contains("deck-active")) {
      var fits = serviceCards.every(function (card) {
        return card.scrollHeight <= card.clientHeight + 1;
      });
      deck.classList.toggle("deck-active", fits);
    }
    deckLength = (serviceCards.length - 1 + deckHold) * viewportHeight * 0.8;
    deck.style.setProperty(
      "--deck-travel",
      deckLength + deckStage.clientHeight + "px",
    );
    queue();
  }

  function draw(now) {
    ticking = false;
    if (motion.matches || document.hidden) return;
    var y = scrollY;
    var dt = Math.max(16, now - lastTime);
    var speed = clamp(((y - lastY) / dt) * 1000, -4500, 4500);
    velocity += (speed - velocity) * 0.22;
    lastY = y;
    lastTime = now;

    // Read geometry before writing transforms. No work continues while idle.
    var heroBounds = hero.getBoundingClientRect();
    var deckBounds = deck.getBoundingClientRect();
    var marqueeBounds = marquee.getBoundingClientRect();
    var stageHeight = stage.offsetHeight;
    var deckHeight = deckStage.clientHeight;
    var marqueeHeight = marqueeStage.offsetHeight;
    var unitWidths = marqueeLines.map(function (line) {
      return line.firstElementChild.offsetWidth;
    });
    var hp = progress(
      heroBounds,
      headerHeight,
      heroBounds.height - stageHeight,
    );
    heroType.style.transform =
      "scale(" + (1 + hp * hp * 32) + ") rotate(" + -hp * 6 + "deg)";
    after.style.transform =
      "translateY(" + 110 * (1 - clamp((hp - 0.68) / 0.32, 0, 1)) + "%)";
    if (deck.classList.contains("deck-active")) {
      // Hold each complete card for most of its step, including the last card.
      // Only the short eased interval between holds may overlap its copy.
      var segment =
        progress(deckBounds, headerHeight + 36, deckLength) *
        (serviceCards.length - 1 + deckHold);
      var current = Math.floor(segment);
      var transition = clamp(
        (segment - current - deckHold) / (1 - deckHold),
        0,
        1,
      );
      var eased = transition * transition * (3 - 2 * transition);
      var dp = Math.min(serviceCards.length - 1, current + eased);
      serviceCards.forEach(function (card, index) {
        var incoming = Math.max(0, index - dp);
        var passed = Math.min(Math.max(0, dp - index), 4);
        var offset = incoming * (deckHeight + 20) - passed * 16;
        card.style.setProperty(
          "--card-transform",
          "translate3d(0," +
            offset +
            "px,0) scale(" +
            (1 - passed * 0.065) +
            ") rotate(" +
            -passed * 1.2 +
            "deg)",
        );
      });
    } else {
      serviceCards.forEach(function (card) {
        card.style.removeProperty("--card-transform");
      });
    }
    var mp = progress(
      marqueeBounds,
      headerHeight + 4,
      marqueeBounds.height - marqueeHeight,
    );
    marqueeLines.forEach(function (line, index) {
      // Wrap identical spans, never pan past the beginning into an empty belt.
      var width = unitWidths[index] || 1;
      var travel = (index % 2 ? 1 : -1) * mp * innerWidth * 3;
      var x = -width + (((travel % width) + width) % width);
      line.style.transform =
        "translate3d(" +
        x +
        "px,0,0) skewX(" +
        clamp(-velocity / 30, -16, 16) +
        "deg)";
    });
    if (
      Math.abs(velocity) > 4 &&
      marqueeBounds.top < innerHeight &&
      marqueeBounds.bottom > headerHeight
    )
      queue();
  }
  function queue() {
    if (!motion.matches && !document.hidden && !ticking) {
      ticking = true;
      requestAnimationFrame(draw);
    }
  }
  function respectMotion() {
    root.classList.toggle("bold-enabled", !motion.matches);
    if (motion.matches) {
      deck.classList.remove("deck-active");
      serviceCards.forEach(function (card) {
        card.style.removeProperty("--card-transform");
      });
      home.classList.remove("signature-wait");
    } else {
      lastY = scrollY;
      lastTime = performance.now();
      velocity = 0;
      measure();
    }
  }
  if ("IntersectionObserver" in window) {
    home.classList.add("signature-wait");
    var signatureObserver = new IntersectionObserver(function (entries) {
      if (
        entries.some(function (entry) {
          return entry.isIntersecting;
        })
      ) {
        home.classList.remove("signature-wait");
        signatureObserver.disconnect();
      }
    });
    signatureObserver.observe(home);
  }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  window.addEventListener("pageshow", measure);
  window.addEventListener("afterprint", measure);
  document.addEventListener("visibilitychange", function () {
    lastY = scrollY;
    lastTime = performance.now();
    velocity = 0;
    queue();
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(measure).observe(header);
    new ResizeObserver(queue).observe(main);
  }
  if (document.fonts) document.fonts.ready.then(measure);
  motion.addEventListener("change", respectMotion);
  respectMotion();
})();
