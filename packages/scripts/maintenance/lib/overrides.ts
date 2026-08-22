// Curation decisions that upstream must not overwrite.
//
// Some hub values are deliberately *not* what the forge reports, and a sync
// that does not remember this proposes the same wrong change every single day
// until the suggestions become noise nobody reads. Recording a rejection —
// with its reason — is what keeps the daily report meaningful: everything left
// in it is something no human has looked at yet.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse as parseYAML } from "yaml";

export const OVERRIDES_FILE = "hub/metadata-overrides.yaml";

export interface Override {
  reason: string;
  /** Upstream value at the time of the decision, to re-ask if it changes. */
  upstream?: string;
}

export type Overrides = Record<string, Record<string, Override>>;

export function loadOverrides(file = OVERRIDES_FILE): Overrides {
  if (!existsSync(file)) return {};
  return (parseYAML(readFileSync(file, "utf-8")) as Overrides) ?? {};
}

/**
 * A rejection is scoped to the value that was rejected. If upstream later
 * publishes something different, that is new information and deserves to be
 * asked again — the maintainer rejected "the contributor handbook URL", not
 * "any future homepage".
 */
export function isRejected(
  overrides: Overrides,
  slug: string,
  field: string,
  upstreamValue: string
): boolean {
  const entry = overrides[slug]?.[field];
  if (!entry) return false;
  return !entry.upstream || entry.upstream === upstreamValue;
}

export function recordRejection(
  slug: string,
  field: string,
  upstream: string,
  reason: string,
  file = OVERRIDES_FILE
): void {
  const overrides = loadOverrides(file);
  overrides[slug] ??= {};
  overrides[slug][field] = { reason, upstream };

  const header = `# SPDX-License-Identifier: MIT
#
# Fields where the curated value is intentionally not what upstream reports.
#
# The forge describes a *repository*; a hub entry describes a *piece of
# software*. When those disagree — a packaging repo whose license covers only
# the Dockerfile, a homepage field pointing at a docs site — the curated value
# wins, and the disagreement is recorded here so sync-metadata.ts stops
# proposing it.
#
# Each entry is pinned to the upstream value that was rejected: if upstream
# later publishes something different, the suggestion comes back for review.
#
# Managed by: node packages/scripts/maintenance/sync-metadata.ts --reject <slug>:<field> --reason "..."
`;

  const body = Object.keys(overrides)
    .sort()
    .map((s) => {
      const fields = Object.entries(overrides[s])
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([f, o]) =>
            `  ${f}:\n    reason: ${JSON.stringify(o.reason)}${
              o.upstream ? `\n    upstream: ${JSON.stringify(o.upstream)}` : ""
            }`
        )
        .join("\n");
      return `${s}:\n${fields}`;
    })
    .join("\n\n");

  writeFileSync(file, `${header}\n${body}\n`);
}
