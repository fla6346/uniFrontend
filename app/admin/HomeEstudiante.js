import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFEDD5',
  secondary: '#4B5563',
  accent: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  white: '#FFFFFF',
};

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
const TOKEN_KEY = 'authToken';

// Función para obtener el token
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

const CARD_MARGIN = 12;
const MIN_CARD_WIDTH = 200;

const StudentActionCard = ({ title, description, icon, color, onPress }) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, MIN_CARD_WIDTH);

  return (
    <TouchableOpacity
      style={[styles.actionCard, { width: cardWidth, borderColor: color + '20' }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        {description && <Text style={styles.cardDescription}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const EventCard = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      <View style={styles.eventHeader}>
        <View style={[styles.eventBadge, { backgroundColor: event.categoryColor + '20' }]}>
          <Text style={[styles.eventBadgeText, { color: event.categoryColor }]}>{event.category}</Text>
        </View>
        <Text style={styles.eventDate}>{event.date}</Text>
      </View>
      
      <Text style={styles.eventTitle}>{event.title}</Text>
      
      <View style={styles.eventInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{event.time}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{event.location}</Text>
        </View>
      </View>
      
      <View style={styles.eventStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: event.statusColor }]} />
        <Text style={[styles.statusText, { color: event.statusColor }]}>{event.status}</Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeEstudianteScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Parsear userProfile si viene como string
  let userProfile = params.userProfile;
  if (typeof userProfile === 'string') {
    try {
      userProfile = JSON.parse(userProfile);
    } catch (e) {
      console.error('Error parseando userProfile:', e);
      userProfile = {};
    }
  }
  
  // Extraer datos básicos
  const nombreUsuario = params.nombre || userProfile?.nombre || userProfile?.name || 'Estudiante';
  const apellido = params.apellidopat || params.apellido || userProfile?.apellidopat || userProfile?.apellido || '';
  const idUsuario = params.idusuario || userProfile?.idusuario || userProfile?.id;
  
  console.log('📋 Parámetros iniciales:', { 
    nombreUsuario, 
    apellido,
    idUsuario,
    userProfile,
    allParams: params 
  });
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [carreraInfo, setCarreraInfo] = useState(null);
  const [facultadInfo, setFacultadInfo] = useState(null);
  const [stats, setStats] = useState({
    eventsCount: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [error, setError] = useState(null);

  // ✅ Paso 1: Cargar datos del estudiante desde la tabla estudiante
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!idUsuario) {
        console.error('❌ No se encontró idUsuario');
        setError('No se pudo identificar al estudiante');
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.error('❌ No hay token disponible');
          setError('Sesión no válida. Por favor, inicia sesión nuevamente.');
          setLoading(false);
          return;
        }

        console.log('🔍 Buscando datos del estudiante con idusuario:', idUsuario);

        // Obtener datos del estudiante desde la tabla estudiante
        const studentResponse = await axios.get(`${API_BASE_URL}/estudiantes/usuario/${idUsuario}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        });

        const student = studentResponse.data;
        console.log('✅ Datos del estudiante obtenidos:', student);

        setStudentData(student);

        // Ahora tenemos idestudiante, idcarrera, idfacultad
        return student;

      } catch (err) {
        console.error('❌ Error al cargar datos del estudiante:', err);
        console.error('❌ Detalles:', err.response?.data || err.message);
        
        const errorMsg = err.response?.data?.message || 
                        err.message || 
                        'No se pudo obtener información del estudiante';
        setError(errorMsg);
        setLoading(false);
        
        Alert.alert(
          'Error',
          `${errorMsg}\n\nPor favor, verifica que tu cuenta de estudiante esté correctamente configurada.`,
          [{ text: 'OK' }]
        );
        
        return null;
      }
    };

    fetchStudentData();
  }, [idUsuario]);

  // ✅ Paso 2: Cargar información de carrera y facultad cuando tengamos studentData
  useEffect(() => {
    if (!studentData) return;

    const fetchCarreraYFacultad = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const { idcarrera, idfacultad } = studentData;

        // Cargar información de la carrera
        if (idcarrera) {
          try {
            console.log('🔍 Cargando carrera ID:', idcarrera);
            const carreraResponse = await axios.get(`${API_BASE_URL}/carreras/${idcarrera}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 5000
            });
            setCarreraInfo(carreraResponse.data);
            console.log('✅ Carrera cargada:', carreraResponse.data);
          } catch (err) {
            console.warn('⚠️ No se pudo cargar la carrera:', err.message);
          }
        }

        // Cargar información de la facultad
        if (idfacultad) {
          try {
            console.log('🔍 Cargando facultad ID:', idfacultad);
            const facultadResponse = await axios.get(`${API_BASE_URL}/facultades/${idfacultad}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 5000
            });
            setFacultadInfo(facultadResponse.data);
            console.log('✅ Facultad cargada:', facultadResponse.data);
          } catch (err) {
            console.warn('⚠️ No se pudo cargar la facultad:', err.message);
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar carrera y facultad:', error);
      }
    };

    fetchCarreraYFacultad();
  }, [studentData]);

  // ✅ Paso 3: Cargar eventos cuando tengamos la facultad
  useEffect(() => {
    if (!studentData?.idfacultad) {
      if (studentData && !studentData.idfacultad) {
        console.warn('⚠️ El estudiante no tiene facultad asignada');
        setError('Tu cuenta no tiene una facultad asignada. Contacta al administrador.');
        setLoading(false);
      }
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = await getToken();
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const { idfacultad, idestudiante } = studentData;

        console.log('🔍 Buscando eventos para facultad:', idfacultad);

        // Obtener eventos de la facultad
        const eventsResponse = await axios.get(`${API_BASE_URL}/eventos/facultad/${idfacultad}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('✅ Respuesta de eventos:', eventsResponse.data);

        // Formatear los eventos
        const formattedEvents = (eventsResponse.data || []).map(event => {
          const fechaInicio = event.fecha_inicio || event.fecha || event.created_at;
          const fechaFin = event.fecha_fin || event.fecha;
          
          return {
            id: event.idevento || event.id,
            title: event.nombre || event.titulo || event.name || 'Evento sin nombre',
            date: formatDate(fechaInicio),
            time: formatTimeRange(fechaInicio, fechaFin),
            location: event.ubicacion || event.lugar || event.location || 'Por definir',
            category: event.tipo_evento || event.tipo || event.categoria || 'Evento',
            categoryColor: getCategoryColor(event.tipo_evento || event.tipo || event.categoria),
            status: getStatus(event.estado || event.status || 'programado'),
            statusColor: getStatusColor(event.estado || event.status || 'programado')
          };
        });

        console.log('📊 Eventos formateados:', formattedEvents);

        // Obtener notificaciones
        let formattedNotifications = [];
        if (idestudiante) {
          try {
            const notificationsResponse = await axios.get(`${API_BASE_URL}/notificaciones/usuario/${idUsuario}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            
            formattedNotifications = (notificationsResponse.data || []).map(notification => ({
              id: notification.idnotificacion || notification.id,
              title: notification.titulo || notification.title || 'Notificación',
              message: notification.mensaje || notification.descripcion || notification.message || '',
              time: formatRelativeTime(notification.created_at || notification.fecha)
            }));
          } catch (notifError) {
            console.warn('⚠️ No se pudieron cargar notificaciones:', notifError.message);
          }
        }

        // Calcular estadísticas
        const upcoming = formattedEvents.filter(e => 
          ['Próximo', 'Confirmado', 'Pendiente'].includes(e.status)
        ).length;
        
        const completed = formattedEvents.filter(e => 
          ['Completado', 'Finalizado', 'Realizado'].includes(e.status)
        ).length;

        setEvents(formattedEvents);
        setNotifications(formattedNotifications);
        setStats({
          eventsCount: formattedEvents.length,
          upcomingEvents: upcoming,
          completedEvents: completed
        });

      } catch (err) {
        console.error('❌ Error al cargar eventos:', err);
        console.error('❌ Detalles:', err.response?.data || err.message);
        
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Error al cargar los eventos.';
        setError(errorMessage);
        
        Alert.alert(
          'Error al cargar eventos',
          `${errorMessage}\n\nSe mostrarán datos de ejemplo.`,
          [{ text: 'OK' }]
        );
        
        // Datos de ejemplo
        setEvents([
          {
            id: 1,
            title: 'Taller de Desarrollo Web',
            date: '25 Jun 2024',
            time: '10:00 - 12:00',
            location: 'Aula 305',
            category: 'Taller',
            categoryColor: '#3B82F6',
            status: 'Confirmado',
            statusColor: '#10B981'
          }
        ]);
        setStats({ eventsCount: 1, upcomingEvents: 1, completedEvents: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [studentData]);

  // Funciones auxiliares
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTimeRange = (startDate, endDate) => {
    if (!startDate) return 'Hora no disponible';
    
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (isNaN(start.getTime())) return 'Hora no disponible';
      
      const startTime = start.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      if (end && !isNaN(end.getTime())) {
        const endTime = end.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        return `${startTime} - ${endTime}`;
      }
      
      return startTime;
    } catch (e) {
      return 'Hora no disponible';
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Ahora';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString('es-ES');
    } catch (e) {
      return '';
    }
  };

  const getCategoryColor = (category) => {
    if (!category) return '#6B7280';
    
    const colors = {
      'taller': '#3B82F6',
      'conferencia': '#EF4444',
      'seminario': '#F59E0B',
      'webinar': '#8B5CF6',
      'capacitacion': '#EC4899',
      'evento': '#6B7280',
    };
    return colors[category.toLowerCase()] || '#6B7280';
  };

  const getStatus = (status) => {
    if (!status) return 'Pendiente';
    
    const statusMap = {
      'scheduled': 'Próximo',
      'confirmed': 'Confirmado',
      'in_progress': 'En curso',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'pending': 'Pendiente',
      'programado': 'Próximo',
      'confirmado': 'Confirmado',
      'en_curso': 'En curso',
      'completado': 'Completado',
      'finalizado': 'Completado',
      'cancelado': 'Cancelado',
      'pendiente': 'Pendiente',
    };
    return statusMap[status.toString().toLowerCase()] || 'Pendiente';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Próximo': '#3B82F6',
      'Confirmado': '#10B981',
      'En curso': '#F59E0B',
      'Completado': '#6B7280',
      'Cancelado': '#EF4444',
      'Pendiente': '#F59E0B'
    };
    return colors[getStatus(status)] || '#6B7280';
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS === 'web') {
                localStorage.removeItem(TOKEN_KEY);
              } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
              }
              router.replace('/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>{getCurrentGreeting()},</Text>
        <Text style={styles.userName}>{nombreUsuario} {apellido}</Text>
      </View>
      
      {/* Mostrar carrera y facultad */}
      {(carreraInfo || facultadInfo) && (
        <View style={styles.userInfoContainer}>
          {carreraInfo && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color={COLORS.white} />
              <Text style={styles.infoText}>{carreraInfo.nombre || carreraInfo.name}</Text>
            </View>
          )}
          {facultadInfo && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color={COLORS.white} />
              <Text style={styles.infoText}>{facultadInfo.nombre || facultadInfo.name}</Text>
            </View>
          )}
        </View>
      )}
      
      <Text style={styles.subtitle}>Portal del Estudiante</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{stats.eventsCount}</Text>
          <Text style={styles.statLabel}>Eventos</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time-outline" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
          <Text style={styles.statLabel}>Próximos</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.info} />
          </View>
          <Text style={styles.statNumber}>{stats.completedEvents}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <TouchableOpacity onPress={() => router.push('/estudiante/notificaciones')}>
          <Text style={styles.seeAll}>Ver todo</Text>
        </TouchableOpacity>
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No hay notificaciones nuevas</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {notifications.map(notification => (
            <TouchableOpacity 
              key={notification.id} 
              style={styles.notificationCard}
              onPress={() => router.push('/estudiante/notificaciones')}
            >
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderEvents = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eventos de tu Facultad</Text>
        <TouchableOpacity onPress={() => router.push('/estudiante/eventos')}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      
      {error && !loading && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.accent} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      ) : events.length === 0 && !error ? (
        <View style={styles.emptyStateCard}>
          <Ionicons name="calendar-clear-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No hay eventos disponibles</Text>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.push('/estudiante/inscripcion')}
          >
            <Text style={styles.primaryButtonText}>Explorar Eventos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {events.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onPress={() => router.push(`/estudiante/eventos/${event.id}`)} 
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      
      <View style={styles.actionsGrid}>
        <StudentActionCard
          title="Mis Eventos"
          description="Ver eventos inscritos"
          icon="calendar-outline"
          color={COLORS.primary}
          onPress={() => router.push('/estudiante/eventos')}
        />

        <StudentActionCard
          title="Inscripción"
          description="Unirse a eventos"
          icon="add-circle-outline"
          color={COLORS.success}
          onPress={() => router.push('/estudiante/inscripcion')}
        />

        <StudentActionCard
          title="Mi Perfil"
          description="Ver y editar perfil"
          icon="person-outline"
          color={COLORS.info}
          onPress={() => router.push('/estudiante/perfil')}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderNotifications()}
        {renderEvents()}
        {renderActions()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  userInfoContainer: {
    marginTop: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 12,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    width: 280,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsGrid: {
    gap: 12,
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeEstudianteScreen;