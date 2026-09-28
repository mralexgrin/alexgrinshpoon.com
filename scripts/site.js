document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Mark the in-page nav link for the section in view (home only).
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (!targets.length) return;
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const link = links.find((a) => a.hash === "#" + entry.target.id);
      if (!link || link.classList.contains("pill")) continue;
      if (entry.isIntersecting) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  targets.forEach((t) => spy.observe(t));
});
