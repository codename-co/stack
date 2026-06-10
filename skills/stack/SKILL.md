---
name: stack
description: Search, identify find the alternative best free software solution, from open source software packages, ready to install via docker compose. Also understands the .stack bundle format, can generate new .stack files, and can run .stack files from URL or local path.
metadata:
  author: Arnaud Leymet
  version: "0.2.0"
---

# Stack

[stack.lol](https://stack.lol) is a curated catalog of open-source, self-hostable software packages — every entry ships a ready-to-use Docker Compose file. Use this skill whenever a user asks about open-source alternatives, wants to self-host something, needs a Docker Compose setup for a specific tool, or wants to understand, generate, or run `.stack` bundle files.

---

## The .stack bundle format

A `.stack` file is a **gzip-compressed tar archive** (`.tar.gz` with a `.stack` extension). It is a self-contained bundle that packages everything needed to run a software stack.

### File structure

```
<name>.stack              ← gzip-compressed tar archive
├── stack.yaml            ← metadata (required)
├── compose.yaml          ← Docker Compose definition (for DockerCompose flavor)
├── .env                  ← primary environment variables
├── <name>.env            ← extra env files (optional, e.g. .apiserver.env)
└── config/               ← auxiliary config files (optional)
    ├── settings.yml
    └── ...
```

For **StaticWebsite** flavor stacks (no Docker Compose), the archive contains:

```
<name>.stack
├── stack.yaml
├── index.html
├── js/
├── style/
└── ...
```

For **recipe** bundles (multi-stack combinations), the archive includes nested stacks:

```
<name>.stack
├── stack.yaml
├── compose.yaml          ← uses `include:` referencing ./stacks/*/compose.yaml
├── .env
└── stacks/
    ├── openwebui/
    │   ├── stack.yaml
    │   ├── compose.yaml
    │   └── .env
    ├── ollama/
    │   ├── stack.yaml
    │   ├── compose.yaml
    │   └── .env
    └── ...
```

### stack.yaml schema

The metadata file follows the schema at `https://stack.lol/schemas/stack.config.schema.yaml`:

```yaml
# yaml-language-server: $schema=https://stack.lol/schemas/stack.config.schema.yaml
slug: myapp                          # required — unique identifier (lowercase, hyphens)
name: My App                         # required — display name
icon: 🚀                             # optional — emoji icon
flavor: DockerCompose                # required — one of: DockerCompose, DockerService, StaticWebsite
version: "1.0.0"                     # required — version string
updated_at: 2026-06-09               # optional — YYYY-MM-DD
description: Short description       # required — brief description
author: Author Name                  # required — author or organization
license: MIT                         # required — SPDX identifier or URL
homepage: https://example.com        # optional — product homepage URL
repository: https://github.com/...   # optional — source code URL
stars: 1000                          # optional — GitHub stars count
tags:                                # optional — category tags
  - self-hosted
  - web
alternativeTo:                       # optional — proprietary tools this replaces
  - some-tool
status: working                      # optional — one of: untested, broken, starting, working
type: stack                          # optional — "stack" or "recipe"
dependencies:                        # optional — for recipes only
  - name: openwebui
    role: Web interface
readme: |                            # optional — markdown description
  Detailed description here...
i18n:                                # optional — translations
  fr:
    description: Description en français
```

### Flavors

| Flavor | Detection | How it runs |
|---|---|---|
| `DockerCompose` | `compose.yaml` or `docker-compose.yaml` present | `docker compose up -d --wait --remove-orphans` |
| `DockerService` | `Dockerfile` present | `docker build` then `docker run` |
| `StaticWebsite` | `index.html` present | Served via `nginx:stable-alpine` container |

### compose.yaml conventions

Stack compose files follow these conventions:

- **Labels** for service discovery:
  ```yaml
  labels:
    dash.url: https://$PROJECT.$DOMAIN
    traefik.http.routers.<name>.rule: Host(`$PROJECT.$DOMAIN`)
    traefik.http.services.<name>.loadbalancer.server.port: 8080
  ```
- **Environment variables** use `$PROJECT` and `$DOMAIN` (defined in `.env`)
- **`.env` always defines** at minimum: `PROJECT=<slug>` and `DOMAIN=stack.localhost`
- **Volumes** use named Docker volumes (not bind mounts) for persistent data
- **Networks** are stack-scoped (non-external)

### Download URLs

Pre-built `.stack` files are available at:
- Stacks: `https://stack.lol/downloads/{slug}.stack`
- Recipes: `https://stack.lol/downloads/recipes/{slug}.stack`

---

## API Reference

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `https://stack.lol/api/stacks` | GET | All individual stacks (201 entries) |
| `https://stack.lol/api/recipes` | GET | Curated multi-stack combinations |

Both endpoints return `{ items: Stack[] }`. No authentication required.

### Stack object shape

```json
{
  "slug": "plane",
  "name": "Plane",
  "version": "1.2.2",
  "updated_at": "2026-02-28T00:00:00.000Z",
  "description": "Issue tracking and project management",
  "license": "AGPL-3.0",
  "tags": ["issue-tracking", "project-management"],
  "alternativeTo": ["jira", "asana", "linear", "monday"],
  "link": "/plane",
  "stars": 46000
}
```

Key fields:

- **`slug`** — unique identifier; also the path key for compose files
- **`alternativeTo`** — array of well-known proprietary/popular tools this stack replaces (lowercase slugs, e.g. `"jira"`, `"notion"`, `"github"`)
- **`tags`** — 131 unique category tags (e.g. `"issue-tracking"`, `"ai"`, `"wiki"`, `"crm"`)
- **`stars`** — GitHub stars (use as a popularity/trust signal)
- **`link`** — relative URL; prefixed with `/recipes/` for recipe entries

### Companion file URLs

All files for a stack live under the same base URL:

```
# Base (stack)
https://raw.githubusercontent.com/codename-co/stack/main/hub/{slug}/

# Base (recipe)
https://raw.githubusercontent.com/codename-co/stack/main/recipes/{slug}/
```

Derive the type from the `link` field: if `link` starts with `/recipes/` it is a recipe, otherwise it is a plain stack.

The files that may exist under that base:

| File | Present | Notes |
|---|---|---|
| `compose.yaml` | Always | Main Docker Compose definition |
| `.env` | ~95% of stacks | Primary environment variables |
| `<name>.env` | Occasional | Extra env files (e.g. `.apiserver.env`, `.db.env`, `settings.env`) |
| `config/<file>` | ~10 stacks | Auxiliary config files (YAML, TOML, nginx.conf, etc.) |

**Do not guess which companion files exist** — discover them by parsing `compose.yaml` (see below).

### Discovering companion files from compose.yaml

After fetching `compose.yaml`, scan it for three patterns:

1. **`env_file:` entries** — each value that does not start with `/` is a relative companion file.
   ```yaml
   env_file: .env          # → fetch .env
   env_file: .apiserver.env  # → fetch .apiserver.env
   ```

2. **`volumes:` local-source mounts** — entries of the form `./local/path:/container/path` where the source starts with `./` are local files/dirs bundled with the stack.
   ```yaml
   volumes:
     - ./config/limiter.toml:/etc/searxng/limiter.toml:ro   # → fetch config/limiter.toml
     - ./config/uwsgi.ini:/etc/searxng/uwsgi.ini:ro          # → fetch config/uwsgi.ini
   ```

3. **Top-level `configs:` blocks** — two sub-cases:
   - `content: |` — config is **inline** in compose.yaml; no extra fetch needed, content is already present.
   - `file: ./path` — config references an external local file; fetch it.

For each discovered path, fetch:
```
https://raw.githubusercontent.com/codename-co/stack/main/hub/{slug}/{relative_path}
```

Always attempt to fetch `.env` even if not explicitly listed in `env_file:` — it is the default and present in ~95% of stacks. A 404 simply means that stack has no `.env`.

---

## Use case 1 — Find the best open-source alternative to a specific tool

**Trigger phrases:** "alternative to Jira", "self-hosted Notion", "open-source Slack", "replace GitHub", "free alternative to …"

### Procedure

1. `GET https://stack.lol/api/stacks` — fetch the full catalog.
2. Normalize the target tool name to a likely slug (lowercase, spaces → hyphens, strip punctuation). Example: `"Jira"` → `"jira"`.
3. Filter items where `alternativeTo` array **contains** the target slug (case-insensitive).
4. If zero results, also search `https://stack.lol/api/recipes` with the same filter.
5. Sort surviving entries by `stars` descending.
6. Present the top candidates in a comparison table.

### Output format

| Tool | Description | License | Stars | Tags | Install |
|---|---|---|---|---|---|
| **Plane** | Issue tracking and project management | AGPL-3.0 | ⭐ 46k | issue-tracking, project-management | `https://stack.lol/plane` |
| **Taiga** | Agile project management platform | MPL-2.0 | ⭐ 17k | issue-tracking, agile | `https://stack.lol/taiga` |

Follow the table with a brief recommendation paragraph: highlight the closest feature match, the most active project (stars + `updated_at`), and any notable license caveats.

### Example

User: *"What's the best open-source alternative to Jira?"*

1. Fetch `https://stack.lol/api/stacks`.
2. Filter `alternativeTo` ∋ `"jira"`.
3. Sort by stars → Plane (46k ⭐), Taiga (17k ⭐), Linear-alikes, …
4. Return comparison table + recommendation.

---

## Use case 2 — Metadata and Docker Compose for a specific stack

**Trigger phrases:** "how do I self-host Plane", "docker compose for Gitea", "deploy Nextcloud", "what's in the Plane stack", "show me the compose file for …"

### Procedure

1. `GET https://stack.lol/api/stacks` — fetch the full catalog.
2. Find the matching entry: exact `slug` match first, then case-insensitive `name` match.
3. If not found in stacks, try `GET https://stack.lol/api/recipes`.
4. Determine base URL:
   - Stack: `https://raw.githubusercontent.com/codename-co/stack/main/hub/{slug}/`
   - Recipe: `https://raw.githubusercontent.com/codename-co/stack/main/recipes/{slug}/`
5. Fetch `compose.yaml` from the base URL.
6. Parse `compose.yaml` to discover companion files (see **Discovering companion files** above).
7. Fetch `.env` unconditionally (ignore 404).
8. Fetch every other companion file discovered in step 6.
9. Present: metadata card → compose.yaml → companion files.

### Output format

**Metadata card** (always show first):

```
📦 Plane  v1.2.2
   Issue tracking and project management
   License : AGPL-3.0
   Stars   : ⭐ 46,000
   Tags    : issue-tracking · project-management
   Also an alternative to: Jira · Asana · Linear · Monday
   Updated : 2026-02-28
   Detail  : https://stack.lol/plane
```

**Docker Compose file** (show in a fenced code block):

```yaml
# contents of compose.yaml …
```

**Companion files** — show each one in its own labeled fenced block:

```
# .env
POSTGRES_USER=plane
…
```

```
# .apiserver.env  (if present)
SECRET_KEY=secret
…
```

```yaml
# config/limiter.toml  (if present)
…
```

Label each block with the relative filename so the user knows exactly where to place it. After all files, provide a brief **"Getting started"** note pointing to `https://stack.lol/{slug}` for full setup instructions.

### Example

User: *"Show me the metadata and docker compose for Plane."*

1. Fetch `/api/stacks`, find `slug: "plane"`.
2. Base URL → `https://raw.githubusercontent.com/codename-co/stack/main/hub/plane/`
3. Fetch `compose.yaml` → parse → discover `env_file: .env` and `env_file: .apiserver.env`.
4. Fetch `.env` and `.apiserver.env`.
5. Render: metadata card + `compose.yaml` + `.env` + `.apiserver.env`.

---

## Use case 3 — Browse by category / tag

**Trigger phrases:** "what self-hosted CRM tools are available", "show me open-source monitoring stacks", "any AI tools on stack.lol"

### Procedure

1. `GET https://stack.lol/api/stacks` (+ `/api/recipes` if relevant).
2. Filter items where `tags` contains the requested category tag.
3. Sort by `stars` descending; cap display at 10 results.
4. Present as a table (same format as use case 1, omitting the "Install" column).

**Common tag → user intent mapping** (not exhaustive):

| User says | Tag(s) to match |
|---|---|
| CRM | `crm` |
| monitoring / observability | `monitoring`, `observability` |
| AI / LLM | `ai`, `llm`, `rag` |
| project management | `project-management`, `issue-tracking` |
| wiki / knowledge base | `wiki`, `knowledge-base` |
| CI/CD | `ci` |
| analytics | `analytics` |
| password manager | `secrets` |

---

## Use case 4 — Generate a new .stack file

**Trigger phrases:** "create a .stack file for …", "generate a stack bundle", "package this docker compose as a .stack", "make a .stack file", "build me a stack"

### How .stack files are built

A `.stack` file is produced by **tar-archiving then gzip-compressing** a directory. The canonical build command (from the Makefile) is:

```sh
cd hub/<slug> && tar --exclude="*.stack" -czf ../../packages/website/public/downloads/<slug>.stack .
```

This yields a tar.gz where all paths are relative to the root (e.g., `./stack.yaml`, `./compose.yaml`, `./.env`).

### Client-side generation (browser)

To generate a `.stack` file entirely client-side (no server needed), use JavaScript with the **pako** library (for gzip) and manual tar block construction. The procedure:

#### Step 1 — Prepare the file contents

Generate the required files as strings:

```javascript
// 1. stack.yaml — metadata
const stackYaml = `# yaml-language-server: $schema=https://stack.lol/schemas/stack.config.schema.yaml
slug: ${slug}
name: ${name}
icon: ${icon}
flavor: DockerCompose
version: "${version}"
updated_at: ${new Date().toISOString().split('T')[0]}
description: ${description}
author: ${author}
license: ${license}
homepage: ${homepage}
repository: ${repository}
tags:
${tags.map(t => `  - ${t}`).join('\n')}
alternativeTo:
${alternativeTo.map(a => `  - ${a}`).join('\n')}
`;

// 2. compose.yaml — Docker Compose definition
const composeYaml = `services:
  ${slug}:
    image: ${image}
    restart: unless-stopped
    env_file: .env
    ports:
      - "${port}:${containerPort}"
    labels:
      dash.url: https://$PROJECT.$DOMAIN
      traefik.http.routers.${slug}.rule: Host(\`$PROJECT.$DOMAIN\`)
      traefik.http.services.${slug}.loadbalancer.server.port: ${containerPort}
    volumes:
      - ${slug}-data:/data

volumes:
  ${slug}-data:
    driver: local
`;

// 3. .env — environment variables
const dotEnv = `PROJECT=${slug}
DOMAIN=stack.localhost
`;
```

#### Step 2 — Build the tar archive in memory

```javascript
/**
 * Creates a tar file entry (header + data blocks).
 * Tar format: 512-byte header + data padded to 512-byte boundary.
 */
function createTarEntry(filename, content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const header = new Uint8Array(512);

  // Filename (offset 0, 100 bytes) — prefix with "./"
  const name = './' + filename;
  encoder.encodeInto(name, header);

  // File mode (offset 100, 8 bytes)
  encoder.encodeInto('0000644\0', header.subarray(100, 108));

  // Owner/group UID/GID (offset 108-124, 8+8 bytes)
  encoder.encodeInto('0001000\0', header.subarray(108, 116));
  encoder.encodeInto('0001000\0', header.subarray(116, 124));

  // File size in octal (offset 124, 12 bytes)
  const sizeOctal = data.length.toString(8).padStart(11, '0') + '\0';
  encoder.encodeInto(sizeOctal, header.subarray(124, 136));

  // Modification time (offset 136, 12 bytes)
  const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
  encoder.encodeInto(mtime, header.subarray(136, 148));

  // Checksum placeholder — fill with spaces (offset 148, 8 bytes)
  header.fill(0x20, 148, 156);

  // Type flag '0' = regular file (offset 156)
  header[156] = 0x30; // ASCII '0'

  // USTAR magic (offset 257, 6 bytes) + version (offset 263, 2 bytes)
  encoder.encodeInto('ustar\0', header.subarray(257, 263));
  encoder.encodeInto('00', header.subarray(263, 265));

  // Calculate checksum (sum of all bytes in header, treating checksum field as spaces)
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }
  const checksumOctal = checksum.toString(8).padStart(6, '0') + '\0 ';
  encoder.encodeInto(checksumOctal, header.subarray(148, 156));

  // Pad data to 512-byte boundary
  const paddedLength = Math.ceil(data.length / 512) * 512;
  const paddedData = new Uint8Array(paddedLength);
  paddedData.set(data);

  // Combine header + padded data
  const entry = new Uint8Array(512 + paddedLength);
  entry.set(header, 0);
  entry.set(paddedData, 512);

  return entry;
}

/**
 * Builds a complete tar archive from an array of {filename, content} objects.
 * Appends two 512-byte zero blocks as end-of-archive marker.
 */
function buildTar(files) {
  const entries = files.map(f => createTarEntry(f.filename, f.content));
  const totalLength = entries.reduce((sum, e) => sum + e.length, 0) + 1024;
  const tar = new Uint8Array(totalLength);
  let offset = 0;
  for (const entry of entries) {
    tar.set(entry, offset);
    offset += entry.length;
  }
  // End-of-archive: two 512-byte zero blocks (already zero-initialized)
  return tar;
}
```

#### Step 3 — Gzip-compress and trigger download

```javascript
// Using pako (available via CDN: https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js)
// or import pako from 'pako';

const files = [
  { filename: 'stack.yaml', content: stackYaml },
  { filename: 'compose.yaml', content: composeYaml },
  { filename: '.env', content: dotEnv },
];

const tarData = buildTar(files);
const gzipped = pako.gzip(tarData);

// Trigger browser download
const blob = new Blob([gzipped], { type: 'application/gzip' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${slug}.stack`;
a.click();
URL.revokeObjectURL(url);
```

### Procedure (for the AI agent)

When a user asks to generate a `.stack` file:

1. **Gather requirements** — ask for or infer:
   - `slug` (lowercase, hyphens only)
   - `name`, `description`, `author`, `license`
   - Docker image and version
   - Port mappings
   - Environment variables
   - Tags and `alternativeTo` entries
   - Any config files needed

2. **Generate all file contents** as strings:
   - `stack.yaml` following the schema above
   - `compose.yaml` with proper labels, env_file, volumes
   - `.env` with `PROJECT=<slug>`, `DOMAIN=stack.localhost`, plus any app-specific vars
   - Any additional config files

3. **Provide the complete client-side code** using the tar + pako approach above, or provide the files individually and a shell command to build:
   ```sh
   mkdir -p mystack && cd mystack
   # ... create files ...
   tar -czf ../mystack.stack .
   ```

4. **Validate** the generated `stack.yaml` against the schema:
   - Required fields: `slug`, `name`, `flavor`, `version`, `description`, `author`, `license`
   - `slug` must be lowercase alphanumeric with hyphens
   - `flavor` must be one of: `DockerCompose`, `DockerService`, `StaticWebsite`
   - `updated_at` must be `YYYY-MM-DD` format

### Output format

Present the generated files in labeled fenced code blocks, then provide:

1. **Option A — Browser download**: Complete HTML/JS snippet the user can paste into a browser console or an HTML file to generate and download the `.stack` file client-side.

2. **Option B — Shell command**: `mkdir` + file creation + `tar -czf` to build locally.

3. **Option C — Direct files**: If the user just wants the individual files to place in a directory.

---

## Use case 5 — Run a .stack file

**Trigger phrases:** "run this .stack file", "start the stack", "launch plane.stack", "install this stack from URL", "how do I run a .stack file"

### How the Stack Desktop app runs .stack files

The **Stack Desktop app** (macOS Tauri app) is the primary way to run `.stack` files. The flow:

1. **Receive the bundle** — via file association (double-click `.stack`), CLI argument, or API call
2. **Download if URL** — supports `http://`, `https://`, `file://` schemes
3. **Extract** — gunzip + untar to a temporary directory
4. **Read metadata** — parse `stack.yaml` to get the slug and other metadata
5. **Detect flavor** — inspect files to determine DockerCompose / DockerService / StaticWebsite
6. **Run** — execute the appropriate command:
   - **DockerCompose**: `docker compose --project-name <slug> up -d --wait --remove-orphans`
   - **DockerService**: `docker build` → `docker run -d --name docker-<slug>`
   - **StaticWebsite**: `docker run -d --name <slug> -v <path>:/usr/share/nginx/html:ro nginx:stable-alpine`

### Stack Desktop API

When the Stack Desktop app is running, it exposes a local API:

| Endpoint | Method | Description |
|---|---|---|
| `https://127.0.0.1:57404/health` | GET | Returns `OK` if the app is running |
| `https://127.0.0.1:57404/run` | POST | Accepts `{ "slug": "<url-or-path>" }` — downloads and runs the stack |

The `/run` endpoint returns a **streaming response** with progress updates.

### Procedure

When a user wants to run a `.stack` file:

#### Option A — Via Stack Desktop app (preferred)

1. Check if the user has the Stack Desktop app: `https://stack.lol/download`
2. For a pre-existing stack from the catalog:
   ```
   Download URL: https://stack.lol/downloads/{slug}.stack
   Web launch:   https://stack.lol/{slug}.stack
   ```
   The web launch page (`/{slug}.stack`) automatically attempts to communicate with the Desktop app API. If the app is not running, it falls back to downloading the `.stack` file.

3. For a custom/generated `.stack` file:
   - Double-click the `.stack` file (if file association is set up)
   - Or drag-and-drop onto the Stack Desktop app icon

#### Option B — Manual with Docker (no app needed)

For users without the Stack Desktop app:

```sh
# 1. Download (if from URL)
curl -LO https://stack.lol/downloads/{slug}.stack

# 2. Extract
mkdir -p {slug} && cd {slug}
tar -xzf ../{slug}.stack

# 3. Run
docker compose up -d --wait --remove-orphans

# 4. Access
# Open https://{slug}.stack.localhost in your browser
# (requires Traefik or similar reverse proxy, or use localhost:<port>)
```

#### Option C — Client-side launch via browser

If the `.stack` file was generated client-side and the Desktop app is running:

```javascript
const STACK_API = 'https://127.0.0.1:57404';

// Check if app is running
async function isAppRunning() {
  try {
    const res = await fetch(`${STACK_API}/health`);
    return (await res.text()) === 'OK';
  } catch {
    return false;
  }
}

// Run a stack by URL
async function runStack(stackUrl) {
  const response = await fetch(`${STACK_API}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: stackUrl }),
  });

  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log(new TextDecoder().decode(value));
  }
}

// Usage
if (await isAppRunning()) {
  await runStack('https://stack.lol/downloads/gitea.stack');
} else {
  console.log('Stack Desktop app not running. Download it at https://stack.lol/download');
}
```

### Running a previously generated .stack (end-to-end)

If the user generated a `.stack` file using the client-side approach from Use case 4:

1. **If the Desktop app is running**: Upload the generated blob to a temporary URL or save to disk, then call the `/run` API endpoint.
2. **If no Desktop app**: Provide the manual Docker instructions (Option B above).
3. **Prerequisites reminder**: Always remind the user they need:
   - Docker Engine installed and running
   - Sufficient disk space for the container images
   - Ports available (check for conflicts)

### Output format

Always include:

1. **Prerequisites** — Docker status, port availability
2. **The run command(s)** — appropriate for the user's setup
3. **Access URL** — where the running stack will be available
4. **Stop command** — how to shut it down:
   ```sh
   docker compose --project-name {slug} down
   ```

---

## General guidelines

- **Always fetch live data** — never hard-code catalog contents; the catalog evolves.
- **Prefer stacks over recipes** for single-tool requests; recipes are multi-service bundles.
- **stars** is the primary trust signal; `updated_at` is the freshness signal. Flag stacks not updated in > 1 year.
- **Compose files are production-ready** but remind the user to review environment variables (`.env`) and reverse-proxy config before deploying.
- When `alternativeTo` is empty and a tag search yields no results, say so clearly rather than guessing.
- Link the detail page (`https://stack.lol{link}`) so the user can explore further.
- When generating `.stack` files, always include `.env` with at least `PROJECT=<slug>` and `DOMAIN=stack.localhost`.
- The `.stack` file format is simply **tar.gz** — any tool that can create tar.gz archives can produce valid `.stack` files.
- When providing client-side code, prefer **pako** for gzip (it's already a dependency of the project and available via CDN at `https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js`).
