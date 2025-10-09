// D:\Nueva carpeta\frontend\babel.config.js

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Otros plugins que puedas tener (como expo-router/babel)
      // ...

      // ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ PRESENTE:
      'react-native-reanimated/plugin',
    ],
  };
};