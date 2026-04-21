import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import dayjs from 'dayjs';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =  'https://evento.cidtec-uc.com';
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch (e) { return null; }
  }
};

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const parseDateSafe = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Fecha Date inválida:', date);
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    console.warn('⚠️ Fecha string inválida:', date);
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
};

const formatActivityForSubmit = (actividad) => ({
  nombreActividad: actividad.nombreActividad?.trim() || '',
  responsable: actividad.responsable?.trim() || '',
  fechaInicio: parseDateSafe(actividad.fechaInicio),
  fechaFin: parseDateSafe(actividad.fechaFin),
});

const formatAmbienteForSubmit = (ambiente) => ({
  nombre: ambiente.nombre?.trim() || '',
  requisito: ambiente.requisito?.trim() || '',
  observaciones: ambiente.observaciones?.trim() || '',
});

const formatServicioForSubmit = (servicio) => ({
  nombreServicio: servicio.nombreServicio?.trim() || '',
  caracteristica: servicio.caracteristica?.trim() || '',
  fechaInicio: parseDateSafe(servicio.fechaInicio),
  observaciones: servicio.observaciones?.trim() || '',
});

const SeccionActividades = ({ titulo, actividades, setActividades, handleActividadDateChange, errors, fechaevento }) => {
   const fechaBase = fechaevento instanceof Date && !isNaN(fechaevento) 
      ? fechaevento 
      : new Date();
      
  const agregarActividad = () => {
    setActividades(prev => [...prev, {
      key: `act-${titulo.replace(/\s/g, '')}-${Date.now()}`,
      nombreActividad: '',
      responsable: '',
      fechaInicio: new Date(fechaBase),
      fechaFin: new Date(fechaBase),
      showDatePickerInicio: false,
      showDatePickerFin: false,
    }]);
  };
  const eliminarActividad = (index) => {
    setActividades(prev => prev.filter((_, i) => i !== index));
  };
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      {actividades.map((actividad, index) => (
        <View key={actividad.key} style={styles.actividadPreviaItemContainer}>
          <View style={styles.actividadItemHeader}>
            <Text style={styles.actividadPreviaTitle}>Actividad #{index + 1}</Text>
            <TouchableOpacity onPress={() => eliminarActividad(index)} style={styles.deleteButton}>
              <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Actividad</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="archive-outline" size={20} style={styles.inputIcon}/>
            <TextInput
              style={styles.input}
              value={actividad.nombreActividad}
              onChangeText={(text) => {
                setActividades(prev => {
                  const newState = [...prev];
                  newState[index] = { ...newState[index], nombreActividad: text };
                  return newState;
                });
              }}
              placeholder="Nombre de la Actividad"
              placeholderTextColor="#aaa"
            />
          </View>
          {errors[`${titulo}_${index}_nombre`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_nombre`]}</Text>}

          <Text style={styles.label}>Responsable</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={actividad.responsable}
              onChangeText={(text) => {
                setActividades(prev => {
                  const newState = [...prev];
                  newState[index] = { ...newState[index], responsable: text };
                  return newState;
                });
              }}
              placeholder="Nombre del responsable"
              placeholderTextColor="#aaa"
            />
          </View>
          {errors[`${titulo}_${index}_responsable`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_responsable`]}</Text>}

          <Text style={styles.label}>Fecha Inicio Actividad</Text>
          <TouchableOpacity
            onPress={() => {
              setActividades(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], showDatePickerInicio: true };
                return newState;
              });
            }}
            style={styles.datePickerButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaInicio.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {actividad.showDatePickerInicio && (
            <DateTimePicker
              value={actividad.fechaInicio}
              mode="date"
              display="default"
              onChange={(event, date) => handleActividadDateChange(index, 'fechaInicio', event, date, setActividades)}
            />
          )}

          <Text style={styles.label}>Fecha Fin Actividad</Text>
          <TouchableOpacity
            onPress={() => {
              setActividades(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], showDatePickerFin: true };
                return newState;
              });
            }}
            style={styles.datePickerButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaFin.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {actividad.showDatePickerFin && (
            <DateTimePicker
              value={actividad.fechaFin}
              mode="date"
              display="default"
              minimumDate={actividad.fechaInicio}
              onChange={(event, date) => handleActividadDateChange(index, 'fechaFin', event, date, setActividades)}
            />
          )}
        </View>
      ))}
      <TouchableOpacity onPress={agregarActividad} style={styles.addButton}>
        <Ionicons name="add-circle" size={26} color="#e95a0c" />
        <Text style={styles.addButtonText}>Añadir Actividad</Text>
      </TouchableOpacity>
    </View>
  );
};

const programacionEvento = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const getInitialDate = () => {
    if (params.selectedDate) {
      let initialDate = dayjs(params.selectedDate);
      if (params.selectedHour) {
        initialDate = initialDate.hour(parseInt(params.selectedHour, 10)).minute(0).second(0);
      }
      return initialDate.toDate();
    }
    return new Date();
  };

  const [authToken, setAuthToken]                   = useState(null);
  const [nombreevento, setNombreevento]             = useState('');
  const [lugarevento, setLugarevento]               = useState('');
  const [responsable, setResponsable]               = useState('');
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState(getInitialDate());
  const [actividadesPrevias, setActividadesPrevias] = useState([]);
  const [actividadesDurante, setActividadesDurante] = useState([]);
  const [actividadesPost, setActividadesPost]       = useState([]);
  const [idtipoevento, setIdtipoevento]             = useState('');
  const [serviciosContratados, setServiciosContratados] = useState([]);
  const [ambientes, setAmbientes]                   = useState([]);
  const [isLoading, setIsLoading]                   = useState(false);
  const [errors, setErrors]                         = useState({});
  const [isLoadingEventos, setIsLoadingEventos]     = useState(false);
  const [comiteSeleccionado, setComiteSeleccionado] = useState([]);
  const [layoutsDisponibles, setLayoutsDisponibles] = useState([]);
  const [layoutSeleccionado, setLayoutSeleccionado] = useState(null);
  const [cargandoLayouts, setCargandoLayouts]       = useState(false);

  const { idevento } = params;
  const isEditing = !!idevento;

  const formatToISODate = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  };
  const formatToISOTime = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toTimeString().split(' ')[0].substring(0, 5);
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const handleActividadDateChange = (index, field, event, selectedDate, setActividades) => {
    const pickerFlag = field === 'fechaInicio' ? 'showDatePickerInicio' : 'showDatePickerFin';
    setActividades(prev => {
      const newState = [...prev];
      if (newState[index]) newState[index] = { ...newState[index], [pickerFlag]: false };
      return newState;
    });
    if (event.type === 'set' && selectedDate) {
      setActividades(prev => {
        const newState = [...prev];
        if (newState[index]) {
          newState[index] = { ...newState[index], [field]: selectedDate };
          if (field === 'fechaInicio' && newState[index].fechaFin < selectedDate) {
            newState[index].fechaFin = selectedDate;
          }
        }
        return newState;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nombreevento.trim()) newErrors.nombreevento = 'El nombre del evento es requerido.';

    const validateActivityList = (list, listName) => {
      list.forEach((act, index) => {
        if (!act.nombreActividad?.trim()) newErrors[`${listName}_${index}_nombre`] = 'Nombre de actividad requerido.';
        if (!act.responsable?.trim()) newErrors[`${listName}_${index}_responsable`] = 'Responsable requerido.';
      });
    };

    if (actividadesPrevias.length > 0) validateActivityList(actividadesPrevias, 'Programación de Actividades Previas');
    if (actividadesDurante.length > 0) validateActivityList(actividadesDurante, 'Programación de Actividades Durante el Evento');
    if (actividadesPost.length > 0) validateActivityList(actividadesPost, 'Programación de Actividades Después del Evento');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const agregarAmbiente = () => setAmbientes(prev => [...prev, { key: `ambiente_${Date.now()}`, nombre: '', requisito: '', observaciones: '' }]);
  const eliminarAmbiente = (index) => setAmbientes(ambientes.filter((_, i) => i !== index));
  const actualizarAmbiente = (index, campo, valor) => {
    const nuevos = [...ambientes];
    nuevos[index][campo] = valor;
    setAmbientes(nuevos);
  };

  const agregarServicio = () => setServiciosContratados(prev => [...prev, { key: `servicio_${Date.now()}`, nombreServicio: '', caracteristica: '', fechaInicio: new Date(), observaciones: '', showDatePickerInicio: false }]);
  const eliminarServicio = (index) => setServiciosContratados(serviciosContratados.filter((_, i) => i !== index));
  const actualizarServicio = (index, campo, valor) => {
    const nuevos = [...serviciosContratados];
    nuevos[index][campo] = valor;
    setServiciosContratados(nuevos);
  };
  const handleServicioDateChange = (index, field, event, selectedDate) => {
    actualizarServicio(index, 'showDatePickerInicio', false);
    if (event.type === 'set' && selectedDate) {
      actualizarServicio(index, field, selectedDate);
    }
  };

  const cargarLayouts = async (token) => {
    const authTokenToUse = token || authToken;
    if (!authTokenToUse) return;
    setCargandoLayouts(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/layouts`, {
        headers: { 'Authorization': `Bearer ${authTokenToUse}` }
      });
      if (response.data && Array.isArray(response.data)) {
        setLayoutsDisponibles(response.data);
      } else {
        setLayoutsDisponibles([]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los layouts disponibles.');
      setLayoutsDisponibles([]);
    } finally {
      setCargandoLayouts(false);
    }
  };

  useEffect(() => {
    const initializeAndFetch = async () => {
      const token = await getTokenAsync();
      setAuthToken(token);
      if (!token) { Alert.alert('Error', 'No autenticado'); router.back(); return; }

      await cargarLayouts(token);

      if (isEditing) {
        setIsLoadingEventos(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/eventos/${idevento}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const evento = response.data;

          setNombreevento(evento.nombreevento || '');
          setLugarevento(evento.lugarevento || '');
          setResponsable(evento.responsable_evento || '');

          if (evento.fechaevento && evento.horaevento) {
            const fechaCompleta = new Date(`${evento.fechaevento}T${evento.horaevento}`);
            if (!isNaN(fechaCompleta.getTime())) setFechaHoraSeleccionada(fechaCompleta);
          }

          setIdtipoevento(evento.idtipoevento?.toString() || '');

          if (Array.isArray(evento.actividadesPrevias)) {
            setActividadesPrevias(evento.actividadesPrevias.map((act, i) => ({
              key: `act-prev-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.actividadesDurante)) {
            setActividadesDurante(evento.actividadesDurante.map((act, i) => ({
              key: `act-durante-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.actividadesPost)) {
            setActividadesPost(evento.actividadesPost.map((act, i) => ({
              key: `act-post-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.serviciosContratados)) {
            setServiciosContratados(evento.serviciosContratados.map((serv, i) => ({
              key: `servicio-${i}-${Date.now()}`,
              nombreServicio: serv.nombreServicio || '',
              caracteristica: serv.caracteristica || '',
              fechaInicio: serv.fechaInicio ? new Date(serv.fechaInicio.includes('T') 
            ? serv.fechaInicio 
            : serv.fechaInicio + 'T00:00:00') : new Date(),
              observaciones: serv.observaciones || '',
              showDatePickerInicio: false,
            })));
          }
          if (Array.isArray(evento.ambientes)) {
            setAmbientes(evento.ambientes.map((amb, i) => ({
              key: `ambiente-${i}-${Date.now()}`,
              nombre: amb.nombre || '',
              requisito: amb.requisito || '',
              observaciones: amb.observaciones || '',
            })));
          }
          if (evento.idlayout) {
            const layoutEncontrado = layoutsDisponibles.find(l => l.idlayout === evento.idlayout);
            setLayoutSeleccionado(layoutEncontrado || null);
          }
          if (Array.isArray(evento.comite)) {
            setComiteSeleccionado(evento.comite);
          }
        } catch (error) {
          console.error("Error al cargar el evento:", error);
          Alert.alert("Error", "No se pudo cargar el evento.");
          router.back();
        } finally {
          setIsLoadingEventos(false);
        }
      }
    };
    initializeAndFetch();
  }, [idevento]);

  if (isEditing && idevento && layoutsDisponibles.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e95a0c" />
        <Text style={{ marginTop: 10, color: '#555' }}>Cargando evento...</Text>
      </View>
    );
  }

  const handleCrearEvento = async () => {
    if (!validateForm()) {
      Alert.alert("Formulario Incompleto", "Por favor, revisa los campos marcados en rojo.");
      return;
    }
    if (!authToken) {
      Alert.alert("Error de Autenticación", "No estás autenticado.");
      return;
    }

    setIsLoading(true);
     try {
    if (!fechaHoraSeleccionada || isNaN(fechaHoraSeleccionada.getTime())) {
      throw new Error('Fecha del evento inválida');
    }

    const fasePayload = {
      nrofase: 2,
      ...(isEditing && idevento && { idevento: parseInt(idevento, 10) })
    };

    const payload = {
      nombreevento: nombreevento.trim(),
      lugarevento: lugarevento.trim(),
      fechaevento: formatToISODate(fechaHoraSeleccionada),
      horaevento: formatToISOTime(fechaHoraSeleccionada),
      responsable: responsable.trim(),
      actividadesPrevias: actividadesPrevias.map(formatActivityForSubmit),
      actividadesDurante: actividadesDurante.map(formatActivityForSubmit),
      actividadesPost: actividadesPost.map(formatActivityForSubmit),
      serviciosContratados: serviciosContratados.map(formatServicioForSubmit),
      ambientes: ambientes.map(formatAmbienteForSubmit),
      idlayout: layoutSeleccionado ? layoutSeleccionado.idlayout : null,
      comite: comiteSeleccionado,
      nuevaFase: fasePayload,
    };

    console.log('📦 Payload enviado:', JSON.stringify(payload, null, 2));
     console.log('🔧 Modo:', isEditing ? 'EDICIÓN' : 'CREACIÓN');
    console.log('🔑 ID Evento:', idevento);

  const validarFechasActividades = (actividades, nombre) => {
      actividades.forEach((act, idx) => {
        if (!act.fechaInicio || isNaN(new Date(act.fechaInicio).getTime())) {
          console.warn(`⚠️ Fecha inválida en ${nombre}[${idx}]:`, act);
        }
        if (!act.fechaFin || isNaN(new Date(act.fechaFin).getTime())) {
          console.warn(`⚠️ Fecha fin inválida en ${nombre}[${idx}]:`, act);
        }
      });
    };

    validarFechasActividades(payload.actividadesPrevias, 'actividadesPrevias');
    validarFechasActividades(payload.actividadesDurante, 'actividadesDurante');
    validarFechasActividades(payload.actividadesPost, 'actividadesPost');

    let response;
    if (isEditing) {
      console.log(`✏️ Actualizando evento ${idevento}...`);
      response = await axios.put(`${API_BASE_URL}/eventos/${idevento}`, payload, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });
    } else {
      console.log('➕ Creando nuevo evento...');
      response = await axios.post(`${API_BASE_URL}/eventos`, payload, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });
    }

    console.log('✅ Respuesta del servidor:', response.data);
    
    Alert.alert(
      'Éxito', 
      isEditing ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
    
  } catch (error) {
    console.error('❌ Error detallado al guardar evento:');
    console.error('├─ Status:', error.response?.status);
    console.error('├─ Data:', error.response?.data);
    console.error('├─ Message:', error.message);
    console.error('└─ Config:', error.config);

    let errorMessage = 'Ocurrió un error al guardar el evento.';
    
    if (error.response) {
      const serverError = error.response.data;
      
      if (serverError.message) {
        errorMessage = serverError.message;
      } else if (serverError.error) {
        errorMessage = serverError.error;
      } else if (typeof serverError === 'string') {
        errorMessage = serverError;
      }
      
      if (errorMessage.includes('Transaction cannot be rolled back')) {
        errorMessage = 'Error de base de datos. Por favor, contacta al administrador del sistema.\n\nDetalles: La transacción ya fue completada.';
        console.error('🚨 ERROR DE TRANSACCIÓN DETECTADO - Posible bug en el backend');
      }
      
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }

    Alert.alert('Error al guardar', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: isEditing ? 'Programar Evento' : 'Crear Nuevo Evento' }} />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Principal</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre del Evento</Text>
            <Text style={styles.infoValue}>{nombreevento || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lugar del Evento</Text>
            <Text style={styles.infoValue}>{lugarevento || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{formatToISODate(fechaHoraSeleccionada)}</Text>
          </View>
        </View>

        <SeccionActividades
          titulo="Programación de Actividades Previas"
          actividades={actividadesPrevias}
          setActividades={setActividadesPrevias}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />
        <SeccionActividades
          titulo="Programación de Actividades Durante el Evento"
          actividades={actividadesDurante}
          setActividades={setActividadesDurante}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />
        <SeccionActividades
          titulo="Programación de Actividades Después del Evento"
          actividades={actividadesPost}
          setActividades={setActividadesPost}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Servicios</Text>
          {serviciosContratados.map((servicio, index) => (
            <View key={servicio.key} style={styles.servicioItemContainer}>
              <View style={styles.servicioItemHeader}>
                <Text style={styles.sectionTitle}>Servicio #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarServicio(index)} style={styles.deleteButton}>
                  <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Servicio</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="build-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={servicio.nombreServicio}
                  onChangeText={(text) => actualizarServicio(index, 'nombreServicio', text)}
                  placeholder="Nombre Servicio"
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Caracteristicas</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="list-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={servicio.caracteristica}
                  onChangeText={(text) => actualizarServicio(index, 'caracteristica', text)}
                  placeholder="Caracteristica"
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Fecha Entrega</Text>
              <TouchableOpacity onPress={() => actualizarServicio(index, 'showDatePickerInicio', true)} style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
                <Text style={styles.datePickerText}>
                  {servicio.fechaInicio instanceof Date && !isNaN(servicio.fechaInicio)
                    ? servicio.fechaInicio.toLocaleDateString('es-ES')
                    : 'Seleccionar fecha'}
                </Text>
              </TouchableOpacity>
              {servicio.showDatePickerInicio && (
                <DateTimePicker 
                  value={servicio.fechaInicio instanceof Date && !isNaN(servicio.fechaInicio) 
                    ? servicio.fechaInicio 
                    : new Date()} 
                     mode="date"
                    display="default"
                    onChange={(event, date) => handleServicioDateChange(index, 'fechaInicio', event, date)}
  
                />
              )}
              <Text style={styles.label}>Observaciones</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="document-text-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={servicio.observaciones}
                  onChangeText={(text) => actualizarServicio(index, 'observaciones', text)}
                  placeholder="Observaciones"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={agregarServicio} style={styles.addButton}>
            <Ionicons name="add-circle" size={26} color="#e95a0c" />
            <Text style={styles.addButtonText}>Añadir Servicio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ambiente</Text>
          {ambientes.map((ambiente, index) => (
            <View key={ambiente.key} style={styles.ambienteItemContainer}>
              <View style={styles.ambienteItemHeader}>
                <Text style={styles.sectionTitle}>Ambiente #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarAmbiente(index)} style={styles.deleteButton}>
                  <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Ambiente</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="business-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={ambiente.nombre}
                  onChangeText={(text) => actualizarAmbiente(index, 'nombre', text)}
                  placeholder="Nombre Ambiente"
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Requisito</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="list-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={ambiente.requisito}
                  onChangeText={(text) => actualizarAmbiente(index, 'requisito', text)}
                  placeholder="Requisito"
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Observaciones</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="document-text-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={ambiente.observaciones}
                  onChangeText={(text) => actualizarAmbiente(index, 'observaciones', text)}
                  placeholder="Observaciones"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={agregarAmbiente} style={styles.addButton}>
            <Ionicons name="add-circle" size={26} color="#e95a0c" />
            <Text style={styles.addButtonText}>Añadir Ambiente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Layouts Disponibles</Text>
          {cargandoLayouts ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color="#e95a0c" />
              <Text style={{ marginTop: 8, color: '#666' }}>Cargando layouts...</Text>
            </View>
          ) : layoutsDisponibles.length === 0 ? (
            <View>
              <Text style={{ color: '#777', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
                No hay layouts subidos aún.
              </Text>
              <TouchableOpacity onPress={() => cargarLayouts(authToken)} style={styles.retryButton}>
                <Ionicons name="reload" size={20} color="#e95a0c" />
                <Text style={styles.retryButtonText}>Reintentar carga</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
           <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 6, textAlign: 'center', fontStyle: 'italic' }}>
              Desliza para ver más →
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <View style={styles.layoutsGrid}>
                {layoutsDisponibles.map((layout) => {
                  const imageUrl = layout.imagenUrl || `${API_BASE_URL}/uploads/${layout.url_imagen}`;
                  const isSelected = layoutSeleccionado?.idlayout === layout.idlayout;
                  return (
                    <TouchableOpacity
                      key={layout.idlayout}
                      style={[styles.layoutItem, isSelected && styles.layoutItemSelected]}
                      onPress={() => setLayoutSeleccionado(isSelected ? null : layout)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.layoutImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.layoutName} numberOfLines={2}>{layout.nombre}</Text>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                          <Ionicons name="checkmark-circle" size={18} color="#e95a0c" />
                          <Text style={{ color: '#e95a0c', fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
                            Seleccionado
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            </>
                      )}
                    </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCrearEvento}
          disabled={isLoading || !authToken}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{isEditing ? 'Guardar Cambios' : 'Crear Evento'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 15 },
  inputIcon: { paddingHorizontal: 12, color: '#888' },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 14 : 10, paddingRight: 15, fontSize: 16, color: '#333' },
  errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 10, marginLeft: 5, marginTop: -10 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: Platform.OS === 'ios' ? 14 : 12, marginBottom: 15, paddingLeft: 0 },
  datePickerText: { fontSize: 16, color: '#333', flex: 1, marginLeft: 5 },
  button: { backgroundColor: '#e95a0c', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonDisabled: { backgroundColor: '#f9bda3' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  deleteButton: { padding: 6 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#e6ffee', borderRadius: 8, borderWidth: 1, borderColor: '#27ae60', marginTop: 10 },
  addButtonText: { marginLeft: 8, color: '#27ae60', fontSize: 16, fontWeight: '500' },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e95a0c', borderRadius: 8, alignSelf: 'center', marginTop: 10 },
  retryButtonText: { marginLeft: 8, color: '#e95a0c', fontSize: 16, fontWeight: '500' },
  actividadPreviaItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  actividadItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actividadPreviaTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  ambienteItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  ambienteItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  servicioItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  servicioItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  infoValue: { fontSize: 15, color: '#1e293b', fontWeight: '600', textAlign: 'right', flex: 1.2, flexWrap: 'wrap' },
  layoutsGrid: { 
  flexDirection: 'row', 
  paddingVertical: 10,
  paddingHorizontal: 5,
},
layoutItem: { 
  width: 260,
  marginRight: 15, 
  alignItems: 'center', 
  backgroundColor: '#fff', 
  borderRadius: 12, 
  padding: 12, 
  shadowColor: "#000", 
  shadowOffset: { width: 0, height: 2 }, 
  shadowOpacity: 0.12, 
  shadowRadius: 4, 
  elevation: 4,
},
layoutItemSelected: { 
  borderColor: '#e95a0c', 
  borderWidth: 3, 
  borderRadius: 12, 
  backgroundColor: '#fffaf5',
},
layoutImage: { 
  width: 236,
  height: 180, 
  borderRadius: 8, 
  backgroundColor: '#f0f0f0', 
  borderWidth: 1, 
  borderColor: '#eee',
},
layoutName: { 
  marginTop: 10, 
  fontSize: 14, 
  color: '#333', 
  textAlign: 'center', 
  fontWeight: '600', 
  width: '100%',
},
});

export default programacionEvento;