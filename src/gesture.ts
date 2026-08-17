// Optional react-native-gesture-handler — needed only by `dial="wheel"` to grab-and-
// spin the ring. If it isn't installed, `GestureDetector`/`Gesture` are null and the
// wheel renders static (still opens; just no spin), matching fabkit's other optional peers.
declare const require: ((moduleId: string) => unknown) | undefined

let GestureDetector: unknown = null
let Gesture: unknown = null
try {
  if (typeof require !== 'undefined') {
    const gh = require('react-native-gesture-handler') as {
      GestureDetector?: unknown
      Gesture?: unknown
    }
    GestureDetector = gh.GestureDetector ?? null
    Gesture = gh.Gesture ?? null
  }
} catch {
  GestureDetector = null
  Gesture = null
}

export { GestureDetector, Gesture }
