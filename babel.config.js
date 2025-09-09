// D:\Nueva carpeta\frontend\babel.config.js

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Otros plugins que puedas tener (como expo-router/babel)
      'expo-router/babel', // Si usas Expo Router v2+
      // ...

      // ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ PRESENTE:
      'react-native-reanimated/plugin',
    ],
  };
};