module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Only include reanimated plugin if the package is installed
      // 'react-native-reanimated/plugin',
    ],
  };
}; 