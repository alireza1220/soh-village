// Builds artifact/soh.html (self-contained page for the Claude Artifact) from content/content.json.
// Usage: node scripts/build-artifact.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const c = JSON.parse(readFileSync(join(root, "content/content.json"), "utf8"));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chip = (s) => `<span class="chip chip-${esc(s)}">${esc({ census: "census", reported: "reported", unverified: "unverified", family: "from family" }[s] ?? s)}</span>`;
const fa = (s) => (s ? `<span class="fa" lang="fa" dir="rtl">${esc(s)}</span>` : "");

const maxPop = Math.max(...c.population.map((p) => p.people));
const last = c.population[c.population.length - 1];

const html = `<title>Soh Village</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&family=Vazirmatn:wght@400;700&display=swap">
<style>
/* Layout: one reading column, a stone-and-orchard palette (slate ground, apple red, shrine-dome turquoise). */
:root{
  --bg:#eef0f1; --surface:#ffffff; --fg:#1d2428; --muted:#5b6770; --line:#d4d9dc;
  --apple:#a8322b; --dome:#12706f; --amber:#8a5a00;
  --chip-bg:#e3e7e9;
  --font-head:"Space Grotesk","Inter",system-ui,sans-serif;
  --font-body:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
  --font-fa:"Vazirmatn","Tahoma",sans-serif;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#12181b; --surface:#1b2327; --fg:#e6eaec; --muted:#9aa7ae; --line:#2e3a40;
  --apple:#ee8279; --dome:#4cc2bf; --amber:#e0b04c; --chip-bg:#26323a; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#12181b; --surface:#1b2327; --fg:#e6eaec; --muted:#9aa7ae; --line:#2e3a40;
  --apple:#ee8279; --dome:#4cc2bf; --amber:#e0b04c; --chip-bg:#26323a; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:16px;line-height:1.6;
  padding-block:0 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.wrap{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:44px}
.fa{font-family:var(--font-fa)}
h1,h2,h3{font-family:var(--font-head);line-height:1.15;text-wrap:balance;margin:0}
header{padding-top:40px;display:flex;flex-direction:column;gap:14px}
.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}
.big-fa{font-family:var(--font-fa);font-weight:700;font-size:clamp(88px,22vw,148px);line-height:1;color:var(--apple);margin:0}
h1{font-size:clamp(30px,6vw,44px);font-weight:700}
.lede{font-size:18px;color:var(--muted);max-width:56ch;margin:0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:8px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:12px 14px;min-width:0}
.stat b{display:block;font-family:var(--font-head);font-size:26px;font-variant-numeric:tabular-nums}
.stat span{font-size:13px;color:var(--muted)}
section{display:flex;flex-direction:column;gap:14px;min-width:0}
h2{font-size:24px;border-top:3px solid var(--apple);padding-top:12px}
p{margin:0}
.muted{color:var(--muted);font-size:14px}
.item{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;min-width:0}
.item h3{font-size:18px;display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
.item h3 .fa{font-size:16px;color:var(--dome);font-weight:700}
.src{font-size:12.5px;color:var(--muted)}
.chip{display:inline-block;font-size:11.5px;font-weight:600;padding:1px 8px;border-radius:99px;background:var(--chip-bg);color:var(--muted);margin-right:6px;vertical-align:1px}
.chip-reported{color:var(--dome)} .chip-unverified{color:var(--amber)} .chip-census{color:var(--apple)} .chip-family{color:var(--dome)}
.bars{display:flex;flex-direction:column;gap:8px}
.bar{display:grid;grid-template-columns:48px 1fr 150px;gap:10px;align-items:center;font-size:14px;font-variant-numeric:tabular-nums}
.bar i{display:block;height:14px;background:var(--apple);border-radius:2px}
.tags{display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:0;list-style:none}
.tags li{background:var(--chip-bg);border-radius:4px;padding:3px 10px;font-size:14px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;margin:0}
dt{color:var(--muted);font-size:14px} dd{margin:0}
ul.plain{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.todo{border:1px dashed var(--amber);border-radius:6px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.todo h3{font-size:17px}
a{color:var(--dome)}
a:focus-visible{outline:2px solid var(--dome);outline-offset:2px}
footer{font-size:13px;color:var(--muted)}
@media (max-width:480px){.bar{grid-template-columns:44px 1fr}.bar span.n{grid-column:1/-1}dl{grid-template-columns:1fr}}
</style>
<div class="wrap">
<header>
  <div class="eyebrow">${esc(c.location.ruralDistrict)} Rural District · ${esc(c.location.county)} County · ${esc(c.location.province)}</div>
  <p class="big-fa" lang="fa" dir="rtl">${esc(c.name.fa)}</p>
  <h1>${esc(c.name.en)}</h1>
  <p class="lede">${esc(c.tagline)}.</p>
  <div class="stats">
    <div class="stat"><b>${c.location.altitudeM.toLocaleString("en-US")} m</b><span>altitude (Kojaro)</span></div>
    <div class="stat"><b>${last.people}</b><span>people, ${last.year} census</span></div>
    <div class="stat"><b>~94 km</b><span>to Isfahan city</span></div>
    <div class="stat"><b>${esc(String(c.location.lat))}, ${esc(String(c.location.lon))}</b><span>latitude, longitude</span></div>
  </div>
</header>

<section>
  <h2>Where it is</h2>
  <p>Soh is in the Central District of Shahin Shahr and Meymeh County, on the slopes of the Karkas mountains. It is also written Seh, Sō or Sūh. Neighbours are ${c.location.neighbours.map(esc).join(", ")}.</p>
  <dl>${c.location.distances.map((d) => `<dt>${esc(d.to)}</dt><dd>${esc(d.km)} km <span class="src">(${esc(d.source)})</span></dd>`).join("")}</dl>
  <p>${esc(c.location.route)}</p>
  <dl>${c.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}${f.source ? ` <span class="src">(${esc(f.source)})</span>` : ""}</dd>`).join("")}</dl>
</section>

<section>
  <h2>People who live there</h2>
  <div class="bars" role="img" aria-label="Population: ${c.population.map((p) => `${p.year} ${p.people}`).join(", ")}">
    ${c.population.map((p) => `<div class="bar"><b>${p.year}</b><i style="width:${Math.round((p.people / maxPop) * 100)}%"></i><span class="n">${p.people} people · ${p.households} households</span></div>`).join("")}
  </div>
  <p class="muted">${chip("census")}Statistical Centre of Iran, via EN Wikipedia. ${esc(c.populationNote)}</p>
</section>

<section>
  <h2>History</h2>
  ${c.history.map((h) => `<div class="item"><p>${chip(h.status)}${esc(h.text)}</p><span class="src">${esc(h.source)}</span></div>`).join("")}
</section>

<section>
  <h2>Places to see</h2>
  ${c.landmarks.map((l) => `<div class="item"><h3>${esc(l.name)} ${fa(l.fa)}</h3><p>${esc(l.text)}</p><span class="src">${chip(l.status)}${esc(l.source)}</span></div>`).join("")}
  <p class="muted">Nature and walks (${esc(c.nature.source)}):</p>
  <ul class="tags">${c.nature.places.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
</section>

<section>
  <h2>Land and livelihood</h2>
  <p>${esc(c.livelihood.summary)}</p>
  <p>${esc(c.livelihood.apples)}</p>
  <p class="muted">Grown here</p><ul class="tags">${c.livelihood.crops.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  <p class="muted">From the animals</p><ul class="tags">${c.livelihood.dairy.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  <p class="muted">Crafts</p><ul class="tags">${c.livelihood.crafts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  <span class="src">${esc(c.livelihood.source)}</span>
</section>

<section>
  <h2>Muharram traditions</h2>
  <div class="item"><p>${chip(c.traditions.status)}${esc(c.traditions.text)}</p><span class="src">${esc(c.traditions.source)}</span></div>
</section>

<section>
  <h2>Notable people</h2>
  <p class="muted">${esc(c.people.note)}</p>
  ${c.people.list.map((p) => `<div class="item"><h3>${esc(p.name)} ${fa(p.fa)}</h3><p>${esc(p.text)}</p></div>`).join("")}
</section>

<section>
  <h2>Is there a website already?</h2>
  <p>${esc(c.online.official)}</p>
  <ul class="plain">${c.online.channels.map((x) => `<li><b>${esc(x.name)}</b>: ${esc(x.note)}</li>`).join("")}</ul>
</section>

<section>
  <h2>Still to fill in</h2>
  <div class="todo"><h3>Needs checking</h3><ul class="plain">${c.toVerify.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  <div class="todo"><h3>Questions for family</h3><ul class="plain">${c.askFamily.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
</section>

<footer>
  <p>Sources: ${c.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(" · ")}</p>
  <p>Draft built from public web sources on ${esc(c.meta.updated)}. Labels show how well each fact is backed.</p>
</footer>
</div>
`;

mkdirSync(join(root, "artifact"), { recursive: true });
writeFileSync(join(root, "artifact/soh.html"), html);
console.log("wrote artifact/soh.html", html.length, "bytes");
