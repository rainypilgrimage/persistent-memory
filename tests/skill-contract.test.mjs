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

test("English skill defines project context ownership, freshness, and coordinated updates", async () => {
  const skill = await readRepoFile("SKILL.md");
  assert.match(skill, /\*\*v0\.9\.1:\*\*/);
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
    ["compact current-status working set", /Keep the current-status source as a compact working set, not a progress log/i],
    ["replace superseded status", /Replace superseded status values instead of appending history/i],
    ["route status history out", /Route completed-task history and process narrative to materials.*keep raw evidence in its first-party material and register only a material pointer instead of copying raw artifacts into memory.*durable reviewed outcomes to stable memory/is],
    ["material pointer boundary", /Keep raw evidence in its first-party material and register only a material pointer instead of copying raw artifacts into memory/is],
  ], "English ownership section");
  assertRequirements(freshness, [
    ["all current-state trigger meanings", /claim that means current, latest, completed, blocked, or no active task/is],
    ["declared status source read", /Read the declared current-status source when one exists/i],
    ["verification date check", /Check its last-updated or last-verified date/i],
    ["declared first-party/live source check", /Check declared first-party or live sources when the task depends on real-time facts/i],
    ["newer authoritative source precedence", /newer material or live source conflicts.*treat the newer authoritative source as evidence.*do not repeat the old status as current/is],
    ["coverage or limitation disclosure", /state the coverage or limitation when claiming current project state/i],
    ["structured current-state coverage receipt", /After a current-state answer, add one concise `Context coverage:` line/i],
    ["coverage receipt contents", /name the current-status source and any required live or first-party sources actually checked/i],
    ["only consequential unread sources", /Mention only declared relevant sources that were not read and could change the answer/i],
    ["no corpus or absolute-path dump", /Do not enumerate unrelated files, the whole memory root, or unnecessary absolute paths/i],
    ["ordinary answers omit the receipt", /Omit this receipt for answers that do not depend on current project state/i],
    ["receipt is a required standalone line", /Every current-state answer must end with exactly one standalone line that starts with `Context coverage:`/i],
    ["coverage is not folded into prose", /Do not fold this coverage into the answer body/i],
    ["minimum sufficient state answer", /Use minimum sufficient state in the answer: include only the fields requested or required to answer/i],
    ["full status only when requested", /Do not replay the whole current-status source unless the user explicitly asks for a full or detailed status/i],
    ["detailed status is not history dump", /A full or detailed status may expand current fields, but must not automatically include historical logs, process narrative, or raw evidence unless explicitly requested/i],
    ["detailed status output shape", /For a full or detailed status, format only the requested current fields and necessary freshness evidence; do not add an `?Additional context`?, `?History`?, or `?Status notes`? section unless explicitly requested/i],
    ["detailed status ordered optional fields", /For a detailed current-status request, unless history or evidence is explicitly requested, use requested and available fields in this order: Phase, Active objective, Active tasks, Blocker, Owner, Next action.*Always put `Context coverage:` last.*Omit fields not requested or unavailable/is],
    ["detailed status unresolved exception", /Hard output contract for detailed current-status requests applies only when the request is directly answerable from resolved, read sources.*If a required source is unread, sources conflict, or ownership is ambiguous, state the limitation or ask one targeted clarifying question instead of forcing the template/is],
    ["detailed status hard output contract", /For a directly answerable detailed current-status request, output only the requested available fields in that order plus exactly one `Context coverage:` line.*Do not add any other heading, paragraph, note, or historical item/is],
    ["detailed status field shape", /Use this field order and line shape for detailed current status.*include only requested and available fields/is],
    ["safe coverage aliases", /Use only declared safe aliases or relative paths.*redact or generalize sensitive filenames, project names, usernames, identifiers, repository URLs, hashes, and absolute paths.*If no safe alias exists, use a generic source label/is],
    ["scoped live-source reads", /When a live source supports scoped queries or filters, retrieve only the relevant project, workstream, and fields/i],
    ["incomplete-source coverage limit", /Do not claim that project context is fully loaded when declared current-status or required first-party sources were not read/i],
  ], "English Freshness Gate");
  assertRequirements(saving, [
    ["broad coordinated update intent", /Treat broad requests such as [“\"]update memory,[”\"] [“\"]update project context,[”\"] [“\"]wrap this up,[”\"] or [“\"]update what needs updating[”\"] as one coordinated project-context update/is],
    ["internal rather than user classification", /Do not require the user to choose among stable memory, current status, materials, or index/is],
    ["conversation and declared-source scope", /Inspect the current conversation and declared relevant sources/i],
    ["four-layer classification", /Classify the proposed changes as stable memory, current status, materials, or index/i],
    ["canonical owner identification", /Identify the canonical owner for each fact/i],
    ["candidate filtering", /Skip transient discussion, duplicates, unsupported inferences, rejected options, obsolete facts, and layers with no necessary change/i],
    ["zero-change outcome", /If no candidate remains after filtering, report that no update is needed and do not request confirmation/i],
    ["single consolidated preview", /Show one consolidated preview.*only the layers that need changes.*exact destination and content/is],
    ["single confirmation before writing", /Request one confirmation for the complete non-destructive write set/is],
    ["targeted questions only for unresolved ownership", /Ask a targeted question only when facts conflict, ownership is ambiguous, or a new source's authority cannot be determined/is],
    ["optional narrow overrides", /Only update stable memory.*only update status.*only register materials/is],
    ["no automatic background synchronization", /does not add background scanning, live polling, bulk migration, destructive lifecycle actions, or unconfirmed writes/is],
    ["no duplicate status or volatile index facts", /Do not create duplicate current-status sources or copy volatile facts into `_index\.md`/i],
  ], "English Saving section");
  assertRequirements(coreRules, [
    ["Core Rule 8", /^8\. Keep one canonical current-status source per active project\.$/m],
    ["Core Rule 9", /^9\. Keep indexes route-only; do not duplicate volatile project facts in them\.$/m],
    ["Core Rule 10", /^10\. Apply the Freshness Gate before making current-state claims\.$/m],
    ["Core Rule 11", /^11\. Treat broad update intent as one coordinated project-context update; do not make the user choose the internal storage layer\.$/m],
    ["Core Rule 12", /^12\. Bundle non-destructive context changes into one preview and one confirmation\.$/m],
  ], "English Core Rules");
  assert.doesNotMatch(skill, /Store stable context, decisions, concise project state/);
  assert.doesNotMatch(skill, /[“\"]Update memory[”\"].*changes stable memory only/is);
});

test("Chinese skill defines equivalent ownership, freshness, and coordinated updates", async () => {
  const skill = await readRepoFile("SKILL_zh.md");
  assert.match(skill, /\*\*v0\.9\.1：\*\*/);
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
    ["紧凑当前状态工作集", /当前状态源必须保持为紧凑的当前工作集，不得充当进展日志/],
    ["替换过时状态", /更新时替换已过时的状态值，不得追加历史记录/],
    ["将状态历史移出", /将已完成任务历史和过程叙述放入材料；将原始证据保留在其一手材料中，只登记材料指针，不得把原始材料复制进记忆；将持久且经过审阅的结果放入稳定记忆/s],
    ["材料指针边界", /将原始证据保留在其一手材料中，只登记材料指针，不得把原始材料复制进记忆/],
  ], "中文所有权章节");
  assertRequirements(freshness, [
    ["所有当前状态触发语义", /“当前、最新、已完成、被阻塞、没有任务”等含义/s],
    ["读取已声明状态源", /如果项目声明了当前状态源，先读取它/],
    ["核验日期", /检查最后更新或最后核验日期/],
    ["核对已声明一手或实时来源", /核对已声明的一手来源或实时来源/],
    ["较新权威来源优先", /更新更晚的材料或实时来源与状态快照冲突，以较新且更权威的来源作为证据，不得继续把旧状态写成当前事实/s],
    ["说明覆盖或限制", /简要说明已覆盖的来源或仍存在的限制/],
    ["结构化当前状态覆盖回执", /当前状态回答末尾添加一行简短的 `上下文覆盖：`/],
    ["覆盖回执内容", /写明实际读取的当前状态源，以及实际核验的必要一手或实时来源/],
    ["只列可能影响结论的未读来源", /只提及已声明、尚未读取且可能改变结论的相关来源/],
    ["不枚举全部文件或绝对路径", /不得枚举无关文件、整棵记忆目录或不必要的绝对路径/],
    ["普通回答不显示回执", /回答不依赖项目当前状态时，不添加该回执/],
    ["回执是必需的独立行", /每个当前状态回答都必须以一行独立的 `上下文覆盖：` 结尾/],
    ["覆盖信息不得折叠进正文", /不得把覆盖信息折叠进回答正文/],
    ["最小充分状态回答", /回答使用最小充分状态：只包含用户所问或作答所必需的字段/],
    ["仅按要求展开完整状态", /除非用户明确要求完整状态或详细状态，不得复述整个当前状态源/],
    ["详细状态不自动展开历史", /完整状态或详细状态可以展开当前字段，但不得自动包含历史记录、过程叙述或原始证据，除非用户明确要求/],
    ["详细状态输出形状", /完整状态或详细状态只列所需当前字段和必要新鲜度证据；除非用户明确要求，不得添加“其他上下文”“历史”或“状态备注”段落/],
    ["详细状态有序可选字段", /详细当前状态请求中，除非明确要求历史或证据，使用以下顺序的已请求并且可用字段：阶段、当前目标、进行中任务、阻塞、负责人、下一步。将 `上下文覆盖：` 始终放在末尾。省略用户未请求或不可用的字段/],
    ["详细状态未决例外", /详细当前状态请求的硬输出契约仅适用于已读取且已解决来源、可以直接回答的情况。如果必要来源未读、来源冲突或所有权不明确，报告限制或提出一个针对性问题，不得强制使用模板/],
    ["详细状态硬输出契约", /对于可以直接回答的详细当前状态请求，只输出已请求且可用的字段，按上述顺序排列，并且只包含一行 `上下文覆盖：`。除字段值外不得添加任何其他标题、段落、备注或历史项/s],
    ["详细状态字段形状", /详细当前状态使用以下字段顺序和行格式，只包含已请求且可用的字段/],
    ["安全覆盖别名", /使用已声明的安全别名或相对路径.*对敏感文件名、项目名、用户名、标识符、仓库 URL、哈希和绝对路径统一脱敏或泛化；没有安全别名时使用通用来源标签/],
    ["限定实时来源读取范围", /实时来源支持限定查询或过滤时，只获取相关项目、工作流和字段/],
    ["来源未读时的覆盖限制", /没有读取已声明的当前状态源或必要一手来源时，不得声称项目上下文已经完整加载/],
  ], "中文新鲜度闸门");
  assertRequirements(saving, [
    ["宽泛更新意图触发协调更新", /将“更新记忆”“更新项目上下文”“帮我收尾”或“把该更新的处理好”等宽泛请求视为一次协调式项目上下文更新/],
    ["内部分类而非要求用户分类", /不得要求用户先在稳定记忆、当前状态、材料和索引之间做选择/],
    ["仅检查本轮对话与已声明来源", /检查本轮对话和已声明的相关来源/],
    ["四层分类", /将拟修改内容分类为稳定记忆、当前状态、材料或索引/],
    ["确定唯一所有者", /为每项事实确定唯一所有者/],
    ["过滤无须写入内容", /跳过临时讨论、重复内容、无证据推断、已否决方案、过时事实和无需修改的层/],
    ["零改动结果", /如果过滤后没有候选变化，说明无需更新，不请求确认/],
    ["一次合并预览", /只展示一份合并预览.*仅包含需要修改的层.*准确目标和内容/s],
    ["一次确认", /针对完整的非破坏性写入集合只请求一次确认/],
    ["仅在无法裁决时定向提问", /只有在事实冲突、所有权不明确或无法判断新来源的权威性时，才提出一个针对性问题/],
    ["可选精确范围", /只更新稳定记忆.*只更新状态.*只登记材料/s],
    ["不做后台自动同步", /不会引入后台扫描、实时轮询、批量迁移、破坏性生命周期操作或未经确认的写入/],
    ["不重复状态、不写易变索引", /不得创建重复的当前状态源，也不得把易变事实复制进 `_index\.md`/],
  ], "中文保存章节");
  assertRequirements(coreRules, [
    ["核心规则 8", /^8\. 每个活跃项目只保留一个权威当前状态源。$/m],
    ["核心规则 9", /^9\. 索引只负责路由，不复制高频变化的项目事实。$/m],
    ["核心规则 10", /^10\. 声称当前状态前必须执行新鲜度闸门。$/m],
    ["核心规则 11", /^11\. 将宽泛更新意图视为一次协调式项目上下文更新，不让用户选择内部存储层。$/m],
    ["核心规则 12", /^12\. 将非破坏性上下文改动合并为一次预览和一次确认。$/m],
  ], "中文核心规则");
  assert.doesNotMatch(skill, /“更新记忆”只修改稳定记忆/);
});

test("READMEs explain coordinated updates without promising automatic synchronization", async () => {
  const english = await readRepoFile("README.md");
  const chinese = await readRepoFile("README_zh.md");
  assert.match(english, /v0\.9\.1/);
  assert.match(chinese, /v0\.9\.1/);
  assert.match(english, /v0\.9\.1 adds compact current-status output, context-coverage receipts, and safe source-label redaction/is);
  assert.match(chinese, /v0\.9\.1 新增紧凑当前状态输出、上下文覆盖回执和安全来源标签脱敏/s);
  assert.match(english, /update memory.*coordinated project-context update/is);
  assert.match(english, /one consolidated preview.*one confirmation/is);
  assert.match(english, /If nothing remains after filtering.*no confirmation/i);
  assert.match(english, /does not run in the background.*declared relevant sources/is);
  assert.match(chinese, /更新记忆.*协调式项目上下文更新/s);
  assert.match(chinese, /一次合并预览.*一次确认/s);
  assert.match(chinese, /如果过滤后没有内容需要修改.*不请求确认/);
  assert.match(chinese, /不会在后台运行.*已声明的相关来源/s);
  assert.match(english, /current-state answer.*`Context coverage:`.*one concise line/is);
  assert.match(english, /does not enumerate unrelated files.*whole memory root.*unnecessary absolute paths/is);
  assert.match(chinese, /当前状态回答.*`上下文覆盖：`.*一行简短/s);
  assert.match(chinese, /不枚举无关文件.*整棵记忆目录.*不必要的绝对路径/s);
  assert.match(english, /compact working set.*not a progress log/is);
  assert.match(english, /minimum sufficient state.*full or detailed status/is);
  assert.match(chinese, /紧凑的当前工作集.*不得充当进展日志/s);
  assert.match(chinese, /最小充分状态.*完整状态或详细状态/s);
});

test("READMEs assign only stable reviewed project background to memory", async () => {
  const english = section(await readRepoFile("README.md"), "What Belongs in Memory");
  const chinese = section(await readRepoFile("README_zh.md"), "什么该进入记忆");

  assert.match(english, /stable reviewed project background, durable decisions, constraints, results, and pointers to canonical status and source materials/i);
  assert.doesNotMatch(english, /concise project state/i);
  assert.match(chinese, /经过审阅的稳定项目背景、持久决策、约束、结果，以及指向权威状态和来源材料的路径/);
  assert.doesNotMatch(chinese, /精炼项目状态/);
});
