import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  return target;
}

export async function createSyntheticProject(root, scenario) {
  const files = [];

  files.push(
    await write(
      root,
      ".persistent-memory/_index.md",
      [
        "# Memory Index",
        "",
        "- projects/alpha.md — Stable Project Alpha memory; current status is routed through the declared status source.",
        "",
      ].join("\n"),
    ),
  );

  files.push(
    await write(
      root,
      ".persistent-memory/projects/alpha.md",
      [
        "# Project Alpha",
        "",
        "## Summary",
        "",
        "- Stable product purpose and reviewed decisions.",
        "- Current operational facts are owned by the declared status source.",
        "- Source materials are registered separately.",
        "",
        "## Context Routing",
        "",
        "- Current status: workspace/alpha-status.md",
        "- Materials index: workspace/materials-index.md",
        "- Live source: workspace/alpha-live-source.md (fictional://alpha-board)",
        "",
      ].join("\n"),
    ),
  );

  files.push(
    await write(
      root,
      "workspace/alpha-live-source.md",
      [
        "# Fictional Project Alpha Live Source",
        "",
        "> source_route: fictional://alpha-board",
        "> source_date: 2026-01-03",
        "> authority: authoritative-current-status",
        "",
        "## Current Status Evidence",
        "",
        "- Blocker: external design approval is pending",
        "- Precedence: This source supersedes workspace/alpha-status.md when newer.",
        "",
      ].join("\n"),
    ),
  );

  files.push(
    await write(
      root,
      "workspace/alpha-status.md",
      [
        "# Project Alpha Current Status",
        "",
        "> role: current-status",
        "> last_verified: 2026-01-01",
        "",
        "- Phase: prototype",
        "- Blocker: none recorded",
        "",
      ].join("\n"),
    ),
  );

  files.push(
    await write(
      root,
      "workspace/materials-index.md",
      [
        "# Project Alpha Materials",
        "",
        "- team-update.md — first-party update dated 2026-01-02",
        "",
      ].join("\n"),
    ),
  );

  files.push(
    await write(
      root,
      "workspace/team-update.md",
      [
        "# Fictional Team Update",
        "",
        "> source_date: 2026-01-02",
        "",
        "- A new blocker exists.",
        "",
      ].join("\n"),
    ),
  );

  if (scenario === "duplicate-owner") {
    files.push(
      await write(
        root,
        "workspace/alpha-status-copy.md",
        [
          "# Project Alpha Alternate Status",
          "",
          "> role: current-status",
          "> last_verified: 2026-01-02",
          "",
          "- Phase: implementation",
          "",
        ].join("\n"),
      ),
    );
  }

  return files;
}
