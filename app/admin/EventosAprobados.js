import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const COLORS = {
  primary: '#E95A0C',
  accent: '#4CAF50',
  background: '#FFFFFF',
  surface: '#ffffff',
  success: '#2E7D32',
  warning: '#f39c12',
  info: '#3498db',
  purple: '#9b59b6',
  white: '#fff',
  grayLight: '#ecf0f1',
  grayText: '#64748b',
  darkText: '#1e293b',
  cardShadow: '#000000',
};

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token:", e);
    }
  }
};

const EventosAprobados = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseEventDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return new Date(0); // Fecha inválida (muy antigua)
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      // Validar que sean números reales
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day); // Meses en JS: 0-indexados
      }
    }
    // Si no es DD/MM/YYYY, intentar con Date.parse
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
  };
  const sanitizeEvent = (item, index) => {
  if (!item || typeof item !== 'object') {
    console.warn(`⚠️ Evento inválido en índice ${index}:`, item);
    return null;
  }

  // Si no tiene id, asignar uno temporal
  let eventId = item.id;
  
  if (eventId == null) {
    // Intentar usar idevento como fallback
    eventId = item.idevento;
    if (eventId == null) {
      console.warn(`⚠️ Evento sin id ni idevento en índice ${index}. Asignando ID temporal.`);
      eventId = `temp-${index}-${Date.now()}`;
    }
  }

  // Asegurar que sea string
  const safeId = String(eventId).trim();

  // Validar que no sea vacío o "undefined"
  if (safeId === '' || safeId === 'undefined' || safeId === 'null') {
    console.warn(`⚠️ ID inválido en índice ${index}: '${safeId}'. Asignando fallback.`);
    eventId = `fallback-${index}`;
  }

  return {
    ...item,
    id: String(eventId), // ¡Forzar string!
    // Opcional: eliminar idevento si no lo usas
    // idevento: undefined
  };
};
const getKeyForEvent = (item, index) => {
  if (!item || item.id == null || item.id === undefined || item.id === '') {
    console.warn('Evento sin ID válido en índice', index, ':', item);
    return `fallback-${index}-${Math.random()}`;
  }
  return String(item.id);
};

const fetchApprovedEvents = useCallback(async () => {
  try {
    const token = await getTokenAsync();
    if (!token) {
      Alert.alert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
      router.replace('/LoginAdmin');
      setEvents([]);
      setLoading(false);
      return;
    }

    console.log('🔄 Solicitando eventos aprobados...');
    const response = await axios.get(`${API_BASE_URL}/eventos/aprobados`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    // ✅ LOG: Ver respuesta cruda
    console.log('📥 Respuesta del API:', response.data);

    // ✅ Procesar con sanitizeEvent (tu función ya es robusta)
    const eventsData = Array.isArray(response.data)
      ? response.data
          .map((item, index) => sanitizeEvent(item, index))
          .filter(item => item !== null)
      : [];

    console.log(`✅ Eventos procesados: ${eventsData.length}`);
    eventsData.forEach((e, i) => {
      console.log(`   [${i}] ID: ${e.id} | Title: ${e.title}`);
    });

    setEvents(eventsData);

  } catch (error) {
    console.error('❌ Error al cargar eventos:', error);
    setEvents([]);

    if (error.response?.status === 401 || error.response?.status === 403) {
      await deleteTokenAsync();
      Alert.alert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', [
        { text: 'OK', onPress: () => router.replace('/LoginAdmin') }
      ]);
      return;
    }

    Alert.alert('Error', 'No se pudieron cargar los eventos aprobados.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [router]);

  useEffect(() => {
    fetchApprovedEvents();
  }, [fetchApprovedEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovedEvents();
  }, [fetchApprovedEvents]);

  const handleEventPress = (event) => {
    router.push({
      pathname: '/admin/EventDetailUpdateScreen',
      params: { eventId: event.id }
    });
  };

  const formatSubmittedDate = (date) => {
    const now = new Date();
    const submittedDate = new Date(date);
    const diff = Math.floor((now - submittedDate) / 1000);
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    const days = Math.floor(diff / 86400);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const renderEventItem = ({ item }) => {
    if (!item || typeof item !== 'object') {
    console.warn('Invalid item in events list:', item);
    return null;
  }

  if (typeof item.id === 'undefined') {
    console.warn('Item missing id:', item);
    return null;
  }

     const eventDate = parseEventDate(item.date);
    const isUpcoming = eventDate >= new Date();
    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          isUpcoming && styles.eventCardUpcoming
        ]}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
      >
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.white} />
            <Text style={styles.upcomingText}>Próximo</Text>
          </View>
        )}

        <View style={styles.eventHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>#{item.id}</Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
        </View>

        {item.description && item.description !== 'Sin descripción' && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.detailsGrid}>
          <View style={styles.detailGridItem}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailGridText}>{item.time}</Text>
          </View>
          <View style={styles.detailGridItem}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailGridText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.detailGridItem}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailGridText} numberOfLines={1}>
              {item.organizer}
            </Text>
          </View>
          <View style={styles.detailGridItem}>
            <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailGridText}>{item.attendees}</Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={styles.submissionInfo}>
            <Text style={styles.submittedBy}>{item.submittedBy}</Text>
            <Text style={styles.submittedDate}>{formatSubmittedDate(item.submittedDate)}</Text>
          </View>
        </View>

        <View style={styles.viewDetailsPrompt}>
          <Text style={styles.viewDetailsText}>Ver o actualizar detalles</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.grayText} />
        </View>
        // En el detalle del evento
{item.additionalComments && (
  <View style={styles.detailSection}>
    <Text style={styles.detailLabel}>Comentarios del administrador:</Text>
    <Text style={styles.detailText}>{item.additionalComments}</Text>
  </View>
)}

{item.approvedAt && (
  <View style={styles.detailSection}>
    <Text style={styles.detailLabel}>Fecha de aprobación:</Text>
    <Text style={styles.detailText}>
      {new Date(item.approvedAt).toLocaleString('es-ES')}
    </Text>
  </View>
)}

{item.approvedBy && (
  <View style={styles.detailSection}>
    <Text style={styles.detailLabel}>Aprobado por:</Text>
    <Text style={styles.detailText}>{item.approvedBy}</Text>
  </View>
)}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Cargando eventos aprobados...</Text>
      </View>
    );
  }
 const upcomingCount = events.filter(e => parseEventDate(e.date) >= new Date()).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos Aprobados</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}  >
          <Ionicons name="refresh" size={24} color={refreshing ? COLORS.grayLight : COLORS.white} />
        </TouchableOpacity>
      </View>

      {events.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.warning} />
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
         
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={20} color={COLORS.purple} />
            <Text style={styles.statNumber}>{upcomingCount}
              
            </Text>
            <Text style={styles.statLabel}>Próximos</Text>
          </View>
        </View>
      )}

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.grayText} />
            <Text style={styles.emptyTitle}>Sin eventos aprobados</Text>
            <Text style={styles.emptyText}>No hay eventos aprobados por el momento</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.grayText,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.grayText,
    marginTop: 4,
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 16,
  },
  dateSection: {
    marginBottom: 8,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
    marginLeft: 8,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  eventCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.black,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  eventCardUpcoming: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  upcomingText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkText,
    flex: 1,
  },
  idBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  idText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.grayText,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginBottom: 16,
    gap: 8,
  },
  detailGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '23%',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    borderColor: COLORS.grayLight,
    borderWidth: 1,
    gap: 6,
  },
  detailGridText: {
    fontSize: 13,
    color: COLORS.darkText,
    flex: 1,
    fontWeight: '500',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  categoryContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  submissionInfo: {
    alignItems: 'flex-end',
  },
  submittedBy: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.grayText,
  },
  submittedDate: {
    fontSize: 11,
    color: COLORS.grayText,
    marginTop: 2,
  },
  viewDetailsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  viewDetailsText: {
    fontSize: 12,
    color: COLORS.grayText,
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.grayText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.grayText,
    textAlign: 'center',
  },
});

export default EventosAprobados;