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

const UsuariosA = () => {
  console.log("UsuariosA: Renderizando componente");
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useLocalSearchParams();
  const animatedValues = useRef({});

  // Animación al cargar lista
  useEffect(() => {
    filteredUsers.forEach((item, index) => {
      if (!animatedValues.current[item.id]) {
        animatedValues.current[item.id] = new Animated.Value(0);
      }
      Animated.timing(animatedValues.current[item.id], {
        toValue: 1,
        duration: 250 + index * 30,
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
        id: user.idusuario || user.id || Math.random().toString()
      }));

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
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
      }
      Alert.alert('Error de Carga', errorMessage);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useFocusEffect(
    useCallback(() => {
      if (params.refresh === 'true' || users.length === 0) {
        fetchUsers();
      }
    }, [params.refresh, fetchUsers, users.length])
  );

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(user =>
          (user.username?.toLowerCase().includes(term)) ||
          (user.name?.toLowerCase().includes(term)) ||
          (user.email?.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, users]);

  const handleAddUser = () => {
    router.push('/admin/CrearUsuarioA');
  };

  const handleViewUser = (userId) => {
    router.push(`/admin/viewUser/${userId}`);
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
            let localTokenForDelete = await getTokenAsync();
            if (!localTokenForDelete) {
              Alert.alert('Error de Autenticación', 'Token no disponible.');
              router.replace('/LoginAdmin');
              return;
            }
            try {
              setLoading(true);
              await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${localTokenForDelete}` }
              });
              Alert.alert("Éxito", "El usuario ha sido eliminado correctamente.");
              fetchUsers();
            } catch (error) {
              console.error(`Error deleting user ${userId}:`, error);
              let errorMessage = 'No se pudo eliminar el usuario.';
              if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = 'Sesión expirada o sin permisos.';
                await deleteTokenAsync();
                router.replace('/LoginAdmin');
              }
              Alert.alert('Error al Eliminar', errorMessage);
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => {
    const opacity = animatedValues.current[item.id] || new Animated.Value(1);
    return (
      <Animated.View style={[styles.userCard, { opacity }]}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username || 'Sin nombre'}</Text>
          <Text style={styles.email}>{item.email || 'Sin email'}</Text>
          <View style={[
            styles.roleBadge,
            { backgroundColor: getRoleColor(item.role) }
          ]}>
            <Text style={styles.roleText}>
              {item.role ? item.role.toUpperCase() : 'ROL'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleViewUser(item.id)} style={styles.iconButton}>
            <Ionicons name="eye-outline" size={20} color={Colors.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/admin/editUser/${item.id}`)} style={styles.iconButton}>
            <Ionicons name="pencil-outline" size={20} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Función para asignar colores según el rol
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return Colors.primary;
      case 'user': return Colors.accent;
      case 'moderator': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Usuarios',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleAddUser} accessibilityLabel="Añadir usuario">
              <Ionicons name="person-add-outline" size={28} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, usuario o email..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <>
          {filteredUsers.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={70} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No hay resultados.' : 'No hay usuarios registrados.'}
              </Text>
              <TouchableOpacity style={styles.fab} onPress={handleAddUser}>
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onRefresh={fetchUsers}
              refreshing={loading && users.length > 0}
            />
          )}

          {/* Botón flotante (FAB) - siempre visible */}
          <TouchableOpacity style={styles.fab} onPress={handleAddUser} accessibilityLabel="Añadir nuevo usuario">
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

// --- Paleta de colores mejorada ---
const Colors = {
 primary: '#E95A0C',     // Naranja principal
  primaryDark: '#C24A0A',
  accent: '#FF9500',      // Naranja claro
  danger: '#FF3B30',      // Rojo
  info: '#5AC8FA',        // Azul claro
  background: '#F8F9FA',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  border: '#E0E0E0',
  success: '#34C759',
}

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
  
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F0F0F0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});


export default UsuariosA;