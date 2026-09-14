import { viewToUrl } from "../router/routes.mjs";

export function renderSidebar({ nav, activeBase, profile, roleLabels, brandHTML, iconFn, profileAccessLabelFn, getInitials, escapeHtmlFn }) {
  const isCompact = localStorage.getItem("sidebarCompact") === "true";

  return `
    <div class="portal-shell ${isCompact ? 'sidebar-compact' : ''}">
      <button class="sidebar-scrim" data-close-menu aria-label="Fechar menu"></button>
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="brand-container">${brandHTML}</div>
          <button class="icon-btn sidebar-toggle" data-toggle-compact aria-label="Alternar tamanho do menu">
            ${iconFn("menu")}
          </button>
          <button class="icon-btn sidebar-close" data-close-menu aria-label="Fechar menu">
            ${iconFn("close")}
          </button>
        </div>
        <nav aria-label="Navegação principal">
          ${nav.map((group, groupIdx) => {
            const hasActiveItem = group.items.some(([id]) => id === activeBase);
            const isExpanded = hasActiveItem; // Automatically expand group with active item
            return `
              <section class="nav-group ${isExpanded ? 'expanded' : ''}" data-group="${groupIdx}">
                <button class="nav-label-btn" aria-expanded="${isExpanded}" aria-controls="group-content-${groupIdx}">
                  <span class="nav-label">${escapeHtmlFn(group.label)}</span>
                  <span class="nav-chevron">${iconFn("chevron")}</span>
                </button>
                <div class="nav-group-content" id="group-content-${groupIdx}">
                  ${group.items.map(([id, label, iconName]) => {
                    const isActive = activeBase === id;
                    const url = viewToUrl[id] || "#";
                    return `
                      <a href="${url}" class="nav-item ${isActive ? "active" : ""}" data-nav="${id}" ${isActive ? 'aria-current="page"' : ''} title="${isCompact ? escapeHtmlFn(label) : ''}">
                        ${iconFn(iconName)}<span>${escapeHtmlFn(label)}</span>
                      </a>
                    `;
                  }).join("")}
                </div>
              </section>
            `;
          }).join("")}
        </nav>
        <div class="sidebar-user">
          <span class="avatar">${escapeHtmlFn(getInitials(profile.full_name))}</span>
          <span class="user-info">
            <strong>${escapeHtmlFn(profile.full_name || roleLabels[profile.role])}</strong>
            <small>${escapeHtmlFn(profileAccessLabelFn(profile))}</small>
          </span>
        </div>
        <div class="sidebar-account-actions">
          <button class="sidebar-account-action" data-dialog="my-profile">${iconFn("users")}<span>Minha conta</span></button>
          <button class="sidebar-account-action sidebar-account-logout" data-logout>${iconFn("logout")}<span>Sair</span></button>
        </div>
      </aside>
      <section class="portal-main">
  `;
}
