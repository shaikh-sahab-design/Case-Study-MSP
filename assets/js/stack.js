/* Scroll stack across all slides.
   Each slide scrolls through fully, then sticks once its bottom reaches the
   bottom of the screen. The next slide slides up over it while the stuck
   slide shrinks to the base scale and dims.
   Settings: item distance 0px, stack distance 6px, stack position 12%,
   item scale 0, base scale 0.8, dim 0.15, blur 0, tilt 0, rotation 0,
   smooth scroll on, snap on. */
(function () {
  "use strict";
  var S = {
    stackDistance: 6,     // px each stuck slide drops per level
    stackPosition: 0.12,  // where on screen the stuck slide shrinks towards
    itemScale: 0,         // extra scale per stack level
    baseScale: 0.8,
    dim: 0.15,
    blur: 0,
    rotation: 0,
    smooth: true,
    snap: true
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var root = document.documentElement;
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  if (slides.length < 2) return;
  root.classList.add("stack");

  slides.forEach(function (s, i) {
    s.style.zIndex = i + 1;
    var v = document.createElement("div");
    v.className = "stack-dim";
    v.setAttribute("aria-hidden", "true");
    s.appendChild(v);
  });

  // Zero-height marker where the first slide starts in the page flow
  var anchor = document.createElement("div");
  anchor.setAttribute("aria-hidden", "true");
  slides[0].parentNode.insertBefore(anchor, slides[0]);
  var vh = 0, tops = [], heights = [];
  function measure() {
    vh = window.innerHeight;
    var y = anchor.getBoundingClientRect().top + window.scrollY;
    slides.forEach(function (s, i) {
      var h = s.offsetHeight;
      heights[i] = h;
      tops[i] = y;
      y += h;
      // Stick only once the slide's bottom meets the bottom of the screen
      s.style.top = Math.min(0, vh - h) + "px";
    });
    update();
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function update() {
    var y = window.scrollY;
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var h = heights[i];
      var stickAt = tops[i] + Math.max(0, h - vh);  // scroll position where it sticks
      var depth = 0, p = 0;
      // How far later slides have covered this one
      for (var j = i + 1; j < slides.length; j++) {
        var start = tops[j] - vh;                    // next slide begins entering
        var q = clamp((y - start) / vh);
        if (q <= 0) break;
        if (j === i + 1) p = q; else depth += q;
      }
      if (y < stickAt || p <= 0) {
        s.style.transform = "";
        s.style.filter = "";
        s.style.borderRadius = "";
        s.lastChild.style.opacity = 0;
        continue;
      }
      var scale = 1 - (1 - (S.baseScale + i * S.itemScale)) * p;
      var drop = (p + depth) * S.stackDistance;
      var originY = Math.max(0, h - vh) + vh * S.stackPosition;
      s.style.transformOrigin = "50% " + originY + "px";
      s.style.transform = "translate3d(0," + drop.toFixed(2) + "px,0) scale(" + scale.toFixed(4) + ")" +
        (S.rotation ? " rotate(" + S.rotation * p + "deg)" : "");
      s.style.borderRadius = (p * 28).toFixed(1) + "px";
      s.style.filter = S.blur ? "blur(" + (S.blur * p).toFixed(2) + "px)" : "";
      s.lastChild.style.opacity = (S.dim * Math.min(1, p + depth)).toFixed(3);
    }
  }

  // Smooth scroll
  var lenis = null;
  if (S.smooth && window.Lenis) {
    root.style.scrollBehavior = "auto";
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  function scrollTo(y) {
    if (lenis) lenis.scrollTo(y, { duration: 0.9 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  // Section links go to each slide's start, not its stuck position
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = slides.findIndex(function (s) { return "#" + s.id === a.getAttribute("href"); });
    if (i < 0) return;
    e.preventDefault();
    scrollTo(tops[i]);
    history.replaceState(null, "", "#" + slides[i].id);
  });

  // Snap: settle on the start of a slide, or on the bottom of a tall one
  var snapTimer = null, snapping = false;
  function snapPoints() {
    var pts = [];
    for (var i = 0; i < slides.length; i++) {
      pts.push(tops[i]);
      if (heights[i] > vh + 4) pts.push(tops[i] + heights[i] - vh);
    }
    return pts;
  }
  function trySnap() {
    if (!S.snap) return;
    var y = window.scrollY, best = null, dist = Infinity;
    snapPoints().forEach(function (p) {
      var d = Math.abs(p - y);
      if (d < dist) { dist = d; best = p; }
    });
    if (best === null || dist < 2 || dist > vh * 0.3) return;
    snapping = true;
    if (lenis) lenis.scrollTo(best, { duration: 0.6, onComplete: function () { snapping = false; } });
    else { window.scrollTo({ top: best, behavior: "smooth" }); setTimeout(function () { snapping = false; }, 700); }
  }

  function onScroll() {
    update();
    if (snapping) return;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(trySnap, 180);
  }
  if (lenis) lenis.on("scroll", onScroll);
  else window.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });

  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  if (location.hash) {
    var start = slides.findIndex(function (s) { return "#" + s.id === location.hash; });
    if (start > 0) window.scrollTo(0, tops[start]);
  }
})();
