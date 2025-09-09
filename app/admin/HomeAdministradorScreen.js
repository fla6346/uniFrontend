import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image, 
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Importa los iconos

const windowWidth = Dimensions.get('window').width;

const HomeAdministradorScreen = () => {
  const router = useRouter();

  const adminActions = [
    {
      id:'0',
      title: 'Proyecto del evento',
      iconName:'',
      route:'/admin/ProyectoEvento',
      color:'',
      description:'Elaboracion del proyecto del evento',
    },
    {  id: '1',
      title: 'Gestionar Usuarios',
      iconName: 'people-sharp',
      route: '/admin/UsuariosA',
      color: '#3498db',
      description: 'Añadir, editar o eliminar usuarios.',
    },
    {
      id: '2',
      title: 'Gestionar Contenido',
      iconName: 'document-text-sharp',
      route: '/admin/Contenido',
      color: '#2ecc71',
      description: 'Moderar publicaciones, categorías, etc.',
    },
    {
      id: '3',
      title: 'Ver Estadísticas',
      iconName: 'stats-chart-sharp',
      route: '/admin/Estadistica',
      color: '#f39c12',
      description: 'Visualizar datos y métricas de la app.',
    },
    {
      id: '4',
      title: 'Configuración App',
      iconName: 'settings-sharp',
      route: '/admin/settings',
      color: '#9b59b6',
      description: 'Ajustes generales de la aplicación.',
    },
  ];

  const handleActionPress = (route) => {
    if (route) {
      router.push(route);
    } else {
      Alert.alert("Acción no implementada", "Esta funcionalidad aún no está disponible.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Cerrar Sesión",
          onPress: () => {
            router.replace('/'); 
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0052A0" /> {/* Ajusta el color de la barra de estado */}
      
      <View style={styles.headerContainer}>
        <Image
          source={require('../../assets/images/ind.jpg')} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Gestiona tu aplicación eficientemente</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcomeText}>¡Bienvenido de nuevo, Administrador!</Text>
        
        <View style={styles.actionsGrid}>
          {adminActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { borderLeftColor: action.color }]} // Usamos el color como un borde
              onPress={() => handleActionPress(action.route)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.iconName} size={36} color={action.color} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                {action.description && <Text style={styles.actionDescription}>{action.description}</Text>}
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerContainer: {
    width: '100%',
    height: 180, 
    position: 'relative', 
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 60, 120, 0.6)', // Un azul oscuro semitransparente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  // --- Contenido del Scroll ---
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  actionsGrid: {
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderLeftWidth: 5, 
  },
  actionIconContainer: {
    marginRight: 18,
    padding: 10,
    borderRadius: 8,
  },
  actionTextContainer: {
    flex: 1, 
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50', // Un color de texto oscuro
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#7f8c8d', // Un gris más suave para la descripción
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#c0392b', // Un rojo más oscuro para logout
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 20, // Espacio desde abajo
    marginTop: 10,
    borderRadius: 10,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeAdministradorScreen;