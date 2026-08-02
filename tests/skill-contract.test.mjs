import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readRepoFile(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const englishRequirements = [
  "One fact, one owner",
  "Stable memory",
  "Current status",
  "Materials",
  "Index",
  "Freshness Gate",
  "Do not claim",
];

const chineseRequirements = [
  "一个事实，一个所有者",
  "稳定记忆",
  "当前状态",
  "材料",
  "索引",
  "新鲜度闸门",
  "不得声称",
];

test("English skill defines project context ownership and freshness", async () => {
  const skill = await readRepoFile("SKILL.md");
  assert.match(skill, /\*\*v0\.8\.1:\*\*/);
  for (const phrase of englishRequirements) {
    assert.match(skill, new RegExp(phrase, "i"), `Missing English contract phrase: ${phrase}`);
  }
  assert.doesNotMatch(skill, /Store stable context, decisions, concise project state/);
});

test("Chinese skill defines equivalent project context ownership and freshness", async () => {
  const skill = await readRepoFile("SKILL_zh.md");
  assert.match(skill, /\*\*v0\.8\.1：\*\*/);
  for (const phrase of chineseRequirements) {
    assert.match(skill, new RegExp(phrase), `Missing Chinese contract phrase: ${phrase}`);
  }
});

test("READMEs explain that update memory is not project-wide synchronization", async () => {
  const english = await readRepoFile("README.md");
  const chinese = await readRepoFile("README_zh.md");
  assert.match(english, /v0\.8\.1/);
  assert.match(chinese, /v0\.8\.1/);
  assert.match(english, /update memory.*stable memory/is);
  assert.match(english, /does not automatically synchronize/is);
  assert.match(chinese, /更新记忆.*稳定记忆/s);
  assert.match(chinese, /不会自动同步/s);
});
