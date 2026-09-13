import fs from 'fs';

let content = fs.readFileSync('src/app.js', 'utf8');

const imports = `import { renderSidebar } from "./navigation/sidebar.mjs";\nimport { resolveRoute, pushRoute, pushView, replaceRoute } from "./router/router.mjs";\n`;

content = content.replace('import { createClient }', imports + 'import { createClient }');

const renderPortalSearch = `  app.innerHTML = \`
    <div class="portal-shell">
      <button class="sidebar-scrim" data-close-menu aria-label="Fechar menu"></button>
      <aside class="sidebar">
        <div class="sidebar-head">\${brand(true)}<button class="icon-btn sidebar-close" data-close-menu aria-label="Fechar menu">\${icon("close")}</button></div>
        <nav aria-label="Navegação principal">
          \${nav.map((group) => \`<section class="nav-group"><span class="nav-label">\${escapeHtml(group.label)}</span>\${group.items.map(([id, label, iconName]) => \`<button class="nav-item \${activeBase === id ? "active" : ""}" data-nav="\${id}">\${icon(iconName)}<span>\${label}</span></button>\`).join("")}</section>\`).join("")}
        </nav>
        <button class="guide-card" data-open-wizard>\${icon("help")}<span><strong>Como usar esta aba</strong><small>Passo a passo da tela atual</small></span></button>
        <div class="sidebar-user"><span class="avatar">\${escapeHtml(initials(profile.full_name))}</span><span><strong>\${escapeHtml(profile.full_name || roleLabels[profile.role])}</strong><small>\${escapeHtml(profileAccessLabel(profile))}</small></span></div>
      </aside>
      <section class="portal-main">`;

const renderPortalReplace = `  app.innerHTML = renderSidebar({
    nav, activeBase, profile, roleLabels, brandHTML: brand(true), iconFn: icon, profileAccessLabelFn: profileAccessLabel, getInitials: initials, escapeHtmlFn: escapeHtml
  }) + \`
        <header class="topbar">`;

content = content.replace(renderPortalSearch, renderPortalReplace);

fs.writeFileSync('src/app.js', content);
