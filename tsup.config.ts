import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: false,
  keepNames: true,
  target: 'es2020',
  external: ['react', 'react-native', 'react-native-reanimated', 'expo-haptics', 'expo-blur'],
})
