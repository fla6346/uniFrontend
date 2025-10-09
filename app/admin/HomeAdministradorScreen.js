import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image, 
  FlatList,
  Modal,
  ActivityIndicator,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configuración de API
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

// Funciones para manejo de tokens
const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
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
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token de localStorage en web:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token de SecureStore en nativo:", e);
    }
  }
};

// Definición de colores
const COLORS = {
  primary: '#E95A0C',
  secondary: '#2980b9',
  accent: '#e74c3c',
  second:'#FFA07A',
  background: '#f8fafc',
  surface: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  info: '#3498db',
  purple: '#9b59b6',
  logout: '#e74c3c',
  white: '#fff',
  grayLight: '#ecf0f1',
  grayText: '#64748b',
  darkText: '#1e293b',
  overlay: 'rgba(15, 23, 42, 0.7)',
  cardShadow: '#000000',
  notificationUnread: '#e6f0ff',
  notificationRead: '#ffffff',
};

// Constantes para el diseño responsivo
const CARD_MARGIN = 16;
const MIN_CARD_WIDTH = 280;
const MAX_COLUMNS = 3;
const MAX_CARD_WIDTH = 340;

const ActionCard = ({ action, onPress, cardWidth, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 100,
      bounciness: 10,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 10,
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

// ✅ CORRECCIÓN PRINCIPAL: Eliminamos la animación de height (problemática)
const ExpandableBottomBanner = ({ 
  onLogout, onActionPress, isExpanded, onToggleExpanded }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const quickActions = [
    {
      id: 'add-user',
      title: 'Nuevo Usuario',
      icon: 'person-add',
      color: COLORS.warning,
      action: '/admin/UsuariosA'
    },
    {
      id: 'pendientes',
      title: 'Pendientes',
      icon: 'document-text',
      color: COLORS.secondary,
      action: '/admin/EventosPendientes'
    },
    {
      id: 'aprobados',
      title: 'Aprobados',
      icon: 'document-text',
      color: COLORS.success,
      action: '/admin/EventosAprobados'
    }
  ];

  const onPressIn = () => {
    Animated.spring(headerScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 120,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(headerScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 120,
      bounciness: 8,
    }).start();
  };

  return (
    <View style={styles.expandableBannerContainer}>
      {/* Contenido expandido SIN animación de altura */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.quickActionItem, { backgroundColor: action.color + '15' }]}
                onPress={() => onActionPress(action.action)}
              >
                <Ionicons name={action.icon} size={28} color={action.color} />
                <Text style={[styles.quickActionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onLogout} style={styles.expandedLogoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            <Text style={styles.expandedLogoutText}>Cerrar Sesión</Text>
          </Pressable>
        </View>
      )}
      {/* Banner principal siempre visible */}
      <Pressable
        onPress={onToggleExpanded}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.bannerHeader}
      >
        <Animated.View style={{ transform: [{ scale: headerScale }] }}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconsContainer}>
              <View style={styles.bannerIcon}>
                <Ionicons name="flash" size={16} color={COLORS.white} />
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="settings" size={16} color={COLORS.white} />
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="person" size={16} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.bannerTitle}>Acceso Rápido</Text>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Ionicons name="chevron-up" size={20} color={COLORS.white} />
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
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
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Gestiona tu aplicación eficientemente</Text>
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

const HomeAdministradorScreen = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [pendingContentCount, setPendingContentCount] = useState('0');
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);

  // ✅ Cálculo estable de columnas y ancho de tarjeta
  const { columns, cardWidth } = useMemo(() => {
    let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH + CARD_MARGIN));
    numColumns = Math.min(numColumns, MAX_COLUMNS);
    const cols = numColumns > 0 ? numColumns : 1;
    let width = (windowWidth - CARD_MARGIN * cols * 2) / cols;
    width = Math.min(width, MAX_CARD_WIDTH);
    return { columns: cols, cardWidth: width };
  }, [windowWidth]);



  useEffect(() => {
    fetchNotifications();
    fetchDashboardStats();
  }, [fetchNotifications, fetchDashboardStats]);


  // Estados para alertas críticas (ya no se usan directamente en la UI, pero se mantienen por si la lógica de fondo los necesita)
  const [systemAlerts, setSystemAlerts] = useState([
    {
      id: 'alert-3',
      title: 'Respaldo automático',
      description: 'Último respaldo hace 25 horas',
      priority: 'medium',
      color: COLORS.info,
      icon: 'cloud-upload',
      timestamp: new Date(Date.now() - 90000000).toISOString(),
      action: '/admin/respaldos'
    },
    {
      id: 'alert-4',
      title: 'Usuarios inactivos',
      description: '23 cuentas sin actividad por 30+ días',
      priority: 'low',
      color: COLORS.purple,
      icon: 'people',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      action: '/admin/UsuariosVista.js'
    }
  ]);

  // Estados para datos dinámicos (mantenemos solo para referencia)
  const [quickStats] = useState([
    { icon: 'people-outline', value: activeUsersCount, label: 'Usuarios', color: COLORS.info },
    { icon: 'calendar-outline', value: '24', label: 'Eventos', color: COLORS.success },
    { icon: 'document-text-outline', value: pendingContentCount, label: 'Contenidos', color: COLORS.warning },
    { icon: 'trending-up-outline', value: '95%', label: 'Sistema', color: COLORS.purple },
  ]);

  // Función para obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        Alert.alert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
        await deleteTokenAsync();
        router.replace('/LoginAdmin');
        return;
      }

        console.log('Fetching notifications with REAL events from database...');

    // 🔧 NUEVA IMPLEMENTACIÓN: Obtener eventos reales pendientes
    let realEventNotifications = [];
    try {
      console.log('Fetching pending events from API...');
      const eventsResponse = await axios.get(`${API_BASE_URL}/eventos/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Events API response:', eventsResponse.data);
      
      // Crear notificaciones basadas en eventos reales pendientes
      if (eventsResponse.data?.success && eventsResponse.data.events?.length > 0) {
        realEventNotifications = eventsResponse.data.events.slice(0, 3).map((event, index) => ({
          id: `event-${event.id}`,
          title: 'Evento pendiente de aprobación',
          message: `El evento "${event.title}" necesita tu revisión`,
          timestamp: new Date(Date.now() - (index + 1) * 1800000).toISOString(),
          read: false,
          type: 'event',
          eventId: event.id, // ID REAL del evento (606, etc.)
          priority: event.priority,
          organizer: event.organizer,
          date: event.date
        }));
        
        console.log('Created event notifications:', realEventNotifications);
      } else {
        console.log('No pending events found in API response');
      }
    } catch (eventError) {
      console.error('Error fetching real events for notifications:', eventError);
      console.error('Error details:', eventError.response?.data);
      
      // Fallback: usar datos mock con el evento 606 que sí existe
      realEventNotifications = [
        {
          id: 'event-606',
          title: 'Evento pendiente de aprobación',
          message: 'El evento "evento primero" necesita tu revisión',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'event',
          eventId: 606 // ID REAL de tu base de datos
        }
      ];
    }

    // Combinar con otras notificaciones del sistema
    const systemNotifications = [
      {
        id: 'sys-1',
        title: 'Usuario registrado',
        message: 'Un nuevo usuario se ha registrado en la plataforma',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        read: false,
        type: 'user'
      },
      {
        id: 'sys-2',
        title: 'Sistema actualizado',
        message: 'El sistema se ha actualizado correctamente',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: true,
        type: 'system'
      },
      {
        id: 'content-1',
        title: 'Contenido pendiente de aprobación',
        message: 'Hay 3 nuevas publicaciones esperando tu revisión',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: false,
        type: 'content',
      },
      {
        id: 'error-1',
        title: 'Mantenimiento programado',
        message: 'El sistema tendrá mantenimiento el próximo domingo',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        type: 'system',
      },
    ];

    // Combinar todas las notificaciones
    const allNotifications = [
      ...realEventNotifications,
      ...systemNotifications
    ];

    const sortedNotifications = allNotifications.sort((a, b) => {
      if (a.read === b.read) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return a.read ? 1 : -1;
    });

    console.log(`Final notifications created: ${sortedNotifications.length}`);
    console.log(`Event notifications: ${realEventNotifications.length}`);
    
    setNotifications(sortedNotifications);

  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
    if (error.response?.status === 401 || error.response?.status === 403) {
      await deleteTokenAsync();
      router.replace('/LoginAdmin');
    }
  } finally {
    setLoadingNotifications(false);
  }
}, [router]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const token = await getTokenAsync();
      if (!token) return;

      setActiveUsersCount('1,245');
      setPendingContentCount('12');
      
    } catch (error) {
      console.error('Error al cargar estadísticas del dashboard:', error);
    }
  }, []);

  const handleNotificationPress = useCallback(async (notificationItem) => {
  console.log('=== NOTIFICATION PRESSED ===');
  console.log('Notification item:', notificationItem);
  console.log('Event ID from notification:', notificationItem.eventId);
  
  // 1. Marcar como leída
  setNotifications(prev =>
    prev.map(notif =>
      notif.id === notificationItem.id
        ? { ...notif, read: true }
        : notif
    ).sort((a, b) => {
      if (a.read === b.read) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return a.read ? 1 : -1;
    })
  );

  try {
    const token = await getTokenAsync();
    console.log(`Notificación ${notificationItem.id} marcada como leída.`);
  } catch (error) {
    console.error(`Error al marcar notificación ${notificationItem.id} como leída:`, error);
  }

  // 2. Navegar si es un evento
  if (notificationItem.type === 'event' ) {
    setShowNotifications(false);
    
    router.push({
      pathname: '/admin/EventosPendientes',  // Cambio aquí: EventDetailScreen en lugar de EventoDetalle
      //params: { eventId: notificationItem.eventId.toString() }
    });
    
  } else if (notificationItem.type === 'content') {
    setShowNotifications(false);
    router.push('/admin/EventDetailScreen');
  }
}, [router]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    try {
      const token = await getTokenAsync();
      console.log('Todas las notificaciones marcadas como leídas.');
      // Aquí podrías hacer una llamada a tu API para marcar todas como leídas en el backend
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  }, []);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Cálculo responsivo de columnas
  let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH + CARD_MARGIN));
  numColumns = Math.min(numColumns, MAX_COLUMNS);
  cardWidth = Math.min(cardWidth, MAX_CARD_WIDTH);

  // Acciones de administración
  const adminActions = [
    {
      id: '0',
      title: 'Proyecto del Evento',
      iconName: 'clipboard-outline',
      route: '/admin/ProyectoEvento',
      color: '#E95A0C',
      description: 'Elaboración del proyecto del evento',
      badge: 'Activo',
      badgeColor: COLORS.success,
    },
    {
      id: '1',
      title: 'Gestionar Usuarios',
      iconName: 'people-outline',
      route: '/admin/UsuariosA',
      color: '#E95A0C',
      description: 'Añadir, editar o eliminar usuarios',
    },
    {
      id: '2',
      title: 'Eventos Pendientes ',
      iconName: 'library-outline',
      route: '/admin/EventosPendientes',
      color: COLORS.secondary,
      description: 'Aprueba los eventos pendientes',
      badge: `${pendingContentCount} pendientes`,
      badgeColor: COLORS.warning,
    },
    {
      id: '3',
      title: 'Eventos Aprobados',
      iconName: 'settings-outline',
      route: '/admin/EventosAprobados',
      color: COLORS.success,
      description: 'Ajustes generales de la aplicación',
    },
    {
      id: '4',
      title: 'Ver Estadísticas',
      iconName: 'analytics-outline',
      route: '/admin/Estadistica',
      color: '#E95A0C',
      description: 'Visualizar datos y métricas de la app',
    },
    {
      id: '5',
      title: 'Reportes',
      iconName: 'document-attach-outline',
      route: '/admin/reportes',
      color: '#E95A0C',
      description: 'Genera informes detallados',
      badge: 'Nuevo',
      badgeColor: COLORS.accent,
    },
  ];

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diff = Math.floor((now - notifTime) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user': return 'person-add';
      case 'system': return 'settings';
      case 'event': return 'calendar';
      case 'content': return 'document-text';
      case 'error': return 'warning';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'user': return COLORS.info;
      case 'system': return COLORS.purple;
      case 'event': return COLORS.success;
      case 'content': return COLORS.warning;
      case 'error': return COLORS.accent;
      default: return COLORS.warning;
    }
  };

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

  const handleLogout = async () => {
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

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read ? styles.unreadNotification : styles.readNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={24} color={getNotificationColor(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isBannerExpanded ? 400 : 120 } // ✅ Ajuste dinámico de padding
        ]}
      >
        <HeaderSection 
          nombreUsuario={nombreUsuario}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
        />
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.notificationBanner}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications" size={20} color={COLORS.warning} />
            <Text style={styles.notificationBannerText}>
              Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} nueva{unreadCount !== 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.warning} />
          </TouchableOpacity>
        )}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Herramientas de Gestión</Text>
          <Text style={styles.sectionSubtitle}>Accede a todas las funcionalidades</Text>
        </View>
        <View style={[styles.actionsGrid, { maxWidth: columns * (cardWidth + CARD_MARGIN) }]}>
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
          />
        </View>
      </ScrollView>

      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            <View style={styles.modalHeaderActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Text style={styles.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.darkText} />
              </TouchableOpacity>
            </View>
          </View>
          {loadingNotifications ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id.toString()}
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No hay notificaciones</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      <ExpandableBottomBanner
        onLogout={handleLogout}
        onActionPress={handleActionPress}
        isExpanded={isBannerExpanded}
        onToggleExpanded={() => setIsBannerExpanded(!isBannerExpanded)}
      />
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
    backgroundColor: 'rgba(0, 60, 120, 0.8)',
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
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  notificationBanner: {
    width: '90%',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationBannerText: {
    flex: 1,
    marginLeft: 12,
    color: '#856404',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionHeader: {
    width: '90%',
    marginBottom: 20,
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
    width: '100%',
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
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
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  markAllText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: COLORS.notificationUnread,
  },
  readNotification: {
    backgroundColor: COLORS.notificationRead,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
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
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 8,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.grayText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  expandableBannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  expandedContent: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 350,
    minHeight: 280,
    maxWidth: 800,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  expandedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    maxWidth: 600,
    alignSelf: 'center'
  },
  quickActionItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    color: COLORS.darkText,
  },
  expandedLogoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
  },
  expandedLogoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bannerHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerIconsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
});

export default HomeAdministradorScreen;