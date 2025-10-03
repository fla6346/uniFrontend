import React, { useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, SafeAreaView, Platform, Animated
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// --- Definición de la URL base de la API (mantener como está) ---
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else {
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;

// --- Funciones para manejar el token (mantener como está) ---
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
      localStorage.removeItem(TOKEN_KEY);
      console.log(`Token eliminado de localStorage (web) con clave: ${TOKEN_KEY}`);
    } catch (e) {
      console.error("Error al eliminar token de localStorage en web:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log(`Token eliminado de SecureStore (nativo) con clave: ${TOKEN_KEY}`);
    } catch (e) {
      console.error("Error al eliminar token de SecureStore en nativo:", e);
    }
  }
};

// --- Componente principal UsuariosA ---
const UsuariosA = () => {
  console.log("UsuariosA: Renderizando componente");
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useLocalSearchParams();

  // Animación para los elementos de la lista (opcional, para un efecto de "fade in")
  const animatedValues = useRef({});

  // Resetear y iniciar animación cuando filteredUsers cambia
  useEffect(() => {
    filteredUsers.forEach((item, index) => {
      if (!animatedValues.current[item.id]) {
        animatedValues.current[item.id] = new Animated.Value(0);
      }
      Animated.timing(animatedValues.current[item.id], {
        toValue: 1,
        duration: 300 + index * 50, // Pequeño retraso para cada ítem
        useNativeDriver: true,
      }).start();
    });
  }, [filteredUsers]);


  const fetchUsers = useCallback(async () => {
    console.log("UsuariosA: Ejecutando fetchUsers...");
    setLoading(true);
    let localToken = null;

    try {
      localToken = await getTokenAsync();

      if (!localToken) {
        Alert.alert(
          'Autenticación Requerida',
          'No se encontró el token de administrador. Por favor, inicia sesión de nuevo.',
          [{ text: 'OK', onPress: () => router.replace('/LoginAdmin') }]
        );
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${localToken}` }
      });

      console.log("UsuariosA: Datos recibidos de la API:", response.data);
      const usersData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const processedUsers = usersData.map(user => ({
        ...user,
        id: user.idusuario || user.id || Math.random().toString() // Fallback para ID si no existe
      }));

      setUsers(processedUsers);
      setFilteredUsers(processedUsers); // Inicialmente, todos los usuarios son filtrados
    } catch (error) {
      console.error("UsuariosA: Error fetching users from API:", error);
      let errorMessage = 'No se pudieron cargar los usuarios. Inténtalo de nuevo.';
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.';
          await deleteTokenAsync();
          router.replace('/LoginAdmin');
        } else {
          errorMessage = `Error del servidor (${error.response.status}): ${error.response.data?.message || 'Algo salió mal.'}`;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor. Revisa tu conexión o que el backend esté activo.';
      } else {
        errorMessage = `Error inesperado: ${error.message}`;
      }
      Alert.alert('Error de Carga', errorMessage);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      console.log("UsuariosA: fetchUsers finalizado.");
    }
  }, [router]); // `router` es una dependencia estable

  useEffect(() => {
    console.log("UsuariosA: Montaje inicial, llamando a fetchUsers.");
    fetchUsers();
  }, [fetchUsers]); // `fetchUsers` ahora es una dependencia estable gracias a useCallback

  useFocusEffect(
    useCallback(() => {
      if (params.refresh === 'true' || users.length === 0) {
        console.log("UsuariosA: Refresh triggered by params or empty users. Calling fetchUsers.");
        fetchUsers();
      }
    }, [params.refresh, fetchUsers, users.length])
  );

  // --- Efecto para filtrar usuarios ---
  useEffect(() => {
    console.log("UsuariosA: useEffect para filtrar. Termino:", searchTerm, "Users count:", users.length);
    if (!users) {
      setFilteredUsers([]);
      return;
    }
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(user =>
          (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Si tienes un campo 'name'
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, users]);

  // --- Handlers de acciones ---
  const handleAddUser = () => {
    router.push('/admin/CrearUsuarioA');
  };

  const handleViewUser = (userId) => {
    Alert.alert("Ver Usuario", `Funcionalidad para ver detalles del ID: ${userId} aún no implementada.`);
    // Implementar navegación a una pantalla de detalles de usuario
    // router.push(`/admin/viewUser/${userId}`);
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      "Eliminar Usuario",
      "¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          onPress: async () => {
            console.log(`UsuariosA: Intentando eliminar usuario con ID: ${userId}`);
            let localTokenForDelete = await getTokenAsync();
            if (!localTokenForDelete) {
              Alert.alert('Error de Autenticación', 'Token no disponible para eliminar. Inicia sesión de nuevo.');
              router.replace('/LoginAdmin');
              return;
            }
            try {
              // Muestra un indicador de carga temporalmente para esta acción
              setLoading(true);
              await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${localTokenForDelete}` }
              });
              Alert.alert("Éxito", "El usuario ha sido eliminado correctamente.");
              fetchUsers(); // Recargar la lista después de eliminar
            } catch (error) {
              console.error(`UsuariosA: Error deleting user ${userId}:`, error);
              let errorMessage = 'No se pudo eliminar el usuario. Inténtalo de nuevo.';
              if (error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                  errorMessage = 'No tienes permisos para eliminar este usuario o tu sesión expiró.';
                  await deleteTokenAsync();
                  router.replace('/LoginAdmin');
                } else {
                  errorMessage = `Error del servidor (${error.response.status}): ${error.response.data?.message || 'Algo salió mal.'}`;
                }
              } else if (error.request) {
                errorMessage = 'No se pudo conectar al servidor para eliminar.';
              }
              Alert.alert('Error al Eliminar', errorMessage);
            } finally {
              setLoading(false);
            }
          },
          style: "destructive", // Color rojo para acción destructiva
        },
      ]
    );
  };

  // --- Componente para renderizar cada ítem de la lista ---
  const renderUserItem = ({ item }) => {
    const opacity = animatedValues.current[item.id] || new Animated.Value(1); // Fallback si no hay animación
    return (
      <Animated.View style={[styles.userItemContainer, { opacity }]}>
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
            {item.username || 'Usuario sin nombre'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
            {item.email || 'Email no disponible'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.userRoleText}>{item.role ? item.role.toUpperCase() : 'ROL DESCONOCIDO'}</Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            onPress={() => handleViewUser(item.id)}
            style={styles.actionButton}
            accessibilityLabel="Ver detalles del usuario"
          >
            <Ionicons name="eye-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/admin/editUser/${item.id}`)}
            style={styles.actionButton}
            accessibilityLabel="Editar usuario"
          >
            <Ionicons name="pencil-outline" size={24} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteUser(item.id)}
            style={styles.actionButton}
            accessibilityLabel="Eliminar usuario"
          >
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // --- Renderizado de carga inicial o principal ---
  if (loading && users.length === 0) { // Solo muestra esta pantalla de carga si no hay datos aún
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Gestionar Usuarios', headerRight: () => null }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gestionar Usuarios',
          headerLargeTitle: true, // Para iOS, un título grande y moderno
          headerRight: () => (
            <TouchableOpacity
              onPress={handleAddUser}
              style={{ marginRight: Platform.OS === 'ios' ? 0 : 15 }} // Ajuste para iOS si usa headerLargeTitle
              accessibilityLabel="Añadir nuevo usuario"
            >
              <Ionicons
                name="person-add-outline" // Icono más específico para añadir usuario
                size={Platform.OS === 'ios' ? 30 : 28}
                color={Platform.OS === 'ios' ? Colors.primary : '#e48406ff'}
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Platform.OS === 'android' ? Colors.primary : 'transparent', // Color para Android header
          },
          headerTintColor: Platform.OS === 'android' ? '#fff' : Colors.primaryText, // Color del texto del header
        }}
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por usuario o email..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Indicador de carga secundario (al recargar con datos existentes) */}
      {loading && users.length > 0 && (
        <View style={styles.reloadingIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.reloadingText}>Actualizando lista...</Text>
        </View>
      )}

      {/* Mensaje de no usuarios o lista de usuarios */}
      {!loading && filteredUsers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={60} color={Colors.textSecondary} style={{ marginBottom: 15 }} />
          <Text style={styles.noUsersText}>
            {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados aún.'}
          </Text>
          {!searchTerm && (
            <TouchableOpacity onPress={handleAddUser} style={styles.addButtonEmptyState}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addButtonEmptyStateText}>Añadir Usuario</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          onRefresh={fetchUsers} 
          refreshing={loading} 
        />
      )}
    </SafeAreaView>
  );
};

// --- Paleta de colores mejorada ---
const Colors = {
  primary: '#007AFF', // Azul para acciones principales y elementos interactivos
  primaryDark: '#0056b3', // Azul más oscuro
  accent: '#FF9500', // Naranja para acciones secundarias o de edición
  danger: '#FF3B30', // Rojo para acciones destructivas
  background: '#F0F2F5', // Fondo general más suave
  cardBackground: '#FFFFFF', // Fondo de las tarjetas de usuario
  textPrimary: '#1C1C1E', // Texto principal, oscuro
  textSecondary: '#8E8E93', // Texto secundario, gris
  lightGray: '#EFEFF4', // Para bordes o separadores
  success: '#34C759', // Verde para éxito
  info: '#5AC8FA', // Azul claro para información
};

// --- Estilos mejorados ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  reloadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  reloadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  userItemContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '700', // Más negrita
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: Colors.primaryDark, // Un color que resalte el rol
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start', // Para que el badge no ocupe todo el ancho
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.cardBackground, // Texto blanco para el badge
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 5,
    borderRadius: 20, // Hacer los botones más redondos
    //backgroundColor: Colors.lightGray, // Fondo sutil para los botones de acción
  },
  noUsersText: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24, // Mejor legibilidad
    marginBottom: 20,
  },
  addButtonEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonEmptyStateText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsuariosA;