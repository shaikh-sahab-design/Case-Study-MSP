/* Slide 05 live demo: the prompt types itself, the real Contact page fills in,
   Submit Inquiry blinks, then the real Thank You page plays its own animation.
   Replays from the button, and again each time the section comes back into view. */
(function () {
  "use strict";
  var demo = document.querySelector("[data-demo]");
  var promptBox = document.querySelector(".prompt-input");
  if (!demo || !promptBox) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var typed = promptBox.querySelector("[data-type]");
  var lines = Array.prototype.map.call(typed.querySelectorAll("p"), function (p) { return p.textContent; });
  var viewport = demo.querySelector(".viewport");
  var frame = viewport.querySelector("iframe");
  var veil = viewport.querySelector(".veil");
  var cursor = viewport.querySelector(".cursor");
  var urlBox = demo.querySelector(".url");
  var urlText = demo.querySelector(".url-text");
  var steps = demo.querySelectorAll(".steps li");
  var replayBtn = demo.querySelector(".replay");
  var CONTACT = demo.getAttribute("data-contact");
  var THANKS = demo.getAttribute("data-thanks");
  var FRAME_W = 1280;
  var scale = 1;
  var run = 0;
  var running = false;

  var FIELDS = [
    { sel: 'input[name="name"]', text: "Sarah Ahmed" },
    { sel: 'input[name="email"]', text: "sarah@northwind.com" },
    { sel: 'input[name="company"]', text: "Northwind Logistics" },
    { sel: 'input[name="phone"]', text: "+1 (408) 555-0142" }
  ];
  var MESSAGE = "We are moving 120 staff to managed IT and need 24/7 support plus endpoint security.";

  function sizeFrame() {
    scale = viewport.clientWidth / FRAME_W;
    frame.style.transform = "scale(" + scale + ")";
    frame.style.height = Math.ceil(viewport.clientHeight / scale) + "px";
  }
  sizeFrame();
  window.addEventListener("resize", sizeFrame);

  function Cancelled() {}
  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject(new Cancelled()); }, reduce ? Math.min(ms, 60) : ms);
    });
  }
  function setStep(n) { steps.forEach(function (li, i) { li.classList.toggle("on", i < n); }); }
  function setUrl(u) {
    urlText.textContent = u.replace(/^https?:\/\//, "");
    urlBox.classList.remove("changed"); void urlBox.offsetWidth; urlBox.classList.add("changed");
  }

  function loadFrame(src, id) {
    return new Promise(function (resolve, reject) {
      var done = false;
      function finish() { if (done) return; done = true; id === run ? resolve() : reject(new Cancelled()); }
      frame.onload = finish;
      setTimeout(finish, 9000);
      frame.src = src;
    });
  }
  function doc() {
    try { return frame.contentDocument && frame.contentDocument.body ? frame.contentDocument : null; } catch (e) { return null; }
  }

  // Prompt box behaves like a text input that types itself
  function typePrompt(id) {
    var ps = typed.querySelectorAll("p");
    ps.forEach(function (p) { p.textContent = ""; });
    var caret = document.createElement("span");
    caret.className = "caret";
    promptBox.classList.remove("sent");
    var li = 0, ci = 0;
    return new Promise(function (resolve, reject) {
      function tick() {
        if (id !== run) { caret.remove(); reject(new Cancelled()); return; }
        if (li >= lines.length) { resolve(caret); return; }
        var line = lines[li];
        var chunk = reduce ? line.length : (line.charAt(ci) === "/" ? 1 : 2);
        ci = Math.min(ci + chunk, line.length);
        ps[li].textContent = line.slice(0, ci);
        ps[li].appendChild(caret);
        if (ci >= line.length) { li++; ci = 0; setTimeout(tick, reduce ? 0 : 180); }
        else setTimeout(tick, 16 + Math.random() * 22);
      }
      tick();
    });
  }

  function scrollFrameTo(y, id, ms) {
    var w = frame.contentWindow;
    var from = w.scrollY || 0, start = null, dur = reduce ? 1 : ms || 900;
    return new Promise(function (resolve, reject) {
      function step(t) {
        if (id !== run) { reject(new Cancelled()); return; }
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        w.scrollTo(0, from + (y - from) * e);
        p < 1 ? requestAnimationFrame(step) : resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function pointAt(el) {
    var r = el.getBoundingClientRect();
    var x = (r.left + Math.min(r.width * 0.3, 60)) * scale;
    var y = (r.top + r.height * 0.55) * scale;
    cursor.style.setProperty("--cx", x + "px");
    cursor.style.setProperty("--cy", y + "px");
  }
  function tap() { cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click"); }

  function setValue(el, value) {
    var proto = el.tagName === "TEXTAREA" ? frame.contentWindow.HTMLTextAreaElement.prototype : frame.contentWindow.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new frame.contentWindow.Event("input", { bubbles: true }));
  }
  function typeInto(el, text, id) {
    el.focus({ preventScroll: true });
    var i = 0;
    return new Promise(function (resolve, reject) {
      function tick() {
        if (id !== run) { reject(new Cancelled()); return; }
        i = reduce ? text.length : i + 1;
        setValue(el, text.slice(0, i));
        i >= text.length ? resolve() : setTimeout(tick, 28 + Math.random() * 40);
      }
      tick();
    });
  }

  function injectStyle(d) {
    if (d.getElementById("cs-demo-style")) return;
    var st = d.createElement("style");
    st.id = "cs-demo-style";
    st.textContent =
      "html{scroll-behavior:auto!important}" +
      ".cs-blink{animation:csBlink .5s ease-in-out 4!important;}" +
      "@keyframes csBlink{0%,100%{box-shadow:0 0 0 0 rgba(74,125,238,.7);filter:none}50%{box-shadow:0 0 0 10px rgba(74,125,238,0);filter:brightness(1.25)}}";
    d.head.appendChild(st);
  }

  async function play() {
    var id = ++run;
    running = true;
    demo.classList.remove("done");
    setStep(0);
    cursor.classList.remove("on");
    veil.classList.remove("on");
    try {
      // 1. Prompt
      var caret = await typePrompt(id);
      await wait(350, id);
      promptBox.classList.add("sent");
      setStep(1);
      await wait(500, id);
      caret.remove();

      // 2. Contact form
      setUrl(CONTACT);
      await loadFrame(CONTACT, id);
      viewport.classList.add("live");
      sizeFrame();
      await wait(900, id);
      var d = doc();
      if (d) {
        injectStyle(d);
        var form = d.querySelector("form.form") || d.querySelector("form");
        if (form) {
          var top = form.getBoundingClientRect().top + frame.contentWindow.scrollY - 140;
          await scrollFrameTo(top, id, 1100);
        }
        cursor.classList.add("on");
        for (var f = 0; f < FIELDS.length; f++) {
          var el = d.querySelector(FIELDS[f].sel);
          if (!el) continue;
          pointAt(el);
          await wait(550, id);
          tap();
          await typeInto(el, FIELDS[f].text, id);
          await wait(180, id);
        }
        var picks = [d.querySelectorAll(".chip")[2], d.querySelectorAll(".option")[1], d.querySelectorAll(".option")[4]];
        for (var k = 0; k < picks.length; k++) {
          if (!picks[k]) continue;
          pointAt(picks[k]);
          await wait(500, id);
          tap();
          picks[k].click();
          await wait(220, id);
        }
        var area = d.querySelector("textarea");
        if (area) {
          var aTop = area.getBoundingClientRect().top + frame.contentWindow.scrollY - 220;
          await scrollFrameTo(aTop, id, 700);
          pointAt(area);
          await wait(550, id);
          tap();
          await typeInto(area, MESSAGE, id);
        }
        setStep(2);

        // 3. Submit blinks
        var submit = d.querySelector(".form__submit") || d.querySelector('button[type="submit"]');
        if (submit) {
          var sTop = submit.getBoundingClientRect().top + frame.contentWindow.scrollY - 300;
          await scrollFrameTo(sTop, id, 700);
          pointAt(submit);
          await wait(650, id);
          setStep(3);
          submit.classList.add("cs-blink");
          await wait(2000, id);
          tap();
          await wait(250, id);
        }
      } else {
        // Page could not be scripted (opened from another address): still walk the flow
        setStep(2);
        await wait(2200, id);
        setStep(3);
        await wait(1200, id);
      }

      // 4. Thank You page reveal
      cursor.classList.remove("on");
      veil.classList.add("on");
      await wait(450, id);
      setUrl(THANKS);
      await loadFrame(THANKS, id);
      sizeFrame();
      veil.classList.remove("on");
      setStep(4);
      await wait(1200, id);
      demo.classList.add("done");
    } catch (e) {
      if (!(e instanceof Cancelled)) { setStep(4); demo.classList.add("done"); }
    }
    if (id === run) running = false;
  }

  replayBtn.addEventListener("click", function () { play(); });

  if ("IntersectionObserver" in window) {
    var started = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !running) {
          if (!started || demo.classList.contains("done")) { started = true; play(); }
        }
      });
    }, { threshold: 0.35 }).observe(demo);
  } else {
    play();
  }
})();
