import { useState } from 'react'
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { Fab, type FabDial, type FabPlacement } from '@ministicdev/fabkit'

// ---- the pool of dial actions (sliced to the chosen count) ----------------

type ActionDef = { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; destructive?: boolean }

const ACTIONS: ActionDef[] = [
  { key: 'photo', icon: 'image-outline', label: 'Photo' },
  { key: 'attach', icon: 'attach-outline', label: 'Attachment' },
  { key: 'voice', icon: 'mic-outline', label: 'Voice note' },
  { key: 'bookmark', icon: 'bookmark-outline', label: 'Save draft' },
  { key: 'delete', icon: 'trash-outline', label: 'Discard', destructive: true },
]

export default function App() {
  return (
    <SafeAreaProvider>
      <Gallery />
    </SafeAreaProvider>
  )
}

function Gallery() {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'
  const insets = useSafeAreaInsets()
  const t = dark ? THEME.dark : THEME.light

  const [dial, setDial] = useState<FabDial>('arc')
  const [placement, setPlacement] = useState<FabPlacement>('bottom-right')
  const [count, setCount] = useState(4)
  const [blur, setBlur] = useState(false)
  const [rotate, setRotate] = useState(true)
  const [extended, setExtended] = useState(false)
  const [lastPicked, setLastPicked] = useState<string>('—')

  const actions = ACTIONS.slice(0, count)

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 220, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.h1, { color: t.fg }]}>fabkit</Text>
        <Text style={[styles.sub, { color: t.dim }]}>
          A floating action button, alone or as a speed dial that unfolds in a column or an arc. Flip the
          controls — the live dial in the corner updates.
        </Text>

        <Text style={[styles.picked, { color: t.dim }]}>
          last picked: <Text style={{ color: t.accent, fontWeight: '700' }}>{lastPicked}</Text>
        </Text>

        {/* ---- live controls ---- */}
        <Card t={t} title="Dial">
          <Segmented t={t} value={dial} onChange={setDial} options={[['column', 'Column'], ['arc', 'Arc']]} />
        </Card>

        <Card t={t} title="Placement">
          <Segmented
            t={t}
            value={placement}
            onChange={setPlacement}
            options={[
              ['bottom-left', 'Left'],
              ['bottom-center', 'Center'],
              ['bottom-right', 'Right'],
            ]}
          />
        </Card>

        <Card t={t} title="Actions">
          <Segmented
            t={t}
            value={count}
            onChange={setCount}
            options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]}
          />
        </Card>

        <View style={styles.switchRow}>
          <Toggle t={t} label="Blur" value={blur} onChange={setBlur} />
          <Toggle t={t} label="Rotate +" value={rotate} onChange={setRotate} />
          <Toggle t={t} label="Trigger label" value={extended} onChange={setExtended} />
        </View>

        {/* ---- static in-flow showcase ---- */}
        <Text style={[styles.section, { color: t.fg }]}>Solo — variants</Text>
        <Text style={[styles.hint, { color: t.dim }]}>Without a placement, a Fab is an ordinary round button.</Text>
        <View style={styles.flowRow}>
          <Fab icon={<Ionicons name="add" size={22} color="#fff" />} accessibilityLabel="Add" />
          <Fab variant="secondary" icon={<Ionicons name="pencil" size={20} color="#fff" />} accessibilityLabel="Edit" />
          <Fab
            variant="surface"
            icon={<Ionicons name="search" size={20} color="#111318" />}
            accessibilityLabel="Search"
          />
          <Fab
            variant="destructive"
            icon={<Ionicons name="trash" size={20} color="#fff" />}
            accessibilityLabel="Delete"
          />
        </View>

        <Text style={[styles.section, { color: t.fg }]}>Solo — sizes</Text>
        <View style={styles.flowRow}>
          <Fab size="sm" icon={<Ionicons name="add" size={18} color="#fff" />} accessibilityLabel="Add small" />
          <Fab size="md" icon={<Ionicons name="add" size={22} color="#fff" />} accessibilityLabel="Add medium" />
          <Fab size="lg" icon={<Ionicons name="add" size={28} color="#fff" />} accessibilityLabel="Add large" />
        </View>

        <Text style={[styles.section, { color: t.fg }]}>Solo — extended</Text>
        <View style={[styles.flowRow, { alignItems: 'center' }]}>
          <Fab extended icon={<Ionicons name="create-outline" size={20} color="#fff" />}>
            Compose
          </Fab>
        </View>
      </ScrollView>

      {/* ---- the live speed dial, pinned over the whole screen ---- */}
      <Fab.Group
        key={`${placement}-${dial}`}
        dial={dial}
        placement={placement}
        blur={blur}
        rotateOnOpen={rotate}
        offset={16 + insets.bottom}
        icon={<Ionicons name="add" size={26} color="#fff" />}
        label={extended ? 'Create' : undefined}
        accessibilityLabel="Create"
        haptics
      >
        {actions.map((a) => (
          <Fab.Action
            key={a.key}
            destructive={a.destructive}
            icon={<Ionicons name={a.icon} size={20} color={a.destructive ? '#fff' : '#111318'} />}
            label={a.label}
            onPress={() => setLastPicked(a.label)}
          />
        ))}
      </Fab.Group>
    </View>
  )
}

// ---- little UI kit for the demo (not part of fabkit) ----------------------

type T = (typeof THEME)['light']

function Card({ t, title, children }: { t: T; title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[styles.cardTitle, { color: t.dim }]}>{title}</Text>
      {children}
    </View>
  )
}

function Segmented<V extends string | number>({
  t,
  value,
  onChange,
  options,
}: {
  t: T
  value: V
  onChange: (v: V) => void
  options: [V, string][]
}) {
  return (
    <View style={[styles.segment, { backgroundColor: t.segBg }]}>
      {options.map(([v, label]) => {
        const on = v === value
        return (
          <Text
            key={String(v)}
            onPress={() => onChange(v)}
            style={[
              styles.segItem,
              { color: on ? t.segOnFg : t.dim, backgroundColor: on ? t.accent : 'transparent' },
            ]}
          >
            {label}
          </Text>
        )
      })}
    </View>
  )
}

function Toggle({
  t,
  label,
  value,
  onChange,
}: {
  t: T
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Text
      onPress={() => onChange(!value)}
      style={[
        styles.toggle,
        {
          color: value ? t.segOnFg : t.dim,
          backgroundColor: value ? t.accent : t.segBg,
          borderColor: t.border,
        },
      ]}
    >
      {label}
    </Text>
  )
}

const THEME = {
  light: {
    bg: '#f4f5f7',
    fg: '#111318',
    dim: '#5b616e',
    card: '#ffffff',
    border: '#e6e8ec',
    segBg: '#eceef2',
    segOnFg: '#ffffff',
    accent: '#2c5fe0',
  },
  dark: {
    bg: '#0e1013',
    fg: '#f3f5f8',
    dim: '#9aa0ad',
    card: '#181b21',
    border: '#262a32',
    segBg: '#20242c',
    segOnFg: '#ffffff',
    accent: '#5b8cff',
  },
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  h1: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  picked: { fontSize: 13, marginTop: 14 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginTop: 14 },
  cardTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  segment: { flexDirection: 'row', borderRadius: 11, padding: 3, gap: 3 },
  segItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  switchRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  toggle: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  section: { fontSize: 18, fontWeight: '700', marginTop: 26, marginBottom: 4 },
  hint: { fontSize: 13, marginBottom: 12 },
  flowRow: { flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
})
