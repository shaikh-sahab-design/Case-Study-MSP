# MSP Website case study

An animated, single-page web version of the "MSP Website Case Study" section in the Figma file `MSP-Website`. It tells how one UI/UX designer designed, built, shipped and tested the Folio3 Managed IT and Cybersecurity website with Claude Code.

Plain HTML, CSS and JavaScript with no build step. Open `index.html` locally, or let the GitHub Pages workflow publish it.

Motion is scroll triggered (IntersectionObserver), and every effect switches off for visitors who set reduced motion.

## Section thumbnails

The side dots show a preview of each slide from `assets/img/thumbs/<slide id>.webp`.
After changing any slide, recapture them:

    node tools/thumbs.js /tmp/thumbs
    python3 tools/thumbs.py /tmp/thumbs assets/img/thumbs
