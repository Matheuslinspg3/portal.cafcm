import { routeMap, viewToUrl } from "./routes.mjs";

/**
 * Resolves the current URL to update the given application state.
 */
export function resolveRoute(state) {
  const path = window.location.pathname;
  const match = routeMap[path];

  if (match) {
    state.view = match.view;
    if (match.title) {
      document.title = `${match.title} | Portal CAFCM`;
    }

    // Set sub-tabs if defined by the route
    if (match.view === "automations" && match.tab) state.automationTab = match.tab;
    if (match.view === "vacancies" && match.tab) state.vacancyTab = match.tab;
    if (match.view === "finance" && match.tab) state.financeTab = match.tab;
    if (match.view === "documents" && match.tab) state.documentTab = match.tab;

    // Parse URL parameters for deep links
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // Some routes might use `id` for specific item selection.
    // Usually these are handled by specific click events currently, but if we need deep linking to entities, we put it here.
    // For example:
    if (id) {
      if (match.view === "courses") state.selectedCourseId = id;
      if (match.view === "student-courses") state.selectedCourseId = id;
      if (match.view === "pipelines") state.selectedPipelineId = id;
      // You could add others here depending on how deep links are handled.
    }

    return true; // Successfully resolved
  }

  // Fallback for unknown routes - could be a 404 or redirect to /
  return false;
}

/**
 * Navigate to a URL pushing state to History API.
 */
export function pushRoute(url) {
  if (window.location.pathname + window.location.search === url) return;
  window.history.pushState({}, "", url);

  // Dispatch custom event to notify app of route change
  window.dispatchEvent(new Event("routeChange"));
}

/**
 * Replace current URL in History API.
 */
export function replaceRoute(url) {
  if (window.location.pathname + window.location.search === url) return;
  window.history.replaceState({}, "", url);
  window.dispatchEvent(new Event("routeChange"));
}

/**
 * Navigate by view name instead of raw URL.
 */
export function pushView(view, extraParams = "") {
  let url = viewToUrl[view];
  if (!url) return;
  if (extraParams) url += extraParams;
  pushRoute(url);
}
