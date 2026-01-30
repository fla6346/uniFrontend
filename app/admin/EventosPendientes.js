import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

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
const TOKEN_KEY = 'adminAuthToken';

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FF7A3D',
  accent: '#4CAF50',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  success: '#2E7D32',
  warning: '#FFA726',
  danger: '#E53935',
  info: '#3498db',
  purple: '#9b59b6',
  blue: '#2196F3',
  white: '#FFFFFF',
  grayLight: '#E0E0E0',
  grayMedium: '#BDBDBD',
  grayText: '#757575',
  darkText: '#212121',
  cardShadow: '#000000',
  border: '#E8E8E8',
  pendingOrange: '#FF9800',
  pendingLight: '#FFF3E0',
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

const formatSubmittedDate = (date) => {
  const now = new Date();
  const submittedDate = new Date(date);
  const diff = Math.floor((now - submittedDate) / 1000);

  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const EventosPendientes = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userprofile, setUserprofile] = useState({
    facultad: null,
    nombre: '',
    email: '',
  });

  const fetchPendingEvents = useCallback(async () => {
    try {
      const token = await getTokenAsync();
      if (!token) {
        Alert.alert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
        router.replace('/LoginAdmin');
        return;
      }

      const responseP = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
      });

      const userProfile = responseP.data;
      setUserprofile({
        facultad: userProfile.facultad,
        nombre: userProfile.nombre,
        email: userProfile.email,
      });

      const response = await axios.get(`${API_BASE_URL}/eventos/pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos pendientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos pendientes.');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        await deleteTokenAsync();
        router.replace('/LoginAdmin');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingEvents();
    }, [fetchPendingEvents])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingEvents();
  }, [fetchPendingEvents]);

  const handleEventPress = (event) => {
    router.push({
      pathname: '/admin/EventDetailScreen',
      params: { eventId: event.id }
    });
  };

  const handleQuickAction = async (eventId, action) => {
    const actionText = action === 'aprobar' ? 'aprobar' : 'rechazar';
    Alert.alert(
      `${action === 'aprobar' ? 'Aprobar' : 'Rechazar'} Evento`,
      `¿Estás seguro de que deseas ${actionText} este evento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: action === 'aprobar' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const token = await getTokenAsync();
              
              await axios.put(`${API_BASE_URL}/eventos/${eventId}/${action}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              // Actualizar la lista
              setEvents(prev => prev.filter(event => event.id !== eventId));

              if (action === 'aprobar') {
                Alert.alert('✓ Evento Aprobado', 'El evento ha sido aprobado exitosamente', [
                  { text: 'Ver eventos aprobados', onPress: () => router.replace('/admin/EventosAceptados') },
                  { text: 'OK', style: 'cancel' }
                ]);
              } else {
                Alert.alert('✓ Evento Rechazado', 'El evento ha sido rechazado');
              }
            } catch (error) {
              console.error('Error al procesar:', error);
              Alert.alert('Error', `No se pudo ${actionText} el evento`);
            }
          }
        }
      ]
    );
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      {/* Header con Badge de Pendiente */}
      <View style={styles.eventHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>#{item.id}</Text>
          </View>
        </View>
        <View style={styles.pendingBadge}>
          <Ionicons name="time" size={14} color={COLORS.white} />
          <Text style={styles.pendingText}>Pendiente</Text>
        </View>
      </View>

      {/* Descripción */}
      {item.description && item.description !== 'Sin descripción' && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Información en dos columnas */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.grayText} />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.grayText} />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.grayText} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.grayText} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.organizer}
          </Text>
        </View>
      </View>

      {/* Área del usuario que envió */}
      {item.area && (
        <View style={styles.areaContainer}>
          <Ionicons name="business-outline" size={14} color={COLORS.primary} />
          <Text style={styles.areaText}>{item.area}</Text>
        </View>
      )}

      {/* Footer con fecha de envío */}
      <View style={styles.footerContainer}>
        <View style={styles.submissionInfo}>
          <Text style={styles.submittedBy}>{item.submittedBy}</Text>
          <Text style={styles.submittedDate}>
            {formatSubmittedDate(item.submittedDate)}
          </Text>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      {/* Botones de Acción */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleEventPress(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color={COLORS.blue} />
          <Text style={[styles.actionButtonText, { color: COLORS.blue }]}>
            Ver Detalles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleQuickAction(item.id, 'rechazar')}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
          <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>
            Rechazar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleQuickAction(item.id, 'aprobar')}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
          <Text style={[styles.actionButtonText, { color: COLORS.white }]}>
            Aprobar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando eventos pendientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Eventos Pendientes</Text>
          <Text style={styles.headerSubtitle}>
            {events.length} {events.length === 1 ? 'evento' : 'eventos'} por revisar
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={COLORS.white}
            style={refreshing && styles.rotating}
          />
        </TouchableOpacity>
      </View>

      {/* Banner de Resumen */}
      {events.length > 0 && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="hourglass-outline" size={24} color={COLORS.pendingOrange} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Revisión Requerida</Text>
            <Text style={styles.summarySubtitle}>
              {events.length} evento{events.length !== 1 ? 's' : ''} esperando aprobación
            </Text>
          </View>
        </View>
      )}

      {/* Lista de Eventos */}
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => `pending-${item.id}`}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={80} color={COLORS.grayMedium} />
            </View>
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>
              No hay eventos pendientes de aprobación
            </Text>
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
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  rotating: {
    transform: [{ rotate: '180deg' }],
  },

  // Summary Banner
  summaryBanner: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pendingOrange,
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
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.pendingLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 13,
    color: COLORS.grayText,
  },

  // Event List
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 16,
  },

  // Event Card
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkText,
    flex: 1,
    marginRight: 8,
  },
  idBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pendingOrange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.grayText,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.grayText,
    fontWeight: '500',
    flex: 1,
  },

  // Area
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    gap: 4,
  },
  areaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submissionInfo: {
    flex: 1,
  },
  submittedBy: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.grayText,
  },
  submittedDate: {
    fontSize: 11,
    color: COLORS.grayMedium,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  rejectButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  approveButton: {
    backgroundColor: COLORS.accent,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.grayText,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default EventosPendientes;