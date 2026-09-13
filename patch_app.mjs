import fs from 'fs';

let content = fs.readFileSync('src/app.js', 'utf8');

// Replace view resolution in loadPortal
const loadPortalSearch = `  state.view = state.view && canAccessView(state.view, profile)
    ? state.view
    : defaultView(profile);`;

const loadPortalReplace = `  // Use router to resolve URL to view
  const resolved = resolveRoute(state);

  // If no state.view yet, or resolved invalid, fallback to default
  state.view = state.view && canAccessView(state.view, profile)
    ? state.view
    : defaultView(profile);

  // If we fell back, redirect to canonical URL
  if (!resolved && state.view) {
    replaceRoute(viewToUrl[state.view] || "/");
  }`;

content = content.replace(loadPortalSearch, loadPortalReplace);

// We need viewToUrl in loadPortal
content = content.replace('import { resolveRoute, pushRoute, pushView, replaceRoute }', 'import { resolveRoute, pushRoute, pushView, replaceRoute } from "./router/router.mjs";\nimport { viewToUrl }');

content = content.replace('import { viewToUrl } from "./router/router.mjs";\nimport { viewToUrl }', 'import { resolveRoute, pushRoute, pushView, replaceRoute } from "./router/router.mjs";\nimport { viewToUrl } from "./router/routes.mjs";');


// Handle navigation clicks
const globalClickSearch = `app.addEventListener("click", async (e) => {`;
const globalClickReplace = `window.addEventListener("popstate", () => {
  if (state.session && state.profile) {
    resolveRoute(state);
    renderPortal();
  }
});

window.addEventListener("routeChange", () => {
  if (state.session && state.profile) {
    resolveRoute(state);
    renderPortal();
  }
});

app.addEventListener("click", async (e) => {
  const navLink = e.target.closest("a.nav-item");
  if (navLink) {
    e.preventDefault();
    const navId = navLink.getAttribute("data-nav");
    pushView(navId);
    app.querySelector(".portal-shell")?.classList.remove("menu-open");
    return;
  }

  const groupToggle = e.target.closest(".nav-label-btn");
  if (groupToggle) {
    const group = groupToggle.closest(".nav-group");
    group.classList.toggle("expanded");
    const isExpanded = group.classList.contains("expanded");
    groupToggle.setAttribute("aria-expanded", isExpanded);
    return;
  }

  const sidebarToggle = e.target.closest(".sidebar-toggle");
  if (sidebarToggle) {
    const isCompact = localStorage.getItem("sidebarCompact") === "true";
    localStorage.setItem("sidebarCompact", !isCompact);
    renderPortal();
    return;
  }`;

content = content.replace(globalClickSearch, globalClickReplace);

// Replace legacy data-nav buttons
content = content.replace(/const navBtn = e.target.closest\("\[data-nav\]"\);\s*if \(navBtn\) \{\s*state.view = navBtn.getAttribute\("data-nav"\);\s*app.querySelector\(".portal-shell"\)\?.classList.remove\("menu-open"\);\s*return renderPortal\(\);\s*\}/, `const navBtn = e.target.closest("button[data-nav]");\n  if (navBtn) {\n    pushView(navBtn.getAttribute("data-nav"));\n    app.querySelector(".portal-shell")?.classList.remove("menu-open");\n    return;\n  }`);

fs.writeFileSync('src/app.js', content);
