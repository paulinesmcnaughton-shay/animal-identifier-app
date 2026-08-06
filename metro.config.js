const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Disable all experimental Node features and instrumentation that might inject
// webpack-specific syntax incompatible with Hermes
config.transformer.assetPlugins = []

module.exports = config
