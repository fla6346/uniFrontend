import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CustomAlert from '../../components/CustomAlert';

//const API_BASE_URL = 'https://evento.cidtec-uc.com';
const API_BASE_URL =  'https://unifrontend.onrender.com';
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); }
    catch (e) { console.error("Error localStorage:", e); return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); }
    catch (e) { console.error("Error SecureStore:", e); return null; }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(TOKEN_KEY); }
    catch (e) { console.error("Error localStorage:", e); }
  } else {
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); }
    catch (e) { console.error("Error SecureStore:", e); }
  }
};

const COLORS = {
  accent: '#0052A0',
  secondary: '#2980b9',
  primary: '#E95A0C',
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
};

const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateString; }
};

const formatTime = (timeString) => {
  if (!timeString) return 'No especificada';
  try {
    if (timeString.includes(':')) return timeString;
    return timeString;
  } catch { return timeString; }
};

const EventDetailScreen = () => {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showApproveAlert, setShowApproveAlert] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');

  const getCurrentPhaseFromFases = useCallback((fases) => {
    if (!Array.isArray(fases) || fases.length === 0) {
      return { number: 1, label: 'Planeación', key: 'phase1', color: COLORS.info, icon: 'document-text-outline' };
    }
    const faseToShow = fases[0];
    const phaseConfig = {
      1: { label: 'Planeación', icon: 'document-text-outline', color: COLORS.info },
      2: { label: 'Revisión y aprobación', icon: 'clipboard-outline', color: COLORS.secondary },
      3: { label: 'Programación del evento', icon: 'calendar-outline', color: COLORS.success },
      4: { label: 'Ejecución', icon: 'play-circle-outline', color: COLORS.purple },
      5: { label: 'Cierre y evaluación', icon: 'checkmark-done-outline', color: COLORS.grayText },
    };
    const config = phaseConfig[faseToShow.nrofase] || { label: `Fase ${faseToShow.nrofase}`, icon: 'help-circle-outline', color: COLORS.grayText };
    return { number: faseToShow.nrofase, label: config.label, key: `phase${faseToShow.nrofase}`, color: config.color, icon: config.icon };
  }, []);

  const fetchEventDetails = useCallback(async () => {
    let processedEventId = Array.isArray(eventId) ? eventId[0] : eventId;
    if (typeof processedEventId === 'string' && processedEventId.startsWith('event-')) {
      processedEventId = processedEventId.replace('event-', '');
    }
    const numericId = Number(processedEventId);
    if (isNaN(numericId) || !processedEventId) {
      setError('ID de evento inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenAsync();
      if (!token) {
        Alert.alert('Sesión Expirada', 'Por favor, inicia sesión de nuevo.');
        await deleteTokenAsync();
        router.replace('/LoginAdmin');
        return;
      }
      const [eventResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/eventos/${numericId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchUserDetails(token)
      ]);
      const eventData = eventResponse.data;
      if (!eventData || typeof eventData !== 'object' || Object.keys(eventData).length === 0) {
        throw new Error('Datos de evento vacíos o inválidos del servidor.');
      }
      const transformedEvent = {
        id: eventData.idevento || null,
        title: eventData.nombreevento || 'Sin título',
        date: formatDate(eventData.fechaevento),
        time: formatTime(eventData.horaevento),
        location: eventData.lugarevento || 'Ubicación no especificada',
        organizer: eventData.responsable_evento || 'Organizador no especificado',
        attendees: eventData.participantes_esperados || 'No especificado',
        status: (eventData.estado || 'pendiente').toLowerCase(),
        imageUrl: eventData.imagenUrl || null,
        idfase: eventData.idfase || 1,
        fases: eventData.fases || [],
        Clasificacion: eventData.Clasificacion || null,
        subcategoria: eventData.subcategoria || null,
        tiposEvento: eventData.TiposDeEvento || [],
        objetivos: eventData.Objetivos || [],
        objetivosPDI: Array.isArray(eventData.ObjetivosPDI)
          ? eventData.ObjetivosPDI
          : typeof eventData.objetivos_pdi === 'string'
            ? JSON.parse(eventData.objetivos_pdi || '[]')
            : [],
        segmentos: eventData.segmentos || [],
        argumentacion: eventData.argumentacion || 'Sin argumentación',
        resultados: (eventData.Resultados && eventData.Resultados.length > 0)
          ? eventData.Resultados[0]
          : { participacion_esperada: null, satisfaccion_esperada: null, otros_resultados: null, satisfaccion_real: null },
        recursos: eventData.Recursos || [],
        comite: eventData.Comite || [],
        presupuesto: eventData.Presupuesto || null,
        egresos: eventData.Egresos || [],
        ingresos: eventData.Ingresos || [],
        tags: eventData.tags || [],
        creador: eventData.creador ? {
          nombre: `${eventData.creador.nombre} ${eventData.creador.apellidopat} ${eventData.creador.apellidomat}`,
          email: eventData.creador.email,
          role: eventData.creador.role
        } : null
      };
      if (!transformedEvent.id) throw new Error('El evento no tiene un ID válido.');
      setEvent(transformedEvent);
    } catch (err) {
      let errorMessage = `Error al cargar evento: ${err.message}`;
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert('Acceso Denegado', 'No tienes permiso o tu sesión ha expirado.');
        await deleteTokenAsync();
        router.replace('/LoginAdmin');
        errorMessage = 'Sesión expirada. Redirigiendo...';
      } else if (err.response?.status === 404) {
        errorMessage = 'Evento no encontrado.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  const fetchUserDetails = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Error al cargar datos del usuario', err);
      return null;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    } else {
      setError('No se proporcionó un ID de evento.');
      setLoading(false);
    }
  }, [fetchEventDetails, eventId]);

  // Abre el modal de rechazo
  const handleRejectEvent = () => {
    if (!event || !event.id) {
      Alert.alert('Error', 'No hay evento cargado para rechazar.');
      return;
    }
    setShowRejectModal(true);
  };

  // Ejecuta el rechazo con la razón
  const confirmReject = async () => {
    setShowRejectModal(false);
    try {
      const token = await getTokenAsync();
      if (!token) throw new Error('Token inválido');

      const response = await axios.put(
        `${API_BASE_URL}/eventos/${event.id}/reject`,
        { razon_rechazo: razonRechazo || null },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      console.log('✅ Respuesta:', response.data);
      setRazonRechazo('');
      Alert.alert('Evento Rechazado', 'El evento ha sido rechazado correctamente');
      router.back();
    } catch (error) {
      console.error('❌ Error al rechazar:', error);
      Alert.alert('Error', `No se pudo rechazar: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando detalles del evento...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={50} color={COLORS.accent} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventDetails}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event || Object.keys(event).length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={50} color={COLORS.grayText} />
        <Text style={styles.errorText}>No se encontraron datos del evento.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Evento</Text>
        <TouchableOpacity onPress={fetchEventDetails}>
          <Ionicons name="refresh" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {event.imageUrl && <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />}

        {/* Título y fase */}
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {(() => {
            const phaseInfo = getCurrentPhaseFromFases([{ nrofase: event.idfase }]);
            return (
              <View style={[styles.phaseBadge, { backgroundColor: phaseInfo.color }]}>
                <Ionicons name={phaseInfo.icon} size={16} color={COLORS.white} />
                <Text style={styles.phaseBadgeText}>Fase {phaseInfo.number}: {phaseInfo.label}</Text>
              </View>
            );
          })()}
        </View>

        {/* Estado */}
        <View style={styles.sectionCard}>
          <View style={styles.detailRow}>
            <Ionicons
              name={event.status === 'aprobado' ? 'checkmark-circle-outline' : 'time-outline'}
              size={20}
              color={event.status === 'aprobado' ? COLORS.success : COLORS.warning}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: event.status === 'aprobado' ? COLORS.success : COLORS.warning }]}>
              Estado: {event.status}
            </Text>
          </View>
        </View>

        {/* Datos Generales */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Datos Generales</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>Fecha: {event.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>Hora: {event.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>Ubicación: {event.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>Organizador: {event.organizer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>Asistentes: {event.attendees}</Text>
          </View>
        </View>

        {/* Creador */}
        {event.creador && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Propuesto por</Text>
            <Text style={styles.creatorName}>{event.creador.nombre}</Text>
            <Text style={styles.creatorRole}>Rol: {event.creador.role}</Text>
            <Text style={styles.creatorEmail}>Email: {event.creador.email}</Text>
          </View>
        )}

        {/* Clasificación */}
        {event.Clasificacion && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Clasificación Estratégica</Text>
            <Text style={styles.detailText}>
              • {event.Clasificacion.nombreClasificacion} - {event.Clasificacion.nombresubcategoria}
            </Text>
          </View>
        )}

        {/* Tipos de Evento */}
        {event.tiposEvento && event.tiposEvento.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tipos de Evento</Text>
            {event.tiposEvento.map((tipo, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="pricetag-outline" size={16} color={COLORS.grayText} style={styles.listIcon} />
                <Text style={styles.listText}>{tipo.nombretipo || `Tipo ID ${tipo.idtipoevento}`}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Objetivos */}
        {event.objetivos && event.objetivos.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Objetivos Principales</Text>
            {event.objetivos.map((obj, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="bulb-outline" size={16} color={COLORS.grayText} style={styles.listIcon} />
                <Text style={styles.listText}>
                  {obj.nombre_objetivo || 'Sin tipo'} — {obj.texto_personalizado || 'Objetivo sin descripción'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Objetivos PDI */}
        {event.objetivosPDI && event.objetivosPDI.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Objetivos del PDI Institucional</Text>
            {event.objetivosPDI.map((pdi, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.listText, { fontWeight: 'bold', color: COLORS.primary }]}>{index + 1}.</Text>
                <Text style={styles.listText}>{pdi}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Segmentos */}
        {event.objetivos && event.objetivos.some(obj => obj.segmentos && obj.segmentos.length > 0) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Segmentos Objetivo</Text>
            {(() => {
              const allSegments = event.objetivos
                .filter(obj => obj.segmentos && obj.segmentos.length > 0)
                .flatMap(obj => obj.segmentos);
              const uniqueSegmentsMap = new Map();
              allSegments.forEach(seg => {
                if (!uniqueSegmentsMap.has(seg.idsegmento)) uniqueSegmentsMap.set(seg.idsegmento, seg);
              });
              return Array.from(uniqueSegmentsMap.values()).map((seg, index) => (
                <View key={`seg-${seg.idsegmento || index}`} style={styles.segmentItem}>
                  <View style={styles.segmentHeader}>
                    <Ionicons name="person-outline" size={16} color={COLORS.primary} style={styles.segmentIcon} />
                    <Text style={styles.segmentName}>{seg.nombre_segmento || `Segmento ID ${seg.idsegmento}`}</Text>
                  </View>
                  {seg.texto_personalizado && <Text style={styles.segmentDescription}>{seg.texto_personalizado}</Text>}
                </View>
              ));
            })()}
          </View>
        )}

        {/* Resultados */}
        {event.resultados && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Resultados Esperados</Text>
            {event.resultados.participacion_esperada && (
              <View style={styles.listItem}>
                <Ionicons name="people-circle-outline" size={16} color={COLORS.grayText} style={styles.listIcon} />
                <Text style={styles.listText}>Participación: {event.resultados.participacion_esperada}</Text>
              </View>
            )}
            {event.resultados.satisfaccion_esperada && (
              <View style={styles.listItem}>
                <Ionicons name="happy-outline" size={16} color={COLORS.grayText} style={styles.listIcon} />
                <Text style={styles.listText}>Satisfacción: {event.resultados.satisfaccion_esperada}</Text>
              </View>
            )}
            {event.resultados.otros_resultados && (
              <View style={styles.listItem}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.grayText} style={styles.listIcon} />
                <Text style={styles.listText}>Otros: {event.resultados.otros_resultados}</Text>
              </View>
            )}
          </View>
        )}

        {/* Recursos */}
        {event.recursos && event.recursos.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recursos Solicitados</Text>
            {['tecnologico', 'mobiliario', 'vajilla'].map(tipo => {
              const filtered = event.recursos.filter(r => r.recurso_tipo === tipo);
              if (!filtered.length) return null;
              const icons = { tecnologico: 'hardware-chip-outline', mobiliario: 'home-outline', vajilla: 'restaurant-outline' };
              const labels = { tecnologico: 'Tecnológicos', mobiliario: 'Mobiliario', vajilla: 'Vajilla' };
              return (
                <View key={tipo} style={styles.resourceCategory}>
                  <Text style={styles.resourceCategoryTitle}>{labels[tipo]}</Text>
                  {filtered.map((r, i) => (
                    <View key={`${tipo}-${i}`} style={styles.listItem}>
                      <Ionicons name={icons[tipo]} size={16} color={COLORS.grayText} style={styles.listIcon} />
                      <Text style={styles.listText}>{r.cantidad || 1} x {r.nombre_recurso}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Comité */}
        {event.comite && event.comite.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Comité del Evento</Text>
            {event.comite.map((miembro, index) => (
              <View key={index} style={styles.committeeMember}>
                <Text style={styles.committeeName}>
                  {[miembro.nombre, miembro.apellidopat, miembro.apellidomat].filter(Boolean).join(' ') || 'Miembro sin nombre'}
                </Text>
                <Text style={styles.committeeRole}>Rol: {miembro.role === 'academico' ? 'Académico' : miembro.role}</Text>
                <Text style={styles.committeeEmail}>Email: {miembro.email}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Presupuesto */}
        {event.presupuesto && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Presupuesto del Evento</Text>
            {event.egresos && event.egresos.length > 0 && (
              <View style={styles.budgetSubsection}>
                <View style={styles.budgetHeader}>
                  <Ionicons name="arrow-down-circle" size={20} color={COLORS.logout} />
                  <Text style={styles.budgetSubtitle}>Egresos</Text>
                </View>
                <View style={styles.budgetTableHeader}>
                  <Text style={[styles.budgetCell, styles.budgetCellDesc]}>Descripción</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Cant.</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Precio</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Total</Text>
                </View>
                {event.egresos.map((egreso, index) => (
                  <View key={egreso.idegreso || index} style={styles.budgetTableRow}>
                    <Text style={[styles.budgetCell, styles.budgetCellDesc]}>{egreso.descripcion}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum]}>{egreso.cantidad}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum]}>Bs {parseFloat(egreso.precio_unitario).toFixed(2)}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum, styles.budgetCellTotal]}>Bs {parseFloat(egreso.total).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.budgetTotalRow}>
                  <Text style={[styles.budgetTotalLabel, { flex: 3 }]}>TOTAL EGRESOS:</Text>
                  <Text style={styles.budgetTotalValue}>Bs {(event.presupuesto.total_egresos || 0).toFixed(2)}</Text>
                </View>
              </View>
            )}
            {event.ingresos && event.ingresos.length > 0 && (
              <View style={styles.budgetSubsection}>
                <View style={styles.budgetHeader}>
                  <Ionicons name="arrow-up-circle" size={20} color={COLORS.success} />
                  <Text style={styles.budgetSubtitle}>Ingresos</Text>
                </View>
                <View style={styles.budgetTableHeader}>
                  <Text style={[styles.budgetCell, styles.budgetCellDesc]}>Descripción</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Cant.</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Precio</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellNum]}>Total</Text>
                </View>
                {event.ingresos.map((ingreso, index) => (
                  <View key={ingreso.idingreso || index} style={styles.budgetTableRow}>
                    <Text style={[styles.budgetCell, styles.budgetCellDesc]}>{ingreso.descripcion}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum]}>{ingreso.cantidad}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum]}>Bs {parseFloat(ingreso.precio_unitario).toFixed(2)}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellNum, styles.budgetCellTotal]}>Bs {parseFloat(ingreso.total).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.budgetTotalRow}>
                  <Text style={[styles.budgetTotalLabel, { flex: 3 }]}>TOTAL INGRESOS:</Text>
                  <Text style={[styles.budgetTotalValue, { color: COLORS.success }]}>Bs {(event.presupuesto.total_ingresos || 0).toFixed(2)}</Text>
                </View>
              </View>
            )}
            <View style={styles.balanceFinal}>
              <Text style={styles.balanceFinalLabel}>BALANCE ECONÓMICO:</Text>
              <Text style={[styles.balanceFinalValue, { color: (event.presupuesto.balance || 0) >= 0 ? COLORS.success : COLORS.logout }]}>
                Bs {(event.presupuesto.balance || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Botones aprobar / rechazar */}
        {event.status?.toLowerCase() !== 'aprobado' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.approveButton} onPress={() => setShowApproveAlert(true)}>
              <Ionicons name="checkmark-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Aprobar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleRejectEvent}>
              <Ionicons name="close-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/admin/EditEvent?eventId=${event.id}`)}>
          <Ionicons name="create-outline" size={20} color={COLORS.white} />
          <Text style={styles.editButtonText}>Editar Evento</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ✅ CustomAlert de aprobación — fuera del ScrollView */}
      <CustomAlert
        visible={showApproveAlert}
        title="¿Aprobar evento?"
        message="¿Estás seguro de que quieres aprobar este evento?"
        cancelText="Cancelar"
        confirmText="Aprobar"
        onCancel={() => setShowApproveAlert(false)}
        onConfirm={async () => {
          setShowApproveAlert(false);
          try {
            const token = await getTokenAsync();
            if (!token) throw new Error('Token inválido');
            await axios.put(
              `${API_BASE_URL}/eventos/${event.id}/approve`,
              {},
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            Alert.alert('Éxito', 'Evento aprobado correctamente');
            router.back();
          } catch (error) {
            Alert.alert('Error', `No se pudo aprobar: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
          }
        }}
      />

      {/* ✅ Modal de rechazo con razón — fuera del ScrollView */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRejectModal(false);
          setRazonRechazo('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <View style={styles.modalIconContainer}>
              <Ionicons name="close-circle" size={44} color={COLORS.logout} />
            </View>

            <Text style={styles.modalTitle}>Rechazar Evento</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres rechazar "{event?.title}"?
            </Text>

            <Text style={styles.modalLabel}>Razón del rechazo (opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe la razón aquí..."
              placeholderTextColor={COLORS.grayText}
              value={razonRechazo}
              onChangeText={setRazonRechazo}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowRejectModal(false);
                  setRazonRechazo('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalRejectBtn} onPress={confirmReject}>
                <Ionicons name="close-outline" size={18} color={COLORS.white} />
                <Text style={styles.modalRejectText}>Rechazar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

EventDetailScreen.options = { headerShown: false };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingBottom: 40, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  card: {
    width: '90%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    ...Platform.select({ ios: { shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  sectionCard: {
    width: '90%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 12,
    ...Platform.select({ ios: { shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  eventTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.darkText, marginBottom: 10 },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  phaseBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkText, marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 10 },
  detailText: { fontSize: 16, color: COLORS.darkText, flex: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 8 },
  listIcon: { marginRight: 8 },
  listText: { fontSize: 14, color: COLORS.darkText, flex: 1 },
  segmentItem: { backgroundColor: COLORS.grayLight, borderRadius: 8, padding: 12, marginTop: 8 },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  segmentIcon: { marginRight: 6 },
  segmentName: { fontSize: 14, fontWeight: '600', color: COLORS.darkText },
  segmentDescription: { fontSize: 13, color: COLORS.grayText, paddingLeft: 22 },
  resourceCategory: { marginTop: 12, paddingLeft: 8 },
  resourceCategoryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.darkText, marginBottom: 8, paddingLeft: 8 },
  committeeMember: { backgroundColor: COLORS.grayLight, borderRadius: 8, padding: 12, marginTop: 8 },
  committeeName: { fontSize: 14, fontWeight: '600', color: COLORS.darkText, marginBottom: 2 },
  committeeRole: { fontSize: 13, color: COLORS.grayText, marginBottom: 2 },
  committeeEmail: { fontSize: 13, color: COLORS.grayText, fontStyle: 'italic' },
  creatorName: { fontSize: 16, color: COLORS.darkText, fontWeight: '500', marginBottom: 3 },
  creatorRole: { fontSize: 14, color: COLORS.grayText, marginBottom: 3 },
  creatorEmail: { fontSize: 14, color: COLORS.grayText, fontStyle: 'italic' },
  eventImage: { width: '100%', height: 250, resizeMode: 'cover', marginBottom: 20 },
  loadingText: { marginTop: 15, fontSize: 16, color: COLORS.grayText },
  errorText: { marginTop: 15, fontSize: 16, color: COLORS.accent, textAlign: 'center', marginHorizontal: 20 },
  retryButton: { marginTop: 20, backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  backButton: { marginTop: 10, backgroundColor: COLORS.grayLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backButtonText: { color: COLORS.darkText, fontSize: 16 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 10, width: '90%' },
  approveButton: { flexDirection: 'row', backgroundColor: COLORS.success, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flex: 0.48 },
  rejectButton: { flexDirection: 'row', backgroundColor: COLORS.logout, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flex: 0.48 },
  actionButtonText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  editButton: { flexDirection: 'row', backgroundColor: COLORS.accent, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, width: '90%' },
  editButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  budgetSubsection: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  budgetSubtitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkText, marginLeft: 8 },
  budgetTableHeader: { flexDirection: 'row', backgroundColor: COLORS.grayLight, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 8 },
  budgetTableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  budgetCell: { fontSize: 13, color: COLORS.darkText },
  budgetCellDesc: { flex: 3, fontWeight: '500' },
  budgetCellNum: { flex: 1, textAlign: 'right' },
  budgetCellTotal: { fontWeight: '600', color: COLORS.primary },
  budgetTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: COLORS.primary },
  budgetTotalLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.darkText },
  budgetTotalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkText },
  balanceFinal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.grayLight, padding: 15, borderRadius: 12, marginTop: 10 },
  balanceFinalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkText },
  balanceFinalValue: { fontSize: 18, fontWeight: 'bold' },

  // Modal de rechazo
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, width: '100%',
    ...Platform.select({ ios: { shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 8 } }),
  },
  modalIconContainer: { alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.darkText, marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: COLORS.grayText, marginBottom: 20, lineHeight: 20, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.darkText, marginBottom: 8 },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.grayLight, borderRadius: 10, padding: 12,
    fontSize: 14, color: COLORS.darkText, backgroundColor: COLORS.background,
    minHeight: 90, textAlignVertical: 'top', marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.grayLight, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.darkText },
  modalRejectBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.logout, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalRejectText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});

export default EventDetailScreen;