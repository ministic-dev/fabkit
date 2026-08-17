import { Fab as FabBase } from './Fab'
import { FabGroup } from './FabGroup'
import { FabAction } from './FabAction'

type FabCompound = typeof FabBase & {
  Group: typeof FabGroup
  Action: typeof FabAction
}

const Fab = FabBase as FabCompound
Fab.Group = FabGroup
Fab.Action = FabAction

export { Fab }

export type {
  FabProps,
  FabGroupProps,
  FabActionProps,
  FabPlacement,
  FabSize,
  FabVariant,
  FabDial,
  FabColors,
} from './types'

// Geometry helpers, for laying out a dial yourself.
export { actionTarget, arcAngles, arcRadius, type DialMetrics } from './geometry'
