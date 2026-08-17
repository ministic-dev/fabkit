// Metro config that lets the example import the library source directly from ../src,
// so the consumer's reanimated worklet plugin transforms it just like real app code.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch the library source so edits hot-reload.
config.watchFolders = [workspaceRoot]

// Resolve bare deps (react, react-native, reanimated…) from the example first, then the lib.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// `import { Fab } from '@ministicdev/fabkit'` -> ../src (the TS source).
config.resolver.extraNodeModules = {
  '@ministicdev/fabkit': path.resolve(workspaceRoot, 'src'),
}

module.exports = config
