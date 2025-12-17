// LoginScreen.js
import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform, // Asegúrate de que esté importado
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store'; // <--- IMPORTA SecureStore
import { useRouter, Stack } from 'expo-router';

// --- LÓGICA PARA DETERMINAR LA URL BASE DE LA API ---
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else { // web y otros
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;
/*useEffect(() => {
  const unsubscribe = router.beforeRemove?.((e) => {
    // Evita volver a pantallas protegidas desde el login
    e.preventDefault();
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [router]);*/
const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contrasenia, setPassword] = useState(''); // 'contrasenia' es la variable de estado
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !contrasenia.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPassword = contrasenia.trim(); // Usa la variable de estado 'contrasenia'

    const apiUrl = `${API_BASE_URL}/auth/login`; // Endpoint de login general

    console.log("Plataforma detectada:", Platform.OS);
    console.log("URL de API seleccionada:", API_BASE_URL);
    console.log("URL completa para axios:", apiUrl);
    console.log("Datos que se PREPARAN para enviar al backend:", { email: trimmedEmail, password: trimmedPassword });


    try {
      const response = await axios.post(apiUrl, {
        email: trimmedEmail,
        password: trimmedPassword, // Asegúrate que el backend espera 'password'
      }, {
        timeout: 10000,
      });

      console.log("Respuesta del servidor (login):", response.data);

      if (response.status === 200 && response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        const TOKEN_KEY = 'adminAuthToken';
        if (Platform.OS === 'web') {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
        }
        const tokenVerificado = Platform.OS === 'web' 
  ? localStorage.getItem(TOKEN_KEY)
  : await SecureStore.getItemAsync(TOKEN_KEY);

console.log('Token guardado correctamente:', tokenVerificado);

        const USER_DATA_KEY = 'userData';
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
            } else {
                await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
            }
            console.log('Datos del usuario guardados.');
        } catch (e) {
            console.error("Error guardando userData:", e);
        }
        
        console.log('Login exitoso. Usuario:', user);
        
         let targetRoute = '/';
        let routeParams = {};
        switch (user.role) {
          case 'admin':
            targetRoute = '../admin/HomeAdministradorScreen';
            routeParams = { nombre: user.nombre };
            break;
            
          case 'student':
            targetRoute = '../admin/HomeEstudiante';
            routeParams = { nombre: user.nombre };
            break;
            
          case 'daf':
            targetRoute = '/admin/Daf'; // Necesitarás crear esta pantalla
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
            
          case 'comunicacion':
            targetRoute = '../admin/HomeComunicacion'; // Necesitarás crear esta pantalla
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
              case 'academico':
            targetRoute = '/admin/HomeAcademico'; 
            routeParams = { nombre: user.nombre };
            break;
            
          case 'TI':
            targetRoute = '../admin/HomeTI'; // Necesitarás crear esta pantalla
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
            
          case 'recursos':
            targetRoute = '../admin/HomeRecursosHumanos'; // Necesitarás crear esta pantalla
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
            
          case 'Admisiones':
            targetRoute = '../admin/HomeAdmisiones';
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
            
          case 'Serv. Estudiatil': // Nota: El valor debe coincidir exactamente con lo que envía el backend
            targetRoute = '../admin/HomeServiciosEstudiantiles'; // Necesitarás crear esta pantalla
            routeParams = { nombre: user.nombre, idUsuario: user.id };
            break;
            
          default:
            console.warn("Rol de usuario no reconocido:", user.role);
            Alert.alert('Acceso', 'Tu rol no tiene una interfaz asignada.');
            targetRoute = '/';
            break;
      } 
       router.replace({
          pathname: targetRoute,
          params: routeParams
        });
      } else {
        Alert.alert('Login Fallido', response.data.message || 'Respuesta inesperada del servidor.');
      }
    } catch (err) {
       console.error("Error completo en handleLogin:", err.toJSON ? err.toJSON() : err);
      if (err.response) {
        console.error("Error data:", err.response.data);
        console.error("Error status:", err.response.status);
        Alert.alert('Login Fallido', `${err.response.data.message || err.response.data.error || 'Credenciales inválidas.'} (Status: ${err.response.status})`);
      } else if (err.request) {
        console.error("Error request (sin respuesta del servidor):", err.request);
        Alert.alert('Error de Red', 'No se pudo conectar al servidor. Verifica tu conexión y la URL del servidor.');
      } else {
        console.error("Error general:", err.message);
        Alert.alert('Error', 'Ocurrió un error inesperado: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ title: "Acceso UFT" }} />
      <View style={styles.formContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={contrasenia} // Usa la variable de estado 'contrasenia'
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
       
        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    paddingHorizontal: 25,
    paddingVertical: 35,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF5733', // Un color naranja como ejemplo
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#FFA07A', // Un naranja más claro para deshabilitado
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;