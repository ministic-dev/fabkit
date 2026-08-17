import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export type FabPlacement = 'bottom-left' | 'bottom-center' | 'bottom-right'
export type FabSize = 'sm' | 'md' | 'lg'
export type FabVariant = 'primary' | 'secondary' | 'surface' | 'destructive'
/** How a `Fab.Group` dial unfolds. `column` stacks straight up; `arc` fans along a bend. */
export type FabDial = 'column' | 'arc'

/** Overridable palette. Pass a partial to `colors` to theme any part. */
export interface FabColors {
  primary: string
  onPrimary: string
  secondary: string
  onSecondary: string
  surface: string
  onSurface: string
  destructive: string
  onDestructive: string
  labelBg: string
  labelText: string
  scrim: string
}

export interface FabProps {
  /** The glyph. Sized by you. */
  icon?: ReactNode
  /** Spell the action out beside the glyph (stadium shape). Label is `children`. */
  extended?: boolean
  /** Label text, shown when `extended`. */
  children?: ReactNode
  /** Pin it over the content, in a corner. Omit for an in-flow button. */
  placement?: FabPlacement
  /** Distance from the edges when `placement` is set, in points. Add your safe-area inset. */
  offset?: number
  size?: FabSize
  variant?: FabVariant
  onPress?: () => void
  disabled?: boolean
  /** A tick on press (needs optional `expo-haptics`; silent without it). */
  haptics?: boolean
  /** Required for an icon-only button — a lone glyph reads out as nothing. */
  accessibilityLabel?: string
  colors?: Partial<FabColors>
  style?: StyleProp<ViewStyle>
}

export interface FabGroupProps {
  icon?: ReactNode
  /** The trigger's label, if it should be extended while closed. */
  label?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Dial shape. Default `column`; `arc` fans the actions along a bend. */
  dial?: FabDial
  placement?: FabPlacement
  offset?: number
  size?: FabSize
  variant?: FabVariant
  disabled?: boolean
  haptics?: boolean
  /** Frost the screen behind the open dial (needs optional `expo-blur`) instead of dimming it. */
  blur?: boolean
  /**
   * Modal (default `true`) renders a full-screen backdrop while open — it dims/frosts
   * the screen and taps anywhere outside close the dial. Set `false` for a non-modal
   * dial: no backdrop, so content behind stays scrollable and interactive; it then
   * closes only via the trigger or by picking an action.
   */
  modal?: boolean
  /** Turn the trigger's glyph a quarter circle while open (plus → cross). Default true. */
  rotateOnOpen?: boolean
  accessibilityLabel?: string
  colors?: Partial<FabColors>
  /** `Fab.Action` children. */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export interface FabActionProps {
  icon?: ReactNode
  /** What it does, beside the glyph. A column of unlabelled circles is a quiz. */
  label?: string
  onPress?: () => void
  disabled?: boolean
  /** Draw it in the destructive colour, for the one that removes something. */
  destructive?: boolean
  style?: StyleProp<ViewStyle>
}
