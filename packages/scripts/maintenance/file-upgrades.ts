#!/usr/bin/env node
//
// Turn the version-drift report into GitHub work orders.
//
// Two kinds of output, for two audiences:
//
//   - one summary issue, rewritten in place every run, so a maintainer can see
//     the whole backlog at a glance without scrolling through notifications;
//   - a small number of per-app issues, each a complete, self-contained upgrade
//     task: the exact edits to make and the exact command that proves the
//     result works.
//
// The per-app trickle is rate-limited on purpose. Every upgrade has to be
// booted and probed before it can be merged, so filing the entire backlog at
// once would produce a queue nobody can drain and would drown the two or three
// upgrades that actually matter today.
//
// Usage: node file-upgrades.ts work/version-drift.json
// Env:   GH_TOKEN, MAX_NEW_ISSUES (3), MAX_OPEN_ISSUES (10), DRY_RUN

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REPORT = process.argv[2] ?? "work/version-drift.json";
const MAX_NEW = Number(process.env.MAX_NEW_ISSUES ?? 3);
const MAX_OPEN = Number(process.env.MAX_OPEN_ISSUES ?? 10);
const DRY_RUN = Boolean(process.env.DRY_RUN);
const LABEL = "upgrade";
const SUMMARY_TITLE = "⬆️ Hub version drift";

interface Drift {
  slug: string;
  name: string;
  current: string;
  latest: string;
  latestTag: string;
  releaseDate: string;
  severity: "major" | "minor" | "patch" | "unknown";
  releaseNotes: string;
  edits: { file: string; from: string; to: string }[];
  imageTag: string | null;
  warnings: string[];
}

function gh(args: string[], input?: string): string {
  if (DRY_RUN) {
    console.log(`[dry-run] gh ${args.join(" ")}${input ? `\n${input}` : ""}`);
    return "";
  }
  return execFileSync("gh", args, {
    encoding: "utf-8",
    input,
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}

const issueTitle = (d: Drift) => `⬆️ Upgrade ${d.slug} to ${d.latest}`;

function workOrder(d: Drift): string {
  const edits = d.edits
    .map((e) => `- \`${e.file}\`\n  - \`${e.from}\` → \`${e.to}\``)
    .join("\n");

  return `**${d.name}** is on \`${d.current}\`; upstream released [\`${d.latest}\`](${d.releaseNotes})${
    d.releaseDate ? ` on ${d.releaseDate}` : ""
  } (${d.severity} bump).

### Changes to apply

${edits}

${
  d.imageTag
    ? `Container tag \`${d.imageTag}\` was verified to exist upstream.`
    : `> [!WARNING]\n> No published container tag was found for this version. Confirm the image exists before doing anything else — a release without an image is not shippable.`
}

${d.warnings.length ? `### Warnings\n\n${d.warnings.map((w) => `- ${w}`).join("\n")}\n` : ""}
### Required before merging

A newer release is not evidence that the new version still works with our
compose file, our \`.env\` and our volumes. Establish a baseline first, then
prove the bump did not regress it:

\`\`\`bash
# 1. baseline: does it pass today, before any change?
./packages/scripts/maintenance/test-stack.sh ${d.slug}

# 2. apply the edits above, then:
./packages/scripts/maintenance/test-stack.sh ${d.slug}
\`\`\`

The test pulls every image, waits for all services to become healthy, checks
that nothing crash-loops during a settle window, and makes a real HTTP request
to the app's entry point.

- If the baseline fails too, this app was already broken: fix that first or say
  so in the PR — it is not a regression from this bump.
- If the baseline passes and the bump fails, do **not** merge. Read the release
  notes: a required new env var or a migration usually needs \`.env\` or
  \`compose.yaml\` changes alongside the version.
- ${d.severity === "major" ? "This is a **major** bump: assume breaking changes and read the upgrade guide before touching anything." : "Attach the test output to the PR."}

<sub>Filed automatically from \`work/version-drift.json\`.</sub>`;
}

function main() {
  const report = JSON.parse(readFileSync(REPORT, "utf-8"));
  const drifted: Drift[] = report.drifted ?? [];

  // Existing open issues, so a re-run updates rather than duplicates.
  const open: { number: number; title: string }[] = JSON.parse(
    gh(["issue", "list", "--label", LABEL, "--state", "open", "--limit", "200", "--json", "number,title"]) ||
      "[]"
  );
  const byTitle = new Map(open.map((i) => [i.title, i.number]));

  // --- summary -------------------------------------------------------------
  const table = drifted.length
    ? [
        "| App | Current | Latest | Bump | Released | Image tag |",
        "| --- | --- | --- | --- | --- | --- |",
        ...drifted.map(
          (d) =>
            `| [${d.slug}](../tree/main/hub/${d.slug}) | \`${d.current}\` | [\`${d.latest}\`](${d.releaseNotes}) | ${d.severity} | ${
              d.releaseDate || "?"
            } | ${d.imageTag ? `\`${d.imageTag}\`` : "⚠️ none found"} |`
        ),
      ].join("\n")
    : "Every hub entry is on the latest upstream release. 🎉";

  const summary = `${drifted.length} of ${report.checked} hub entries are behind upstream, as of ${report.generatedAt.slice(0, 10)}.

${table}

Descriptive metadata (stars, license, homepage, repository, \`updated_at\`) is refreshed automatically by the same workflow. Versions are not: each one needs \`test-stack.sh\` to pass before it can be merged, so they are filed individually and worked through a few at a time.

<sub>Rewritten on every run of \`.github/workflows/hub-maintenance.yml\`.</sub>`;

  const summaryNumber = byTitle.get(SUMMARY_TITLE);
  if (summaryNumber) {
    gh(["issue", "edit", String(summaryNumber), "--body-file", "-"], summary);
    console.log(`updated summary issue #${summaryNumber}`);
  } else {
    gh(
      ["issue", "create", "--title", SUMMARY_TITLE, "--label", LABEL, "--body-file", "-"],
      summary
    );
    console.log("created summary issue");
  }

  // --- per-app work orders -------------------------------------------------
  // Everything except the summary counts towards the in-flight budget.
  const inFlight = open.filter((i) => i.title !== SUMMARY_TITLE).length;
  const budget = Math.min(MAX_NEW, Math.max(0, MAX_OPEN - inFlight));
  if (budget === 0) {
    console.log(`${inFlight} upgrade issues already open — filing none this run`);
    return;
  }

  // Oldest release first: the longer a version has been superseded, the more
  // security fixes our users are missing.
  const candidates = drifted
    .filter((d) => !byTitle.has(issueTitle(d)))
    .sort((a, b) => (a.releaseDate || "9999").localeCompare(b.releaseDate || "9999"))
    .slice(0, budget);

  for (const d of candidates) {
    gh(
      ["issue", "create", "--title", issueTitle(d), "--label", LABEL, "--body-file", "-"],
      workOrder(d)
    );
    console.log(`filed ${issueTitle(d)}`);
  }
  console.log(
    `${candidates.length} new work order(s); ${inFlight} were already open, ${
      drifted.length - inFlight - candidates.length
    } remain in the backlog`
  );
}

main();
