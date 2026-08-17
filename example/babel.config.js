module.exports = function (api) {
  api.cache(true)
  // babel-preset-expo (SDK 54) auto-adds the react-native-worklets/reanimated
  // plugin when reanimated is installed — it must run last, which the preset handles.
  return {
    presets: ['babel-preset-expo'],
  }
}
