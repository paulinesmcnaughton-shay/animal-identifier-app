const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Disable OpenTelemetry auto-instrumentation that uses webpack-specific syntax
// incompatible with Hermes compiler
process.env.NODE_OPTIONS = '--no-experimental-fetch'

module.exports = config
