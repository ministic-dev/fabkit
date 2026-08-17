# fabkit

[![npm version](https://img.shields.io/npm/v/@ministicdev/fabkit.svg)](https://www.npmjs.com/package/@ministicdev/fabkit)
[![license](https://img.shields.io/npm/l/@ministicdev/fabkit.svg)](LICENSE)

**A floating action button toolkit for React Native + Expo.** One action pinned over the content, or a speed dial that unfolds behind it — in a straight **column** or a bending **arc**. The whole dial runs off a single shared value on the UI thread.

```tsx
import { Fab } from '@ministicdev/fabkit'

<Fab placement="bottom-right" icon={<PlusIcon size={24} />} accessibilityLabel="New note" onPress={compose} />
```

---

## Install

```bash
npm install @ministicdev/fabkit
npx expo install react-native-reanimated
```

`react-native-reanimated` (≥3.10) is the one required peer — add its Babel plugin **last** in `babel.config.js`:

```js
plugins: ['react-native-reanimated/plugin']
```

Optional, only if you use the matching prop:
- **`haptics`** → `npx expo install expo-haptics`
- **`blur`** → `npx expo install expo-blur`

Both are silent no-ops when absent.

---

## Composition

```tsx
{/* on its own */}
<Fab icon={…} accessibilityLabel="…" onPress={…} />

{/* or with a dial behind it */}
<Fab.Group icon={…} accessibilityLabel="…" dial="arc">
  <Fab.Action icon={…} label="…" onPress={…} />
  <Fab.Action icon={…} label="…" onPress={…} />
</Fab.Group>
```

`Fab.Action` only works inside a `Fab.Group` — it reads the dial's open progress to know when to unfold, and throws outside one.

---

## The dial: column or arc

`Fab.Group` takes a **`dial`** prop:

```tsx
<Fab.Group dial="column" …>  {/* default — actions stack straight up */}
<Fab.Group dial="arc" …>     {/* actions fan out along a bend around the trigger */}
```

`arc` sweeps the actions into the free space next to the corner — up-and-left from a `bottom-right` trigger, up-and-right from `bottom-left`, and a symmetric fan from `bottom-center`. Either way it's one animation: a single shared value the actions each take their staggered share of, so opening and closing never fall out of step.

```tsx
<Fab.Group icon={<PlusIcon size={24} />} accessibilityLabel="Add" dial="arc" blur>
  <Fab.Action icon={<ImageIcon size={18} />} label="Photo" onPress={addPhoto} />
  <Fab.Action icon={<PaperclipIcon size={18} />} label="Attachment" onPress={attach} />
  <Fab.Action icon={<MicIcon size={18} />} label="Voice note" onPress={record} />
  <Fab.Action icon={<TrashIcon size={18} />} label="Empty drafts" destructive onPress={empty} />
</Fab.Group>
```

Opening drops a scrim (or a `blur`) over the screen — the dial is modal, so the next tap either picks something or closes it, and the scrim is what says so and catches the tap. `rotateOnOpen` turns the trigger's glyph a quarter turn, so a plus becomes a close-cross.

---

## Examples

### Over a list

The case it exists for. `placement` pins it to a corner of the nearest positioned ancestor — on a screen, the screen. Give the list enough bottom padding to scroll clear of it.

```tsx
<View style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>{/* …rows… */}</ScrollView>

  <Fab
    placement="bottom-right"
    icon={<PlusIcon size={24} />}
    accessibilityLabel="New note"
    haptics
    onPress={compose}
  />
</View>
```

### Spelling the action out

`extended` turns the circle into a stadium with a label beside it — worth the width for anything a plus wouldn't have said.

```tsx
<Fab extended placement="bottom-right" icon={<PencilIcon size={20} />}>Write</Fab>
```

### In the flow instead of over it

Leave `placement` out and it's an ordinary round button where you put it — for laying several side by side.

```tsx
<View style={{ flexDirection: 'row', gap: 16 }}>
  <Fab icon={<PlusIcon size={20} />} accessibilityLabel="Add" />
  <Fab variant="surface" icon={<SearchIcon size={20} />} accessibilityLabel="Search" />
  <Fab variant="destructive" icon={<TrashIcon size={20} />} accessibilityLabel="Delete" />
</View>
```

### Sizes & variants

`size` is `sm | md | lg` (`md` default) — the diameter; the glyph inside it is yours to scale. `variant` is `primary | secondary | surface | destructive` (`primary` default).

---

## Props

### `Fab`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `icon` | `ReactNode` | — | The glyph. Sized by you. |
| `extended` | `boolean` | `false` | Stadium shape + label (`children`). |
| `placement` | `'bottom-left' \| 'bottom-center' \| 'bottom-right'` | — | Pin to a corner. Omit for an in-flow button. |
| `offset` | `number` | `16` | Distance from the edges when placed. Add your safe-area inset. |
| `size` / `variant` | `FabSize` / `FabVariant` | `md` / `primary` | |
| `onPress` `disabled` | | | |
| `haptics` | `boolean` | `false` | A tick on press (needs `expo-haptics`). |
| `accessibilityLabel` | `string` | — | Required for an icon-only button. |
| `colors` | `Partial<FabColors>` | — | Theme any part. |

### `Fab.Group`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `dial` | `'column' \| 'arc'` | `'column'` | How the actions unfold. |
| `icon` / `label` | `ReactNode` / `string` | — | Trigger glyph; label extends it while closed. |
| `open` / `onOpenChange` | `boolean` / `(open) => void` | — | Controlled open state. |
| `placement` `offset` `size` `variant` | | `bottom-right` `16` `md` `primary` | Which corner the dial parks in. |
| `blur` | `boolean` | `false` | Frost the screen behind the dial (needs `expo-blur`). |
| `rotateOnOpen` | `boolean` | `true` | Turn the trigger glyph a quarter turn (plus → cross). |
| `haptics` `disabled` `colors` | | | |
| `accessibilityLabel` | `string` | — | Required — the trigger is a lone glyph until opened. |

### `Fab.Action`

| Prop | Type | Notes |
|---|---|---|
| `icon` / `label` | `ReactNode` / `string` | The glyph, and what it does beside it. |
| `onPress` `disabled` | | |
| `destructive` | `boolean` | The destructive colour, for the one that removes something. |

---

## Notes

- **Write a group in the screen's root container.** `Fab.Group` draws its scrim and its buttons as absolutely positioned siblings in whatever it's written inside — that parent is what `offset` is measured from and what the scrim covers, so it should be the view that fills the screen. This is also what makes the dial belong to its screen: push a new screen over this one and the dial hides with it.
- **Add your safe-area inset to `offset`** to clear the home indicator.
- **Pressing an action closes the dial**, and the **Android back button** closes it rather than popping the screen.
- **The actions are unmounted while closed** — not hidden — so a screen reader never walks into buttons nobody can see.
- **One timing, not one per action.** The whole dial runs off a single shared value; each action derives its own share on the UI thread from its index, so there's no chain of timeouts to fall out of step.

---

## License

MIT. An original implementation; its API is modeled on [panelui-native](https://panelui.dev)'s Fab, rebuilt on Reanimated with an added arc dial. See [LICENSE](LICENSE).
