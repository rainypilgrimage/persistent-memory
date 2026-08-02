import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readRepoFile(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function section(document, heading, level = 2) {
  const prefix = "#".repeat(level);
  const marker = `${prefix} ${heading}`;
  const start = document.indexOf(marker);
  assert.notEqual(start, -1, `Missing section: ${heading}`);
  const next = document.indexOf(`\n${prefix} `, start + marker.length);
  return document.slice(start, next === -1 ? undefined : next);
}

function assertRequirements(content, requirements, label) {
  for (const [description, pattern] of requirements) {
    assert.match(content, pattern, `${label} is missing: ${description}`);
  }
}

test("English skill defines project context ownership and freshness", async () => {
  const skill = await readRepoFile("SKILL.md");
  assert.match(skill, /\*\*v0\.8\.1:\*\*/);
  const ownership = section(skill, "Project Context Ownership");
  const freshness = section(skill, "Freshness Gate", 3);
  const saving = section(skill, "Saving");
  const coreRules = section(skill, "Core Rules");

  assertRequirements(ownership, [
    ["stable-memory role", /\*\*Stable memory:\*\*.*reviewed background.*decisions.*constraints.*durable results/is],
    ["single canonical current-status role", /\*\*Current status:\*\*.*single canonical source.*phase.*tasks.*blockers.*owners.*next actions/is],
    ["first-party materials role", /\*\*Materials:\*\*.*first-party messages.*meeting notes.*repositories.*datasets.*source evidence/is],
    ["route-only index role", /\*\*Index:\*\*.*routing metadata.*must not own volatile project facts/is],
    ["one-fact/one-owner rule", /\*\*One fact, one owner\.\*\*/i],
    ["duplicate-owner stop and ask", /two files both claim.*current-status source.*stop and ask the user to choose or approve a migration/is],
  ], "English ownership section");
  assertRequirements(freshness, [
    ["all current-state trigger meanings", /claim that means current, latest, completed, blocked, or no active task/is],
    ["declared status source read", /Read the declared current-status source when one exists/i],
    ["verification date check", /Check its last-updated or last-verified date/i],
    ["declared first-party/live source check", /Check declared first-party or live sources when the task depends on real-time facts/i],
    ["newer authoritative source precedence", /newer material or live source conflicts.*treat the newer authoritative source as evidence.*do not repeat the old status as current/is],
    ["coverage or limitation disclosure", /state the coverage or limitation when claiming current project state/i],
    ["incomplete-source coverage limit", /Do not claim that project context is fully loaded when declared current-status or required first-party sources were not read/i],
  ], "English Freshness Gate");
  assertRequirements(saving, [
    ["stable-only update-memory boundary", /[“\"]Update memory[”\"].*changes stable memory only.*does not automatically synchronize project status, source materials, or every routing file/is],
    ["four-layer classification", /Classify the proposed changes as stable memory, current status, materials, or index/i],
    ["canonical owner identification", /Identify the canonical owner for each fact/i],
    ["exact per-layer preview", /Show the user the exact per-layer preview/i],
    ["explicit confirmation before writing", /Wait for confirmation before writing/i],
    ["no duplicate status or volatile index facts", /Do not create duplicate current-status sources or copy volatile facts into `_index\.md`/i],
  ], "English Saving section");
  assertRequirements(coreRules, [
    ["Core Rule 8", /^8\. Keep one canonical current-status source per active project\.$/m],
    ["Core Rule 9", /^9\. Keep indexes route-only; do not duplicate volatile project facts in them\.$/m],
    ["Core Rule 10", /^10\. Apply the Freshness Gate before making current-state claims\.$/m],
  ], "English Core Rules");
  assert.doesNotMatch(skill, /Store stable context, decisions, concise project state/);
});

test("Chinese skill defines equivalent project context ownership and freshness", async () => {
  const skill = await readRepoFile("SKILL_zh.md");
  assert.match(skill, /\*\*v0\.8\.1：\*\*/);
  const ownership = section(skill, "项目上下文所有权");
  const freshness = section(skill, "新鲜度闸门", 3);
  const saving = section(skill, "保存");
  const coreRules = section(skill, "核心规则");

  assertRequirements(ownership, [
    ["稳定记忆角色", /\*\*稳定记忆：\*\*.*已确认的背景、决策、约束、持久结果与经验边界/s],
    ["唯一权威当前状态角色", /\*\*当前状态：\*\*.*当前阶段、任务、阻塞、负责人和下一步的唯一权威来源/s],
    ["一手材料角色", /\*\*材料：\*\*.*一手沟通、会议记录、仓库、数据集和其他来源证据/s],
    ["只路由索引角色", /\*\*索引：\*\*.*路由信息，不拥有高频变化的项目事实/s],
    ["一个事实一个所有者", /\*\*一个事实，一个所有者。\*\*/],
    ["重复所有者时停止并询问", /两个文件都声称自己是当前状态源，停止并请用户选择，或预览迁移方案后等待确认/s],
  ], "中文所有权章节");
  assertRequirements(freshness, [
    ["所有当前状态触发语义", /“当前、最新、已完成、被阻塞、没有任务”等含义/s],
    ["读取已声明状态源", /如果项目声明了当前状态源，先读取它/],
    ["核验日期", /检查最后更新或最后核验日期/],
    ["核对已声明一手或实时来源", /核对已声明的一手来源或实时来源/],
    ["较新权威来源优先", /更新更晚的材料或实时来源与状态快照冲突，以较新且更权威的来源作为证据，不得继续把旧状态写成当前事实/s],
    ["说明覆盖或限制", /简要说明已覆盖的来源或仍存在的限制/],
    ["来源未读时的覆盖限制", /没有读取已声明的当前状态源或必要一手来源时，不得声称项目上下文已经完整加载/],
  ], "中文新鲜度闸门");
  assertRequirements(saving, [
    ["更新记忆仅限稳定层", /“更新记忆”只修改稳定记忆，不会自动同步项目状态、来源材料或全部路由文件/],
    ["四层分类", /将拟修改内容分类为稳定记忆、当前状态、材料或索引/],
    ["确定唯一所有者", /为每项事实确定唯一所有者/],
    ["按层精确预览", /展示按层拆分的精确预览/],
    ["写入前明确确认", /等待用户确认后再写入/],
    ["不重复状态、不写易变索引", /不得创建重复的当前状态源，也不得把易变事实复制进 `_index\.md`/],
  ], "中文保存章节");
  assertRequirements(coreRules, [
    ["核心规则 8", /^8\. 每个活跃项目只保留一个权威当前状态源。$/m],
    ["核心规则 9", /^9\. 索引只负责路由，不复制高频变化的项目事实。$/m],
    ["核心规则 10", /^10\. 声称当前状态前必须执行新鲜度闸门。$/m],
  ], "中文核心规则");
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

test("READMEs assign only stable reviewed project background to memory", async () => {
  const english = section(await readRepoFile("README.md"), "What Belongs in Memory");
  const chinese = section(await readRepoFile("README_zh.md"), "什么该进入记忆");

  assert.match(english, /stable reviewed project background, durable decisions, constraints, results, and pointers to canonical status and source materials/i);
  assert.doesNotMatch(english, /concise project state/i);
  assert.match(chinese, /经过审阅的稳定项目背景、持久决策、约束、结果，以及指向权威状态和来源材料的路径/);
  assert.doesNotMatch(chinese, /精炼项目状态/);
});
