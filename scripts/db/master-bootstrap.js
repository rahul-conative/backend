#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backendRoot = path.resolve(__dirname, "..", "..");

const steps = [
  { name: "Run Sequelize migrations", cmd: ["node", "scripts/db/run-sequelize-migrations.js"] },
  { name: "Seed RBAC", cmd: ["node", "scripts/db/seed-rbac.js"] },
  { name: "Seed platform/dev catalog data", cmd: ["node", "scripts/db/seed-dev-data.js"] },
  { name: "Seed category depth-2 children", cmd: ["node", "scripts/db/seed-category-children.js"] },
  { name: "Seed CMS pages", cmd: ["node", "scripts/db/seed-cms.js"] },
  { name: "Seed CMS static content keys", cmd: ["node", "scripts/db/seed-cms-static-content.js"] },
  { name: "Seed catalog media", cmd: ["node", "scripts/db/seed-catalog-media.js"] },
];

function runStep(step) {
  console.log(`\n==> ${step.name}`);
  const result = spawnSync(step.cmd[0], step.cmd.slice(1), {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`${step.name} failed with exit code ${result.status}`);
  }
}

function main() {
  console.log("Starting backend master bootstrap...");
  steps.forEach(runStep);
  console.log("\nMaster bootstrap completed successfully.");
}

try {
  main();
} catch (error) {
  console.error("\nMaster bootstrap failed:", error.message);
  process.exit(1);
}
