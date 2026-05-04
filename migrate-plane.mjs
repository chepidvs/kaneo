#!/usr/bin/env node

// Plane.so → Kaneo migration script - FINAL
// Usage:
//   export PLANE_TOKEN=... PLANE_WORKSPACE=frmwrk PLANE_PROJECT_ID=...
//          KANEO_URL=http://localhost:1337/api KANEO_TOKEN=... KANEO_PROJECT_ID=...
//   node migrate-plane.mjs

const PLANE_BASE = "https://api.plane.so/api/v1";
const PLANE_TOKEN = process.env.PLANE_TOKEN;
const PLANE_WORKSPACE = process.env.PLANE_WORKSPACE;
const PLANE_PROJECT_ID = process.env.PLANE_PROJECT_ID;
const KANEO_URL = process.env.KANEO_URL;
const KANEO_TOKEN = process.env.KANEO_TOKEN;
const KANEO_PROJECT_ID = process.env.KANEO_PROJECT_ID;

const requiredEnv = [
  ["PLANE_TOKEN", PLANE_TOKEN],
  ["PLANE_WORKSPACE", PLANE_WORKSPACE],
  ["PLANE_PROJECT_ID", PLANE_PROJECT_ID],
  ["KANEO_URL", KANEO_URL],
  ["KANEO_TOKEN", KANEO_TOKEN],
  ["KANEO_PROJECT_ID", KANEO_PROJECT_ID],
];
const missing = requiredEnv.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing:", missing.join(", "));
  console.error(
    "export PLANE_TOKEN=... PLANE_WORKSPACE=frmwrk PLANE_PROJECT_ID=... KANEO_URL=http://localhost:1337/api KANEO_TOKEN=... KANEO_PROJECT_ID=...",
  );
  process.exit(1);
}

const planeHeaders = () => ({
  "X-API-Key": PLANE_TOKEN,
  "Content-Type": "application/json",
});
const kaneoHeaders = () => ({
  Authorization: `Bearer ${KANEO_TOKEN}`,
  "Content-Type": "application/json",
});

async function planeFetch(path) {
  const res = await fetch(`${PLANE_BASE}${path}`, { headers: planeHeaders() });
  if (!res.ok)
    throw new Error(
      `Plane ${res.status}: ${path}\n${await res.text().catch(() => "")}`,
    );
  return res.json();
}

async function kaneoFetch(method, path, body) {
  const res = await fetch(`${KANEO_URL}${path}`, {
    method,
    headers: kaneoHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok)
    throw new Error(
      `Kaneo ${res.status} ${method} ${path}\n${await res.text().catch(() => "")}`,
    );
  return res.json();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchAllPlanePages(path) {
  let all = [];
  let cursor = null;
  while (true) {
    const qs = cursor
      ? `?cursor=${encodeURIComponent(cursor)}&per_page=100`
      : "?per_page=100";
    const data = await planeFetch(`${path}${qs}`);
    all = all.concat(data.results || []);
    if (!data.next_page_results) break;
    cursor = data.next_cursor;
  }
  return all;
}

const PRIORITY_MAP = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  none: "no-priority",
};
function mapPriority(p) {
  return PRIORITY_MAP[p] || "no-priority";
}

const HEX_TO_THEME = {
  "#FCB900": "yellow",
  "#8ED1FC": "teal",
  "#FF6900": "orange",
  "#9900EF": "purple",
  "#EB144C": "red",
  "#00D084": "green",
  "#0693E3": "teal",
};
function mapColor(hex) {
  return HEX_TO_THEME[hex?.toUpperCase()] || hex || "#6b7280";
}

async function main() {
  console.log("=== Plane → Kaneo Migration ===\n");
  console.log(`Plane: ${PLANE_PROJECT_ID}  Kaneo: ${KANEO_PROJECT_ID}\n`);

  // ── Phase 1: Fetch Plane data ──
  console.log("── Phase 1: Fetching Plane data ──");
  const [planeStates, planeLabels, planeModules, planeIssues] =
    await Promise.all([
      fetchAllPlanePages(
        `/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT_ID}/states/`,
      ),
      fetchAllPlanePages(
        `/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT_ID}/labels/`,
      ),
      fetchAllPlanePages(
        `/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT_ID}/modules/`,
      ),
      fetchAllPlanePages(
        `/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT_ID}/work-items/`,
      ),
    ]);
  console.log(
    `  ${planeStates.length} states, ${planeLabels.length} labels, ${planeModules.length} modules, ${planeIssues.length} issues`,
  );

  // Module→issue mapping
  const moduleIssueMap = {};
  for (const mod of planeModules) {
    const items = await fetchAllPlanePages(
      `/workspaces/${PLANE_WORKSPACE}/projects/${PLANE_PROJECT_ID}/modules/${mod.id}/work-items/`,
    );
    for (const item of items) moduleIssueMap[item.id] = mod.id;
  }
  if (!planeIssues.length) {
    console.log("No issues. Done.");
    return;
  }

  // ── Phase 2: Columns from Plane states ──
  console.log("\n── Phase 2: Creating columns ──");
  const stateToSlug = {};
  for (const state of planeStates) {
    const slug = slugify(state.name);
    stateToSlug[state.id] = slug;
    try {
      await kaneoFetch("POST", `/column/${KANEO_PROJECT_ID}`, {
        name: state.name,
      });
      console.log(`  ✓ ${state.name}`);
    } catch (e) {
      if (e.message.includes("409")) {
        console.log(`  ~ ${state.name} (exists)`);
      } else {
        console.error(`  ✗ ${state.name}: ${e.message}`);
      }
    }
  }

  // ── Phase 3: Labels ──
  console.log("\n── Phase 3: Creating labels ──");
  for (const label of planeLabels) {
    try {
      await kaneoFetch("POST", "/label", {
        name: label.name,
        color: mapColor(label.color),
        projectId: KANEO_PROJECT_ID,
      });
      console.log(`  ✓ ${label.name}`);
    } catch (e) {
      console.error(`  ✗ ${label.name}: ${e.message}`);
    }
  }

  // ── Phase 4: Modules ──
  console.log("\n── Phase 4: Creating modules ──");
  for (const mod of planeModules) {
    try {
      await kaneoFetch("POST", `/module/project/${KANEO_PROJECT_ID}`, {
        name: mod.name,
        description: mod.description || undefined,
      });
      console.log(`  ✓ ${mod.name}`);
    } catch (e) {
      console.error(`  ✗ ${mod.name}: ${e.message}`);
    }
  }

  // ── Phase 5: Import tasks ──
  console.log("\n── Phase 5: Importing tasks ──");
  const tasks = planeIssues.map((issue) => ({
    title: issue.name,
    description: issue.description_stripped || "",
    status: stateToSlug[issue.state] || "planned",
    priority: mapPriority(issue.priority),
    ...(issue.start_date && { startDate: issue.start_date }),
    ...(issue.target_date && { dueDate: issue.target_date }),
  }));

  const importResult = await kaneoFetch(
    "POST",
    `/task/import/${KANEO_PROJECT_ID}`,
    { tasks },
  );
  const { successful, failed } = importResult.results;
  console.log(`  ${successful} imported, ${failed} failed`);
  if (!successful) return;

  // ── Phase 6: Attach labels (title-based) ──
  const planeIssuesWithLabels = planeIssues.filter((i) => i.labels?.length);
  if (planeIssuesWithLabels.length) {
    console.log("\n── Phase 6: Attaching labels ──");

    // Get Kaneo labels and tasks
    const [kaneoLabels, taskRes] = await Promise.all([
      kaneoFetch("GET", `/label/project/${KANEO_PROJECT_ID}`),
      kaneoFetch("GET", `/task/tasks/${KANEO_PROJECT_ID}?page=1&limit=100`),
    ]);
    const labelByName = {};
    for (const kl of kaneoLabels)
      labelByName[kl.name.toLowerCase().trim()] = kl.id;

    const columns = taskRes.data?.columns || [];
    const kaneoTasks = [];
    for (const col of columns) kaneoTasks.push(...(col.tasks || []));
    if (taskRes.data?.archivedTasks)
      kaneoTasks.push(...taskRes.data.archivedTasks);
    if (taskRes.data?.plannedTasks)
      kaneoTasks.push(...taskRes.data.plannedTasks);
    const taskByTitle = {};
    for (const t of kaneoTasks)
      taskByTitle[t.title.toLowerCase().trim()] = t.id;

    // Build Plane label names lookup
    const planeLabelNames = {};
    for (const pl of planeLabels) planeLabelNames[pl.id] = pl.name;

    let attached = 0;
    let failedLbl = 0;
    for (const issue of planeIssuesWithLabels) {
      const labelNames = (issue.labels || [])
        .map((id) => planeLabelNames[id])
        .filter(Boolean);
      if (!labelNames.length) continue;
      const taskId = taskByTitle[issue.name.toLowerCase().trim()];
      if (!taskId) {
        console.log(`  ? No task match: "${issue.name}"`);
        continue;
      }
      for (const name of labelNames) {
        const lid = labelByName[name.toLowerCase().trim()];
        if (!lid) continue;
        try {
          await kaneoFetch("PUT", `/label/${lid}/task`, { taskId });
          attached++;
        } catch (_e) {
          failedLbl++;
        }
      }
    }
    console.log(`  ${attached} attached, ${failedLbl} failed`);
  }

  // ── Phase 7: Assign modules ──
  const issuesWithModule = planeIssues.filter((i) => moduleIssueMap[i.id]);
  if (issuesWithModule.length) {
    console.log("\n── Phase 7: Assigning modules ──");

    // Build Kaneo module map
    const kaneoModules = await kaneoFetch(
      "GET",
      `/module/project/${KANEO_PROJECT_ID}`,
    );
    const moduleByName = {};
    for (const km of kaneoModules) moduleByName[km.name] = km.id;

    // Get task list again
    const taskRes2 = await kaneoFetch(
      "GET",
      `/task/tasks/${KANEO_PROJECT_ID}?page=1&limit=100`,
    );
    const cols2 = taskRes2.data?.columns || [];
    const kaneoTasks2 = [];
    for (const col of cols2) kaneoTasks2.push(...(col.tasks || []));
    if (taskRes2.data?.archivedTasks)
      kaneoTasks2.push(...taskRes2.data.archivedTasks);
    if (taskRes2.data?.plannedTasks)
      kaneoTasks2.push(...taskRes2.data.plannedTasks);
    const taskByTitle2 = {};
    for (const t of kaneoTasks2) taskByTitle2[t.title.toLowerCase().trim()] = t;

    // Build Plane module names
    const planeModuleNames = {};
    for (const pm of planeModules) planeModuleNames[pm.id] = pm.name;

    let assigned = 0;
    let failedMod = 0;
    for (const issue of issuesWithModule) {
      const task = taskByTitle2[issue.name.toLowerCase().trim()];
      const modName = planeModuleNames[moduleIssueMap[issue.id]];
      if (!task || !modName) continue;
      const modId = moduleByName[modName];
      if (!modId) continue;
      try {
        await kaneoFetch("PUT", `/task/${task.id}`, {
          title: task.title,
          description: task.description || "",
          priority: task.priority || "no-priority",
          status: task.status,
          projectId: KANEO_PROJECT_ID,
          position: task.position || 0,
          moduleId: modId,
        });
        assigned++;
      } catch (_e) {
        failedMod++;
      }
    }
    console.log(`  ${assigned} assigned, ${failedMod} failed`);
  }

  console.log("\n── Migration complete ──");
  console.log(
    `  ${tasks.length} tasks imported, ${planeLabels.length} labels, ${planeModules.length} modules`,
  );
}

main().catch((e) => {
  console.error("\nMigration failed:", e.message);
  process.exit(1);
});
