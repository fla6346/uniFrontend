// app/(admin)/CrearUsuarioA.js (VERSIÓN CORREGIDA CON DROPDOWN)

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../src/api/axiosConfig'; 
import DropDownPicker from 'react-native-dropdown-picker';

const CrearUsuario = () => {
  const router = useRouter();

  // --- CORRECCIÓN 1: Definir TODOS los estados necesarios para el DropDownPicker ---
  const [open, setOpen] = useState(false); // Estado para controlar si el dropdown está abierto
  const [role, setRole] = useState(null); // Estado para el valor seleccionado. Inicia en null para mostrar el placeholder.
  const [items, setItems] = useState([ // Estado para la lista de opciones
    {label:'Administrador', value:'admin'},
    {label:'Estudiante', value:'student'},
    {label:'DAF', value:'DAF'},
    {label:'Comunicación', value:'comunicacion'},
    {label:'Académico', value:'academico'},        
    {label:'TI', value:'TI'},
    {label:'Recursos Humanos', value:'recursos'},    
    {label:'Admisiones', value:'Admisiones'},
    {label:'Servicios Estudiantiles', value:'Serv. Estudiatil'},    
  ]);

  const [username, setUserName] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidopat, setApellidopat] = useState('');
  const [apellidomat, setApellidomat] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [habilitado, setHabilitado] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const TOKEN_KEY = 'adminAuthToken';
      let token;
      if (Platform.OS === 'web') {
        token = localStorage.getItem(TOKEN_KEY);
      } else {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      }
      if (!token) {
        Alert.alert("Acceso Denegado", "No estás autenticado. Por favor, inicia sesión.");
        router.replace('/Login');
      }
    };
    checkAuth();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'El nombre de usuario es requerido.';
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
    if (!apellidopat.trim()) newErrors.apellidopat = 'El apellido paterno es requerido.';
    if (!email.trim()) {
      newErrors.email = 'El email es requerido.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El formato del email no es válido.';
    }
    if (!contrasenia) {
      newErrors.contrasenia = 'La contraseña es requerida.';
    } else if (contrasenia.length < 6) {
      newErrors.contrasenia = 'La contraseña debe tener al menos 6 caracteres.';
    }
    // --- CORRECCIÓN 2: Simplificar la validación del rol ---
    if (!role) newErrors.role = 'El rol es requerido.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const newUserPayload = {
        username: username.trim(),
        nombre: nombre.trim(),
        apellidopat: apellidopat.trim(),
        apellidomat: apellidomat.trim(),
        email: email.trim(),
        contrasenia: contrasenia,
        role: role, // El valor ya es un string, no necesita trim()
        habilitado: habilitado ? '1' : '0',
      };

      console.log("FRONTEND - Payload que se envía a /api/auth/register:", JSON.stringify(newUserPayload, null, 2));
      
      const response = await apiClient.post('/auth/register', newUserPayload);

      if (response.status === 201) {
        Alert.alert('Éxito', 'Usuario añadido correctamente.');
        router.replace({ pathname: '/admin/UsuariosA', params: { refresh: Date.now().toString() } });
      } else {
        Alert.alert('Aviso', response.data.message || 'Respuesta inesperada del servidor.');
      }
      
    } catch (error) {
      console.error("Error al añadir usuario:", error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un error inesperado.';
      Alert.alert('Error', errorMessage);
      if (error.response?.data?.errors) {
        setErrors(prev => ({...prev, ...error.response.data.errors}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Stack.Screen options={{ title: 'Añadir Nuevo Usuario' }} />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.label}>Nombre de Usuario</Text>
          <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder="Ej: jperez" value={username} onChangeText={setUserName} autoCapitalize="none" />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          <Text style={styles.label}>Nombre(s)</Text>
          <TextInput style={[styles.input, errors.nombre && styles.inputError]} placeholder="Ej: Juan Carlos" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

          <Text style={styles.label}>Apellido Paterno</Text>
          <TextInput style={[styles.input, errors.apellidopat && styles.inputError]} placeholder="Ej: Pérez" value={apellidopat} onChangeText={setApellidopat} autoCapitalize="words" />
          {errors.apellidopat && <Text style={styles.errorText}>{errors.apellidopat}</Text>}

          <Text style={styles.label}>Apellido Materno (Opcional)</Text>
          <TextInput style={styles.input} placeholder="Ej: López" value={apellidomat} onChangeText={setApellidomat} autoCapitalize="words" />

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="ejemplo@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={[styles.input, errors.contrasenia && styles.inputError]} placeholder="Mínimo 6 caracteres" value={contrasenia} onChangeText={setContrasenia} secureTextEntry />
          {errors.contrasenia && <Text style={styles.errorText}>{errors.contrasenia}</Text>}

          <Text style={styles.label}>Rol</Text>
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              open={open}
              value={role}
              items={items}
              setOpen={setOpen}
              setValue={setRole}
              setItems={setItems}
              placeholder="Selecciona un rol"
              style={[styles.dropdown, errors.role && styles.inputError]}
              dropDownContainerStyle={styles.dropdownList}
              listMode="SCROLLVIEW"
            />
          </View>
          {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
        
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAddUser}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Añadir Usuario</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- CORRECCIÓN 4: Limpiar y unificar los estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066CC',
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 200, // Aumentar padding para que el dropdown sea visible
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15, // Espacio consistente
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  dropdownContainer: {
    zIndex: 1000, // Permite que el dropdown se muestre por encima de otros elementos
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: -1, // Asegura que el switch quede por debajo del dropdown
  },
  button: {
    backgroundColor: '#e95a0c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    zIndex: -1, // Asegura que el botón quede por debajo del dropdown
  },
  buttonDisabled: {
    backgroundColor: '#f9bda3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default CrearUsuario;