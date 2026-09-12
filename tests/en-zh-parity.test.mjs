import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function headings(text, level) {
  const prefix = "#".repeat(level);
  return text.split("\n").filter((line) => line.startsWith(`${prefix} `));
}

function numberedRules(text, startMarker) {
  const tail = text.slice(text.indexOf(startMarker));
  return tail.split("\n").filter((line) => /^\d+\. /.test(line));
}

function escapeRegex(token) {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("English and Chinese skill files stay structurally in sync", async () => {
  const en = await read("SKILL.md");
  const zh = await read("SKILL_zh.md");

  assert.match(en, /^version: 0\.10\.1$/m);
  assert.match(zh, /^version: 0\.10\.1$/m);
  assert.match(en, /^description: Use when /m);
  assert.match(zh, /^description: Use when /m);

  assert.equal(headings(en, 2).length, headings(zh, 2).length, "top-level (##) section counts differ");
  assert.equal(headings(en, 3).length, headings(zh, 3).length, "### subsection counts differ");

  const enRules = numberedRules(en, "## Core Rules");
  const zhRules = numberedRules(zh, "## 核心规则");
  assert.equal(enRules.length, zhRules.length, "Core Rule counts differ");
  assert.ok(enRules.length >= 14, "expected at least 14 core rules in English");
  assert.ok(zhRules.length >= 14, "expected at least 14 core rules in Chinese");

  // The code-like trigger tokens must appear in both files so both languages stay routable.
  const sharedTokens = [
    "load memory",
    "remember this",
    "save this",
    "update memory",
    "wrap this up",
    "memory status",
    "memory upgrade",
    "memory health",
    "clean up memory",
    "archive",
    "delete",
    "recover",
    "bin/memory",
    "PERSISTENT_MEMORY_HOME",
  ];
  for (const token of sharedTokens) {
    assert.match(en, new RegExp(escapeRegex(token)), `missing English token: ${token}`);
    assert.match(zh, new RegExp(escapeRegex(token)), `missing Chinese-file token: ${token}`);
  }
});
