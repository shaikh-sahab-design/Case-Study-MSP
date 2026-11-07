(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Stagger delays for child elements
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 90;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--d", i * step + "ms");
    });
  });
  document.querySelectorAll(".display").forEach(function (h) {
    h.querySelectorAll(".line > span").forEach(function (s, i) { s.style.setProperty("--d", 120 + i * 140 + "ms"); });
  });
  document.querySelectorAll(".stages .stage").forEach(function (s, i) {
    s.style.setProperty("--d", 250 + i * 220 + "ms");
    var dot = s.querySelector(".dot");
    if (dot) dot.style.setProperty("--d", 250 + i * 220 + "ms");
  });
  document.querySelectorAll(".days i").forEach(function (d, i) { d.style.setProperty("--d", i * 60 + "ms"); });
  document.querySelectorAll(".bar i").forEach(function (b, i) { b.parentNode.style.setProperty("--d", i * 140 + "ms"); });

  // Count-up numbers
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var fmt = function (n) { return Math.round(n).toLocaleString("en-US") + suffix; };
    if (reduce) { el.textContent = fmt(target); return; }
    var dur = target > 100 ? 1600 : 1100;
    var start = null;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = fmt(0);
    requestAnimationFrame(tick);
  }

  // Live page tiles light up one by one
  function lightTiles(wrap) {
    var tiles = wrap.querySelectorAll("span");
    tiles.forEach(function (t, i) {
      setTimeout(function () {
        t.classList.add("on", "flash");
        setTimeout(function () { t.classList.remove("flash"); }, 420);
      }, reduce ? 0 : 200 + i * 55);
    });
  }

  var targets = document.querySelectorAll("[data-reveal], [data-stagger], .display, .mrow, .stages, .timeline, .chart, .devices, [data-tiles], .num");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-tiles]").forEach(lightTiles);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add("in");
        if (el.classList.contains("num")) countUp(el);
        if (el.hasAttribute("data-tiles")) lightTiles(el);
        if (el.classList.contains("devices")) setTimeout(function () { el.classList.add("ready"); }, 1900);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Scroll progress, section dots
  var bar = document.querySelector(".progress span");
  var nav = document.querySelector(".dots");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  slides.forEach(function (s) {
    var a = document.createElement("a");
    a.href = "#" + s.id;
    a.innerHTML = "<span>" + (s.getAttribute("data-title") || s.id) + "</span>";
    a.setAttribute("aria-label", s.getAttribute("data-title") || s.id);
    nav.appendChild(a);
  });
  var links = nav.querySelectorAll("a");
  var ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    bar.style.transform = "scaleX(" + p + ")";
    var mid = window.innerHeight / 2, active = 0;
    slides.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) active = i; });
    links.forEach(function (l, i) { l.classList.toggle("on", i === active); });
    nav.classList.toggle("on-light", slides[active].classList.contains("light"));
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Pointer parallax on the cover devices
  var devices = document.querySelector("[data-parallax]");
  if (devices && !reduce && window.matchMedia("(pointer: fine)").matches) {
    var cover = document.querySelector(".cover");
    cover.addEventListener("pointermove", function (e) {
      if (!devices.classList.contains("ready")) return;
      var r = cover.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      devices.style.setProperty("--px", (x * 14).toFixed(2) + "px");
      devices.style.setProperty("--py", (y * 10).toFixed(2) + "px");
    });
    cover.addEventListener("pointerleave", function () {
      devices.style.setProperty("--px", "0px");
      devices.style.setProperty("--py", "0px");
    });
  }
})();
