import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Pressable, Animated,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibackend1-production.up.railway.app';
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
  }
};

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFF0E6',
  primaryShadow: 'rgba(233,90,12,0.25)',
  secondary: '#4B5563',
  accent: '#EF4444',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, color, colorLight, trend, trendLabel }) => (
  <View style={[styles.kpiCard, { borderTopColor: color, borderTopWidth: 2 }]}>
    <View style={[styles.kpiIconWrap, { backgroundColor: colorLight }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
    {trendLabel ? (
      <View style={styles.kpiTrendRow}>
        <Ionicons
          name={trend === 'up' ? 'trending-up-outline' : trend === 'down' ? 'trending-down-outline' : 'remove-outline'}
          size={12}
          color={trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.danger : COLORS.textTertiary}
        />
        <Text style={[styles.kpiTrendText, {
          color: trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.danger : COLORS.textTertiary
        }]}>{trendLabel}</Text>
      </View>
    ) : null}
  </View>
);

// ─── Action Card ──────────────────────────────────────────────────────────────
const ActionCard = ({ action, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300,
      delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 120 }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 120 }).start()}
    >
      <Animated.View style={[styles.actionCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <View style={[styles.actionIcon, { backgroundColor: action.colorLight || action.color + '18' }]}>
          <Ionicons name={action.iconName} size={22} color={action.color} />
        </View>
        <View style={styles.actionContent}>
          <View style={styles.actionTitleRow}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            {action.badge && (
              <View style={[styles.actionBadge, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={[styles.actionBadgeText, { color: COLORS.danger }]}>{action.badge}</Text>
              </View>
            )}
          </View>
          {action.description && <Text style={styles.actionDesc}>{action.description}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </Animated.View>
    </Pressable>
  );
};

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, onPrint }) => {
  const approved = event.state === 'Aprobado';
  const accentColor = approved ? COLORS.success : COLORS.warning;
  const bgColor     = approved ? COLORS.successLight : COLORS.warningLight;

  return (
    <View style={[styles.eventCard, { borderLeftColor: accentColor }]}>
      <View style={styles.eventCardTop}>
        <View style={[styles.stateBadge, { backgroundColor: bgColor }]}>
          <View style={[styles.stateDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.stateBadgeText, { color: accentColor }]}>
            {approved ? 'Aprobado' : 'Pendiente'}
          </Text>
        </View>
        {approved && (
          <TouchableOpacity style={styles.printBtn} onPress={() => onPrint(event.id)}>
            <Ionicons name="print-outline" size={12} color={COLORS.primary} />
            <Text style={styles.printBtnText}>Imprimir</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.eventCardTitle}>{event.title}</Text>

      <View style={styles.eventMeta}>
        <View style={styles.eventMetaItem}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.eventMetaText}>{event.date}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.eventMetaItem}>
          <Ionicons name="time-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.eventMetaText}>{event.time}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.eventMetaItem}>
          <Ionicons name="person-outline" size={12} color={COLORS.textTertiary} />
          <Text style={[
            styles.eventMetaText,
            event.creator === 'Desconocido' && { fontStyle: 'italic', color: COLORS.textTertiary },
          ]}>{event.creator}</Text>
        </View>
      </View>

      <Text style={styles.eventId}>ID #{event.id}</Text>
    </View>
  );
};

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ onNavigate, onLogout }) => {
  const tabs = [
    { id: 'usuarios',  icon: 'people-outline',         label: 'Usuarios', route: '/admin/UsuariosDaf' },
    { id: 'aprobados', icon: 'checkmark-circle-outline', label: 'Aprobados', route: '/admin/EventosAprobados' },
    { id: 'home',      icon: null,                     label: '',          route: null }, // central FAB
    { id: 'stats',     icon: 'analytics-outline',      label: 'Análisis',  route: '/admin/Estadistica' },
    { id: 'settings',  icon: 'settings-outline',       label: 'Ajustes',   route: '/admin/Settings' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        if (tab.id === 'home') {
          return (
            <TouchableOpacity key={tab.id} style={styles.fabBtn} onPress={onLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => onNavigate(tab.route)}>
            <Ionicons name={tab.icon} size={22} color={COLORS.textTertiary} />
            <Text style={styles.tabLabel}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ nombreUsuario, unreadCount, onNotificationPress, lastUpdated, onRefresh, refreshing }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerGreeting}>{greeting},</Text>
          <Text style={styles.headerName}>{nombreUsuario}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="refresh-outline" size={20} color={COLORS.textSecondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.headerTitle}>Panel DAF</Text>
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Actualizado a las {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {children}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const Daf = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador DAF';
  const router = useRouter();

  const [notifications, setNotifications]         = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingDashboard, setLoadingDashboard]   = useState(true);
  const [loadingEvents, setLoadingEvents]         = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [lastUpdated, setLastUpdated]             = useState(null);
  const [allEvents, setAllEvents]                 = useState([]);

  const [dashboardStats, setDashboardStats] = useState([
    { title: 'Usuarios activos',     value: '–', icon: 'people-outline',        color: COLORS.primary,  colorLight: COLORS.primaryLight, trend: null, trendLabel: null },
    { title: 'Eventos totales',      value: '–', icon: 'calendar-outline',      color: COLORS.info,     colorLight: COLORS.infoLight,    trend: null, trendLabel: null },
    { title: 'Pendientes',           value: '–', icon: 'document-text-outline', color: COLORS.warning,  colorLight: COLORS.warningLight, trend: null, trendLabel: null },
    { title: 'Estabilidad',          value: '–', icon: 'pulse-outline',         color: COLORS.success,  colorLight: COLORS.successLight, trend: null, trendLabel: null },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoadingDashboard(true); setLoadingEvents(true); }

    try {
      const token = await getTokenAsync();
      if (!token) { Alert.alert('Error', 'Por favor, inicia sesión nuevamente'); return; }

      const [dashRes, eventsRes, notifsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }),
        axios.get(`${API_BASE_URL}/eventos`,          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }),
        axios.get(`${API_BASE_URL}/notificaciones`,   { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }).catch(() => ({ data: [] })),
      ]);

      const data = dashRes.data;

      setDashboardStats([
        { title: 'Usuarios activos', value: (data.activeUsers || 0).toLocaleString(),      icon: 'people-outline',        color: COLORS.primary,  colorLight: COLORS.primaryLight, trend: 'up',      trendLabel: 'Cuentas habilitadas' },
        { title: 'Eventos totales',  value: (data.totalEvents || 0).toString(),             icon: 'calendar-outline',      color: COLORS.info,     colorLight: COLORS.infoLight,    trend: 'neutral', trendLabel: 'Todos los eventos' },
        { title: 'Pendientes',       value: (data.estadoCounts?.pendiente || 0).toString(), icon: 'document-text-outline', color: COLORS.warning,  colorLight: COLORS.warningLight, trend: 'down',    trendLabel: 'Esperando revisión' },
        { title: 'Estabilidad',      value: `${data.systemStability || 0}%`,               icon: 'pulse-outline',         color: COLORS.success,  colorLight: COLORS.successLight, trend: 'up',      trendLabel: 'Rendimiento óptimo' },
      ]);

      const events = (Array.isArray(eventsRes.data) ? eventsRes.data : [])
        .filter(e => e.idfase === 2)
        .map(e => ({
          id: e.idevento,
          title: e.nombreevento || 'Sin título',
          date: e.fechaevento
            ? new Date(e.fechaevento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A',
          time: e.horaevento ? e.horaevento.substring(0, 5) : 'N/A',
          state: e.estado?.toLowerCase().includes('aprobado') ? 'Aprobado' : 'Pendiente',
          creator: e.academicoCreador
            ? `${e.academicoCreador.nombre || ''} ${e.academicoCreador.apellidopat || ''}`.trim()
            : 'Desconocido',
        }));

      setAllEvents(events);
      setNotifications(Array.isArray(notifsRes.data) ? notifsRes.data : []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetchData:', error);
      if (error.response?.status === 401) { await deleteTokenAsync(); router.replace('/'); }
      else Alert.alert('Error de conexión', 'No se pudieron cargar los datos.', [
        { text: 'Reintentar', onPress: () => fetchData() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setLoadingDashboard(false);
      setLoadingEvents(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAsRead = async (id) => {
    try {
      const token = await getTokenAsync();
      await axios.put(`${API_BASE_URL}/notificaciones/${id}/leer`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.read).map(n => markAsRead(n.id)));
  };

  const handlePrint = (eventoId) => {
    router.push({ pathname: '/admin/EventoDetalleImp', params: { eventId: eventoId.toString() } });
  };

  const handleNavigate = (route) => {
    if (route) router.push(route);
    else Alert.alert('En desarrollo', 'Esta función estará disponible próximamente.');
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Está seguro que desea cerrar la sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await deleteTokenAsync(); router.replace('/'); } },
    ], { cancelable: true });
  };

  const adminActions = [
    { id: '1', title: 'Gestión de usuarios',   iconName: 'people-outline',        route: '/admin/UsuariosDaf',  color: COLORS.secondary, colorLight: '#F3F4F6',           description: 'Administración de cuentas' },
    { id: '4', title: 'Análisis de datos',      iconName: 'analytics-outline',     route: '/admin/Estadistica',  color: COLORS.info,      colorLight: COLORS.infoLight,    description: 'Informes y métricas del sistema' },
    { id: '5', title: 'Reportes avanzados',     iconName: 'document-text-outline', route: '/admin/reportes',     color: COLORS.danger,    colorLight: COLORS.dangerLight,  description: 'Generación de reportes detallados', badge: 'Nuevo' },
    { id: '6', title: 'Creación de recursos',   iconName: 'construct-outline',     route: '/admin/Recursos',     color: COLORS.warning,   colorLight: COLORS.warningLight, description: 'Gestión de recursos del sistema',   badge: 'Nuevo' },
    { id: '7', title: 'Subida de layouts',      iconName: 'images-outline',        route: '/admin/Layouts',      color: COLORS.info,      colorLight: COLORS.infoLight,    description: 'Administración de plantillas',       badge: 'Nuevo' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          nombreUsuario={nombreUsuario}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
          lastUpdated={lastUpdated}
          onRefresh={() => fetchData(true)}
          refreshing={refreshing}
        />

        {/* KPIs */}
        <Section label="Resumen de actividad">
          {loadingDashboard ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando estadísticas…</Text>
            </View>
          ) : (
            <View style={styles.kpiGrid}>
              {dashboardStats.map((s, i) => <KpiCard key={i} {...s} />)}
            </View>
          )}
        </Section>

        {/* Eventos fase 2 */}
        <Section label="Eventos en fase 2">
          {loadingEvents ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando eventos…</Text>
            </View>
          ) : allEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No hay eventos disponibles</Text>
            </View>
          ) : (
            <>
              <View style={styles.eventsBar}>
                <View style={styles.eventsBarBadge}>
                  <Text style={styles.eventsBarBadgeText}>{allEvents.length} eventos</Text>
                </View>
                <Text style={styles.eventsBarSub}>
                  {allEvents.filter(e => e.state === 'Aprobado').length} aprobados ·{' '}
                  {allEvents.filter(e => e.state !== 'Aprobado').length} pendientes
                </Text>
              </View>
              {allEvents.map(ev => (
                <EventCard key={ev.id} event={ev} onPrint={handlePrint} />
              ))}
            </>
          )}
        </Section>

        {/* Herramientas */}
        <Section label="Herramientas de gestión">
          {adminActions.map((action, i) => (
            <ActionCard
              key={action.id}
              action={action}
              onPress={() => handleNavigate(action.route)}
              index={i}
            />
          ))}
        </Section>
      </ScrollView>

      {/* Notificaciones */}
      {showNotifications && (
        <View style={styles.overlay}>
          <View style={styles.notifModal}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>
                Notificaciones
                {unreadCount > 0 && <Text style={{ color: COLORS.primary }}> ({unreadCount})</Text>}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllText}>Marcar todas</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close-outline" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="notifications-off-outline" size={36} color={COLORS.textTertiary} />
                <Text style={styles.notifEmptyText}>Sin notificaciones nuevas</Text>
              </View>
            ) : (
              <ScrollView>
                {notifications.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifItem, { backgroundColor: notif.read ? COLORS.surface : COLORS.primaryLight }]}
                    onPress={async () => {
                      if (!notif.read) await markAsRead(notif.id);
                      if (notif.idEvento) router.push(`/admin/evento/${notif.idEvento}`);
                      setShowNotifications(false);
                    }}
                  >
                    <View style={[styles.notifDot, { backgroundColor: notif.read ? COLORS.border : COLORS.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifMsg, { fontWeight: notif.read ? '400' : '600' }]}>{notif.mensaje}</Text>
                      <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</Text>
                    </View>
                    {!notif.read && (
                      <TouchableOpacity onPress={() => markAsRead(notif.id)} style={{ padding: 4 }}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Tab Bar */}
      <TabBar onNavigate={handleNavigate} onLogout={handleLogout} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 90 },

  // Header
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 40) + 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerGreeting: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 1 },
  headerName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 0.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  lastUpdated: { fontSize: 11, color: COLORS.textTertiary, marginTop: 4 },
  notifBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: 18, marginTop: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  // KPIs
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    width: '48%',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  kpiIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  kpiTitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  kpiTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  kpiTrendText: { fontSize: 11 },

  // Events bar
  eventsBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eventsBarBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  eventsBarBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  eventsBarSub: { fontSize: 12, color: COLORS.textSecondary },

  // Event cards
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
  },
  eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  stateBadgeText: { fontSize: 11, fontWeight: '700' },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.primary,
  },
  printBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  eventCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, lineHeight: 20 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eventMetaText: { fontSize: 11, color: COLORS.textSecondary },
  metaDivider: { width: 1, height: 10, backgroundColor: COLORS.border },
  eventId: { fontSize: 10, color: COLORS.textTertiary, marginTop: 6 },

  emptyBox: { alignItems: 'center', paddingVertical: 36 },
  emptyText: { marginTop: 8, fontSize: 13, color: COLORS.textTertiary },

  // Action cards
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  actionContent: { flex: 1 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  actionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  actionBadgeText: { fontSize: 10, fontWeight: '700' },
  actionDesc: { fontSize: 12, color: COLORS.textSecondary },

  // Tab bar
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 10, color: COLORS.textTertiary, marginTop: 3 },
  fabBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },

  // Notifications modal
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: (StatusBar.currentHeight || 0) + 10,
    zIndex: 1000,
  },
  notifModal: {
    backgroundColor: COLORS.white, marginHorizontal: 14,
    borderRadius: 18, maxHeight: '72%', overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  notifTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  notifEmpty: { alignItems: 'center', paddingVertical: 36 },
  notifEmptyText: { marginTop: 10, fontSize: 13, color: COLORS.textSecondary },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 0.5, borderColor: COLORS.border, gap: 10,
  },
  notifDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  notifMsg: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 2, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.textTertiary },

  // Loading
  loadingBox: { alignItems: 'center', paddingVertical: 36 },
  loadingText: { marginTop: 10, fontSize: 13, color: COLORS.textSecondary },
});

export default Daf;