import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, TextInput, Modal,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
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

const CATEGORIAS = ['Todos', 'Mobiliario', 'Vajilla', 'Electrónica', 'Decoración', 'Otros'];

const stockColor = (disponible, total) => {
  if (total === 0) return { color: C.t3, bg: C.bg, label: 'Sin datos' };
  const pct = disponible / total;
  if (pct >= 0.5) return { color: C.success, bg: C.successLight, label: 'Disponible' };
  if (pct > 0)    return { color: C.warning, bg: C.warningLight, label: 'Bajo stock' };
  return            { color: C.danger,  bg: C.dangerLight,  label: 'Agotado' };
};

// ─── Barra de stock ───────────────────────────────────────────────────────────
const StockBar = ({ disponible, total }) => {
  const pct = total > 0 ? Math.min(disponible / total, 1) : 0;
  const sc = stockColor(disponible, total);
  return (
    <View style={st.barWrap}>
      <View style={st.barBg}>
        <View style={[st.barFill, { width: `${pct * 100}%`, backgroundColor: sc.color }]} />
      </View>
      <Text style={[st.barLabel, { color: sc.color }]}>{disponible}/{total}</Text>
    </View>
  );
};

// ─── Modal editar/agregar recurso ─────────────────────────────────────────────
const RecursoModal = ({ visible, recurso, onClose, onSave, saving }) => {
  const isEdit = !!recurso?.id;
  const [nombre, setNombre]       = useState('');
  const [categoria, setCategoria] = useState('Mobiliario');
  const [total, setTotal]         = useState('');
  const [disponible, setDisp]     = useState('');
  const [descripcion, setDesc]    = useState('');

  useEffect(() => {
    if (recurso) {
      setNombre(recurso.nombre || '');
      setCategoria(recurso.categoria || 'Mobiliario');
      setTotal(recurso.total?.toString() || '');
      setDisp(recurso.disponible?.toString() || '');
      setDesc(recurso.descripcion || '');
    } else {
      setNombre(''); setCategoria('Mobiliario'); setTotal(''); setDisp(''); setDesc('');
    }
  }, [recurso, visible]);

  const handleSave = () => {
    if (!nombre.trim()) { Alert.alert('Campo requerido', 'Ingresa el nombre del recurso.'); return; }
    const t = parseInt(total, 10);
    const d = parseInt(disponible, 10);
    if (isNaN(t) || t < 0) { Alert.alert('Cantidad inválida', 'Ingresa una cantidad total válida.'); return; }
    if (isNaN(d) || d < 0 || d > t) { Alert.alert('Cantidad inválida', 'La cantidad disponible no puede superar el total.'); return; }
    onSave({ id: recurso?.id, nombre: nombre.trim(), categoria, total: t, disponible: d, descripcion: descripcion.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={onClose} style={st.modalClose}>
              <Ionicons name="close" size={22} color={C.t2} />
            </TouchableOpacity>
            <Text style={st.modalTitle}>{isEdit ? 'Editar recurso' : 'Nuevo recurso'}</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            <View style={st.formCard}>
              <Text style={st.fieldLabel}>Nombre del recurso *</Text>
              <TextInput style={st.textInput} value={nombre} onChangeText={setNombre} placeholder="Ej. Sillas plásticas" placeholderTextColor={C.t3} />

              <Text style={[st.fieldLabel, { marginTop: 16 }]}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {['Mobiliario', 'Vajilla', 'Electrónica', 'Decoración', 'Otros'].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[st.catChip, categoria === c && { backgroundColor: C.primary, borderColor: C.primary }]}
                      onPress={() => setCategoria(c)}
                    >
                      <Text style={[st.catChipText, categoria === c && { color: C.surface }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={st.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.fieldLabel, { marginTop: 16 }]}>Cantidad total *</Text>
                  <TextInput style={st.textInput} value={total} onChangeText={setTotal} keyboardType="numeric" placeholder="0" placeholderTextColor={C.t3} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[st.fieldLabel, { marginTop: 16 }]}>Disponible *</Text>
                  <TextInput style={st.textInput} value={disponible} onChangeText={setDisp} keyboardType="numeric" placeholder="0" placeholderTextColor={C.t3} />
                </View>
              </View>

              <Text style={[st.fieldLabel, { marginTop: 16 }]}>Descripción</Text>
              <TextInput
                style={[st.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={descripcion} onChangeText={setDesc}
                multiline placeholder="Descripción opcional…" placeholderTextColor={C.t3}
              />
            </View>
          </ScrollView>

          <View style={st.modalActions}>
            <TouchableOpacity style={[st.btn, st.btnSave]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={C.surface} />
                : <><Ionicons name="save-outline" size={18} color={C.surface} /><Text style={[st.btnText, { color: C.surface }]}>Guardar</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Recurso card ─────────────────────────────────────────────────────────────
const RecursoCard = ({ item, onEdit, onDelete }) => {
  const sc = stockColor(item.disponible, item.total);
  return (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={[st.catTag, { backgroundColor: C.infoLight }]}>
          <Text style={[st.catTagText, { color: C.info }]}>{item.categoria}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={st.iconAction} onPress={() => onEdit(item)}>
            <Ionicons name="pencil-outline" size={15} color={C.t2} />
          </TouchableOpacity>
          <TouchableOpacity style={[st.iconAction, { borderColor: C.dangerLight }]} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={15} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={st.cardName}>{item.nombre}</Text>
      {item.descripcion ? <Text style={st.cardDesc} numberOfLines={1}>{item.descripcion}</Text> : null}
      <StockBar disponible={item.disponible} total={item.total} />
      <View style={[st.stockBadge, { backgroundColor: sc.bg }]}>
        <View style={[st.stockDot, { backgroundColor: sc.color }]} />
        <Text style={[st.stockLabel, { color: sc.color }]}>{sc.label}</Text>
      </View>
    </View>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Inventario() {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [recursos, setRecursos]       = useState([]);
  const [filtro, setFiltro]           = useState('Todos');
  const [search, setSearch]           = useState('');
  const [modalVisible, setModal]      = useState(false);
  const [editTarget, setEditTarget]   = useState(null);

  const fetchRecursos = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/daf/recursos`, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      setRecursos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo cargar el inventario.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecursos(); }, [fetchRecursos]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const token = await getToken();
      if (data.id) {
        await axios.put(`${API_BASE_URL}/daf/recursos/${data.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/daf/recursos`, data, { headers: { Authorization: `Bearer ${token}` } });
      }
      Alert.alert('Éxito', data.id ? 'Recurso actualizado.' : 'Recurso creado.');
      setModal(false);
      setEditTarget(null);
      fetchRecursos();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el recurso.');
    } finally { setSaving(false); }
  };

  const handleDelete = (item) => {
    Alert.alert('Eliminar recurso', `¿Deseas eliminar "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${API_BASE_URL}/daf/recursos/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchRecursos();
        } catch { Alert.alert('Error', 'No se pudo eliminar el recurso.'); }
      }},
    ]);
  };

  const openEdit = (item) => { setEditTarget(item); setModal(true); };
  const openNew  = ()     => { setEditTarget(null);  setModal(true); };

  const filtered = recursos.filter(r => {
    const matchCat = filtro === 'Todos' || r.categoria === filtro;
    const matchQ   = !search || r.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const bajoStock = recursos.filter(r => r.total > 0 && r.disponible / r.total < 0.5);

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.hTitle}>Inventario</Text>
          <Text style={st.hSub}>{recursos.length} recursos · {bajoStock.length} bajo stock</Text>
        </View>
        <TouchableOpacity style={st.fabSmall} onPress={openNew}>
          <Ionicons name="add" size={22} color={C.surface} />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={st.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.t3} />
        <TextInput style={st.searchInput} placeholder="Buscar recurso…" placeholderTextColor={C.t3} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.t3} /></TouchableOpacity> : null}
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
        {CATEGORIAS.map(c => (
          <TouchableOpacity key={c} style={[st.chip, filtro === c && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setFiltro(c)}>
            <Text style={[st.chipText, filtro === c && { color: C.surface }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={st.loadingBox}><ActivityIndicator color={C.primary} /><Text style={st.loadingText}>Cargando inventario…</Text></View>
      ) : filtered.length === 0 ? (
        <View style={st.emptyBox}>
          <Ionicons name="cube-outline" size={40} color={C.t3} />
          <Text style={st.emptyTitle}>Sin recursos</Text>
          <Text style={st.emptyText}>Agrega recursos con el botón +</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {filtered.map(item => (
            <RecursoCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </ScrollView>
      )}

      <RecursoModal visible={modalVisible} recurso={editTarget} onClose={() => { setModal(false); setEditTarget(null); }} onSave={handleSave} saving={saving} />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: (StatusBar.currentHeight || 40) + 12, paddingBottom: 14,
    borderBottomWidth: 0.5, borderColor: C.border, gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  hTitle: { fontSize: 20, fontWeight: '800', color: C.t1 },
  hSub: { fontSize: 12, color: C.t2 },
  fabSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface,
    marginHorizontal: 16, marginTop: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.t1, padding: 0 },

  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.surface },
  chipText: { fontSize: 13, color: C.t2, fontWeight: '500' },

  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catTagText: { fontSize: 11, fontWeight: '600' },
  cardName: { fontSize: 16, fontWeight: '700', color: C.t1, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: C.t3, marginBottom: 8 },

  barWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.bg, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barLabel: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockLabel: { fontSize: 11, fontWeight: '600' },

  iconAction: { width: 30, height: 30, borderRadius: 8, borderWidth: 0.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: C.t2 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.t1 },
  emptyText: { fontSize: 13, color: C.t2, textAlign: 'center' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 16 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: 14, borderBottomWidth: 0.5, borderColor: C.border,
  },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.t1 },
  formCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.border },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.t2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.t1, backgroundColor: C.bg },
  row: { flexDirection: 'row' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg },
  catChipText: { fontSize: 13, color: C.t2 },
  modalActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
    backgroundColor: C.surface, borderTopWidth: 0.5, borderColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  btnSave: { backgroundColor: C.primary },
  btnText: { fontSize: 15, fontWeight: '700' },
});