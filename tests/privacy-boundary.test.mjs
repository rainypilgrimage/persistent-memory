import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createSyntheticProject } from "./helpers/create-synthetic-project.mjs";

const forbiddenPatterns = [
  /C:\\Users\\[^\\\s]+/i,
  /\/Users\/[^/\s]+/,
  /[A-Z]:\\/i,
  /https?:\/\//i,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  /\b[0-9a-f]{40}\b/i,
];

test("synthetic scenario artifacts contain no personal identifiers", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-alpha-"));
  try {
    const files = await createSyntheticProject(root, "duplicate-owner");
    for (const file of files) {
      const content = await readFile(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        assert.doesNotMatch(content, pattern, `${file} matched ${pattern}`);
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
