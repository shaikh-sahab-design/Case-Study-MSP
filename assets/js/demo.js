/* Slide 05: the prompt types itself while the Contact page image shows,
   then the Thank You page image takes its place. Replays each time the
   section comes back into view. */
(function () {
  "use strict";
  var promptBox = document.querySelector(".prompt-input");
  var shot = document.querySelector("[data-swap] .swap");
  if (!promptBox || !shot) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var typed = promptBox.querySelector("[data-type]");
  var ps = typed.querySelectorAll("p");
  var lines = Array.prototype.map.call(ps, function (p) { return p.textContent; });
  var run = 0;
  var done = false;

  function play() {
    var id = ++run;
    done = false;
    shot.classList.remove("thanks");
    promptBox.classList.remove("sent");
    ps.forEach(function (p) { p.textContent = ""; });
    var caret = document.createElement("span");
    caret.className = "caret";
    var li = 0, ci = 0;
    function tick() {
      if (id !== run) { caret.remove(); return; }
      if (li >= lines.length) {
        setTimeout(function () {
          if (id !== run) return;
          caret.remove();
          promptBox.classList.add("sent");
          shot.classList.add("thanks");
          done = true;
        }, reduce ? 0 : 400);
        return;
      }
      var line = lines[li];
      ci = reduce ? line.length : Math.min(ci + 2, line.length);
      ps[li].textContent = line.slice(0, ci);
      ps[li].appendChild(caret);
      if (ci >= line.length) { li++; ci = 0; setTimeout(tick, reduce ? 0 : 180); }
      else setTimeout(tick, 16 + Math.random() * 22);
    }
    setTimeout(tick, reduce ? 0 : 500);
  }

  if (!("IntersectionObserver" in window)) { play(); return; }
  var started = false;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && (!started || done)) { started = true; play(); }
    });
  }, { threshold: 0.5 }).observe(promptBox);
})();
