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
} from 'react'
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native'
import { createAnimatedComponent, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated'
import type { FabColors, FabGroupProps } from './types'
import { FabGroupContext, type FabGroupCtx } from './context'
import { cornerContainer } from './Fab'
import { ACTION_D, DEFAULT_OFFSET, DIAL_GAP, SIZES, resolveColors, variantColors } from './theme'
import { arcRadius } from './geometry'
import { tick } from './haptics'
import { BlurView } from './blur'

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
 */
export function FabGroup({
  icon,
  label,
  open,
  onOpenChange,
  dial = 'column',
  placement = 'bottom-right',
  offset = DEFAULT_OFFSET,
  size = 'md',
  variant = 'primary',
  disabled = false,
  haptics = false,
  blur = false,
  rotateOnOpen = true,
  accessibilityLabel,
  colors: colorOverrides,
  children,
  style,
}: FabGroupProps) {
  const colors = resolveColors(colorOverrides)
  const { bg, fg } = variantColors(colors, variant)
  const d = SIZES[size]

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
      progress.value = withTiming(1, { duration: OPEN_MS })
      return
    }
    progress.value = withTiming(0, { duration: CLOSE_MS })
    const t = setTimeout(() => setRendered(false), CLOSE_MS + 40)
    return () => clearTimeout(t)
  }, [isOpen, progress])

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

  const ctx: FabGroupCtx = useMemo(
    () => ({
      progress,
      count,
      dial,
      placement,
      size,
      triggerD: d,
      triggerW,
      offset,
      colors,
      metrics,
      labelSide: placement === 'bottom-left' ? 'right' : 'left',
      haptics,
      close,
    }),
    [progress, count, dial, placement, size, d, triggerW, offset, colors, metrics, haptics, close],
  )

  const positioned = items.map((child, i) =>
    cloneElement(child as ReactElement<{ __index?: number }>, { __index: i, key: child.key ?? i }),
  )

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(rotateOnOpen ? 45 : 0) * progress.value}deg` }],
  }))

  return (
    <FabGroupContext.Provider value={ctx}>
      {rendered ? <Scrim blur={blur} colors={colors} onPress={close} isOpen={isOpen} progress={progress} /> : null}

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {rendered ? positioned : null}

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
      </View>
    </FabGroupContext.Provider>
  )
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
