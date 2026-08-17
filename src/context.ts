import { createContext, useContext } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { FabColors, FabDial, FabPlacement, FabSize } from './types'
import type { DialMetrics } from './geometry'

/** Layout + tuning a `dial="wheel"` action needs to place and light itself. */
export interface WheelMetrics {
  /** Orbit radius (trigger centre → item centre). */
  radius: number
  /** Degrees between neighbouring items. */
  spacing: number
  /** Front angle the ring is centred on (degrees, +x CCW). */
  windowCenter: number
  /** Fully-solid and fully-hidden angular thresholds from the front. */
  visFull: number
  visEdge: number
  /** The trigger/orbit centre in the wheel field's own coordinate space. */
  center: { x: number; y: number }
}

export interface FabGroupCtx {
  /** 0 = closed, 1 = fully open. Drives every action's staggered unfold. */
  progress: SharedValue<number>
  /** Wheel rotation in degrees (0 for column/arc). */
  rotation: SharedValue<number>
  count: number
  dial: FabDial
  placement: FabPlacement
  size: FabSize
  /** Trigger diameter (its height, and its width when unlabelled). */
  triggerD: number
  /** Measured trigger width — larger than `triggerD` when the trigger carries a label. */
  triggerW: number
  offset: number
  colors: FabColors
  metrics: DialMetrics
  wheel: WheelMetrics
  /** Which side the action labels sit on. */
  labelSide: 'left' | 'right'
  haptics?: boolean
  close: () => void
}

export const FabGroupContext = createContext<FabGroupCtx | null>(null)

export function useFabGroup(): FabGroupCtx {
  const ctx = useContext(FabGroupContext)
  if (!ctx) {
    throw new Error(
      'Fab.Action must be used inside a <Fab.Group>. It reads the dial’s open progress to unfold.',
    )
  }
  return ctx
}
