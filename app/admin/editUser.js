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
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const getApiBaseUrl = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return 'http://192.168.0.167:3001/api';
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const getTokenAsync = async () => {
  const TOKEN_KEY = 'adminAuthToken';
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  } else {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Error al obtener token:', e);
      return null;
    }
  }
};

const COLORS = {
  primary: '#E95A0C',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  accent: '#EF4444',
  warning: '#F59E0B',
};

const EditUser = () => {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellidopat: '',
    apellidomat: '',
    email: '',
    contrasenia: '',
    role: 'user',
    habilitado: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log("EditUser: ID recibido:", id);
    if (!id || typeof id !== 'string' || id.trim() === '') {
      Alert.alert('Error', 'ID de usuario no válido');
      router.replace('/admin/UsuarioA');
      return;
    }
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const token = await getTokenAsync();
      if (!token) {
        Alert.alert('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.replace('/LoginAdmin');
        return;
      }

      console.log("EditUser: Consultando API para ID:", id);
      console.log("EditUser: URL completa:", `${API_BASE_URL}/users/${id}`);
      
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("EditUser: Respuesta completa del servidor:", JSON.stringify(response.data, null, 2));
      
      let userData = response.data;

      // Si el backend envía { user: { ... } }, extrae el objeto interno
      if (userData && userData.user) {
        console.log("EditUser: Extrayendo datos de userData.user");
        userData = userData.user;
      }

      console.log("EditUser: Datos del usuario procesados:", userData);

      // Validar que userData tenga contenido
      if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
        console.error("EditUser: Datos de usuario vacíos o inválidos");
        Alert.alert('Error', 'No se pudo cargar los datos del usuario.');
        router.back();
        return;
      }

      // Crear el objeto de formData con valores seguros
      const newFormData = {
        username: userData.username || '',
        nombre: userData.nombre || '',
        apellidopat: userData.apellidopat || '',
        apellidomat: userData.apellidomat || '',
        email: userData.email || '',
        contrasenia: '',
        role: userData.role || 'user',
        habilitado: userData.habilitado === 1 || userData.habilitado === true,
      };

      console.log("EditUser: FormData a establecer:", newFormData);
      setFormData(newFormData);
      
    } catch (error) {
      console.error('EditUser: Error al cargar usuario:', error);
      console.error('EditUser: Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let message = 'No se pudo cargar los datos del usuario.';
      
      if (error.response?.status === 404) {
        message = 'Usuario no encontrado en el servidor.';
      } else if (error.response?.status === 401) {
        message = 'Sesión no autorizada. Por favor, inicia sesión nuevamente.';
        router.replace('/LoginAdmin');
      } else if (error.code === 'ECONNREFUSED') {
        message = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://192.168.0.167:3001';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Alert.alert('Error', message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido.';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Debe tener al menos 3 caracteres.';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido.';
    }
    
    if (!formData.apellidopat.trim()) {
      newErrors.apellidopat = 'El apellido paterno es requerido.';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido.';
    }
    
    if (formData.contrasenia && formData.contrasenia.length < 6) {
      newErrors.contrasenia = 'La contraseña debe tener al menos 6 caracteres.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        throw new Error('Token no disponible');
      }

      const payload = {
        username: formData.username.trim(),
        nombre: formData.nombre.trim(),
        apellidopat: formData.apellidopat.trim(),
        apellidomat: formData.apellidomat.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        habilitado: formData.habilitado ? 1 : 0,
      };

      // Solo incluir contraseña si se proporciona
      if (formData.contrasenia.trim()) {
        payload.contrasenia = formData.contrasenia;
      }

      console.log("EditUser: Guardando cambios con payload:", payload);

      await axios.put(`${API_BASE_URL}/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Éxito', 'Usuario actualizado correctamente.', [
        {
          text: 'OK',
          onPress: () => router.replace('/admin/UsuarioA')
        }
      ]);
    } catch (error) {
      console.error('EditUser: Error al actualizar usuario:', error);
      let message = 'No se pudo actualizar el usuario.';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 409) {
        message = 'El nombre de usuario o email ya están en uso.';
      } else if (error.response?.status === 401) {
        message = 'Sesión no autorizada.';
        router.replace('/LoginAdmin');
      } else if (error.code === 'ECONNREFUSED') {
        message = 'No se pudo conectar con el servidor.';
      }
      
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando usuario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar Usuario',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre de usuario */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de Usuario *</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Ej: jperez"
              autoCapitalize="none"
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre(s) *</Text>
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Juan Carlos"
              autoCapitalize="words"
            />
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
          </View>

          {/* Apellido Paterno */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido Paterno *</Text>
            <TextInput
              style={[styles.input, errors.apellidopat && styles.inputError]}
              value={formData.apellidopat}
              onChangeText={(text) => setFormData({ ...formData, apellidopat: text })}
              placeholder="Ej: Pérez"
              autoCapitalize="words"
            />
            {errors.apellidopat && <Text style={styles.errorText}>{errors.apellidopat}</Text>}
          </View>

          {/* Apellido Materno */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido Materno</Text>
            <TextInput
              style={styles.input}
              value={formData.apellidomat}
              onChangeText={(text) => setFormData({ ...formData, apellidomat: text })}
              placeholder="Ej: López"
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo Electrónico *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva Contraseña (Opcional)</Text>
            <TextInput
              style={[styles.input, errors.contrasenia && styles.inputError]}
              value={formData.contrasenia}
              onChangeText={(text) => setFormData({ ...formData, contrasenia: text })}
              placeholder="Déjalo vacío para no cambiarla"
              secureTextEntry
            />
            {errors.contrasenia && <Text style={styles.errorText}>{errors.contrasenia}</Text>}
          </View>

          {/* Rol */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rol</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyText}>
                {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
              </Text>
            </View>
          </View>

          {/* Estado */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setFormData({ ...formData, habilitado: !formData.habilitado })}
            >
              <View style={[
                styles.toggleSwitch,
                formData.habilitado && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleCircle,
                  formData.habilitado && styles.toggleCircleActive
                ]} />
              </View>
              <Text style={styles.toggleText}>
                {formData.habilitado ? 'Habilitado' : 'Deshabilitado'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
  },
  readonlyInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  readonlyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  toggleText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#E95A0C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#b06a09',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#E95A0C',
  },
  cancelButtonText: {
    color: '#E95A0C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditUser;