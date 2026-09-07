import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const CLI = fileURLToPath(new URL("../bin/memory", import.meta.url));
const exec = promisify(execFile);

async function run(root, args) {
  try {
    const { stdout, stderr } = await exec("node", [CLI, ...args], {
      env: { ...process.env, PERSISTENT_MEMORY_HOME: root },
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

async function seedActive(root) {
  await mkdir(path.join(root, "projects"), { recursive: true });
  await writeFile(path.join(root, "_index.md"), "# Memory Index\n\n- projects/old.md — old project memory\n\n", "utf8");
  await writeFile(path.join(root, "projects/old.md"), "# Old\n\nstale content\n", "utf8");
}

test("validate enforces the relative-path safety contract", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    await seedActive(root);
    const ok = await run(root, ["validate", "projects/old.md"]);
    assert.equal(ok.code, 0, ok.stderr);
    assert.match(ok.stdout, /"ok":true/);

    assert.notEqual((await run(root, ["validate", "../outside.md"])).code, 0);
    assert.notEqual((await run(root, ["validate", "/etc/passwd"])).code, 0);
    assert.notEqual((await run(root, ["validate", "_core/profile.md"])).code, 0);
    assert.notEqual((await run(root, ["validate", "a/../b.md"])).code, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("upgrade creates only the missing lifecycle structure", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    const res = await run(root, ["upgrade", "--yes"]);
    assert.equal(res.code, 0, res.stderr);
    for (const p of ["_core", "projects", "notes", "_archive", "_archive/_trash", "_index.md", "_archive/_index.md"]) {
      await access(path.join(root, p));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("archive moves the file, removes the index route, and records the entry", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    await seedActive(root);
    const res = await run(root, ["archive", "projects/old.md", "--reason", "done", "--yes"]);
    assert.equal(res.code, 0, res.stderr);
    await assert.rejects(access(path.join(root, "projects/old.md")));
    await access(path.join(root, "_archive/projects/old.md"));
    const index = await readFile(path.join(root, "_index.md"), "utf8");
    assert.doesNotMatch(index, /projects\/old\.md/);
    const archive = await readFile(path.join(root, "_archive/_index.md"), "utf8");
    assert.match(archive, /### projects\/old\.md/);
    assert.match(archive, /- original_path: projects\/old\.md/);
    assert.match(archive, /- state: archived/);
    assert.match(archive, /- reason: done/);
    assert.match(archive, /- active_index_line: - projects\/old\.md — old project memory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("delete moves to trash with a deadline, recover restores the index line", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    await seedActive(root);
    assert.equal((await run(root, ["archive", "projects/old.md", "--reason", "done", "--yes"])).code, 0);

    const del = await run(root, ["delete", "projects/old.md", "--yes"]);
    assert.equal(del.code, 0, del.stderr);
    await access(path.join(root, "_archive/_trash/projects/old.md"));
    const archive = await readFile(path.join(root, "_archive/_index.md"), "utf8");
    assert.match(archive, /- state: trashed/);
    assert.match(archive, /- deleted_at: \d{4}-\d{2}-\d{2}/);
    assert.match(archive, /- recover_deadline: \d{4}-\d{2}-\d{2}/);

    const rec = await run(root, ["recover", "projects/old.md", "--yes"]);
    assert.equal(rec.code, 0, rec.stderr);
    await access(path.join(root, "projects/old.md"));
    const index = await readFile(path.join(root, "_index.md"), "utf8");
    assert.match(index, /- projects\/old\.md — old project memory/);
    const archiveAfter = await readFile(path.join(root, "_archive/_index.md"), "utf8");
    assert.doesNotMatch(archiveAfter, /### projects\/old\.md/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("mutating commands preview and change nothing without --yes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    await seedActive(root);
    const res = await run(root, ["archive", "projects/old.md", "--reason", "done"]);
    assert.equal(res.code, 0, res.stderr);
    assert.match(res.stdout, /Re-run with --yes/);
    await access(path.join(root, "projects/old.md"));
    const index = await readFile(path.join(root, "_index.md"), "utf8");
    assert.match(index, /projects\/old\.md/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects symlinks that resolve outside the memory root", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "pm-out-"));
  try {
    await seedActive(root);
    await mkdir(path.join(root, "projects", "sub"), { recursive: true });
    try {
      await symlink(outside, path.join(root, "projects", "sub", "link"));
    } catch (err) {
      // Windows may disallow symlink creation without Developer Mode or elevation.
      // The production path-safety logic is still covered on platforms that support it.
      if (err?.code === "EPERM" || err?.code === "EACCES") {
        t.skip(`symlink creation unavailable: ${err.code}`);
        return;
      }
      throw err;
    }
    await writeFile(path.join(outside, "escape.md"), "secret\n", "utf8");

    assert.notEqual((await run(root, ["validate", "projects/sub/link"])).code, 0);
    const archive = await run(root, ["archive", "projects/sub/link/escape.md", "--reason", "x", "--yes"]);
    assert.notEqual(archive.code, 0);
    assert.match(archive.stderr, /symlink escapes memory root/);
    await access(path.join(outside, "escape.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("health lists expired trash without changing files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pm-cli-"));
  try {
    await seedActive(root);
    await run(root, ["archive", "projects/old.md", "--reason", "done", "--yes"]);
    await run(root, ["delete", "projects/old.md", "--yes"]);
    // Force the deadline into the past so health flags it as expired.
    const archiveFile = path.join(root, "_archive/_index.md");
    const text = await readFile(archiveFile, "utf8");
    const expired = text.replace(/- recover_deadline: \d{4}-\d{2}-\d{2}/, "- recover_deadline: 2000-01-01");
    await writeFile(archiveFile, expired, "utf8");

    const res = await run(root, ["health"]);
    assert.equal(res.code, 0, res.stderr);
    assert.match(res.stdout, /projects\/old\.md/);
    await access(path.join(root, "_archive/_trash/projects/old.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
