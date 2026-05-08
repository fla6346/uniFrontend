import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibackend1-production.up.railway.app';
const TOKEN_KEY = 'adminAuthToken';

const getToken = async () => {
  if (Platform.OS === 'web') { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
};
const deleteToken = async () => {
  if (Platform.OS === 'web') { try { localStorage.removeItem(TOKEN_KEY); } catch {} }
  else { try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {} }
};

const C = {
  primary: '#E95A0C', primaryLight: '#FFF0E6', primaryShadow: 'rgba(233,90,12,0.2)',
  success: '#10B981', successLight: '#D1FAE5',
  warning: '#F59E0B', warningLight: '#FEF3C7',
  danger: '#EF4444',  dangerLight: '#FEE2E2',
  info: '#3B82F6',    infoLight: '#DBEAFE',
  bg: '#F3F4F6', surface: '#FFFFFF',
  t1: '#111827', t2: '#6B7280', t3: '#9CA3AF',
  border: '#E5E7EB',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stateColor = (s) => ({
  pendiente:  { color: C.warning, bg: C.warningLight },
  aprobado:   { color: C.success, bg: C.successLight },
  rechazado:  { color: C.danger,  bg: C.dangerLight  },
  asignado:   { color: C.info,    bg: C.infoLight    },
})[s?.toLowerCase()] || { color: C.t3, bg: C.bg };

// ─── KPI ──────────────────────────────────────────────────────────────────────
const Kpi = ({ label, value, icon, color, colorLight, sub }) => (
  <View style={[s.kpi, { borderTopColor: color, borderTopWidth: 2 }]}>
    <View style={[s.kpiIcon, { backgroundColor: colorLight }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={s.kpiVal}>{value}</Text>
    <Text style={s.kpiLabel}>{label}</Text>
    {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
  </View>
);

// ─── Solicitud Card (resumen) ─────────────────────────────────────────────────
const SolicitudCard = ({ item, onPress }) => {
  const sc = stateColor(item.estado);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[s.solicCard, { borderLeftColor: sc.color }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 120 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 120 }).start()}
        activeOpacity={1}
      >
        <View style={s.solicTop}>
          <Text style={s.solicTitle} numberOfLines={1}>{item.nombreEvento}</Text>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeText, { color: sc.color }]}>{item.estado}</Text>
          </View>
        </View>
        <Text style={s.solicSub} numberOfLines={1}>{item.solicitante}</Text>
        <View style={s.solicMeta}>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={11} color={C.t3} />
            <Text style={s.metaText}>{item.fechaEvento}</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <Ionicons name="cube-outline" size={11} color={C.t3} />
            <Text style={s.metaText}>{item.totalRecursos} recursos</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <Ionicons name="location-outline" size={11} color={C.t3} />
            <Text style={s.metaText}>{item.lugar || 'Sin especificar'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active, onChange, onLogout }) => {
  const tabs = [
    { id: 'inicio',      icon: 'home-outline',        label: 'Inicio' },
    { id: 'solicitudes', icon: 'clipboard-outline',   label: 'Solicitudes' },
    { id: 'inventario',  icon: 'cube-outline',        label: 'Inventario' },
    { id: 'reportes',    icon: 'bar-chart-outline',   label: 'Reportes' },
  ];
  return (
    <View style={s.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => onChange(t.id)}>
          <Ionicons name={t.icon} size={22} color={active === t.id ? C.primary : C.t3} />
          <Text style={[s.tabLabel, active === t.id && { color: C.primary }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.tabItem} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={22} color={C.t3} />
        <Text style={s.tabLabel}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ nombre, lastUpdated, onRefresh, refreshing }) => {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  return (
    <View style={s.header}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>{greeting},</Text>
          <Text style={s.hName}>{nombre}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={onRefresh} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Ionicons name="refresh-outline" size={20} color={C.t2} />}
        </TouchableOpacity>
      </View>
      <Text style={s.hTitle}>Gestión DAF</Text>
      <Text style={s.hSub}>Servicios para eventos</Text>
      {lastUpdated && (
        <Text style={s.hUpdated}>
          Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
};

const Section = ({ label, action, onAction, children }) => (
  <View style={s.section}>
    <View style={s.secHead}>
      <Text style={s.secLabel}>{label}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={s.secAction}>{action}</Text></TouchableOpacity>}
    </View>
    {children}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DafServicios() {
  const params = useLocalSearchParams();
  const nombre = params.nombre || 'Admin DAF';
  const router = useRouter();

  const [activeTab, setActiveTab]     = useState('inicio');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats]             = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0, itemsBajoStock: 0 });
  const [solicitudes, setSolicitudes] = useState([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert('Error', 'Inicia sesión nuevamente'); return; }

      const [solRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/daf/solicitudes`, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }),
      ]);

      const sol = Array.isArray(solRes.data) ? solRes.data : [];
      setSolicitudes(sol.map(e => ({
        id: e.idevento,
        nombreEvento: e.nombreevento || 'Sin título',
        solicitante: e.academicoCreador
          ? `${e.academicoCreador.nombre || ''} ${e.academicoCreador.apellidopat || ''}`.trim()
          : 'Desconocido',
        fechaEvento: e.fechaevento
          ? new Date(e.fechaevento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : 'N/A',
        estado: e.estadoDAF || 'Pendiente',
        totalRecursos: e.recursos?.length || 0,
        lugar: e.lugar,
        recursos: e.recursos || [],
      })));

      setStats({
        pendientes:     sol.filter(e => (e.estadoDAF || '').toLowerCase() === 'pendiente').length,
        aprobadas:      sol.filter(e => (e.estadoDAF || '').toLowerCase() === 'aprobado').length,
        rechazadas:     sol.filter(e => (e.estadoDAF || '').toLowerCase() === 'rechazado').length,
        itemsBajoStock: 0, // se calcula en inventario
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) { await deleteToken(); router.replace('/'); }
      else Alert.alert('Error de conexión', 'No se pudieron cargar los datos.', [
        { text: 'Reintentar', onPress: () => fetchData() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTab = (id) => {
    if (id === 'solicitudes') router.push('/admin/daf/Solicitudes');
    else if (id === 'inventario') router.push('/admin/daf/Inventario');
    else if (id === 'reportes') router.push('/admin/daf/Reportes');
    else setActiveTab(id);
  };

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Desea cerrar la sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await deleteToken(); router.replace('/'); } },
    ]);

  const pendientes = solicitudes.filter(s => s.estado.toLowerCase() === 'pendiente');

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <Header nombre={nombre} lastUpdated={lastUpdated} onRefresh={() => fetchData(true)} refreshing={refreshing} />

        {/* KPIs */}
        <Section label="Resumen">
          {loading ? (
            <View style={s.loadingBox}><ActivityIndicator color={C.primary} /><Text style={s.loadingText}>Cargando…</Text></View>
          ) : (
            <View style={s.kpiGrid}>
              <Kpi label="Pendientes"  value={stats.pendientes}  icon="time-outline"             color={C.warning} colorLight={C.warningLight} sub="Esperando revisión" />
              <Kpi label="Aprobadas"   value={stats.aprobadas}   icon="checkmark-circle-outline" color={C.success} colorLight={C.successLight} sub="Recursos asignados" />
              <Kpi label="Rechazadas"  value={stats.rechazadas}  icon="close-circle-outline"     color={C.danger}  colorLight={C.dangerLight}  sub="Este período" />
              <Kpi label="Bajo stock"  value={stats.itemsBajoStock} icon="alert-circle-outline"  color={C.primary} colorLight={C.primaryLight} sub="Ver inventario" />
            </View>
          )}
        </Section>

        {/* Solicitudes pendientes */}
        <Section label="Solicitudes pendientes" action={pendientes.length > 3 ? 'Ver todas' : null} onAction={() => router.push('/admin/daf/Solicitudes')}>
          {loading ? (
            <View style={s.loadingBox}><ActivityIndicator size="small" color={C.primary} /></View>
          ) : pendientes.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={36} color={C.success} />
              <Text style={s.emptyText}>Sin solicitudes pendientes</Text>
            </View>
          ) : (
            pendientes.slice(0, 3).map(item => (
              <SolicitudCard
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: '/admin/daf/DetalleSolicitud', params: { id: item.id.toString() } })}
              />
            ))
          )}
        </Section>

        {/* Accesos rápidos */}
        <Section label="Gestión">
          {[
            { title: 'Solicitudes de recursos', desc: 'Ver y gestionar todas las solicitudes', icon: 'clipboard-outline', color: C.primary,  colorLight: C.primaryLight, route: '/admin/daf/Solicitudes' },
            { title: 'Inventario',              desc: 'Stock de sillas, mesas, vajilla y más', icon: 'cube-outline',      color: C.info,     colorLight: C.infoLight,    route: '/admin/daf/Inventario' },
            { title: 'Reportes de uso',         desc: 'Estadísticas y uso de recursos',        icon: 'bar-chart-outline', color: C.success,  colorLight: C.successLight, route: '/admin/daf/Reportes' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={s.actionCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: a.colorLight }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>{a.title}</Text>
                <Text style={s.actionDesc}>{a.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.t3} />
            </TouchableOpacity>
          ))}
        </Section>
      </ScrollView>

      <TabBar active={activeTab} onChange={handleTab} onLogout={handleLogout} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  header: {
    backgroundColor: C.surface, paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 40) + 12, paddingBottom: 16,
    borderBottomWidth: 0.5, borderColor: C.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontSize: 13, color: C.t2, marginBottom: 1 },
  hName: { fontSize: 18, fontWeight: '700', color: C.t1 },
  hTitle: { fontSize: 26, fontWeight: '800', color: C.t1 },
  hSub: { fontSize: 13, color: C.primary, fontWeight: '600', marginTop: 1 },
  hUpdated: { fontSize: 11, color: C.t3, marginTop: 4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg,
    borderWidth: 0.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center',
  },

  section: { paddingHorizontal: 18, marginTop: 24 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secLabel: { fontSize: 11, fontWeight: '600', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.8 },
  secAction: { fontSize: 13, color: C.primary, fontWeight: '600' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, width: '48%',
    borderWidth: 0.5, borderColor: C.border,
  },
  kpiIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  kpiVal: { fontSize: 26, fontWeight: '800', color: C.t1, marginBottom: 2 },
  kpiLabel: { fontSize: 12, color: C.t2, fontWeight: '500' },
  kpiSub: { fontSize: 11, color: C.t3, marginTop: 4 },

  solicCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 3,
  },
  solicTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  solicTitle: { fontSize: 14, fontWeight: '700', color: C.t1, flex: 1 },
  solicSub: { fontSize: 12, color: C.t2, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  solicMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: C.t2 },
  metaDivider: { width: 1, height: 10, backgroundColor: C.border },

  actionCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: C.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 14, fontWeight: '700', color: C.t1, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: C.t2 },

  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 68,
    backgroundColor: C.surface, borderTopWidth: 0.5, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 10, color: C.t3, marginTop: 3 },

  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { fontSize: 13, color: C.t2 },
  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: C.t2 },
});