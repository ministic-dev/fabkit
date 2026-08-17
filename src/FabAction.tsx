import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { createAnimatedComponent, Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import type { FabActionProps } from './types'
import { useFabGroup, type FabGroupCtx } from './context'
import { actionTarget } from './geometry'
import { tick } from './haptics'

// Build the animated View from the named `createAnimatedComponent` export rather
// than reaching through `AnimatedView`. Reanimated ships ESM-only with no
// top-level `View` (it lives on the default export), so a CJS/interop build of
// `AnimatedView` resolves to `undefined` under Metro. `createAnimatedComponent`
// is a real named export and survives that interop.
const AnimatedView = createAnimatedComponent(View)

interface InternalActionProps extends FabActionProps {
  /** Injected by Fab.Group — the action's order in the dial. */
  __index?: number
}

/**
 * One member of a `Fab.Group` dial. Reads the dial's shared open progress and
 * unfolds to its own column/arc position on the UI thread, a touch after the
 * one before it. Throws outside a `Fab.Group`.
 */
export function FabAction({
  icon,
  label,
  onPress,
  disabled = false,
  destructive,
  style,
  __index = 0,
}: InternalActionProps) {
  const g = useFabGroup()
  const i = __index

  const isWheel = g.dial === 'wheel'

  const target = useMemo(
    () => actionTarget(i, g.count, g.dial, g.placement, g.metrics),
    [i, g.count, g.dial, g.placement, g.metrics],
  )
  // Each action opens over [start, 1] — later ones start a touch later (the stagger).
  const start = Math.min(0.6, i * 0.09)
  // Wheel: this item's fixed slot on the ring.
  const offsetDeg = i * g.wheel.spacing

  // At bottom-center the dial fans BOTH ways, so a single fixed side would drop
  // labels on top of neighbouring circles — send each label to its own outer side.
  const labelSide: 'left' | 'right' =
    g.placement === 'bottom-center' ? (target.x >= 0 ? 'right' : 'left') : g.labelSide

  const wrapStyle = useAnimatedStyle(() => {
    if (g.dial === 'wheel') {
      const w = g.wheel
      const period = g.count * w.spacing
      // Wrap into [-period/2, period/2] so the ring loops seamlessly.
      let dd = (((offsetDeg + g.rotation.value) % period) + period) % period
      if (dd > period / 2) dd -= period
      const eff = ((w.windowCenter + dd) * Math.PI) / 180
      const r = w.radius * g.progress.value
      const ad2 = dd < 0 ? -dd : dd
      // Solid across the front arc; the next item peeks in at the edges before hiding.
      const vis = ad2 <= w.visFull ? 1 : Math.max(0, (w.visEdge - ad2) / (w.visEdge - w.visFull))
      return {
        opacity: g.progress.value * vis,
        transform: [
          { translateX: r * Math.cos(eff) },
          { translateY: -r * Math.sin(eff) },
          { scale: 0.74 + 0.26 * vis },
        ],
      }
    }
    const local = interpolate(g.progress.value, [start, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity: local,
      transform: [
        { translateX: target.x * local },
        { translateY: target.y * local },
        { scale: 0.5 + 0.5 * local },
      ],
    }
  })

  const bg = destructive ? g.colors.destructive : g.colors.surface
  const ad = g.metrics.actionD

  return (
    <AnimatedView pointerEvents="box-none" style={[isWheel ? wheelAnchor(g) : anchor(g), wrapStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => {
          if (disabled) return
          tick(g.haptics)
          g.close()
          onPress?.()
        }}
        style={({ pressed }) => [
          styles.circle,
          {
            width: ad,
            height: ad,
            borderRadius: ad / 2,
            backgroundColor: bg,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          },
          style,
        ]}
      >
        {icon}
      </Pressable>

      {label && !isWheel ? (
        <View
          pointerEvents="none"
          style={[styles.labelWrap, labelSide === 'left' ? { right: ad + 10 } : { left: ad + 10 }]}
        >
          <Text
            numberOfLines={1}
            style={[styles.labelChip, { color: g.colors.labelText, backgroundColor: g.colors.labelBg }]}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </AnimatedView>
  )
}

/** Wheel: absolute, action-sized wrapper centred on the orbit centre (the rotation
 * pivot). The animated style then translates it out to its place on the ring. */
function wheelAnchor(g: FabGroupCtx): ViewStyle {
  const { actionD } = g.metrics
  return {
    position: 'absolute',
    width: actionD,
    height: actionD,
    left: g.wheel.center.x - actionD / 2,
    top: g.wheel.center.y - actionD / 2,
  }
}

/** Absolute, action-sized wrapper whose center sits on the trigger's center. */
function anchor(g: FabGroupCtx): ViewStyle {
  const { actionD } = g.metrics
  // Vertical centering uses the trigger's height (always its diameter); horizontal
  // uses its measured width, so a labelled (pill) trigger doesn't offset the dial.
  const vInset = g.offset + (g.triggerD - actionD) / 2
  const hInset = g.offset + (g.triggerW - actionD) / 2
  const base: ViewStyle = { position: 'absolute', width: actionD, height: actionD, bottom: vInset }
  if (g.placement === 'bottom-left') return { ...base, left: hInset }
  if (g.placement === 'bottom-center') return { ...base, left: '50%', marginLeft: -actionD / 2 }
  return { ...base, right: hInset }
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  labelWrap: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  labelChip: {
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
})
