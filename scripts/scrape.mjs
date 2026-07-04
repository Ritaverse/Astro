#!/usr/bin/env node
// Scrapes astrocade.com homepage and refreshes data/games.json.
// The homepage is a Next.js app that embeds full game objects (plays, likeCount,
// commentsCount, remixCount, username, ...) inside its self.__next_f payload.
// Genre is NOT published by Astrocade — we preserve analyst-assigned genres by title
// and mark any newly-seen game as "Unclassified".

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "data", "games.json");
const URL = "https://www.astrocade.com/";

// Extract balanced {...} object starting at the opening brace before `idx`,
// tracking string state so braces inside strings don't break matching.
// Input is the ESCAPED payload where string delimiters are the two chars: \ "
function extractObject(s, idx) {
  // walk left to the opening brace of this object
  let start = idx;
  let depth = 0;
  for (let i = idx; i >= 0; i--) {
    const c = s[i];
    if (c === "}") depth++;
    else if (c === "{") {
      if (depth === 0) { start = i; break; }
      depth--;
    }
  }
  // walk right to the matching closing brace
  let inStr = false;
  depth = 0;
  for (let i = start; i < s.length; i++) {
    const two = s[i] === "\\" && s[i + 1] === '"';
    if (two) { inStr = !inStr; i++; continue; }
    if (inStr) continue;
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

// Heuristic genre from title keywords — provisional, refined by the monthly analyst pass.
const GENRE_RULES = [
  ["Racing", /\b(car|racer?|racing|drift|drive|kart|formula|jeep|moto|bike|traffic)\b/i],
  ["Shooter", /\b(sniper|shoot|gun|blaster?|fps|war|combat|duel|strike|hunter|zombie)\b/i],
  ["Merge", /\bmerge\b/i],
  ["IO", /\.io\b|\bio\b/i],
  ["Sports", /\b(football|soccer|cricket|basketball|world cup|kick|golf|tennis|skills)\b/i],
  ["Puzzle", /\b(puzzle|chess|number|nexus|pop it|match|sudoku|2048|brain|fill|dig)\b/i],
  ["Sandbox", /\b(minecraft|voxel|craft|build|sandbox|block)\b/i],
  ["Simulation", /\b(tycoon|wash|simulator|sim|manage|clicker|idle|studio|styling)\b/i],
  ["Adventure", /\b(journey|adventure|quest|escape|doors|dream|world|rumble)\b/i],
  ["Action", /\b(tank|ragdoll|lightsaber|fight|smash|rush|havoc|jump)\b/i],
  ["Casual", /\b(asmr|sparkle|relax|draw|perfection|barbie|emily)\b/i],
];
function classify(title) {
  for (const [genre, re] of GENRE_RULES) if (re.test(title)) return genre;
  return "Unclassified";
}

function unescape(escaped) {
  // Turn the escaped payload substring into real JSON text.
  return escaped
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\\//g, "/")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\r/g, "");
}

async function main() {
  const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0 AstroBlox-refresh" } });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const html = await res.text();

  const anchor = '\\"gameId\\"';
  const games = [];
  const seen = new Set();
  let i = html.indexOf(anchor);
  while (i !== -1) {
    const raw = extractObject(html, i);
    if (raw) {
      try {
        const o = JSON.parse(unescape(raw));
        if (o.gameId && o.title && typeof o.plays === "number" && !seen.has(o.gameId)) {
          seen.add(o.gameId);
          games.push({
            title: o.title.trim(),
            creator: o.username || "unknown",
            plays: o.plays,
            likes: o.likeCount ?? 0,
            comments: o.commentsCount ?? 0,
            remixes: o.remixCount ?? 0,
            isRemix: !!o.isRemix,
          });
        }
      } catch { /* skip malformed */ }
    }
    i = html.indexOf(anchor, i + anchor.length);
  }

  if (games.length === 0) throw new Error("no games parsed — page structure may have changed");

  // Preserve analyst-assigned genres by title from the existing file.
  let prevGenre = {};
  try {
    const prev = JSON.parse(readFileSync(DATA, "utf8"));
    for (const g of prev.games) if (g.genre) prevGenre[g.title] = g.genre;
  } catch { /* first run */ }

  for (const g of games) g.genre = prevGenre[g.title] || classify(g.title);
  games.sort((a, b) => b.plays - a.plays);

  const out = {
    collected: new Date().toISOString().slice(0, 10),
    source: "astrocade.com homepage Next.js payload (self.__next_f)",
    count: games.length,
    notes:
      "plays/likes/comments/remixes are MEASURED from the embedded payload. genre is analyst-assigned by title (Astrocade publishes no genre field); newly-seen games default to 'Unclassified' until classified.",
    games,
  };
  writeFileSync(DATA, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${games.length} games to data/games.json`);
  console.log("Top 5:", games.slice(0, 5).map((g) => `${g.title} (${g.plays})`).join(", "));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
