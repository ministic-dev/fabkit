import { createContext, useContext } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import type { FabColors, FabDial, FabPlacement, FabSize } from './types'
import type { DialMetrics } from './geometry'

export interface FabGroupCtx {
  /** 0 = closed, 1 = fully open. Drives every action's staggered unfold. */
  progress: SharedValue<number>
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
