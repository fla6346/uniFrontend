import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Pressable } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { createStackNavigator,StackScreenProps  } from '@react-navigation/stack';

import Home from '../Home'

SplashScreen.preventAutoHideAsync();
export type RootStackParamList = {
Welcome: undefined;
Home: undefined;
};
type WelcomeScreenProps = StackScreenProps<RootStackParamList, 'Welcome'>;
const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);
  const [fadeAnim] = useState<Animated.Value>(new Animated.Value(1));
  const [contentAnim] = useState<Animated.Value>(new Animated.Value(0));


  const Stack = createStackNavigator<RootStackParamList>();
  useEffect(() => {
    async function prepare() {
      try {
        // Simula carga de recursos (puedes reemplazar con carga real, e.g., fuentes o datos)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación de 2 segundos
      } catch (e) {
        console.warn(e);
      } finally {
        // Animación de desvanecimiento
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(async () => {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
          Animated.timing(contentAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        });
      }
    }

    prepare();
  }, [fadeAnim, contentAnim]);

  if (!appIsReady) {
    return (
      <View style={styles.container}>
        <Animated.Image
          source={require('../../assets/images/logo.jpg')} // Verifica esta ruta
          style={[styles.image, { opacity: fadeAnim }]}
        />
        <ActivityIndicator size="large" color="#e95a0c" />
      </View>
    );
  }

  // Pantalla principal sin LinearGradient
  return (
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen
          name="Welcome"
          options={{ headerShown: false }}
          component={({ navigation }:WelcomeScreenProps) => (
            <View style={[styles.container, { backgroundColor: '#e9590cd4' }]}>
              <Animated.View style={[styles.content, { opacity: contentAnim, transform: [{ scale: contentAnim }] }]}>
                <Text style={styles.title}>¡Bienvenido a EventosApp!</Text>
                <Text style={styles.subtitle}>Organiza y automatiza tus eventos con facilidad</Text>
                <Pressable
                  style={styles.button}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.buttonText}>Explorar Eventos</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: 'Home',
            headerLeft:()=>null,
           }}
        />
      </Stack.Navigator>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo semi-transparente
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fcfcfcff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#e95a0c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;

