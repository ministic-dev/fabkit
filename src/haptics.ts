// Optional expo-haptics — a silent no-op if the package isn't installed.
// (Metro provides `require`; declared here since tsconfig ships no @types/node.)
declare const require: ((moduleId: string) => unknown) | undefined

let mod: { impactAsync?: (s?: unknown) => void; ImpactFeedbackStyle?: { Light?: unknown } } | null = null
try {
  if (typeof require !== 'undefined') {
    mod = require('expo-haptics') as typeof mod
  }
} catch {
  mod = null
}

/** A light tap on press. No-op when `enabled` is false or expo-haptics is absent. */
export function tick(enabled?: boolean): void {
  if (!enabled || !mod) return
  try {
    mod.impactAsync?.(mod.ImpactFeedbackStyle?.Light)
  } catch {
    // silent
  }
}
