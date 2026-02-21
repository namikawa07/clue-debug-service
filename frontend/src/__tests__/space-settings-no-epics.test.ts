/**
 * TDD tests to ensure epic creation is NOT in space settings.
 * Run: npx tsx src/__tests__/space-settings-no-epics.test.ts
 */

import * as fs from "fs";
import * as path from "path";

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

const SETTINGS_CLIENT_PATH = path.resolve(
  __dirname,
  "../../src/app/(dashboard)/workspaces/[workspaceId]/spaces/[spaceId]/settings/client.tsx"
);

console.log("\n=== Space Settings - No Epic Creation Tests ===\n");

const fileContent = fs.readFileSync(SETTINGS_CLIENT_PATH, "utf-8");

// 1. SECTIONS array does not contain "epics"
{
  const sectionsMatch = fileContent.match(
    /const\s+SECTIONS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/
  );
  assert(sectionsMatch !== null, "SECTIONS constant found");
  if (sectionsMatch) {
    const sectionsBody = sectionsMatch[1];
    assert(!sectionsBody.includes('"epics"'),
      "SECTIONS does not contain 'epics' entry");
  }
}

// 2. No CreateEpicForm import
{
  assert(!fileContent.includes("CreateEpicForm"),
    "does not import CreateEpicForm");
}

// 3. No <CreateEpicForm render
{
  assert(!fileContent.includes("<CreateEpicForm"),
    "does not render <CreateEpicForm");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
