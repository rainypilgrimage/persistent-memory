import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createSyntheticProject } from "./helpers/create-synthetic-project.mjs";

test("stale-source scenario contains a newer first-party material than the status snapshot", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-alpha-"));
  try {
    await createSyntheticProject(root, "stale-source");
    const status = await readFile(path.join(root, "workspace/alpha-status.md"), "utf8");
    const material = await readFile(path.join(root, "workspace/team-update.md"), "utf8");
    assert.match(status, /last_verified: 2026-01-01/);
    assert.match(material, /source_date: 2026-01-02/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("duplicate-owner scenario contains two current-status owners", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-alpha-"));
  try {
    const files = await createSyntheticProject(root, "duplicate-owner");
    let owners = 0;
    for (const file of files) {
      const content = await readFile(file, "utf8");
      if (content.includes("role: current-status")) owners += 1;
    }
    assert.equal(owners, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
