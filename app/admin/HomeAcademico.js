import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else {
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return (token && token !== 'null' && token !== '') ? token : null;
    } catch (e) {
      console.error("Error al acceder a localStorage en web:", e);
      return null;
    }
  } else {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return (token && token !== 'null' && token !== '') ? token : null;
    } catch (e) {
      console.error("Error al obtener token de SecureStore en nativo:", e);
      return null;
    }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

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
  sis: '#FFCC00',
  opo: '#755E00',
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

const ActionCard = ({ action, onPress, cardWidth, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
            opacity: fadeAnim,
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

const HeaderSection = ({ nombreUsuario, unreadCount, onNotificationPress }) => {
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

        <View style={styles.headerBottom}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{nombreUsuario.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{nombreUsuario}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerNotificationButton}
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications" size={24} color={COLORS.white} />
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HomeAcademicoScreen = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Usuario';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [quickStats] = useState([
    { icon: 'people-outline', value: '1,245', label: 'Estudiantes', color: COLORS.info },
    { icon: 'calendar-outline', value: '24', label: 'Eventos', color: COLORS.info },
    { icon: 'document-text-outline', value: '89', label: 'Documentos', color: COLORS.info },
    { icon: 'trending-up-outline', value: '95%', label: 'Rendimiento', color: COLORS.info },
  ]);

  let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH + CARD_MARGIN));
  numColumns = Math.min(numColumns, MAX_COLUMNS);
  const columns = numColumns > 0 ? numColumns : 1;
  let cardWidth = (windowWidth - CARD_MARGIN * (columns + 1)) / columns;
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

  const fetchNotifications = useCallback(async () => {
   
    setLoadingNotifications(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const notifs = Array.isArray(response.data) ? response.data : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read && n.estado !== 'leido').length);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Sesión Expirada', 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
        await deleteTokenAsync();
        router.replace('/Login');
      } else {
        Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
      }
    } finally {
      setLoadingNotifications(false);
    }
  }, [authToken, router]);

  // Efecto para inicializar y obtener el token
 /* useEffect(() => {
    const initialize = async () => {
      const token = await getTokenAsync();
      console.log('🔑 Token obtenido:', token ? `${token.substring(0, 20)}...` : 'NO HAY TOKEN');
      
      if (!token || token === 'null' || token === '') {
        console.warn('⚠️ Token inválido o ausente en initialize');
        await deleteTokenAsync();
        router.replace('/Login');
        return;
      }
      
      
      console.log('✅ Token válido, estableciendo en estado');
      setAuthToken(token);
      //loadNotifications();
       try {
         const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
           headers: { Authorization: `Bearer ${token}` },
         });
        // const notifs = Array.isArray(response.data) ? response.data : [];
         //setNotifications(notifs);
         //setUnreadCount(notifs.filter(n => !n.read && n.estado !== 'leido').length);
       } catch (error) {
         console.error('Error al cargar notificaciones:', error);
         if (error.response?.status === 401 || error.response?.status === 403) {
           Alert.alert('Sesión Expirada', 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
           await deleteTokenAsync();
           router.replace('/Login');
         }
       }
    };
    
    initialize();
  }, [router]);

  const loadNotifications = async () => {
       try {
         const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
           headers: { Authorization: `Bearer ${token}` },
         });
        // const notifs = Array.isArray(response.data) ? response.data : [];
         //setNotifications(notifs);
         //setUnreadCount(notifs.filter(n => !n.read && n.estado !== 'leido').length);
       } catch (error) {
         console.error('Error al cargar notificaciones:', error);
         if (error.response?.status === 401 || error.response?.status === 403) {
           Alert.alert('Sesión Expirada', 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
           await deleteTokenAsync();
           router.replace('/Login');
         }
       }
     };*/

 useEffect(() => {
  if (!authToken) return;

  const loadNotifications = async () => {
    const token = await getTokenAsync();
    if (!token) {
      router.replace('/Login');
      return;
    }
    setLoadingNotifications(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const notifs = Array.isArray(response.data) ? response.data : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read && n.estado !== 'leido').length);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Sesión Expirada', 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
        await deleteTokenAsync();
        router.replace('/Login');
      } else {
        Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Cargar inmediatamente
  loadNotifications();

  // Polling cada 30 segundos
  const interval = setInterval(loadNotifications, 30000);

  return () => clearInterval(interval);
}, [authToken, router]);

  const handleActionPress = (route) => {
    if (route) {
      router.push(route);
    } else {
      Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto.', [
        { text: 'Entendido' },
      ]);
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
          onPress: async () => {
            await deleteTokenAsync();
            router.replace('/');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diff = Math.floor((now - notifTime) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeaderSection
          nombreUsuario={nombreUsuario}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
        />

        <QuickStatsCard stats={quickStats} />

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

      {/* Modal de Notificaciones */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close" size={24} color={COLORS.darkText} />
            </TouchableOpacity>
          </View>

          {loadingNotifications ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id.toString()}
              style={styles.notificationsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No tienes notificaciones</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* Botón de logout */}
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
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderWidth: 2,
    borderColor: COLORS.warning,
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
  headerNotificationButton: {
    position: 'relative',
    padding: 8,
  },
  headerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
  // Modal de notificaciones
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.grayText,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.grayText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.grayText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.grayText,
    textAlign: 'center',
  },
});

export default HomeAcademicoScreen;