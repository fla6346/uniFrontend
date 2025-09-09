import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, 
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import apiClient from '../../src/api/axiosConfig.js'; // Ajusta la ruta si es necesario
//import User from '../../../backend/models/User.js';
// Cambia el nombre del componente para mayor claridad
const EditarUsuarioScreen = () => {
  const router = useRouter();
  // Obtenemos el 'id' del usuario desde la URL (ej: /edit-user/123 -> id será '123')
  const { id } = useLocalSearchParams();

  const [userName, setUserName] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidopat, setApellidopat] = useState('');
  const [apellidomat, setApellidomat] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState(''); 
  const [role, setRole] = useState('user');
  const [habilitado, setHabilitado] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Inicia en true para mostrar carga
  const [errors, setErrors] = useState({});

  // NUEVO useEffect: Cargar los datos del usuario cuando el componente se monta
  useEffect(() => {
    if (!id) return; // Si no hay ID, no hacer nada

    const fetchUserData = async () => {
      try {
        console.log(`Editando usuario con ID: ${id}`);
        // Hacemos una petición GET para obtener los datos del usuario específico
        const response = await apiClient.get(`/users/${id}`);
        const user = response.data;

        // Rellenamos los campos del formulario con los datos obtenidos
        setUserName(user.userName);
        setNombre(user.nombre);
        setApellidopat(user.apellidopat);
        setApellidomat(user.apellidomat || '');
        setEmail(user.email);
        setRole(user.role);
        setHabilitado(user.habilitado === 1 || user.habilitado === true); // Maneja '1' o booleano

      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        Alert.alert("Error", "No se pudieron cargar los datos del usuario.");
        router.back(); // Volver si hay un error
      } finally {
        setIsLoading(false); // Dejar de cargar
      }
    };

    fetchUserData();
  }, [id]); // Este efecto se ejecuta cada vez que el 'id' cambia

  // La validación puede ser un poco diferente (la contraseña es opcional)
  const validateForm = () => {
    // ... (tu lógica de validación se mantiene, pero puedes hacer la contraseña opcional)
    // Por ejemplo, solo validar la contraseña si se ha escrito algo en el campo.
    if (contrasenia && contrasenia.length < 6) {
        newErrors.contrasenia = 'La nueva contraseña debe tener al menos 6 caracteres.';
    }
    // ...
    return true; // Simplificado por ahora
  };

  // CAMBIAMOS handleAddUser a handleUpdateUser
  const handleUpdateUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Creamos el payload. Si la contraseña está vacía, no la incluimos
      // para que el backend no la actualice a una cadena vacía.
      const updateUserPayload = {
        userName: userName.trim(),
        nombre: nombre.trim(),
        apellidopat: apellidopat.trim(),
        apellidomat: apellidomat.trim(),
        email: email.trim(),
        role: role.trim(),
        habilitado: habilitado ? 1 : 0,
      };

      if (contrasenia) {
        updateUserPayload.contrasenia = contrasenia;
      }

      // ¡Usamos el método PUT y la URL con el ID del usuario!
      await apiClient.put(`/users/${id}`, updateUserPayload);

      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
      // Volvemos a la lista y pasamos un parámetro para forzar el refresco
      router.replace({ pathname: '/admin/UsuariosA', params: { refresh: Date.now() } });
      
    } catch (error) {
      console.error("Error al actualizar usuario:", error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo actualizar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si está cargando los datos iniciales, muestra un indicador
  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView /* ... */ >
        {/* Cambia el título de la pantalla */}
        <Stack.Screen options={{ title: 'Editar Usuario' }} />
        <ScrollView /* ... */ >
          {/* ... (Todos tus TextInput se mantienen igual) ... */}

          {/* Cambia el botón */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleUpdateUser} // Llama a la nueva función
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              // Cambia el texto del botón
              <Text style={styles.buttonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ... (Los estilos se mantienen exactamente igual que en CrearUsuarioA.js)
const styles = StyleSheet.create({ /* ... */ });

export default EditarUsuarioScreen;
