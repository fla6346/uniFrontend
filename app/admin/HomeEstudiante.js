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
import { Stack, useRouter } from 'expo-router'; 
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
const TOKEN_KEY = 'studentAuthToken'; 
const USER_DATA_KEY = 'studentUserData';

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

const getUserData = async () => {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(USER_DATA_KEY);
      console.log(' Raw data from localStorage:', data);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await SecureStore.getItemAsync(USER_DATA_KEY);
      console.log(' Raw data from SecureStore:', data);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

const deleteTokenAndRedirect = async (router) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (err) {
    console.error('Error deleting token:', err);
  }
  router.replace('/login');
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
        <View style={[styles.eventBadge, { backgroundColor: event.categoryColor + '15' }]}>
          <Text style={[styles.eventBadgeText, { color: event.categoryColor }]}>
            {event.category}
          </Text>
        </View>
        <Text style={styles.eventDate}>{event.date}</Text>
      </View>
      
      {/* Título principal */}
      <Text style={styles.eventTitle}>{event.title}</Text>
      
      {/* Información detallada */}
      <View style={styles.eventDetails}>
        
        {/* Organizador */}
        {event.organizador && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.detailText}>{event.organizador}</Text>
          </View>
        )}
        
        {/* Hora y duración */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.detailText}>{event.time}</Text>
          {event.duracion && (
            <Text style={[styles.detailText, { marginLeft: 8, opacity: 0.7 }]}>
              • {event.duracion}
            </Text>
          )}
        </View>
        
        {/* Ubicación */}
        {event.location && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.detailText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        
        {/* Facultad/Carrera (si está disponible) */}
        {(event.facultad || event.carrera) && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="school-outline" size={14} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.detailText}>
              {event.facultad || event.carrera}
            </Text>
          </View>
        )}
        
        {/* Participantes/Inscritos */}
        {(event.participantes || event.capacidad) && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            </View>
            {event.participantes && (
              <Text style={styles.detailText}>
                {event.participantes} inscritos
              </Text>
            )}
            {event.capacidad && (
              <Text style={[styles.detailText, { marginLeft: 8, opacity: 0.7 }]}>
                • Capacidad: {event.capacidad}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Estado del evento */}
      <View style={styles.eventStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: event.statusColor }]} />
        <Text style={[styles.statusText, { color: event.statusColor }]}>{event.status}</Text>
        
        {/* Modalidad (presencial/virtual) */}
        {event.modalidad && (
          <View style={styles.modalidadBadge}>
            <Ionicons 
              name={event.modalidad === 'virtual' ? 'videocam-outline' : 'home-outline'} 
              size={12} 
              color={COLORS.primary} 
            />
            <Text style={styles.modalidadText}>
              {event.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
const HomeEstudianteScreen = () => {
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
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

   useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      console.log('\n🔍 ===== LOADING USER DATA =====');
      console.log('Storage keys being used:', { TOKEN_KEY, USER_DATA_KEY });
      
      try {
        const user = await getUserData();
        
        console.log('📋 User data retrieved:', user);
        console.log('🎭 Role found:', user?.role);
        console.log('🆔 User ID:', user?.id || user?.idusuario);
        
        if (!isMounted) return;
        
        if (!user) {
          console.error('❌ No user data found in storage');
          
          Alert.alert(
            'Sesión no válida',
            'No se encontró información de sesión. Por favor, inicia sesión nuevamente.',
            [{
              text: 'OK',
              onPress: () => deleteTokenAndRedirect(router)
            }]
          );
          return;
        }

        if (user.role !== 'student') {
          console.error('❌ Invalid role:', user.role, '(expected: student)');
          
          Alert.alert(
            'Sesión no válida',
            `Esta pantalla es solo para estudiantes. Tu rol es: ${user.role}`,
            [{
              text: 'OK',
              onPress: () => deleteTokenAndRedirect(router)
            }]
          );
          return;
        }

        setUserData(user);
        console.log('✅ User data loaded successfully');
        
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        
        if (isMounted) {
          Alert.alert('Error', 'No se pudo cargar tu información', [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = await getToken();
      
      if (!isMounted) return;
      
      if (!token) {
        console.error('❌ Token not found');
        
        Alert.alert(
          'Sesión expirada',
          'Por favor, inicia sesión nuevamente.',
          [{
            text: 'OK',
            onPress: () => deleteTokenAndRedirect(router)
          }]
        );
        return;
      }
      
      console.log('✅ Token verified');
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const nombreUsuario = userData?.nombre || userData?.name || 'Estudiante';
  const apellido = userData?.apellidopat || userData?.apellido || '';
  const idUsuario = userData?.id || userData?.idusuario;

  const recargarDatos = () => {
    setError(null);
    setLoading(true);
    setStudentData(null);
    // Recargar eventos manteniendo la lógica actual
    if (idUsuario && userData) {
      fetchEventsDirect();
    }
  };

const fetchEventsDirect = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token no disponible');

    let facultadId = userData?.facultad_id;
    
    if (!facultadId) {
      console.log('⚠️ facultad_id no encontrado en userData, intentando refresh...');
      
      try {
        const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        
        const freshFacultadId = meResponse.data?.user?.facultad_id || meResponse.data?.facultad_id;
        
        if (freshFacultadId) {
          console.log('✅ facultad_id obtenido de /auth/me:', freshFacultadId);
          setUserData(prev => {
            const updated = { ...prev, facultad_id: freshFacultadId };
            if (Platform.OS === 'web') {
              localStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
            } else {
              SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(updated));
            }
            return updated;
          });
          facultadId = freshFacultadId;
        }
      } catch (meError) {
        console.warn('⚠️ No se pudo refrescar datos:', meError.message);
      }
    }

    if (!facultadId) {
      console.error('❌ facultad_id aún no disponible después de refresh');
      setError('Tu perfil no tiene facultad asignada. Contacta al administrador.');
      setLoading(false);
      return;
    }

    console.log('📡 Request: GET /eventos/aprobados-por-facultad?id=', facultadId);
    
    const response = await axios.get(
      `${API_BASE_URL}/eventos/aprobados-por-facultad`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { facultad_id: facultadId }, 
        timeout: 10000
      }
    );

    console.log('📡 Request URL:', `${API_BASE_URL}/eventos/aprobados-por-facultad?facultad_id=${facultadId}`);
      console.log('📦 Eventos recibidos (total):', response.data.length);
      const eventosFase2 = response.data.filter(evento => {
      if (evento.idfase === 2) return true;
      
      if (evento.fase?.nrofase === 2) return true;
      if (Array.isArray(evento.fase) && evento.fase[0]?.nrofase === 2) return true;
      
      if (evento.idfase === '2' || evento.fase?.nrofase === '2') return true;
      
      return false;
    });
      console.log('🔍 Primeros 3 eventos:');
      response.data.slice(0, 3).forEach((evt, i) => {
        console.log(`  ${i+1}. "${evt.nombreevento || evt.title}" - facultad_id: ${evt.facultad_id || evt.facultad?.id || 'N/A'}`);
      });

      // ✅ Verifica si TODOS tienen tu facultad_id
      const todosDeMiFacultad = response.data.every(evt => 
        evt.facultad_id === facultadId || evt.facultad?.id === facultadId
      );

      if (!todosDeMiFacultad) {
        console.warn('⚠️ El backend NO está filtrando por facultad_id');
      }
          
    setStats(prev => ({ ...prev, eventsCount: eventosFase2.length }));
    setEvents(eventosFase2);
    
  } catch (err) {
    console.error('❌ Error cargando eventos:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    if (err.response?.status === 400 && err.response?.data?.message?.includes('facultad')) {
      setError('Tu perfil no tiene facultad asignada. Contacta al administrador.');
    } else if (err.response?.status === 404) {
      setError('Endpoint de eventos no encontrado.');
    } else {
      setError('No se pudieron cargar los eventos. Verifica tu conexión.');
    }
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (idUsuario && userData) {
      fetchEventsDirect();
    }
  }, [idUsuario, userData]);

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
      'aprobado': 'Confirmado',
      'publicado': 'Confirmado'
    };
    return statusMap[status.toString().toLowerCase()] || 'Pendiente';
  };

  const getStatusColor = (status) => {
    const normalized = (status || '').toString().toLowerCase();
    
    if (['aprobado', 'approved', 'confirmado', 'publicado', 'completado'].includes(normalized)) {
      return COLORS.success;
    }
    
    const colors = {
      'programado': '#3B82F6',
      'en_curso': '#F59E0B',
      'pendiente': '#F59E0B',
      'cancelado': '#EF4444'
    };
    return colors[normalized] || COLORS.success;
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
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTokenAndRedirect(router);
            } catch (error) {
              console.error('Error during logout:', error);
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

  const renderEvents = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eventos de tu Facultad</Text>
        <TouchableOpacity onPress={() => router.push('/estudiante/eventos/${event.id}')}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      
      {error && !loading && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.accent} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={recargarDatos}  
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
              key={event.id?.toString() || event.idevento?.toString() || Math.random().toString()} 
              event={event} 
              onPress={() => router.push(`/estudiante/eventos/${event.idevento || event.id}`)} 
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
    marginBottom: 10,
  },
  eventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  eventDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalidadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  modalidadText: {
    fontSize: 11,
    color: COLORS.primary,
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