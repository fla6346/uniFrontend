import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, TextInput, Modal,
  Platform, KeyboardAvoidingView, Animated,
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

const C = {
  primary: '#E95A0C', primaryLight: '#FFF0E6',
  success: '#10B981', successLight: '#D1FAE5',
  warning: '#F59E0B', warningLight: '#FEF3C7',
  danger: '#EF4444',  dangerLight: '#FEE2E2',
  info: '#3B82F6',    infoLight: '#DBEAFE',
  bg: '#F3F4F6', surface: '#FFFFFF',
  t1: '#111827', t2: '#6B7280', t3: '#9CA3AF', border: '#E5E7EB',
};

const stateColor = (s) => ({
  pendiente: { color: C.warning, bg: C.warningLight },
  aprobado:  { color: C.success, bg: C.successLight },
  rechazado: { color: C.danger,  bg: C.dangerLight  },
  asignado:  { color: C.info,    bg: C.infoLight    },
})[s?.toLowerCase()] || { color: C.t3, bg: C.bg };

const FILTROS = ['Todos', 'Pendiente', 'Aprobado', 'Rechazado'];

// ─── Chip filtro ──────────────────────────────────────────────────────────────
const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
    onPress={onPress}
  >
    <Text style={[s.chipText, active && { color: C.surface }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Recurso row dentro del modal ─────────────────────────────────────────────
const RecursoRow = ({ recurso, onChangeAprobado }) => {
  const [val, setVal] = useState(recurso.cantidadAprobada?.toString() ?? recurso.cantidadSolicitada?.toString() ?? '0');

  const handleChange = (t) => {
    const n = parseInt(t, 10);
    if (!isNaN(n) && n >= 0 && n <= recurso.cantidadSolicitada) {
      setVal(t);
      onChangeAprobado(recurso.id, n);
    } else if (t === '') {
      setVal('');
      onChangeAprobado(recurso.id, 0);
    }
  };

  return (
    <View style={s.recursoRow}>
      <View style={s.recursoInfo}>
        <Text style={s.recursoNombre}>{recurso.nombre}</Text>
        <Text style={s.recursoSolicitado}>Solicitado: {recurso.cantidadSolicitada}</Text>
      </View>
      <View style={s.recursoInput}>
        <Text style={s.recursoInputLabel}>Aprobar</Text>
        <TextInput
          style={s.input}
          keyboardType="numeric"
          value={val}
          onChangeText={handleChange}
          maxLength={4}
        />
      </View>
    </View>
  );
};

// ─── Modal de detalle/aprobación ──────────────────────────────────────────────
const DetalleSolicitudModal = ({ visible, solicitud, onClose, onSubmit, submitting }) => {
  const [recursos, setRecursos] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (solicitud) {
      setRecursos(solicitud.recursos.map(r => ({ ...r, cantidadAprobada: r.cantidadSolicitada })));
      setObservaciones('');
    }
  }, [solicitud]);

  const handleChangeAprobado = (id, val) => {
    setRecursos(prev => prev.map(r => r.id === id ? { ...r, cantidadAprobada: val } : r));
  };

  const handleAprobar = () => {
    onSubmit({ solicitudId: solicitud.id, accion: 'aprobar', recursos, observaciones });
  };

  const handleRechazar = () => {
    if (!observaciones.trim()) {
      Alert.alert('Observaciones requeridas', 'Por favor indica el motivo del rechazo.');
      return;
    }
    Alert.alert('Confirmar rechazo', '¿Está seguro de rechazar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: () => onSubmit({ solicitudId: solicitud.id, accion: 'rechazar', recursos, observaciones }) },
    ]);
  };

  if (!solicitud) return null;
  const sc = stateColor(solicitud.estado);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalContainer}>
          {/* Header modal */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={onClose} style={s.modalClose}>
              <Ionicons name="close" size={22} color={C.t2} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Detalle de solicitud</Text>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeText, { color: sc.color }]}>{solicitud.estado}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Info evento */}
            <View style={s.modalCard}>
              <Text style={s.modalEventTitle}>{solicitud.nombreEvento}</Text>
              <Text style={s.modalSolicitante}>{solicitud.solicitante}</Text>
              <View style={s.modalMetaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={C.t3} />
                  <Text style={s.metaText}>{solicitud.fechaEvento}</Text>
                </View>
                <View style={s.metaDivider} />
                <View style={s.metaItem}>
                  <Ionicons name="time-outline" size={13} color={C.t3} />
                  <Text style={s.metaText}>{solicitud.horaEvento}</Text>
                </View>
                {solicitud.lugar ? <>
                  <View style={s.metaDivider} />
                  <View style={s.metaItem}>
                    <Ionicons name="location-outline" size={13} color={C.t3} />
                    <Text style={s.metaText}>{solicitud.lugar}</Text>
                  </View>
                </> : null}
              </View>
              {solicitud.descripcion ? (
                <Text style={s.modalDesc}>{solicitud.descripcion}</Text>
              ) : null}
            </View>

            {/* Recursos */}
            <View style={[s.modalCard, { marginTop: 12 }]}>
              <Text style={s.modalSecLabel}>Recursos solicitados</Text>
              <Text style={s.modalSecSub}>Ajusta las cantidades aprobadas según disponibilidad</Text>
              {recursos.length === 0 ? (
                <Text style={s.emptyText}>Sin recursos registrados</Text>
              ) : (
                recursos.map(r => (
                  <RecursoRow
                    key={r.id}
                    recurso={r}
                    onChangeAprobado={handleChangeAprobado}
                  />
                ))
              )}
            </View>

            {/* Observaciones */}
            <View style={[s.modalCard, { marginTop: 12 }]}>
              <Text style={s.modalSecLabel}>Observaciones</Text>
              <TextInput
                style={s.obsInput}
                multiline
                numberOfLines={3}
                placeholder="Agrega notas o el motivo de rechazo…"
                placeholderTextColor={C.t3}
                value={observaciones}
                onChangeText={setObservaciones}
              />
            </View>
          </ScrollView>

          {/* Botones acción */}
          {solicitud.estado.toLowerCase() === 'pendiente' && (
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.btn, s.btnReject]} onPress={handleRechazar} disabled={submitting}>
                <Ionicons name="close-circle-outline" size={18} color={C.danger} />
                <Text style={[s.btnText, { color: C.danger }]}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnApprove]} onPress={handleAprobar} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator size="small" color={C.surface} />
                  : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={C.surface} />
                    <Text style={[s.btnText, { color: C.surface }]}>Aprobar</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Solicitudes() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [solicitudes, setSolicitudes]   = useState([]);
  const [filtro, setFiltro]             = useState('Todos');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/daf/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setSolicitudes(data.map(e => ({
        id: e.idevento,
        nombreEvento: e.nombreevento || 'Sin título',
        solicitante: e.academicoCreador
          ? `${e.academicoCreador.nombre || ''} ${e.academicoCreador.apellidopat || ''}`.trim()
          : 'Desconocido',
        fechaEvento: e.fechaevento
          ? new Date(e.fechaevento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : 'N/A',
        horaEvento: e.horaevento ? e.horaevento.substring(0, 5) : 'N/A',
        estado: e.estadoDAF || 'Pendiente',
        lugar: e.lugar || '',
        descripcion: e.descripcion || '',
        totalRecursos: e.recursos?.length || 0,
        recursos: (e.recursos || []).map(r => ({
          id: r.idrecurso,
          nombre: r.nombre || r.tipoRecurso || 'Recurso',
          cantidadSolicitada: r.cantidadSolicitada || r.cantidad || 0,
          cantidadAprobada: r.cantidadAprobada ?? null,
        })),
      })));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleOpenDetalle = (item) => {
    setSelected(item);
    setModalVisible(true);
  };

  const handleSubmit = async ({ solicitudId, accion, recursos, observaciones }) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE_URL}/daf/solicitudes/${solicitudId}/${accion}`,
        { recursos: recursos.map(r => ({ id: r.id, cantidadAprobada: r.cantidadAprobada })), observaciones },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 },
      );
      Alert.alert('Éxito', accion === 'aprobar' ? 'Solicitud aprobada correctamente.' : 'Solicitud rechazada.');
      setModalVisible(false);
      fetchSolicitudes();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', `No se pudo ${accion === 'aprobar' ? 'aprobar' : 'rechazar'} la solicitud.`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = solicitudes.filter(sol => {
    const matchFiltro = filtro === 'Todos' || sol.estado.toLowerCase() === filtro.toLowerCase();
    const matchSearch = !search || sol.nombreEvento.toLowerCase().includes(search.toLowerCase()) || sol.solicitante.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.hTitle}>Solicitudes</Text>
          <Text style={s.hSub}>{solicitudes.length} solicitudes en total</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.t3} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar evento o solicitante…"
          placeholderTextColor={C.t3}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.t3} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {FILTROS.map(f => <Chip key={f} label={f} active={filtro === f} onPress={() => setFiltro(f)} />)}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={s.loadingBox}><ActivityIndicator color={C.primary} /><Text style={s.loadingText}>Cargando solicitudes…</Text></View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="clipboard-outline" size={40} color={C.t3} />
          <Text style={s.emptyTitle}>Sin solicitudes</Text>
          <Text style={s.emptyText}>No hay solicitudes para el filtro seleccionado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {filtered.map(item => {
            const sc = stateColor(item.estado);
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.solicCard, { borderLeftColor: sc.color }]}
                onPress={() => handleOpenDetalle(item)}
                activeOpacity={0.85}
              >
                <View style={s.solicTop}>
                  <Text style={s.solicTitle} numberOfLines={1}>{item.nombreEvento}</Text>
                  <View style={[s.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[s.badgeText, { color: sc.color }]}>{item.estado}</Text>
                  </View>
                </View>
                <Text style={s.solicSub}>{item.solicitante}</Text>
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
                  {item.lugar ? <>
                    <View style={s.metaDivider} />
                    <View style={s.metaItem}>
                      <Ionicons name="location-outline" size={11} color={C.t3} />
                      <Text style={s.metaText}>{item.lugar}</Text>
                    </View>
                  </> : null}
                </View>
                {item.estado.toLowerCase() === 'pendiente' && (
                  <View style={s.actionHint}>
                    <Ionicons name="finger-print-outline" size={12} color={C.primary} />
                    <Text style={s.actionHintText}>Toca para revisar y aprobar</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <DetalleSolicitudModal
        visible={modalVisible}
        solicitud={selected}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: (StatusBar.currentHeight || 40) + 12, paddingBottom: 14,
    borderBottomWidth: 0.5, borderColor: C.border, gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  hTitle: { fontSize: 20, fontWeight: '800', color: C.t1 },
  hSub: { fontSize: 12, color: C.t2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.t1, padding: 0 },

  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.surface,
  },
  chipText: { fontSize: 13, color: C.t2, fontWeight: '500' },

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
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  actionHintText: { fontSize: 11, color: C.primary, fontWeight: '500' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: C.t2 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.t1 },
  emptyText: { fontSize: 13, color: C.t2, textAlign: 'center' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: 14, borderBottomWidth: 0.5, borderColor: C.border,
  },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.t1 },
  modalCard: { backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.border },
  modalEventTitle: { fontSize: 18, fontWeight: '800', color: C.t1, marginBottom: 4 },
  modalSolicitante: { fontSize: 13, color: C.t2, marginBottom: 10 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  modalDesc: { fontSize: 13, color: C.t2, marginTop: 8, lineHeight: 18 },
  modalSecLabel: { fontSize: 12, fontWeight: '700', color: C.t1, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  modalSecSub: { fontSize: 12, color: C.t3, marginBottom: 14 },

  recursoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5, borderColor: C.border,
  },
  recursoInfo: { flex: 1, paddingRight: 12 },
  recursoNombre: { fontSize: 14, fontWeight: '600', color: C.t1 },
  recursoSolicitado: { fontSize: 12, color: C.t3, marginTop: 2 },
  recursoInput: { alignItems: 'center', gap: 4 },
  recursoInputLabel: { fontSize: 10, color: C.t3, fontWeight: '500', textTransform: 'uppercase' },
  input: {
    width: 60, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 6, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.t1,
    backgroundColor: C.bg,
  },
  obsInput: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 12,
    fontSize: 14, color: C.t1, minHeight: 80, textAlignVertical: 'top',
    backgroundColor: C.bg,
  },

  modalActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: C.surface, borderTopWidth: 0.5, borderColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  btnReject: { backgroundColor: C.dangerLight, borderColor: C.danger },
  btnApprove: { backgroundColor: C.primary, borderColor: C.primary },
  btnText: { fontSize: 15, fontWeight: '700' },
});