// Guards the built dist against the one packaging trap that makes the optional
// expo-haptics / expo-blur peers silently dead: the entry Metro actually loads
// (the "react-native" export condition) MUST keep a literal `require("expo-…")`
// that Metro's static dependency collector can see and mark optional. esbuild's
// ESM output rewrites that to `__require(...)`, which Metro can't collect — so the
// react-native entry has to be the CJS build. This asserts exactly that.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const fail = (msg) => {
  console.error(`\n✖ check-dist: ${msg}\n`)
  process.exit(1)
}

// The path Metro resolves for a React Native consumer.
const rnEntry = pkg.exports?.['.']?.['react-native'] ?? pkg['react-native']
if (!rnEntry) fail('no "react-native" export condition / field found in package.json')

const entryFile = resolve(root, rnEntry)
let src
try {
  src = readFileSync(entryFile, 'utf8')
} catch {
  fail(`react-native entry ${rnEntry} does not exist — run \`npm run build\` first`)
}

for (const dep of ['expo-haptics', 'expo-blur']) {
  // A literal require("dep") or require('dep') — what Metro's collector matches.
  const literal = new RegExp(`(?<![\\w$])require\\(\\s*["']${dep}["']\\s*\\)`)
  if (!literal.test(src)) {
    fail(
      `react-native entry (${rnEntry}) has no literal require("${dep}") that Metro can collect.\n` +
        `  The optional "${dep}" peer would be a permanent no-op in a published build.\n` +
        `  The react-native export condition must point at the CJS build (dist/index.cjs).`,
    )
  }
}

console.log(`✓ check-dist: ${rnEntry} keeps Metro-collectable require() for expo-haptics + expo-blur`)
