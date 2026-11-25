// Runs the real app on a spare port against the in-memory mock Supabase, seeded with fake people, profiles and sample ads (all four boards, with photos).
// Demo logins (fake, mock only): maryam.demo@example.com / reza.demo@example.com / sara.demo@example.com, password demo-pass-1234;
// no-profile.demo@example.com has an account but no profile yet. Sign up with any new email: Confirm email is OFF unless you call
// http://localhost:54398/__admin/set-confirm?on=1 . Mails Supabase would send are listed at http://localhost:54398/__admin/dump (field "mails").
// For screenshots and visual checks while Al's own dev server (3111) keeps running. Nothing is committed or sent anywhere.
//   node scripts/dev-mock.mjs            -> app on http://localhost:3333 , mock on http://localhost:54398
//   PORT=3444 MOCK_PORT=54397 node scripts/dev-mock.mjs
// Why a copy: "next dev" allows one instance per project folder, so this works in a throwaway copy of the project
// (node_modules is an APFS clone) and mirrors src/, public/ and content/ into it every second, so edits still hot-reload.
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || "3333";
const MOCK_PORT = process.env.MOCK_PORT || "54398";
const CLONE = join(tmpdir(), `soh-devmock-${PORT}`);

// Refuse to start when a port is taken (another dev-mock or app), so no orphaned child is left behind.
for (const port of [PORT, MOCK_PORT]) {
  let busy = false;
  try { busy = execFileSync("lsof", [`-iTCP:${port}`, "-sTCP:LISTEN", "-t"]).toString().trim() !== ""; } catch { /* lsof exits 1 when nothing listens */ }
  if (busy) { console.error(`Port ${port} is already in use. Stop that process or set PORT / MOCK_PORT.`); process.exit(1); }
}

rmSync(CLONE, { recursive: true, force: true });
execFileSync("mkdir", ["-p", CLONE]);
for (const name of readdirSync(ROOT)) {
  if ([".next", "tsconfig.tsbuildinfo", ".git", ".env.local"].includes(name)) continue;
  execFileSync("cp", [name === "node_modules" ? "-Rc" : "-R", join(ROOT, name), join(CLONE, name)]);
}
const sync = () => {
  for (const d of ["src", "public", "content", "docs", "scripts"]) {
    try { execFileSync("rsync", ["-a", "--delete", join(ROOT, d) + "/", join(CLONE, d) + "/"]); } catch {}
  }
};
const timer = setInterval(sync, 1000);

const mock = spawn("node", ["scripts/mock-supabase.mjs"], { cwd: ROOT, env: { ...process.env, MOCK_PORT, MOCK_SEED: "1" }, stdio: "inherit" });
const app = spawn("npx", ["next", "dev", "-p", PORT], {
  cwd: CLONE,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "svc-key",
    IP_HASH_SALT: "dev",
  },
});
const stop = () => { clearInterval(timer); mock.kill(); app.kill(); rmSync(CLONE, { recursive: true, force: true }); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
app.on("exit", stop);
console.log(`app http://localhost:${PORT}/fa/market  mock http://localhost:${MOCK_PORT}  (Ctrl-C stops both)`);
