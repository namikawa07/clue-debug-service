/**
 * TDD tests for Navbar breadcrumb link correctness.
 * Run: npx tsx src/__tests__/navbar-breadcrumbs.test.ts
 */

import { buildBreadcrumbs } from "../components/navbar-breadcrumbs";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

const workspace = { name: "Development" };

console.log("\n=== Breadcrumb Tests ===\n");

// 1. Workspace link
{
  const segs = buildBreadcrumbs("/w/ws123/spaces", "ws123", workspace);
  assertEqual(segs[0], { label: "Development", href: "/w/ws123" },
    "workspace segment links to /w/{workspaceId}");
}

// 2. No /workspaces/ in href
{
  const segs = buildBreadcrumbs("/w/ws123/spaces/sp1/settings", "ws123", workspace);
  assert(!segs[0].href.includes("/workspaces/"),
    "workspace segment does NOT link to /workspaces/");
}

// 3. Spaces links to current space
{
  const segs = buildBreadcrumbs("/w/ws123/spaces/sp456/settings", "ws123", workspace);
  const spaceSeg = segs.find((s) => s.href.includes("spaces"));
  assert(spaceSeg !== undefined, "'Spaces' segment exists");
  assertEqual(spaceSeg?.href, "/w/ws123/spaces/sp456",
    "'Spaces' links to current space, not /w/ws123/spaces");
}

// 4. Settings is last segment
{
  const segs = buildBreadcrumbs("/w/ws123/spaces/sp456/settings", "ws123", workspace);
  const last = segs[segs.length - 1];
  assertEqual(last.label, "Settings",
    "'Settings' is the last breadcrumb");
}

// 5. Top-level tasks
{
  const segs = buildBreadcrumbs("/w/ws123/tasks", "ws123", workspace);
  assertEqual(segs, [
    { label: "Development", href: "/w/ws123" },
    { label: "Tasks", href: "/w/ws123/tasks" },
  ], "top-level tasks: Development > Tasks");
}

// 6. Top-level members
{
  const segs = buildBreadcrumbs("/w/ws123/members", "ws123", workspace);
  assertEqual(segs, [
    { label: "Development", href: "/w/ws123" },
    { label: "Members", href: "/w/ws123/members" },
  ], "top-level members: Development > Members");
}

// 7. Epics page links to current space
{
  const segs = buildBreadcrumbs("/w/ws123/spaces/sp456/epics", "ws123", workspace);
  const spaceSeg = segs.find((s) => s.href.includes("spaces/sp456"));
  assert(spaceSeg !== undefined,
    "epics page: Spaces segment links to current space");
}

// 8. No workspace returns empty
{
  const segs = buildBreadcrumbs("/w/ws123/tasks", "ws123", null);
  assertEqual(segs, [], "returns empty when no workspace");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
