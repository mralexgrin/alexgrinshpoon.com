// Motion and small interactions. No libraries; everything degrades to a static page.
const root = document.documentElement;
root.classList.add("js");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Hero choreography starts once fonts are ready, so words don't reflow mid-animation.
  // A timeout backs it up, so content can never stay hidden.
  const loaded = () => root.classList.add("is-loaded");
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(loaded);
  setTimeout(loaded, 1200);

  // Split display headings into words that rise from a mask. Screen readers get the plain text.
  for (const el of document.querySelectorAll("[data-split]")) {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}"><span>${w}</span></span>`).join(" ");
  }

  // Auto-tag reveal targets on every page, staggered within their parent.
  const groups = [".tiles > li", ".index__row", ".chapter .shot", ".chapter .shots > figure"];
  const targets = new Set();
  for (const sel of groups) {
    document.querySelectorAll(sel).forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.matches(sel));
      const i = siblings.indexOf(el);
      el.style.setProperty("--d", `${sel === ".tiles > li" ? (i % 2) * 110 : Math.min(i, 8) * 70}ms`);
      el.setAttribute("data-reveal", "");
      targets.add(el);
    });
  }
  document.querySelectorAll("[data-split]:not(.hero__title), .about").forEach((el) => targets.add(el));

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -12% 0px" });
  targets.forEach((el) => io.observe(el));
  document.querySelector(".hero__title")?.classList.add("in");

  // Navigation: compact floating pill once the page scrolls.
  const sentinel = document.querySelector(".nav-sentinel");
  const head = document.querySelector(".site-head");
  if (sentinel && head) new IntersectionObserver(([e]) => head.classList.toggle("is-compact", !e.isIntersecting)).observe(sentinel);

  // Navigation highlight: slides to the hovered link, rests on the current section.
  const nav = document.querySelector(".nav");
  const hl = document.querySelector(".nav__hl");
  if (nav && hl) {
    const links = [...nav.querySelectorAll("a")];
    const moveTo = (a) => {
      if (!a || a.offsetParent === null) { hl.style.opacity = "0"; return; }
      hl.style.width = `${a.offsetWidth}px`;
      hl.style.transform = `translateX(${a.offsetLeft}px)`;
      hl.style.opacity = "1";
    };
    const current = () => links.find((a) => a.hasAttribute("aria-current"));
    links.forEach((a) => { a.addEventListener("pointerenter", () => moveTo(a)); a.addEventListener("focus", () => moveTo(a)); });
    nav.addEventListener("pointerleave", () => moveTo(current()));
    const targetsById = links.map((a) => [a, a.hash && document.getElementById(a.hash.slice(1))]).filter(([, t]) => t);
    if (targetsById.length) {
      const spy = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const pair = targetsById.find(([, t]) => t === e.target);
          if (!pair) continue;
          if (e.isIntersecting) { links.forEach((l) => l.removeAttribute("aria-current")); pair[0].setAttribute("aria-current", "location"); }
          else pair[0].removeAttribute("aria-current");
        }
        if (!nav.matches(":hover")) moveTo(current());
      }, { rootMargin: "-45% 0px -50% 0px" });
      targetsById.forEach(([, t]) => spy.observe(t));
    }
    addEventListener("resize", () => moveTo(current()));
  }

  // Experience: a dark highlight glides to the hovered role, then settles back on the current one.
  const roles = document.querySelector(".roles");
  if (roles) {
    const items = [...roles.children];
    const bar = document.createElement("span");
    bar.className = "roles__hl";
    bar.setAttribute("aria-hidden", "true");
    roles.prepend(bar);
    roles.classList.add("has-hl");
    const settle = (li) => {
      items.forEach((i) => i.classList.toggle("is-on", i === li));
      bar.style.height = `${li.offsetHeight}px`;
      bar.style.transform = `translateY(${li.offsetTop}px)`;
    };
    settle(items[0]);
    items.forEach((li) => li.addEventListener("pointerenter", () => settle(li)));
    roles.addEventListener("pointerleave", () => settle(items[0]));
    addEventListener("resize", () => settle(items.find((i) => i.classList.contains("is-on")) || items[0]));
  }

  // Earlier-work index: a preview follows the pointer (hover devices only).
  const peek = document.querySelector(".index__peek");
  if (peek && matchMedia("(hover: hover) and (min-width: 800px)").matches) {
    let x = 0, y = 0, px = 0, py = 0, raf = 0;
    const loop = () => {
      px += (x - px) * (calm ? 1 : 0.18);
      py += (y - py) * (calm ? 1 : 0.18);
      peek.style.transform = `translate3d(${px + 24}px, ${py - 100}px, 0)`;
      raf = Math.abs(x - px) + Math.abs(y - py) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    document.querySelectorAll(".index__row").forEach((row) => {
      row.addEventListener("pointerenter", (e) => {
        peek.src = row.dataset.peek;
        if (!peek.classList.contains("is-on")) { px = e.clientX; py = e.clientY; }
        peek.classList.add("is-on");
      });
      row.addEventListener("pointerleave", () => peek.classList.remove("is-on"));
      row.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  // Hero: the colour fields lean gently toward the pointer.
  const hero = document.querySelector(".hero");
  if (hero && !calm && matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5) * 2);
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener("pointerleave", () => { hero.style.setProperty("--mx", 0); hero.style.setProperty("--my", 0); });
  }

  // Case pages: a thin reading-progress line (driven by CSS scroll timelines where supported).
  if (document.querySelector(".case-head")) {
    const bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);
  }
});
