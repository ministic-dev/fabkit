import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import type { FabPlacement, FabProps } from './types'
import { DEFAULT_OFFSET, SIZES, resolveColors, variantColors } from './theme'
import { tick } from './haptics'

/**
 * A single floating action button. With `placement` it pins to a corner of the
 * nearest positioned ancestor (on a screen, the screen); without it, it's an
 * ordinary round button in the flow.
 */
export function Fab({
  icon,
  extended = false,
  children,
  placement,
  offset = DEFAULT_OFFSET,
  size = 'md',
  variant = 'primary',
  onPress,
  disabled = false,
  haptics = false,
  accessibilityLabel,
  colors: colorOverrides,
  style,
}: FabProps) {
  const colors = resolveColors(colorOverrides)
  const { bg, fg } = variantColors(colors, variant)
  const d = SIZES[size]

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        if (disabled) return
        tick(haptics)
        onPress?.()
      }}
      style={({ pressed }) => [
        styles.button,
        {
          height: d,
          minWidth: d,
          borderRadius: d / 2,
          paddingHorizontal: extended ? d * 0.34 : 0,
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {icon}
      {extended && children != null ? (
        <Text style={[styles.label, { color: fg, marginLeft: icon ? 8 : 0 }]} numberOfLines={1}>
          {children}
        </Text>
      ) : null}
    </Pressable>
  )

  if (!placement) return button
  return (
    <View pointerEvents="box-none" style={cornerContainer(placement, offset)}>
      {button}
    </View>
  )
}

/** Absolute container pinning a button to a bottom corner of the parent. */
export function cornerContainer(placement: FabPlacement, offset: number): ViewStyle {
  const base: ViewStyle = { position: 'absolute', bottom: offset }
  if (placement === 'bottom-left') return { ...base, left: offset }
  if (placement === 'bottom-center') return { ...base, left: 0, right: 0, alignItems: 'center' }
  return { ...base, right: offset }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: { fontSize: 15, fontWeight: '600' },
})
