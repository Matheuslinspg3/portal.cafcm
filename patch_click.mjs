import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const clickSearch = `app.addEventListener("click", async (event) => {`;
const clickReplace = `window.addEventListener("popstate", () => {
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

app.addEventListener("click", async (event) => {
  const navLink = event.target.closest("a.nav-item");
  if (navLink) {
    event.preventDefault();
    const navId = navLink.getAttribute("data-nav");
    pushView(navId);
    app.querySelector(".portal-shell")?.classList.remove("menu-open");
    return;
  }

  const groupToggle = event.target.closest(".nav-label-btn");
  if (groupToggle) {
    const group = groupToggle.closest(".nav-group");
    group.classList.toggle("expanded");
    const isExpanded = group.classList.contains("expanded");
    groupToggle.setAttribute("aria-expanded", isExpanded);
    return;
  }

  const sidebarToggle = event.target.closest(".sidebar-toggle");
  if (sidebarToggle) {
    const isCompact = localStorage.getItem("sidebarCompact") === "true";
    localStorage.setItem("sidebarCompact", !isCompact);
    renderPortal();
    return;
  }`;

content = content.replace(clickSearch, clickReplace);
fs.writeFileSync('src/app.js', content);
