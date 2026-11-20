(function () {
  "use strict";
  var root = document.documentElement;
  var modes = (root.dataset.moreDemo || "").split(/\s+/);
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var api = window.portfolioMotion;
  // Without the site's scheduler, leave the original static content intact.
  if (!api) return;
  var printing = false;
  var header = document.querySelector(".site-header");
  var selectors = {
    "stats-dimensions": ".stats",
    "evidence-deal": "#evidence",
    "contact-ink": "#contact",
    "closing-mark": ".site-footer",
  };
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  // Offset coordinates exclude the very transforms this scene is animating.
  function progress(el) {
    var top = 0, node = el;
    do { top += node.offsetTop || 0; node = node.offsetParent; } while (node);
    return clamp((innerHeight * .9 - (top - scrollY)) / (innerHeight * .65));
  }
  modes.filter(function (mode, i) {
    return selectors[mode] && modes.indexOf(mode) === i;
  }).forEach(function (mode) {
    var target = document.querySelector(selectors[mode]);
    if (!target) return;
    var enabled = false, queued = false, geometryDirty = true;
    var items = [], countStart = null;
    if (mode === "stats-dimensions") {
      items = Array.from(target.querySelectorAll("strong")).map(function (strong) {
        var node = strong.firstChild, text = node.textContent;
        var original = document.createElement("span"), number = document.createElement("span");
        original.className = "more-original";
        original.textContent = text;
        number.className = "more-number";
        number.setAttribute("aria-hidden", "true");
        number.textContent = text;
        node.replaceWith(original, number);
        return { el: number, value: parseInt(text, 10), suffix: text.includes("+") ? "+" : "" };
      });
      var scene = document.createElement("div");
      scene.className = "more-stats-scene";
      target.before(scene);
      scene.append(target);
      target = scene;
    } else if (mode === "evidence-deal") {
      items = Array.from(target.querySelectorAll(".proof-card"));
      target.classList.add("more-clip");
    } else if (mode === "closing-mark") {
      var closing = document.createElement("div");
      closing.className = "more-closing";
      closing.setAttribute("aria-hidden", "true");
      closing.innerHTML = '<div class="more-closing-stage"><p>END OF SHEET / RAJI AYATULLAH</p><svg viewBox="0 0 1000 320" focusable="false"><text x="0" y="260" font-size="285" textLength="960" lengthAdjust="spacingAndGlyphs">RAJI.</text></svg><p>ONE PERSON. EVERY PHASE.</p></div>';
      target.before(closing);
      target = closing;
    }
    target.classList.add("more-target");
    function read(now) {
      queued = false;
      if (!enabled || document.hidden) return null;
      var frame = { styles: [], texts: [], again: false };
      function style(el, prop, value) { frame.styles.push([el, prop, String(value)]); }
      function transform(el, value) { style(el, "transform", value); }
      // Fit checks run on geometry changes, even offscreen, so a cold hash
      // cannot later acquire a different-length stats wrapper above it.
      if (geometryDirty) {
        geometryDirty = false;
        if (mode === "stats-dimensions" || mode === "closing-mark") {
          var top = (header ? header.offsetHeight : 0) + 16;
          style(target, "--more-top", top + "px");
          if (mode === "stats-dimensions")
            frame.statsFit = target.firstElementChild.offsetHeight + top + 16 <= innerHeight;
        }
      }
      if (!api.near(target)) return frame;
      var rect = target.getBoundingClientRect();
      if (rect.bottom < -innerHeight || rect.top > innerHeight * 2) return frame;
      var p = progress(target);
      if (mode === "stats-dimensions") {
        var plate = target.firstElementChild.getBoundingClientRect();
        if (plate.top >= innerHeight) countStart = null;
        if (plate.top < innerHeight && plate.bottom > 0 && countStart === null) countStart = now;
        p = countStart === null ? 0 : clamp((now - countStart) / 1000);
        frame.again = countStart !== null && p < 1 && plate.bottom > 0 && plate.top < innerHeight;
        items.forEach(function (item) {
          frame.texts.push([item.el, String(Math.floor(item.value * (1 - Math.pow(1 - p, 3)))) + item.suffix]);
          transform(item.el, "translateY(" + ((1 - p) * 20) + "px)");
        });
      }
      if (mode === "contact-ink") p = clamp((innerHeight * .55 - rect.top) / (innerHeight * .3));
      style(target, "--more-p", p);
      if (mode === "evidence-deal") items.forEach(function (el, i) {
        if (!api.near(el)) return;
        var rest = 1 - progress(el);
        transform(el, "translate3d(" + ((i % 2 ? 1 : -1) * rest * 65) + "px," + (rest * 110) + "px,0) rotate(" + ((i % 2 ? 1 : -1) * rest * 14) + "deg) scale(" + (1 - rest * .12) + ")");
      });
      if (mode === "contact-ink") transform(target.querySelector("h2"), "scale(" + (.8 + p * .2) + ")");
      if (mode === "closing-mark") {
        p = clamp((innerHeight * .85 - rect.top) / (innerHeight * .8));
        style(target, "--more-p", p);
        style(target, "--more-fill", clamp((p - .65) / .35));
      }
      return frame;
    }
    function write(frame) {
      if (frame.statsFit !== undefined) target.classList.toggle("more-stats-static", !frame.statsFit);
      frame.styles.forEach(function (value) { api.style(value[0], value[1], value[2]); });
      frame.texts.forEach(function (value) { api.text(value[0], value[1]); });
      if (frame.again) queue();
    }
    function queue() { if (!queued) { queued = true; api.request(read, write); } }
    function invalidate() { geometryDirty = true; queue(); }
    function preferences() {
      enabled = !reduced.matches && !printing;
      root.classList.toggle("more-enabled", enabled);
      if (!enabled) {
        target.querySelectorAll("[style]").forEach(function (el) { api.removeStyle(el, "transform"); });
      }
      invalidate();
    }
    api.watch(target, queue);
    items.forEach(function (item) { api.watch(item.el || item, queue); });
    if (reduced.addEventListener) reduced.addEventListener("change", preferences);
    else reduced.addListener(preferences);
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", invalidate);
    addEventListener("pageshow", invalidate);
    document.addEventListener("visibilitychange", queue);
    // site.js already expands/restores disclosures and scroll for printing.
    addEventListener("beforeprint", function () { printing = true; preferences(); });
    addEventListener("afterprint", function () {
      printing = false;
      // Firefox may still expose print geometry within afterprint.
      requestAnimationFrame(preferences);
    });
    target.addEventListener("focusin", queue);
    target.addEventListener("focusout", queue);
    if ("ResizeObserver" in window) {
      var observer = new ResizeObserver(invalidate);
      observer.observe(mode === "stats-dimensions" ? target.firstElementChild : target);
      if (header && (mode === "stats-dimensions" || mode === "closing-mark")) observer.observe(header);
    }
    if (document.fonts) document.fonts.ready.then(invalidate);
    preferences();
  });
})();
