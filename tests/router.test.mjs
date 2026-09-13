import test from "node:test";
import assert from "node:assert";
import { routeMap, viewToUrl } from "../src/router/routes.mjs";
import { resolveRoute } from "../src/router/router.mjs";

test("route map properly defines routes and tabs", () => {
  assert.ok(routeMap["/"]);
  assert.equal(routeMap["/"].view, "overview");

  assert.ok(routeMap["/faturamento"]);
  assert.equal(routeMap["/faturamento"].view, "finance");
  assert.equal(routeMap["/faturamento"].tab, "receivable");
});

test("viewToUrl maps views back to canonical URLs", () => {
  assert.equal(viewToUrl["overview"], "/");
  assert.equal(viewToUrl["finance"], "/financeiro");
});

test("resolveRoute correctly updates state and parses URL params", () => {
  // Mock window and document
  global.window = {
    location: {
      pathname: "/faturamento",
      search: "?id=123"
    }
  };
  global.document = {
    title: ""
  };

  const state = { view: null, financeTab: null };
  const resolved = resolveRoute(state);

  assert.equal(resolved, true);
  assert.equal(state.view, "finance");
  assert.equal(state.financeTab, "receivable");
  assert.equal(document.title, "Faturamento | Portal CAFCM");
});

test("resolveRoute correctly parses deep link id for courses", () => {
  global.window = {
    location: {
      pathname: "/cursos",
      search: "?id=abc"
    }
  };
  global.document = {
    title: ""
  };

  const state = {};
  resolveRoute(state);

  assert.equal(state.view, "courses");
  assert.equal(state.selectedCourseId, "abc");
});
