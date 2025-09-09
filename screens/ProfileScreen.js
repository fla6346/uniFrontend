import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { AuthContext } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  // const { user, logout } = useContext(AuthContext); // Suponiendo que tienes un AuthContext

  // Datos de usuario simulados
  const user = {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    role: 'student', // o 'organizer', 'admin'
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, Cerrar Sesión", onPress: () => {
            // logout();
            console.log('Logout (simulado)');
            // navigation.replace('Auth'); // Navegar al stack de autenticación
        }}
      ]
    );
  };

  if (!user) {
    // Esto no debería pasar si la pantalla está protegida, pero por si acaso
    return (
      <View style={styles.centered}>
        <Text>No has iniciado sesión.</Text>
        <Button title="Ir a Login" onPress={() => navigation.navigate('Login')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{user.name}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Correo Electrónico:</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Rol:</Text>
        <Text style={styles.value}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
      </View>

      {/* <Button title="Editar Perfil" onPress={() => navigation.navigate('EditProfile')} /> */}
      <View style={styles.logoutButtonContainer}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  value: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  logoutButtonContainer: {
    marginTop: 30,
  }
});

export default ProfileScreen;