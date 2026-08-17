import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'
import { BackHandler, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import type { FabColors, FabGroupProps, FabPlacement } from './types'
import { FabGroupContext, type FabGroupCtx } from './context'
import { cornerContainer } from './Fab'
import {
  ACTION_D,
  DEFAULT_OFFSET,
  DIAL_GAP,
  SIZES,
  WHEEL_SPACING,
  WHEEL_VIS_EDGE,
  WHEEL_VIS_FULL,
  resolveColors,
  variantColors,
  wheelRadiusDefault,
} from './theme'
import { arcRadius, wheelWindowCenter } from './geometry'
import { tick } from './haptics'
import { BlurView } from './blur'
import { Gesture, GestureDetector } from './gesture'

const OPEN_MS = 240
const CLOSE_MS = 200

// Named `createAnimatedComponent` (not `Animated.View`/`Animated.createAnimatedComponent`)
// so the built output survives Metro's CJS interop of Reanimated's ESM-only, no-top-level-
// `View` package — reaching through the default export resolves to `undefined` there.
const AnimatedView = createAnimatedComponent(View)
const AnimatedPressable = createAnimatedComponent(Pressable)

/**
 * A speed dial: a trigger that opens a set of `Fab.Action`s. The whole dial runs
 * off one shared value on the UI thread — each action derives its own staggered
 * share from its index — so there is no chain of timeouts to fall out of step.
 *
 * `dial="wheel"` makes it a spinnable ring you grab-and-turn with momentum (needs
 * optional `react-native-gesture-handler`; without it the ring renders static).
 */
export function FabGroup({
  icon,
  label,
  open,
  onOpenChange,
  dial = 'column',
  wheelRadius,
  placement = 'bottom-right',
  offset = DEFAULT_OFFSET,
  size = 'md',
  variant = 'primary',
  disabled = false,
  haptics = false,
  blur = false,
  modal = true,
  rotateOnOpen = true,
  accessibilityLabel,
  colors: colorOverrides,
  children,
  style,
}: FabGroupProps) {
  const colors = resolveColors(colorOverrides)
  const { bg, fg } = variantColors(colors, variant)
  const d = SIZES[size]
  const isWheel = dial === 'wheel'

  const items = useMemo(
    () => Children.toArray(children).filter(isValidElement) as ReactElement[],
    [children],
  )
  const count = items.length

  const controlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlled ? !!open : internalOpen
  // The trigger's real width — equals `d` until a `label` makes it a wider pill.
  // The dial anchors on this so a labelled trigger doesn't offset the whole column.
  const [triggerW, setTriggerW] = useState(d)
  // Actions/scrim stay mounted through the close animation, then unmount — a
  // column kept alive behind the trigger would be in the a11y tree.
  const [rendered, setRendered] = useState(false)

  const progress = useSharedValue(0)
  // Wheel rotation (degrees) + pan bookkeeping. Inert for column/arc.
  const rotation = useSharedValue(0)
  const lastAngle = useSharedValue(0)
  const angVel = useSharedValue(0)

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled) return
      if (!controlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [controlled, disabled, onOpenChange],
  )
  const close = useCallback(() => setOpen(false), [setOpen])

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      rotation.value = 0 // open with the first item at the front each time
      progress.value = withTiming(1, { duration: OPEN_MS })
      return
    }
    progress.value = withTiming(0, { duration: CLOSE_MS })
    const t = setTimeout(() => setRendered(false), CLOSE_MS + 40)
    return () => clearTimeout(t)
  }, [isOpen, progress, rotation])

  // Android back closes the dial rather than popping the screen behind it.
  useEffect(() => {
    if (!isOpen) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => sub.remove()
  }, [isOpen, close])

  const metrics = useMemo(
    () => ({
      triggerD: d,
      actionD: ACTION_D,
      gap: DIAL_GAP,
      radius: arcRadius({ triggerD: d, actionD: ACTION_D, gap: DIAL_GAP }, count, placement),
    }),
    [d, count, placement],
  )

  // Wheel layout: an orbit radius, the front angle for this placement, and a square
  // field anchored at the corner whose centre is the trigger/orbit centre.
  const radius = wheelRadius ?? wheelRadiusDefault(d, ACTION_D)
  const wheel = useMemo(() => {
    const centerInset = offset + d / 2
    const field = radius + ACTION_D / 2 + 8 + centerInset
    const cy = field - centerInset
    const cx =
      placement === 'bottom-left' ? centerInset : placement === 'bottom-center' ? field / 2 : field - centerInset
    return {
      radius,
      spacing: WHEEL_SPACING,
      windowCenter: wheelWindowCenter(placement),
      visFull: WHEEL_VIS_FULL,
      visEdge: WHEEL_VIS_EDGE,
      center: { x: cx, y: cy },
      field,
    }
  }, [radius, placement, offset, d])

  // Grab-and-spin: rotate the ring by the angle the finger sweeps around the centre,
  // then coast with clamped momentum. Null (no gesture) if gesture-handler is absent.
  const pan = useMemo(() => {
    if (!isWheel || !Gesture) return null
    const G = Gesture as any
    const cx = wheel.center.x
    const cy = wheel.center.y
    return G.Pan()
      .enabled(isOpen)
      .onBegin((e: { x: number; y: number }) => {
        'worklet'
        lastAngle.value = Math.atan2(-(e.y - cy), e.x - cx)
        angVel.value = 0
      })
      .onChange((e: { x: number; y: number }) => {
        'worklet'
        const a = Math.atan2(-(e.y - cy), e.x - cx)
        let dd = a - lastAngle.value
        if (dd > Math.PI) dd -= 2 * Math.PI
        if (dd < -Math.PI) dd += 2 * Math.PI
        const deg = (dd * 180) / Math.PI
        rotation.value += deg
        angVel.value = angVel.value * 0.75 + deg * 60 * 0.25
        lastAngle.value = a
      })
      .onEnd(() => {
        'worklet'
        const v = Math.max(-900, Math.min(900, angVel.value))
        rotation.value = withDecay({ velocity: v, deceleration: 0.9985 })
      })
  }, [isWheel, isOpen, wheel.center.x, wheel.center.y, rotation, lastAngle, angVel])

  const ctx: FabGroupCtx = useMemo(
    () => ({
      progress,
      rotation,
      count,
      dial,
      placement,
      size,
      triggerD: d,
      triggerW,
      offset,
      colors,
      metrics,
      wheel,
      labelSide: placement === 'bottom-left' ? 'right' : 'left',
      haptics,
      close,
    }),
    [progress, rotation, count, dial, placement, size, d, triggerW, offset, colors, metrics, wheel, haptics, close],
  )

  const positioned = items.map((child, i) =>
    cloneElement(child as ReactElement<{ __index?: number }>, { __index: i, key: child.key ?? i }),
  )

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(rotateOnOpen ? 45 : 0) * progress.value}deg` }],
  }))

  const triggerNode = (
    <View pointerEvents="box-none" style={cornerContainer(placement, offset)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, expanded: isOpen }}
        disabled={disabled}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          if (w > 0 && Math.abs(w - triggerW) > 0.5) setTriggerW(w)
        }}
        onPress={() => {
          tick(haptics)
          setOpen(!isOpen)
        }}
        style={({ pressed }) => [
          styles.trigger,
          {
            height: d,
            minWidth: d,
            borderRadius: d / 2,
            paddingHorizontal: label ? d * 0.34 : 0,
            backgroundColor: bg,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          },
          style,
        ]}
      >
        <AnimatedView style={iconStyle}>{icon}</AnimatedView>
        {label ? (
          <Text style={[styles.triggerLabel, { color: fg, marginLeft: icon ? 8 : 0 }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  )

  const GD = GestureDetector as ComponentType<{ gesture: unknown; children?: ReactNode }> | null

  return (
    <FabGroupContext.Provider value={ctx}>
      {rendered && modal ? (
        <Scrim blur={blur} colors={colors} onPress={close} isOpen={isOpen} progress={progress} />
      ) : null}

      {isWheel ? (
        // A field anchored at the corner: only this region catches the spin drag, so a
        // non-modal wheel leaves the rest of the screen scrollable.
        <View pointerEvents="box-none" style={wheelFieldStyle(placement, wheel.field)}>
          {rendered ? (
            pan && GD ? (
              <GD gesture={pan}>
                <AnimatedView pointerEvents="box-none" style={StyleSheet.absoluteFill} collapsable={false}>
                  {positioned}
                </AnimatedView>
              </GD>
            ) : (
              <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                {positioned}
              </View>
            )
          ) : null}
          {triggerNode}
        </View>
      ) : (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {rendered ? positioned : null}
          {triggerNode}
        </View>
      )}
    </FabGroupContext.Provider>
  )
}

/** Square field anchored at the placement corner; its centre is the orbit centre. */
function wheelFieldStyle(placement: FabPlacement, field: number): ViewStyle {
  const base: ViewStyle = { position: 'absolute', bottom: 0, width: field, height: field }
  if (placement === 'bottom-left') return { ...base, left: 0 }
  if (placement === 'bottom-center') return { ...base, left: '50%', marginLeft: -field / 2 }
  return { ...base, right: 0 }
}

function Scrim({
  blur,
  colors,
  onPress,
  isOpen,
  progress,
}: {
  blur: boolean
  colors: FabColors
  onPress: () => void
  isOpen: boolean
  progress: SharedValue<number>
}) {
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }))
  const Blur = BlurView as ComponentType<{ intensity?: number; tint?: string; style?: unknown }> | null
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Close menu"
      onPress={onPress}
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, scrimStyle]}
    >
      {blur && Blur ? (
        <Blur intensity={24} tint="default" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  triggerLabel: { fontSize: 15, fontWeight: '600' },
})
