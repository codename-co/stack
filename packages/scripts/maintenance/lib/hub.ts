// Reading and (surgically) writing hub entries.
//
// stack.yaml files are hand-curated: they carry the SPDX header, the schema
// comment, per-field ordering and occasional inline notes. A parse/serialize
// round-trip would silently reflow all of that, turning a one-field refresh
// into an unreviewable diff. So we parse for reading and patch single lines for
// writing — the diff a maintainer reviews then contains exactly what changed.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYAML } from "yaml";

export interface StackEntry {
  slug: string;
  dir: string;
  stackFile: string;
  composeFile: string | null;
  envFile: string | null;
  data: Record<string, any>;
  raw: string;
}

export function listStacks(root = "hub", only?: string[]): StackEntry[] {
  const dirs = readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => existsSync(join(root, name, "stack.yaml")))
    .filter((name) => !only?.length || only.includes(name))
    .sort();

  return dirs.map((name) => {
    const dir = join(root, name);
    const stackFile = join(dir, "stack.yaml");
    const raw = readFileSync(stackFile, "utf-8");
    const composeFile = join(dir, "compose.yaml");
    const envFile = join(dir, ".env");
    return {
      slug: name,
      dir,
      stackFile,
      composeFile: existsSync(composeFile) ? composeFile : null,
      envFile: existsSync(envFile) ? envFile : null,
      data: parseYAML(raw) ?? {},
      raw,
    };
  });
}

/**
 * Fields we are allowed to write, in schema order. Used to place a field that
 * is currently absent next to the ones it belongs with.
 */
const FIELD_ORDER = [
  "status",
  "type",
  "slug",
  "name",
  "icon",
  "flavor",
  "version",
  "updated_at",
  "description",
  "author",
  "license",
  "homepage",
  "repository",
  "stars",
  "tags",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Current raw (unparsed) text of a top-level scalar field. */
export function readField(text: string, key: string): string | null {
  const m = text.match(new RegExp(`^${escape(key)}:[ \\t]*(.*)$`, "m"));
  return m ? m[1] : null;
}

/**
 * Replace a top-level scalar field, preserving the existing quoting style, or
 * insert it at its schema position when missing.
 *
 * Only column-0 keys match, so block scalars (`readme: |`) and nested mappings
 * are never touched.
 */
export function setField(
  text: string,
  key: string,
  value: string | number
): string {
  const line = new RegExp(`^${escape(key)}:[ \\t]*(.*)$`, "m");
  const match = text.match(line);
  const rendered = renderValue(key, value, match?.[1] ?? "");

  if (match) {
    // Preserve any trailing comment on the line.
    const comment = match[1].match(/(?:^|\s)(#.*)$/)?.[1];
    return text.replace(line, `${key}: ${rendered}${comment ? ` ${comment}` : ""}`);
  }

  const position = FIELD_ORDER.indexOf(key);
  const anchors = FIELD_ORDER.slice(0, position < 0 ? 0 : position).reverse();
  for (const anchor of anchors) {
    const anchorLine = new RegExp(`^${escape(anchor)}:.*$`, "m");
    if (anchorLine.test(text)) {
      return text.replace(anchorLine, (m) => `${m}\n${key}: ${rendered}`);
    }
  }
  return `${text.trimEnd()}\n${key}: ${rendered}\n`;
}

function renderValue(key: string, value: string | number, current: string): string {
  if (typeof value === "number") return String(value);
  const text = String(value);
  // Dates and versions keep whatever style the file already used; strings that
  // need quoting (URLs are fine bare, but `: ` or `#` are not) get them.
  const quoted = current.trim().startsWith('"') || current.trim().startsWith("'");
  const mustQuote = /^[\s>|&*!%@`{}[\],]|: |\s#|^$/.test(text) || /^[\d.]+$/.test(text);
  if (key === "updated_at") return text;
  if (quoted || mustQuote) return JSON.stringify(text);
  return text;
}

export function writeStack(entry: StackEntry, text: string): void {
  writeFileSync(entry.stackFile, text);
}

// ---------------------------------------------------------------------------
// compose.yaml version pins
// ---------------------------------------------------------------------------

export interface ImagePin {
  /** Full `image:` value with variables intact. */
  image: string;
  /** Image reference with `${VAR:-default}` resolved to the default. */
  resolved: string;
  /** Env var driving the pin, when the image uses the `${VAR:-x}` idiom. */
  variable: string | null;
  /** Default value of that variable, i.e. the version actually shipped. */
  pinned: string | null;
}

const VAR = /\$\{([A-Z0-9_]+):-([^}]*)\}/g;

/**
 * The hub's convention is `image: repo/app:${APP_VERSION:-1.2.3}`, which lets a
 * user override the version without editing the bundle. The default inside the
 * braces is the version the hub actually ships, and is what an upgrade changes.
 */
export function parseImagePins(composeText: string): ImagePin[] {
  const pins: ImagePin[] = [];
  for (const m of composeText.matchAll(/^\s*image:\s*(.+?)\s*$/gm)) {
    const image = m[1].replace(/^["']|["']$/g, "");
    const vars = [...image.matchAll(VAR)];
    pins.push({
      image,
      resolved: image.replace(VAR, (_, __, def) => def),
      variable: vars[0]?.[1] ?? null,
      pinned: vars[0]?.[2] ?? null,
    });
  }
  return pins;
}

/**
 * Pick the image that represents the app itself.
 *
 * A compose file lists dependencies too (postgres, redis, ...); the app's own
 * image is the one whose `${VAR:-...}` pin matches the version in stack.yaml,
 * and failing that the first parameterised image — dependencies are pinned
 * literally by convention.
 */
export function primaryImage(pins: ImagePin[], version: string): ImagePin | null {
  const normalized = version.replace(/^v/, "");
  return (
    pins.find((p) => p.pinned && p.pinned.replace(/^v/, "") === normalized) ??
    pins.find((p) => p.variable) ??
    null
  );
}

export const today = (): string => new Date().toISOString().slice(0, 10);
