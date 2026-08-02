import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createSyntheticProject } from "./helpers/create-synthetic-project.mjs";

test("stale-source scenario routes current facts to a newer authoritative live source", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-alpha-"));
  try {
    await createSyntheticProject(root, "stale-source");
    const memory = await readFile(path.join(root, ".persistent-memory/projects/alpha.md"), "utf8");
    const status = await readFile(path.join(root, "workspace/alpha-status.md"), "utf8");
    const liveSource = await readFile(path.join(root, "workspace/alpha-live-source.md"), "utf8");
    const statusDate = status.match(/last_verified: (\d{4}-\d{2}-\d{2})/)[1];
    const liveSourceDate = liveSource.match(/source_date: (\d{4}-\d{2}-\d{2})/)[1];

    assert.match(memory, /Live source: workspace\/alpha-live-source\.md \(fictional:\/\/alpha-board\)/);
    assert.ok(liveSourceDate > statusDate, "live source must be newer than the status snapshot");
    assert.match(liveSource, /source_route: fictional:\/\/alpha-board/);
    assert.match(liveSource, /authority: authoritative-current-status/);
    assert.match(liveSource, /Blocker: external design approval is pending/);
    assert.match(liveSource, /supersedes workspace\/alpha-status\.md when newer/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale-source scenario exposes a newer conflicting first-party material", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-alpha-"));
  try {
    await createSyntheticProject(root, "stale-source");
    const status = await readFile(path.join(root, "workspace/alpha-status.md"), "utf8");
    const material = await readFile(path.join(root, "workspace/team-update.md"), "utf8");
    const statusDate = status.match(/last_verified: (\d{4}-\d{2}-\d{2})/)[1];
    const materialDate = material.match(/source_date: (\d{4}-\d{2}-\d{2})/)[1];

    assert.ok(materialDate > statusDate, "first-party material must be newer than the status snapshot");
    assert.match(status, /Blocker: none recorded/);
    assert.match(material, /Blocker: component certification is pending/);
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
