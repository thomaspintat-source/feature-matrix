#!/usr/bin/env node
/**
 * Sync the Octopus SDK Feature Matrix from Notion into octo-features.json.
 *
 * Reads:
 *   - the database rows (24 features) from the "SDK Feature Matrix" database
 *   - the "Platform versions" callout on the parent page (versions + last-updated date)
 *
 * Writes octo-features.json at the repo root, which index.html fetches on load.
 *
 * Requires env var NOTION_TOKEN (an internal integration token with the database
 * and the page shared to it). No external npm dependencies — uses built-in fetch (Node 18+).
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID || "56a05beab58345f180ab1b8c1497fe6e";
const PAGE_ID     = process.env.NOTION_PAGE_ID     || "2edd0ed811a9804894c5ce4fa4bcf367";
const NOTION_VERSION = "2022-06-28";

const PLATFORMS = ["Android", "iOS", "React Native", "Flutter", "Unity 3D"];
const CATEGORY_ORDER = ["Core Capabilities", "Customization", "Media", "Data", "Miscellaneous"];

if (!NOTION_TOKEN) {
  console.error("Missing NOTION_TOKEN environment variable.");
  process.exit(1);
}

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${res.status} on ${url}: ${body}`);
  }
  return res.json();
}

function plain(richText) {
  return (richText || []).map(t => t.plain_text).join("").trim();
}

function mapStatus(name) {
  if (!name) return "no";
  if (name.includes("✅")) return "ok";
  if (name.includes("⚠️")) return "warn";
  if (name.includes("🔵")) return "soon";
  if (name.includes("❌")) return "no";
  return "no";
}

async function fetchRows() {
  const rows = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await api(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    for (const page of data.results) {
      const p = page.properties;
      const platforms = {};
      for (const plat of PLATFORMS) {
        platforms[plat] = mapStatus(p[plat]?.select?.name);
      }
      rows.push({
        category: p["Category"]?.select?.name || "",
        feature: plain(p["Feature"]?.title),
        description: plain(p["Description"]?.rich_text),
        platforms,
        note: plain(p["Notes"]?.rich_text) || undefined,
      });
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

async function fetchVersions() {
  const versions = {};
  let updatedAt = null;
  const data = await api(`https://api.notion.com/v1/blocks/${PAGE_ID}/children?page_size=100`);
  for (const block of data.results) {
    if (block.type !== "callout") continue;
    const text = plain(block.callout?.rich_text);
    const dm = text.match(/last updated\s+(\d{4}-\d{2}-\d{2})/i);
    if (dm) updatedAt = dm[1];
    for (const plat of PLATFORMS) {
      const re = new RegExp(plat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+v?(\\d+\\.\\d+(?:\\.\\d+)?)", "i");
      const m = text.match(re);
      if (m) versions[plat] = m[1];
    }
  }
  return { versions, updatedAt };
}

function sortRows(rows) {
  const idx = c => { const i = CATEGORY_ORDER.indexOf(c); return i === -1 ? 999 : i; };
  // stable sort by category order; preserve Notion order within a category
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => idx(a.r.category) - idx(b.r.category) || a.i - b.i)
    .map(x => x.r);
}

async function main() {
  const [rows, ver] = await Promise.all([fetchRows(), fetchVersions()]);
  const out = {
    updatedAt: ver.updatedAt || new Date().toISOString().slice(0, 10),
    versions: ver.versions,
    features: sortRows(rows),
  };
  const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "octo-features.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${out.features.length} features to octo-features.json (updatedAt ${out.updatedAt}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
