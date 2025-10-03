import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'; // useRouter para la navegación
// import { useAuth } from '../../path/to/authContext'; // Si necesitas el contexto de autenticación

const HomeEstudianteScreen = () => {
  const params=useLocalSearchParams();
  const nombreUsuario= params.nombre||'Estudiante';
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "Funcionalidad de logout pendiente aquí.");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Portal del Estudiante',
          // Puedes añadir un botón de logout en el header si quieres
          // headerRight: () => (
          //   <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          //     <Ionicons name="log-out-outline" size={24} color="blue" />
          //   </TouchableOpacity>
          // ),
        }}
      />
      <Text style={styles.title}>¡Bienvenido, Estudiante {nombreUsuario}!</Text>
      <Text style={styles.subtitle}>Este es tu panel principal.</Text>

      {/* Aquí puedes añadir enlaces o botones a otras secciones para estudiantes */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/ruta/a/mis-cursos')}>
        <Text style={styles.buttonText}>Mis Eventos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/api/Inscripcion')}>
        <Text style={styles.buttonText}>Inscripcion</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={[styles.buttonText, styles.logoutButtonText]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff', // Un color de fondo suave
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e95', // Un color azul primario
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#dc3545', // Un color rojo para logout
    marginTop: 20,
  },
  logoutButtonText: {
    // Puedes mantener el mismo estilo de buttonText o especializarlo
  }
});

export default HomeEstudianteScreen; // <--- EXPORTACIÓN POR DEFECTO