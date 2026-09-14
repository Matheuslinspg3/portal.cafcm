import { viewToUrl } from "../router/routes.mjs";

export function renderSidebar({ nav, activeBase, activePath = "", profile, roleLabels, brandHTML, iconFn, profileAccessLabelFn, getInitials, escapeHtmlFn }) {
  const isCompact = localStorage.getItem("sidebarCompact") === "true";

  const itemMeta = (item) => item[3] || {};
  const itemRoute = (item) => itemMeta(item).route || viewToUrl[item[0]] || "#";
  const itemIsActive = (item) => {
    const meta = itemMeta(item);
    if (meta.active === false || activeBase !== item[0]) return false;
    return !meta.route || !activePath || activePath === meta.route;
  };
  const groupHasActiveItem = (items = []) => items.some((item) => itemIsActive(item) || groupHasActiveItem(itemMeta(item).children));
  const renderItem = (item, nested = false) => {
    const [id, label, iconName] = item;
    const meta = itemMeta(item);
    const url = itemRoute(item);
    const isActive = itemIsActive(item);
    const children = meta.children || [];
    return `
      <a href="${url}" class="nav-item ${nested ? "nav-subitem" : ""} ${isActive ? "active" : ""}" data-nav="${id}" data-route="${url}" ${isActive ? 'aria-current="page"' : ''} title="${isCompact ? escapeHtmlFn(label) : ''}">
        ${iconFn(iconName)}<span>${escapeHtmlFn(label)}</span>
      </a>
      ${children.length ? `<div class="nav-subitems">${children.map((child) => renderItem(child, true)).join("")}</div>` : ""}
    `;
  };

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
            const hasActiveItem = groupHasActiveItem(group.items);
            const isExpanded = hasActiveItem; // Automatically expand group with active item
            return `
              <section class="nav-group ${isExpanded ? 'expanded' : ''}" data-group="${groupIdx}">
                <button class="nav-label-btn" aria-expanded="${isExpanded}" aria-controls="group-content-${groupIdx}">
                  <span class="nav-label">${escapeHtmlFn(group.label)}</span>
                  <span class="nav-chevron">${iconFn("chevron")}</span>
                </button>
                <div class="nav-group-content" id="group-content-${groupIdx}">
                  ${group.items.map((item) => renderItem(item)).join("")}
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
