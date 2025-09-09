import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, SafeAreaView, Platform
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
//import { User } from '../../..backend/models/User.js';
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else { 
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;

const getTokenAsync = async () => {
    const TOKEN_KEY = 'adminAuthToken';
  if (Platform.OS === 'web') {
    console.warn("Usando localStorage para el token en web (no seguro para producción). SecureStore tiene limitaciones en web.");
    try {
      return localStorage.getItem('adminAuthToken');
    } catch (e) {
      console.error("Error al acceder a localStorage en web:", e);
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al obtener token de SecureStore en nativo:", e);
      return null;
    }
  }
};

const deleteTokenAsync = async () => {
    const TOKEN_KEY = 'adminAuthToken'; 
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY); // Usar la variable TOKEN_KEY
      console.log(`Token eliminado de localStorage (web) con clave: ${TOKEN_KEY}`);
    } catch (e) {
      console.error("Error al eliminar token de localStorage en web:", e);
    }
  } else { // Nativo
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY); // Usar la variable TOKEN_KEY por consistencia
      console.log(`Token eliminado de SecureStore (nativo) con clave: ${TOKEN_KEY}`);
    } catch (e){
      console.error("Error al eliminar token de SecureStore en nativo:", e);
    
    }
  }
};


const UsuariosA = () => {
  console.log("UsuariosA: Renderizando componente");
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useLocalSearchParams();

  const fetchUsers = async () => {
    console.log("UsuariosA: Ejecutando fetchUsers...");
    setLoading(true);
    let localToken = null;

    try {
       console.log("UsuariosA: Intentando obtener token...");
      localToken = await getTokenAsync();
    console.log("UsuariosA: Token obtenido:", localToken);
      if (!localToken) {
         
        console.log("UsuariosA: No se encontró token, mostrando alerta y retornando.");
        Alert.alert(
          'Autenticación Requerida',
          'No se encontró el token de administrador. Por favor, inicia sesión de nuevo.',
          [{ text: 'OK', onPress: () => router.replace('/LoginAdmin') }] // Ajusta la ruta a tu login de admin
        );
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }


      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${localToken}` }
      });
      
      console.log("UsuariosA: Datos recibidos de la API:", response.data);
      const usersData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const processedUsers = usersData.map(user => ({
        ...user,
        id: user.idusuario 
      }));

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);

    } catch (error) {
      console.error("UsuariosA: Error fetching users from API:", error);
      let errorMessage = 'No se pudieron cargar los usuarios.';
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        if (error.response.status === 401) {
          errorMessage = 'No autorizado. Tu sesión podría haber expirado. Por favor, inicia sesión de nuevo.';
          await deleteTokenAsync();
          router.replace('/LoginAdmin'); // Ajusta la ruta
        } else {
          errorMessage = `Error del servidor: ${error.response.status}. ${error.response.data?.message || ''}`;
        }
      } else if (error.request) {
        console.error("Error request:", error.request);
        errorMessage = 'No se pudo conectar al servidor. Verifica la URL y que el backend esté corriendo.';
      } else {
        console.error('Error genérico:', error.message);
        errorMessage = error.message;
      }
      Alert.alert('Error de Carga', errorMessage);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      console.log("UsuariosA: fetchUsers finalizado.");
    }
  };

  useEffect(() => {
    console.log("UsuariosA: Montaje inicial, llamando a fetchUsers.");
    fetchUsers();
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (params.refresh) {
        console.log("UsuariosA: Refresh triggered by params:", params.refresh);
        fetchUsers();
      }
    }, [params.refresh])
  );

  useEffect(() => {
    console.log("UsuariosA: useEffect para filtrar. Termino:", searchTerm, "Users count:", users.length);
    if (!users) { // Doble chequeo
        setFilteredUsers([]);
        return;
    }
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(user =>
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, users]);

  const handleAddUser = () => {
    router.push('/admin/CrearUsuarioA'); // Ajusta la ruta a tu pantalla de creación
  };

  const handleViewUser = (userId) => Alert.alert("Ver Usuario", `ID: ${userId}`); // Implementa la navegación o modal
  //const handleEditUser = (userId) => Alert.alert("Editar Usuario", `ID: ${userId}`); // Implementa la navegación o modal
  
  const handleDeleteUser = async (userId) => {
    Alert.alert(
      "Eliminar Usuario",
      "¿Estás seguro de que quieres eliminar este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          onPress: async () => {
            console.log(`UsuariosA: Intentando eliminar usuario con ID: ${userId}`);
            let localTokenForDelete = await getTokenAsync();
            if (!localTokenForDelete) {
              Alert.alert('Error de Autenticación', 'Token no disponible para eliminar.');
              return;
            }
            try {
              await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                 headers: { 'Authorization': `Bearer ${localTokenForDelete}` }
               });
               Alert.alert("Usuario Eliminado", `El usuario ha sido eliminado del servidor.`);

              fetchUsers(); // Recargar la lista
            } catch (error) {
              console.error(`UsuariosA: Error deleting user ${userId}:`, error);
              Alert.alert('Error', 'No se pudo eliminar el usuario.');
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Componente para renderizar cada ítem de la lista
  const renderUserItem = ({ item }) => (
    <View style={styles.userItemContainer}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username || 'N/A'}</Text>
        <Text style={styles.userEmail}>{item.email || 'N/A'}</Text>
        <Text style={styles.userRole}>Rol: {item.role || 'N/A'}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity onPress={() => handleViewUser(item.id)} style={styles.actionButton}>
          <Ionicons name="eye-outline" size={22} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/admin/editUser/${item.id}`)} 
        style={styles.actionButton}>
          <Ionicons name="pencil-outline" size={22} color="#f39c12" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Estado de carga inicial (cuando no hay usuarios aún)
  if (loading && (!users || users.length === 0)) {
    return (
      <SafeAreaView style={styles.container}> {/* SafeAreaView también aquí */}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e95a0c" />
          <Text>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizado principal
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gestionar Usuarios', // Título para la pantalla
          headerRight: () => (
            <TouchableOpacity onPress={handleAddUser} style={{ marginRight: 15 }}>
              <Ionicons name="add-circle-outline" size={30} color={Platform.OS === 'ios' ? '#007AFF' : '#fff'} />
            </TouchableOpacity>
          ),
        }}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o email..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholderTextColor="#888"
      />
      {/* Indicador de carga secundario (cuando se está recargando pero ya hay datos) */}
      {loading && users && users.length > 0 && (
        <ActivityIndicator style={{ marginVertical: 10 }} color="#e95a0c" />
      )}

      {/* Mensaje de no usuarios o lista de usuarios */}
      {!loading && filteredUsers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noUsersText}>
            {searchTerm ? 'No se encontraron usuarios con ese filtro.' : 'No hay usuarios para mostrar.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()} // Asegúrate que item.id es un string o número
          contentContainerStyle={styles.listContentContainer}
          // Opcional: para mostrar un indicador mientras se carga más (si implementas paginación)
          // ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
          // onEndReached={handleLoadMore} // Si implementas paginación
          // onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8', // Un color de fondo general
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20, // Espacio al final de la lista
  },
  userItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Sombras para un look más moderno
    elevation: 2, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 1 }, // iOS
    shadowOpacity: 0.1, // iOS
    shadowRadius: 3, // iOS
  },
  userInfo: {
    flex: 1, // Para que ocupe el espacio disponible
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  userRole: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8, // Hace más fácil tocar los íconos
    marginLeft: 8, // Espacio entre botones
  },
  noUsersText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  }
});

export default UsuariosA;