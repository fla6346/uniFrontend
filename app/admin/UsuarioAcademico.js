import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, SafeAreaView, Platform, RefreshControl,
  Dimensions, Modal, Pressable
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

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
      localStorage.removeItem(TOKEN_KEY);
      console.log(`Token eliminado de localStorage (web) con clave: ${TOKEN_KEY}`);
    } catch (e) {
      console.error("Error al eliminar token de localStorage en web:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log(`Token eliminado de SecureStore (nativo) con clave: ${TOKEN_KEY}`);
    } catch (e){
      console.error("Error al eliminar token de SecureStore en nativo:", e);
    }
  }
};

const UsuarioAcademico = () => {
  console.log("UsuariosA: Renderizando componente");
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const params = useLocalSearchParams();

  const fetchUsers = async (isRefresh = false) => {
    console.log("UsuariosA: Ejecutando fetchUsers...");
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
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
          router.replace('/LoginAdmin');
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
      setRefreshing(false);
      console.log("UsuariosA: fetchUsers finalizado.");
    }
  };

  const onRefresh = useCallback(() => {
    fetchUsers(true);
  }, []);

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
    if (!users) {
      setFilteredUsers([]);
      return;
    }
    
    let filtered = users;
    
    // Filtro por término de búsqueda
    if (searchTerm !== '') {
      filtered = filtered.filter(user =>
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtro por rol
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, filterRole]);

  const handleAddUser = () => {
    router.push('/admin/CrearUsuarioA'); 
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

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
              fetchUsers();
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

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#e74c3c';
      case 'user': return '#3498db';
      case 'moderator': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'shield-checkmark-outline';
      case 'user': return 'person-outline';
      case 'moderator': return 'people-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderUserItem = ({ item, index }) => (
    <View style={[styles.userItemContainer, { opacity: loading ? 0.6 : 1 }]}>
      <View style={styles.userAvatarContainer}>
        <View style={[styles.userAvatar, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.avatarText}>
            {(item.username || item.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(item.role) }]}>
          <Ionicons name={getRoleIcon(item.role)} size={12} color="#fff" />
        </View>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {item.username || 'Sin nombre'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email || 'Sin email'}
        </Text>
        <View style={styles.roleContainer}>
          <Text style={[styles.userRole, { color: getRoleColor(item.role) }]}>
            {item.role || 'Sin rol'}
          </Text>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          onPress={() => handleViewUser(item)} 
          style={[styles.actionButton, styles.viewButton]}
        >
          <Ionicons name="eye-outline" size={20} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push(`/admin/editUser/${item.id}`)} 
          style={[styles.actionButton, styles.editButton]}
        >
          <Ionicons name="pencil-outline" size={20} color="#f39c12" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleDeleteUser(item.id)} 
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterChips = () => {
    const roles = ['all', 'admin', 'user', 'moderator'];
    return (
      <View style={styles.filterContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterChip,
              filterRole === role && styles.filterChipActive
            ]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[
              styles.filterChipText,
              filterRole === role && styles.filterChipTextActive
            ]}>
              {role === 'all' ? 'Todos' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUserModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowUserModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
            <TouchableOpacity
              onPress={() => setShowUserModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <View style={styles.modalBody}>
              <View style={styles.modalUserAvatar}>
                <View style={[styles.modalAvatar, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                  <Text style={styles.modalAvatarText}>
                    {(selectedUser.username || selectedUser.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>
                  {selectedUser.username || 'Sin nombre'}
                </Text>
                <Text style={styles.modalUserEmail}>
                  {selectedUser.email || 'Sin email'}
                </Text>
                <View style={styles.modalRoleContainer}>
                  <Ionicons 
                    name={getRoleIcon(selectedUser.role)} 
                    size={16} 
                    color={getRoleColor(selectedUser.role)} 
                  />
                  <Text style={[styles.modalUserRole, { color: getRoleColor(selectedUser.role) }]}>
                    {selectedUser.role || 'Sin rol'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalEditButton]}
                  onPress={() => {
                    setShowUserModal(false);
                    router.push(`/admin/editUser/${selectedUser.id}`);
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.modalActionButtonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalDeleteButton]}
                  onPress={() => {
                    setShowUserModal(false);
                    handleDeleteUser(selectedUser.id);
                  }}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.modalActionButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );

  if (loading && (!users || users.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e95a0c" />
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
          headerStyle: {
            backgroundColor: '#e95a0c',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity onPress={handleAddUser} style={styles.headerButton}>
              <Ionicons name="add-circle" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#888"
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderFilterChips()}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
          {searchTerm || filterRole !== 'all' ? ' encontrados' : ' total'}
        </Text>
      </View>

      {!loading && filteredUsers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.noUsersText}>
            {searchTerm || filterRole !== 'all' 
              ? 'No se encontraron usuarios con los filtros aplicados.' 
              : 'No hay usuarios para mostrar.'}
          </Text>
          {(searchTerm || filterRole !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchTerm('');
                setFilterRole('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#e95a0c']}
              tintColor="#e95a0c"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderUserModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#666',
  },
  headerButton: {
    marginRight: 15,
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#e95a0c',
    borderColor: '#e95a0c',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  userItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  viewButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  editButton: {
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  noUsersText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  clearFiltersButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e95a0c',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalUserAvatar: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalUserInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalUserEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUserRole: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  modalEditButton: {
    backgroundColor: '#f39c12',
  },
  modalDeleteButton: {
    backgroundColor: '#e74c3c',
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default UsuarioAcademico;