import type { FabDial, FabPlacement } from './types'

/**
 * Arc sweep per placement — the angular span the actions fan into the free
 * space, as degrees measured from +x CCW (90 = straight up, 180 = left, 0 = right).
 * bottom-right fans up→left; bottom-left up→right; bottom-center up-left→up-right.
 */
export function arcAngles(placement: FabPlacement): [number, number] {
  switch (placement) {
    case 'bottom-left':
      return [90, 5]
    case 'bottom-center':
      return [145, 35]
    default: // bottom-right
      return [90, 175]
  }
}

export interface DialMetrics {
  triggerD: number
  actionD: number
  gap: number
  /** Arc radius (trigger center → action center). */
  radius: number
}

/**
 * Target offset (dx, dy) of action `i` from the trigger center when the dial is
 * fully open. React Native coords: +x right, +y down (so "up" is negative y).
 */
export function actionTarget(
  i: number,
  count: number,
  dial: FabDial,
  placement: FabPlacement,
  m: DialMetrics,
): { x: number; y: number } {
  if (dial === 'arc') {
    const [a0, a1] = arcAngles(placement)
    const deg = count > 1 ? a0 + ((a1 - a0) * i) / (count - 1) : (a0 + a1) / 2
    const rad = (deg * Math.PI) / 180
    return { x: m.radius * Math.cos(rad), y: -m.radius * Math.sin(rad) }
  }
  // column: stack straight up; action 0 is closest to the trigger
  const first = m.triggerD / 2 + m.gap + m.actionD / 2
  const step = m.actionD + m.gap
  return { x: 0, y: -(first + i * step) }
}

/**
 * An arc radius that keeps every action clear of the trigger AND of its arc
 * neighbours. Neighbours sit `span/(count-1)` apart; the chord between two of
 * them is `2·r·sin(Δ/2)`, so to hold at least `gap` between their edges we need
 * `r ≥ (actionD + gap) / (2·sin(Δ/2))`. Taking the max with the trigger-clearance
 * floor means a small dial stays tight while a big one opens up enough not to
 * overlap itself.
 */
export function arcRadius(
  m: Pick<DialMetrics, 'triggerD' | 'actionD' | 'gap'>,
  count: number,
  placement: FabPlacement = 'bottom-right',
): number {
  const floor = m.triggerD / 2 + m.actionD / 2 + m.gap
  if (count < 2) return floor
  const [a0, a1] = arcAngles(placement)
  const spanRad = (Math.abs(a1 - a0) * Math.PI) / 180
  const step = spanRad / (count - 1)
  const chordRadius = (m.actionD + m.gap) / (2 * Math.sin(step / 2))
  return Math.max(floor, chordRadius)
}
