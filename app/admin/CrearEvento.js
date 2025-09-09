// app/(admin)/CrearEvento.js
import React, { useState, useEffect } from 'react';
// --- 1. AÑADIMOS FlatList A LA IMPORTACIÓN ---
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Image, FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import dayjs from 'dayjs'; // <-- Importación de dayjs

// --- LÓGICA API Y TOKEN (sin cambios) ---
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://10.0.2.2:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://localhost:3001/api';
} else { // web y otros
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;

const getTokenAsync = async () => {
  return "token-de-prueba-para-desarrollo";
};

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const SeccionActividades = ({ titulo, actividades, setActividades, handleActividadDateChange, errors }) => {
  const agregarActividad = () => { setActividades(prev => [ ...prev, { key: `act-${titulo.replace(/\s/g, '')}-${Date.now()}`, nombreActividad: '', responsable: '', fechaInicio: new Date(), fechaFin: new Date(), showDatePickerInicio: false, showDatePickerFin: false, } ]); };
  const eliminarActividad = (index) => { setActividades(prev => prev.filter((_, i) => i !== index)); };
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
            <TextInput style={styles.input} value={actividad.nombreActividad} onChangeText={(text)=>{ setActividades(prev=>{ const newState=[...prev]; newState[index]={...newState[index], nombreActividad: text}; return newState; }); }} placeholder="Nombre de la Actividad" placeholderTextColor="#aaa" />
          </View>
          {errors[`${titulo}_${index}_nombre`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_nombre`]}</Text>}
          <Text style={styles.label}>Responsable</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
            <TextInput style={styles.input} value={actividad.responsable} onChangeText={(text) => { setActividades(prev => { const newState = [...prev]; newState[index] = { ...newState[index], responsable: text }; return newState; }); }} placeholder="Nombre del responsable" placeholderTextColor="#aaa" />
          </View>
          {errors[`${titulo}_${index}_responsable`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_responsable`]}</Text>}
          <Text style={styles.label}>Fecha Inicio Actividad</Text>
          <TouchableOpacity onPress={() => { setActividades(prev => { const newState = [...prev]; newState[index] = { ...newState[index], showDatePickerInicio: true }; return newState; }); }} style={styles.datePickerButton} >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaInicio.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {actividad.showDatePickerInicio && ( <DateTimePicker value={actividad.fechaInicio} mode="date" display="default" onChange={(event, date) => handleActividadDateChange(index, 'fechaInicio', event, date, setActividades)} /> )}
          <Text style={styles.label}>Fecha Fin Actividad</Text>
          <TouchableOpacity onPress={() => { setActividades(prev => { const newState = [...prev]; newState[index] = { ...newState[index], showDatePickerFin: true }; return newState; }); }} style={styles.datePickerButton} >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaFin.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {actividad.showDatePickerFin && ( <DateTimePicker value={actividad.fechaFin} mode="date" display="default" minimumDate={actividad.fechaInicio} onChange={(event, date) => handleActividadDateChange(index, 'fechaFin', event, date, setActividades)} /> )}
        </View>
      ))}
      <TouchableOpacity onPress={agregarActividad} style={styles.addButton}>
        <Ionicons name="add-circle" size={26} color="#e95a0c" />
        <Text style={styles.addButtonText}>Añadir Actividad</Text>
      </TouchableOpacity>
    </View>
  );
};


const CrearEvento = () => {
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
    return new Date(); };
  
  // ... (otros estados) ...
  const [authToken, setAuthToken] = useState(null);
  const [nombreevento, setNombreevento] = useState('');
  const [lugarevento, setLugarevento] = useState('');
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState(getInitialDate());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [actividadesPrevias, setActividadesPrevias] = useState([]);
  const [actividadesDurante, setActividadesDurante] = useState([]);
  const [actividadesPost, setActividadesPost] = useState([]);
  const [idtipoevento, setIdtipoevento] = useState('');
  const [objetivos, setObjetivos]=useState({
    modeloPedagogico: false,
    posicionamiento: false,
    internacionalizacion: false,
    rsu: false,
    fidelizacion: false,
    otro: false,
    otroTexto: '',
  });
  const [tiposEventoDisponibles, setTiposEventoDisponibles] = useState([ 
    { idtipoevento: '1', nombretipoevento: 'Académicos/Curriculares' },
    { idtipoevento: '2', nombretipoevento: 'Culturales' }, 
    { idtipoevento: '3', nombretipoevento: 'Deportivos' }, 
    { idtipoevento: '4', nombretipoevento: 'Sociales' }, 
    { idtipoevento: '5', nombretipoevento: 'Institucionales' }, 
    { idtipoevento: '6', nombretipoevento: 'Externos' },
    { idtipoevento: '7', nombretipoevento: 'Marketing' },
    { idtipoevento: '8', nombretipoevento: 'Internacionalizacion' },
  ]);
  const [serviciosContratados, setServiciosContratados] = useState([]);
  const [ambientes,setAmbientes]=useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventosRegistrados, setEventosRegistrados] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [eventosDelDia, setEventosDelDia] = useState([]);

  const eventTypeColors = {
    '1': '#e95a0c', '2': '#3498db', '3': '#2ecc71',
    '4': '#9b59b6', '5': '#f1c40f', '6': '#7f8c8d',
  };

  useEffect(() => {
    const initializeAndFetch = async () => {
      const token = await getTokenAsync();
      setAuthToken(token);
      if (token) {
        fetchEventosRegistrados(token);
      }
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') Alert.alert('Permiso Necesario', 'Se necesita permiso para acceder a la galería.');
      }
    };
    initializeAndFetch();
  }, []);

  useEffect(() => {
    const datesToMark = {};
    eventosRegistrados.forEach(evento => {
      if (evento.fechaevento) {
        const fecha = evento.fechaevento.split('T')[0];
        const tipoId = String(evento.idtipoevento);
        const colorDelEvento = eventTypeColors[tipoId] || '#bdc3c7';
        datesToMark[fecha] = {
          color: colorDelEvento,
          textColor: 'white',
          startingDay: true,
          endingDay: true,
        };
      }
    });
    
    const selectedDateStr = formatToISODate(fechaHoraSeleccionada);
    const existingMarking = datesToMark[selectedDateStr] || {};
    datesToMark[selectedDateStr] = {
      ...existingMarking,
      selected: true,
      color: existingMarking.color || '#27ae60',
      textColor: 'white',
    };
    setMarkedDates(datesToMark);
  }, [eventosRegistrados, fechaHoraSeleccionada]);

  const fetchEventosRegistrados = async (token) => {
    setIsLoadingEventos(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/eventos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data && Array.isArray(response.data)) {
        setEventosRegistrados(response.data);
        const diaInicial = getInitialDate();
        const diaInicialStr = formatToISODate(diaInicial);
        const eventosDelDiaInicial = response.data
          .filter(e => e.fechaevento.split('T')[0] === diaInicialStr)
          .sort((a, b) => a.horaevento.localeCompare(b.horaevento));
        setEventosDelDia(eventosDelDiaInicial);
      }
    } catch (error) {
      console.error("Error al cargar los eventos existentes:", error);
    } finally {
      setIsLoadingEventos(false);
    }
  };
  const handleObjetivoChange=(key)=>{
    setObjetivos(prev=>({...prev,[key]:!prev[key] }));
  };
  const handleOtroObjetivoText=(text)=>{
    setObjetivos(prev=>({...prev, otroTexto:text}));
  };
  const onDayPressEventoPrincipal = (day) => {
    const { dateString } = day;
    router.push(`/admin/AgendaDia?date=${dateString}`);
  };

  const formatToISODate = (date) => { if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toISOString().split('T')[0]; return date.toISOString().split('T')[0]; };
  const formatToISOTime = (date) => { if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toTimeString().split(' ')[0].substring(0, 5); return date.toTimeString().split(' ')[0].substring(0, 5); };
  const onChangeTimeEventoPrincipal = (event, selectedTime) => { setShowTimePicker(Platform.OS === 'ios'); if (event.type === 'set' && selectedTime) { const nuevaHora = new Date(selectedTime); const fechaActual = new Date(fechaHoraSeleccionada); fechaActual.setHours(nuevaHora.getHours()); fechaActual.setMinutes(nuevaHora.getMinutes()); setFechaHoraSeleccionada(fechaActual); } if (Platform.OS === 'android') { setShowTimePicker(false); } };
  const handleActividadDateChange = (index, field, event, selectedDate, setActividades) => { const pickerVisibilityFlag = field === 'fechaInicio' ? 'showDatePickerInicio' : 'showDatePickerFin'; setActividades(prev => { const newState = [...prev]; if (newState[index]) { newState[index] = { ...newState[index], [pickerVisibilityFlag]: false }; } return newState; }); if (event.type === 'set' && selectedDate) { setActividades(prev => { const newState = [...prev]; if (newState[index]) { newState[index] = {...newState[index], [field]: selectedDate}; if (field === 'fechaInicio' && newState[index].fechaFin < selectedDate) { newState[index].fechaFin = selectedDate; } } return newState; }); } };
  const validateForm = () => { const newErrors = {}; if (!nombreevento.trim()) newErrors.nombreevento = 'El nombre del evento es requerido.'; if (!idtipoevento) newErrors.idtipoevento = 'El tipo de evento es requerido.'; const validateActivityList = (list, listName) => { list.forEach((act, index) => { if (!act.nombreActividad?.trim()) newErrors[`${listName}_${index}_nombre`] = `Nombre de actividad requerido.`; if (!act.responsable?.trim()) newErrors[`${listName}_${index}_responsable`] = `Responsable requerido.`; }); }; validateActivityList(actividadesPrevias, 'Programación de Actividades Previas'); validateActivityList(actividadesDurante, 'Programación de Actividades Durante el Evento'); validateActivityList(actividadesPost, 'Programación de Actividades Después del Evento'); setErrors(newErrors); return Object.keys(newErrors).length === 0; };
  const agregarAmbiente = () => { setAmbientes(prevState => [...prevState, { key: `ambiente_${Date.now()}`, nombre: '', requisito: '', observaciones: '' }]); }; const eliminarAmbiente = (index) => { setAmbientes(ambientes.filter((_, i) => i !== index)); }; const actualizarAmbiente = (index, campo, valor) => { const nuevosAmbientes = [...ambientes]; nuevosAmbientes[index][campo] = valor; setAmbientes(nuevosAmbientes); }; const agregarServicio = () => { setServiciosContratados(prevState => [...prevState, { key: `servicio_${Date.now()}`, nombreServicio: '', caracteristica: '', fechaInicio: new Date(), observaciones: '', showDatePickerInicio: false }]); }; const eliminarServicio = (index) => { setServiciosContratados(serviciosContratados.filter((_, i) => i !== index)); };
  const actualizarServicio = (index, campo, valor) => { const nuevosServicios = [...serviciosContratados]; nuevosServicios[index][campo] = valor;
     setServiciosContratados(nuevosServicios); };
  const handleServicioDateChange = (index, field, event, selectedDate) => { actualizarServicio(index, 'showDatePickerInicio', false); if (event.type === 'set' && selectedDate) { actualizarServicio(index, field, selectedDate); } };
  const handleCrearEvento = async () => { 
    console.log('[DEBUG] Se ha hecho clic en "Crear Evento"');
    if (!validateForm()) {
       Alert.alert("Formulario Incompleto", "Por favor, revisa los campos marcados en rojo."); 
       return; 
      }
      console.log(`[DEBUG] Valor del authToken: ${authToken}`); 
        if (!authToken) {
           Alert.alert("Error de Autenticación", "No estás autenticado.");
            return;
           } 
            console.log('[DEBUG] Todo validado, iniciando proceso de carga...');
           setIsLoading(true);
           const formData = new FormData();
           formData.append('nombreevento', nombreevento.trim()); formData.append('lugarevento', lugarevento.trim()); formData.append('fechaevento', formatToISODate(fechaHoraSeleccionada)); 
           formData.append('horaevento', formatToISOTime(fechaHoraSeleccionada));
            if (idtipoevento) formData.append('idtipoevento', idtipoevento); 
            
                   const formatActivityForSubmit = act => ({ nombreActividad: act.nombreActividad, responsable: act.responsable, fechaInicio: formatToISODate(act.fechaInicio), fechaFin: formatToISODate(act.fechaFin), }); 
                   if (actividadesPrevias.length > 0) formData.append('actividadesPrevias', JSON.stringify(actividadesPrevias.map(formatActivityForSubmit)));
                    if (actividadesDurante.length > 0) formData.append('actividadesDurante', JSON.stringify(actividadesDurante.map(formatActivityForSubmit))); 
                    if (actividadesPost.length > 0) formData.append('actividadesPost', JSON.stringify(actividadesPost.map(formatActivityForSubmit))); 
                    if (serviciosContratados.length > 0) formData.append('serviciosContratados', JSON.stringify(serviciosContratados));
                     if (ambientes.length > 0) formData.append('ambientes', JSON.stringify(ambientes)); try { const response = await axios.post(`${API_BASE_URL}/eventos`, formData, { headers: { 'Authorization': `Bearer ${authToken}`, } });
                      if (response.status === 201) { Alert.alert('Éxito', 'Evento creado correctamente.'); router.back(); 

                      } else { Alert.alert('Aviso', response.data.message || 'Respuesta inesperada del servidor.');

                       } } catch (error) { console.error("Error al crear evento:", error.response ? JSON.stringify(error.response.data) : error.message);
                         const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ocurrió un error al conectar con el servidor.'; 
                         Alert.alert('Error al crear evento', errorMessage);

            } finally { setIsLoading(false); } };

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
        <Stack.Screen options={{ title: 'Crear Nuevo Evento' }} />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Principal</Text>
          
          
          <Text style={styles.label}>Nombre del Evento</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="text-outline" size={20} style={styles.inputIcon} />
            <TextInput style={[styles.input, errors.nombreevento && styles.inputError]} value={nombreevento} onChangeText={setNombreevento} placeholder="Nombre del evento" placeholderTextColor="#aaa"/>
          </View>
          {errors.nombreevento && <Text style={styles.errorText}>{errors.nombreevento}</Text>}
          
          <Text style={styles.label}>Lugar del Evento</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="location-outline" size={20} style={styles.inputIcon} />
            <TextInput style={styles.input} value={lugarevento} onChangeText={setLugarevento} placeholder="Lugar (opcional)" placeholderTextColor="#aaa"/>
          </View>
          
          <Text style={styles.label}>Fecha del Evento</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={onDayPressEventoPrincipal}
              markedDates={markedDates}
              markingType={'period'}
              theme={{
                  todayTextColor: '#e95a0c',
                  arrowColor: '#e95a0c',
                  selectedDayTextColor: '#ffffff',
              }}
            />
            {isLoadingEventos && <ActivityIndicator style={{padding: 10}} />}
          </View>

          <View style={styles.eventListContainer}>
            <Text style={styles.eventListHeader}>Eventos para el {new Date(fechaHoraSeleccionada).toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})}</Text>
            {eventosDelDia.length > 0 ? (
              <FlatList
                data={eventosDelDia}
                keyExtractor={(item) => item.idevento.toString()}
                renderItem={({ item }) => (
                  <View style={styles.eventListItem}>
                    <View style={[styles.eventTypeIndicator, {backgroundColor: eventTypeColors[item.idtipoevento] || '#bdc3c7'}]} />
                    <Text style={styles.eventListTime}>{item.horaevento.substring(0, 5)}</Text>
                    <Text style={styles.eventListName}>{item.nombreevento}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyListText}>No hay eventos programados para este día.</Text>
            )}
          </View>

          <Text style={styles.label}>Hora del Evento</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="time-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
              <Text style={styles.datePickerText}>
                  {fechaHoraSeleccionada.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
          </TouchableOpacity>

          {showTimePicker && ( 
            <DateTimePicker 
              value={fechaHoraSeleccionada} 
              mode="time" 
              is24Hour={true} 
              display="default"
              onChange={onChangeTimeEventoPrincipal}
            /> 
          )}
          {errors.fechaHora && <Text style={styles.errorText}>{errors.fechaHora}</Text>}
          
          <Text style={styles.label}>Tipo de Evento</Text>
          <View style={[styles.pickerContainer, errors.idtipoevento && styles.inputError]}>
            <Picker 
              selectedValue={idtipoevento} 
              onValueChange={(itemValue) => setIdtipoevento(itemValue)} 
              style={styles.picker} 
              prompt="Seleccione un tipo de evento"
            >
              <Picker.Item label="-- Seleccione un tipo --" value="" style={styles.pickerItemPlaceholder} />
              {tiposEventoDisponibles.map((tipo) => (
                <Picker.Item 
                  key={tipo.idtipoevento} 
                  label={tipo.nombretipoevento} 
                  value={tipo.idtipoevento.toString()} 
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
          </View>
          {errors.idtipoevento && 
          <Text style={styles.errorText}>{errors.idtipoevento}</Text>}
        </View>
        
        <SeccionActividades
          titulo="Programación de Actividades Previas"
          actividades={actividadesPrevias}
          setActividades={setActividadesPrevias}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
        />
        <SeccionActividades
          titulo="Programación de Actividades Durante el Evento"
          actividades={actividadesDurante}
          setActividades={setActividadesDurante}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
        />
        <SeccionActividades
          titulo="Programación de Actividades Después del Evento"
          actividades={actividadesPost}
          setActividades={setActividadesPost}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
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
              {errors[`servicio_${index}_nombreServicio`] && <Text style={styles.errorText}>{errors[`servicio_${index}_nombreServicio`]}</Text>}

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
              {errors[`servicio_${index}_caracteristica`] && <Text style={styles.errorText}>{errors[`servicio_${index}_caracteristica`]}</Text>}

              <Text style={styles.label}>Fecha Entrega</Text>
              <TouchableOpacity onPress={() => actualizarServicio(index, 'showDatePickerInicio', true)} style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
                <Text style={styles.datePickerText}>{servicio.fechaInicio.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {servicio.showDatePickerInicio && (
                <DateTimePicker 
                  value={servicio.fechaInicio} 
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
              {errors[`servicio_${index}_observaciones`] && <Text style={styles.errorText}>{errors[`servicio_${index}_observaciones`]}</Text>}
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
              {errors[`ambiente_${index}_nombre`] && <Text style={styles.errorText}>{errors[`ambiente_${index}_nombre`]}</Text>}

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
              {errors[`ambiente_${index}_requisito`] && <Text style={styles.errorText}>{errors[`ambiente_${index}_requisito`]}</Text>}

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
              {errors[`ambiente_${index}_observaciones`] && <Text style={styles.errorText}>{errors[`ambiente_${index}_observaciones`]}</Text>}
            </View>
          ))}
          <TouchableOpacity onPress={agregarAmbiente} style={styles.addButton}>
            <Ionicons name="add-circle" size={26} color="#e95a0c" />
            <Text style={styles.addButtonText}>Añadir Ambiente</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCrearEvento}
          disabled={isLoading || !authToken}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> :
           <Text style={styles.buttonText}>Crear Evento</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


// --- ESTILOS (sin cambios) ---
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 20, paddingBottom: 60 },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 15 },
  inputIcon: { paddingHorizontal: 12, color: '#888' },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 14 : 10, paddingRight: 15, fontSize: 16, color: '#333' },
  inputError: { borderColor: '#D32F2F' },
  errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 10, marginLeft: 5, marginTop: -10 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: Platform.OS === 'ios' ? 14 : 12, marginBottom: 15, paddingLeft: 0 },
  datePickerText: { fontSize: 16, color: '#333', flex:1, marginLeft: 5 },
  button: { backgroundColor: '#e95a0c', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonDisabled: { backgroundColor: '#f9bda3' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  pickerContainer: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 15, },
  picker: { height: Platform.OS === 'ios' ? undefined : 50, width: '100%', color: '#333', },
  pickerItemPlaceholder: { color: '#aaa', },
  pickerItem: { color: '#333', },
  imagePickerButton: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20, minHeight: 180, },
  imagePreview: { width: '100%', height: 180, borderRadius: 8, resizeMode: 'contain', },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, },
  imagePlaceholderText: { marginTop: 10, color: '#888', fontSize: 14, },
  actividadPreviaItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  actividadItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  actividadPreviaTitle: { fontSize: 16, fontWeight: '600', color: '#333', },
  deleteButton: { padding: 6, },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#e6ffee', borderRadius: 8, borderWidth: 1, borderColor: '#27ae60', marginTop: 10, },
  addButtonText: { marginLeft: 8, color: '#27ae60', fontSize: 16, fontWeight: '500', },
  ambienteItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  ambienteItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  servicioItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  servicioItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  calendarContainer:{borderWidth:1,borderColor:'#e0e0e0', borderRadius:8, marginBottom:15,overflow:'hidden'  },
  eventListContainer: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', },
  eventListHeader: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 10, },
  eventListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, },
  eventTypeIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 12, },
  eventListTime: { fontSize: 15, fontWeight: '500', color: '#333', width: 60, },
  eventListName: { fontSize: 15, color: '#555', flex: 1, },
  emptyListText: { textAlign: 'center', color: '#777', paddingVertical: 20, fontStyle: 'italic', },
});

export default CrearEvento;