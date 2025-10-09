import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Alert,
  Image,
  FlatList,
  Pressable,
  Animated,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#219ebc',
  secondary: '#2980b9',
  accent: '#e74c3c',
  background: '#f8fafc',
  surface: '#ffffff',
  success: '#27ae60',
  warning: '#d97706',
  info: '#3498db',
  purple: '#9b59b6',
  logout: '#e74c3c',
  white: '#fff',
  grayLight: '#ecf0f1',
  grayText: '#64748b',
  res: '#67c1eaff',
  sis:'#FFCC00',
  opo:'#755E00',
  darkText: '#1e293b',
  overlay: 'rgba(15, 23, 42, 0.7)',
  cardShadow: '#000000',
  notificationUnread: '#e6f0ff',
  notificationRead: '#ffffff',
};

const CARD_MARGIN = 16;
const MIN_CARD_WIDTH = 280;
const MAX_COLUMNS = 3;
const MAX_CARD_WIDTH = 340;

const QuickStatsCard = ({ stats }) => {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Estadísticas Rápidas</Text>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={styles.statNumber}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Componente de tarjeta de acción mejorado
const ActionCard = ({ action, onPress, cardWidth, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada escalonada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Acción: ${action.title}`}
      style={{ margin: CARD_MARGIN / 2 }}
    >
      <Animated.View
        style={[
          styles.actionCard,
          { 
            width: cardWidth, 
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim 
          },
        ]}
      >
        <View style={[styles.actionCardHeader, { backgroundColor: action.color }]}>
          <View style={styles.actionIconContainer}>
            <Ionicons name={action.iconName} size={32} color={COLORS.white} />
          </View>
          <View style={styles.headerOverlayEffect} />
        </View>
        
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          {action.description && (
            <Text style={styles.actionDescription}>{action.description}</Text>
          )}
          {action.badge && (
            <View style={[styles.badge, { backgroundColor: action.badgeColor || COLORS.accent }]}>
              <Text style={styles.badgeText}>{action.badge}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionArrow}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const HeaderSection = ({ nombreUsuario }) => {
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('../../assets/images/ind.jpg')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <Text style={styles.headerGreeting}>{getCurrentGreeting()}</Text>
          <Text style={styles.headerTitle}>Panel Académico</Text>
          <Text style={styles.headerSubtitle}>Gestiona tu institución de manera inteligente</Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{nombreUsuario.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{nombreUsuario}</Text>
        </View>
      </View>
    </View>
  );
};

const HomeAcademicoScreen = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  // Estados para datos dinámicos
  const [quickStats] = useState([
    { icon: 'people-outline', value: '1,245', label: 'Estudiantes', color: COLORS.info },
    { icon: 'calendar-outline', value: '24', label: 'Eventos', color: COLORS.info },
    { icon: 'document-text-outline', value: '89', label: 'Documentos', color: COLORS.info },
    { icon: 'trending-up-outline', value: '95%', label: 'Rendimiento', color: COLORS.info },
  ]);

  let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH + CARD_MARGIN));
  numColumns = Math.min(numColumns, MAX_COLUMNS);
  const columns = numColumns > 0 ? numColumns : 1;
  
    const containerPadding = CARD_MARGIN; // Asumimos que el contenedor tiene padding horizontal de CARD_MARGIN/2 * 2 = CARD_MARGIN
    let cardWidth = (windowWidth - containerPadding - CARD_MARGIN * (columns + 1)) / columns;
    cardWidth = Math.min(cardWidth, MAX_CARD_WIDTH);
  const adminActions = [
    {
      id: '0',
      title: 'Proyecto del Evento',
      iconName: 'clipboard-outline',
      route: '/admin/ProyectoEvento',
      color: COLORS.sis,
      description: 'Planifica y gestiona eventos académicos',
      badge: 'Nuevo',
      badgeColor: COLORS.accent,
    },
    {
      id: '1',
      title: 'Gestionar Contenido',
      iconName: 'library-outline',
      route: '/admin/Contenido',
      color: COLORS.sis,
      description: 'Administra publicaciones y recursos',
      badge: '12 pendientes',
      badgeColor: COLORS.warning,
    },
    {
      id: '2',
      title: 'Estadísticas',
      iconName: 'analytics-outline',
      route: '/admin/Estadistica',
      color: COLORS.sis,
      description: 'Analiza métricas y rendimiento',
    },
    {
      id: '3',
      title: 'Gestión de Usuarios',
      iconName: 'people-outline',
      route: '/admin/UsuarioAcademico',
      color: COLORS.sis,
      description: 'Administra estudiantes y docentes',
    },
    {
      id: '4',
      title: 'Configuración',
      iconName: 'settings-outline',
      route: '/admin/settings',
      color: COLORS.sis,
      description: 'Ajustes del sistema',
    },
    {
      id: '5',
      title: 'Reportes',
      iconName: 'document-attach-outline',
      route: '/admin/reportes',
      color: COLORS.sis,
      description: 'Genera informes detallados',
    },
  ];

  const handleActionPress = (route) => {
    if (route) {
      router.push(route);
    } else {
      Alert.alert(
        'Próximamente',
        'Esta funcionalidad estará disponible en la próxima actualización.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeaderSection nombreUsuario={nombreUsuario} />
        
        <QuickStatsCard stats={quickStats} />

        {/* Título de sección */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Herramientas de Gestión</Text>
          <Text style={styles.sectionSubtitle}>Accede a todas las funcionalidades</Text>
        </View>

      
      <View style={styles.actionsGrid}>
        <FlatList
          data={adminActions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ActionCard
              action={item}
              onPress={() => handleActionPress(item.route)}
              cardWidth={cardWidth}
              index={index}
            />
          )}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          key={columns}
          contentContainerStyle={{
            justifyContent: 'center', 
            paddingHorizontal: CARD_MARGIN / 2, 
          }}
        />
      </View>
       
      </ScrollView>

      {/* Botón de logout mejorado */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButtonContainer,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <View style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  
  headerContainer: {
    width: '100%',
    height: 220,
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'space-between',
    padding: 24,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    opacity: 0.9,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth:2,
    borderColor:COLORS.warning,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },

  statsContainer: {
    width: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: -30,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkText,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.grayText,
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    width: '90%',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.grayText,
  },

  actionsGrid: {
    paddingHorizontal: CARD_MARGIN / 2,
    paddingBottom: 20,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth:1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor:'#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionCardHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerOverlayEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  actionContent: {
    padding: 20,
    minHeight: 100,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.grayText,
    lineHeight: 20,
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },

  quickAccessSection: {
    width: '90%',
    marginTop: 20,
    marginBottom: 20,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 16,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // En el componente ExpandableBottomBanner
quickActionItem: {
  width: '30%',
  aspectRatio: 1,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 10,
  padding: 16,
  backgroundColor: '#f8fafc', // Fondo claro
  borderWidth: 1,
  borderColor: '#e2e8f0', // Borde sutil
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
},
quickActionText: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 6,
  textAlign: 'center',
  lineHeight: 18,
  color: '#1e293b', // Texto oscuro
},
expandedLogoutButton: {
  flexDirection: 'row',
  backgroundColor: '#e74c3c', // Solo este botón en rojo
  paddingVertical: 14,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  marginBottom: 10,
  width: '100%',
},
expandedLogoutText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8,
},

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoutButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.opo,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HomeAcademicoScreen;