import { describe, it, expect } from 'vitest'
import { actionTarget, arcAngles, arcRadius, type DialMetrics } from './geometry'

const m: DialMetrics = { triggerD: 56, actionD: 44, gap: 14, radius: 60 }

describe('arcAngles', () => {
  it('fans into the free space per placement', () => {
    expect(arcAngles('bottom-right')).toEqual([90, 175]) // up → left
    expect(arcAngles('bottom-left')).toEqual([90, 5]) // up → right
    expect(arcAngles('bottom-center')).toEqual([145, 35]) // up-left → up-right
  })
})

describe('arcRadius', () => {
  const base = { triggerD: 56, actionD: 44, gap: 14 }

  it('is at least clear of the trigger + action + gap', () => {
    expect(arcRadius(base, 2)).toBe(64) // floor: 28 + 22 + 14
    expect(arcRadius(base, 1)).toBe(64) // a lone action never tightens below the floor
  })

  it('widens as the dial grows so arc neighbours keep spacing', () => {
    expect(arcRadius(base, 5)).toBeGreaterThan(arcRadius(base, 3))
  })

  // The whole point of the chord formula: neighbours never overlap, at any count
  // or span. Chord between adjacent actions must stay >= actionD + gap.
  it('keeps adjacent action circles from overlapping for every count and placement', () => {
    const placements = ['bottom-left', 'bottom-center', 'bottom-right'] as const
    for (const placement of placements) {
      const [a0, a1] = arcAngles(placement)
      const span = (Math.abs(a1 - a0) * Math.PI) / 180
      for (let count = 2; count <= 6; count++) {
        const r = arcRadius(base, count, placement)
        const step = span / (count - 1)
        const chord = 2 * r * Math.sin(step / 2)
        expect(chord).toBeGreaterThanOrEqual(base.actionD + base.gap - 1e-6)
      }
    }
  })
})

describe('actionTarget — column', () => {
  it('stacks straight up, action 0 closest to the trigger', () => {
    const t0 = actionTarget(0, 3, 'column', 'bottom-right', m)
    const t1 = actionTarget(1, 3, 'column', 'bottom-right', m)
    expect(t0.x).toBe(0)
    expect(t0.y).toBe(-64) // 28 + 14 + 22
    expect(t1.y).toBe(-122) // -64 - (44 + 14)
    expect(t1.y).toBeLessThan(t0.y) // further up
  })
})

describe('actionTarget — arc', () => {
  it('bottom-right fans up (i=0) → left (last)', () => {
    const first = actionTarget(0, 3, 'arc', 'bottom-right', m)
    const last = actionTarget(2, 3, 'arc', 'bottom-right', m)
    expect(first.x).toBeCloseTo(0, 5) // straight up
    expect(first.y).toBeCloseTo(-60, 5)
    expect(last.x).toBeLessThan(-40) // swung left
    expect(last.y).toBeGreaterThan(-15) // near horizontal
  })

  it('every action goes up or level, never below the trigger', () => {
    for (let i = 0; i < 4; i++) {
      expect(actionTarget(i, 4, 'arc', 'bottom-right', m).y).toBeLessThanOrEqual(0.0001)
    }
  })

  it('a single action sits at the arc midpoint', () => {
    const only = actionTarget(0, 1, 'arc', 'bottom-right', m)
    // midpoint of [90,175] = 132.5° → up-and-left
    expect(only.x).toBeLessThan(0)
    expect(only.y).toBeLessThan(0)
  })
})
