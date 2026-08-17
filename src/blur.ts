// Optional expo-blur — `BlurView` if installed, else null (callers fall back to a dim scrim).
declare const require: ((moduleId: string) => unknown) | undefined

let BlurView: unknown = null
try {
  if (typeof require !== 'undefined') {
    BlurView = (require('expo-blur') as { BlurView?: unknown }).BlurView ?? null
  }
} catch {
  BlurView = null
}

export { BlurView }
