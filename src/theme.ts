import type { FabColors, FabSize, FabVariant } from './types'

export const DEFAULT_OFFSET = 16

/** Trigger diameters per size. */
export const SIZES: Record<FabSize, number> = { sm: 40, md: 56, lg: 72 }

/** Dial action circle diameter, and the gap between stacked items. */
export const ACTION_D = 44
export const DIAL_GAP = 14

export const DEFAULT_COLORS: FabColors = {
  primary: '#2c5fe0',
  onPrimary: '#ffffff',
  secondary: '#3a3f4b',
  onSecondary: '#ffffff',
  surface: '#ffffff',
  onSurface: '#111318',
  destructive: '#d64550',
  onDestructive: '#ffffff',
  labelBg: 'rgba(20, 23, 31, 0.92)',
  labelText: '#ffffff',
  scrim: 'rgba(0, 0, 0, 0.32)',
}

export function resolveColors(overrides?: Partial<FabColors>): FabColors {
  return overrides ? { ...DEFAULT_COLORS, ...overrides } : DEFAULT_COLORS
}

export function variantColors(colors: FabColors, variant: FabVariant): { bg: string; fg: string } {
  switch (variant) {
    case 'secondary':
      return { bg: colors.secondary, fg: colors.onSecondary }
    case 'surface':
      return { bg: colors.surface, fg: colors.onSurface }
    case 'destructive':
      return { bg: colors.destructive, fg: colors.onDestructive }
    default:
      return { bg: colors.primary, fg: colors.onPrimary }
  }
}
