const createExpoWebpackConfigAsync = require('@expo/webpack-config')

const transpileDependencies = [
  'rn-sliding-up-panel',
]

module.exports = async (env, argv) => {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@ui-kitten/components'],
      loaders: [{
        test: /\.(jsx?|tsx?)$/,
        loader: 'babel-loader',
        exclude: new RegExp(`node_modules/(?!(${transpileDependencies.join('|')})/).*`),
      }],
    },
  }, argv)
  return config
}
