import React, { useState, useEffect, useRef, useMemo,useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import dayjs from 'dayjs';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

// Configuración de la URL de la API usando variables de entorno
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001/api';

// Configuración de localización del calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Constantes
const TIPOS_DE_EVENTO = [
  { id: '1', label: 'Curricular' },
  { id: '2', label: 'Extracurricular' },
  { id: '3', label: 'Marketing' },
  { id: '4', label: 'Internacionalización' },
  { id: '5', label: 'Otro' }
];

const SEGMENTO_OBJETIVO = [
  { id: '1', label: 'Estudiantes' },
  { id: '2', label: 'Docentes' },
  { id: '3', label: 'Público Externo' },
  { id: '4', label: 'Influencers' },
  { id: '5', label: 'Otro' }
];

const OBJETIVOS_EVENTO_MAP = {
  modeloPedagogico: 1,
  posicionamiento: 2,
  internacionalizacion: 3,
  rsu: 4,
  fidelizacion: 5,
  otro: 6
};
const throttle = (func, limit) => {
  let inThrottle;
  let lastFunc;
  let lastRan;
  return function (...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};
// --- Componente InteractiveClockPicker ---
const InteractiveClockPicker = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const clockRef = useRef(null);
  const svgWidth = 200;
  const svgHeight = 200;
  //const [clockBounds, setClockBounds] = useState({ x: 0, y: 0, width: 200, height: 200 }); // Aumentado a 200
   const [clockCenter, setClockCenter] = useState({ x: 100, y: 100 }); // Default for SVG
  const [clockRadius, setClockRadius] = useState(80); // Default for SVG

  // Ensure value is always a Date object
  const dateValue = useMemo(() => (value instanceof Date ? value : new Date()), [value]);

  const currentHour24 = value.getHours();
  const currentMinute = value.getMinutes();
  const currentHour12 = currentHour24 % 12 || 12;
  const period = currentHour24 < 12 ? 'AM' : 'PM';

  const hourAngle = (currentHour12 * 30) + (currentMinute * 0.5) - 90;
  const minuteAngle = (currentMinute * 6) - 90;


  useEffect(() => {
    const updateClockDimensions = () => {
      if (clockRef.current) {
        if (Platform.OS === 'web') {
          const svgElement = clockRef.current;
          if (svgElement && typeof svgElement.getBoundingClientRect === 'function') {
            const rect = svgElement.getBoundingClientRect();
            setClockCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            setClockRadius(Math.min(rect.width, rect.height) / 2 - 10);
          }
        } else {
          // For native, measure the view containing the SVG if needed,
          // or rely on fixed SVG dimensions if it's not dynamic.
          // For simplicity, we'll use fixed dimensions for native if measure is not reliable.
          setClockCenter({ x: svgWidth / 2, y: svgHeight / 2 });
          setClockRadius(Math.min(svgWidth, svgHeight) / 2 - 10);
        }
      }
    };
  updateClockDimensions();
    // Add event listener for window resize on web to update dimensions
    if (Platform.OS === 'web') {
      window.addEventListener('resize', updateClockDimensions);
      return () => window.removeEventListener('resize', updateClockDimensions);
    }
  }, [Platform.OS, svgWidth, svgHeight]);

  const handlePeriodChange = (newPeriod) => {
      if (period === newPeriod) return;
    const newDate = new Date(dateValue);
    let newHour = newDate.getHours();

    if (newPeriod === 'PM' && newHour < 12) {
      newHour += 12;
    } else if (newPeriod === 'AM' && newHour >= 12) {
      newHour -= 12;
    }
    newDate.setHours(newHour);
    onChange(newDate);
  };

   const calculateAngleFromCoordinates = (clientX, clientY) => {
    const deltaX = clientX - clockCenter.x;
    const deltaY = clientY - clockCenter.y;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90; // Convert to 0-360, 0 at top
    return angle < 0 ? angle + 360 : angle;
  };


  const handleDragStart = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
  };

  const handleDragMove = useCallback(
    throttle((e) => {
      if (!isDragging || !dragType) return;

      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      if (!clientX || !clientY) return;

      const angle = calculateAngleFromCoordinates(clientX, clientY);
      const newDate = new Date(dateValue);

      if (dragType === 'hour') {
        let newHour12 = Math.round(angle / 30);
        if (newHour12 === 0) newHour12 = 12; 

        let finalHour24 = newHour12;
        if (period === 'PM' && newHour12 !== 12) {
          finalHour24 += 12;
        } else if (period === 'AM' && newHour12 === 12) {
          finalHour24 = 0;
        }
        newDate.setHours(finalHour24);
      } else if (dragType === 'minute') {
        const newMinute = Math.round(angle / 6) % 60;
        newDate.setMinutes(newMinute);
      }
      onChange(newDate);
    }, 50),
    [isDragging, dragType, period, dateValue, onChange, clockCenter,calculateAngleFromCoordinates]
  );

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragType(null);
  };

   useEffect(() => {
    if (isDragging) {
      if (Platform.OS === 'web') {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
      } else {
        // For simplicity here, we'll assume touch events on the SVG itself are sufficient
        // or that a PanResponder would wrap this for more robust native dragging.
      }
      return () => {
        if (Platform.OS === 'web') {
          document.removeEventListener('mousemove', handleDragMove);
          document.removeEventListener('mouseup', handleDragEnd);
          document.removeEventListener('touchmove', handleDragMove);
          document.removeEventListener('touchend', handleDragEnd);
        }
      };
    }
  }, [isDragging, handleDragMove]);

  const displayHour = currentHour24 % 12 || 12;

  return (
    <View style={styles.clockContainer}>
      <View style={styles.digitalDisplay}>
        <Text style={styles.digitalTime}>
          {String(displayHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
        </Text>
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'AM' && styles.periodButtonActive]}
            onPress={() => handlePeriodChange('AM')}
          >
            <Text style={[styles.periodText, period === 'AM' && styles.periodTextActive]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'PM' && styles.periodButtonActive]}
            onPress={() => handlePeriodChange('PM')}
          >
            <Text style={[styles.periodText, period === 'PM' && styles.periodTextActive]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Svg
        ref={clockRef}
        width={200} // Aumentado a 200
        height={200} // Aumentado a 200
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
         onMouseDown={Platform.OS === 'web' ? (e) => handleDragStart(e, dragType || 'minute') : undefined} // Default to minute if not set
        onTouchStart={Platform.OS === 'web' ? (e) => handleDragStart(e, dragType || 'minute') : undefined}
      >
        <Circle cx={100} cy={100} r={85} fill="#f0f4f8" stroke="#d1d5db" strokeWidth={2} /> {/* Ajustado a 100, 85 */}
        <Circle cx={100} cy={100} r={80} fill="white" stroke="#e95a0c" strokeWidth={1} /> {/* Ajustado a 100, 80 */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) - 90;
          const x1 = 100 + 75 * Math.cos((angle * Math.PI) / 180); 
          const y1 = 100 + 75 * Math.sin((angle * Math.PI) / 180); 
          const x2 = 100 + 60 * Math.cos((angle * Math.PI) / 180); 
          const y2 = 100 + 60 * Math.sin((angle * Math.PI) / 180); 
          return <Line key={`hour-mark-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e95a0c" strokeWidth={2} strokeLinecap="round" />;
        })}
        {Array.from({ length: 60 }, (_, i) => {
          if (i % 5 !== 0) {
            const angle = (i * 6) - 90;
            const x1 = 100 + 78 * Math.cos((angle * Math.PI) / 180); // Aumentado de 58 a 78
            const y1 = 100 + 78 * Math.sin((angle * Math.PI) / 180); // Aumentado de 58 a 78
            const x2 = 100 + 70 * Math.cos((angle * Math.PI) / 180); // Aumentado de 52 a 70
            const y2 = 100 + 70 * Math.sin((angle * Math.PI) / 180); // Aumentado de 52 a 70
            return <Line key={`minute-mark-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b0b5b9" strokeWidth={1} />;
          }
          return null;
        }).filter(Boolean)}
        {Array.from({ length: 12 }, (_, i) => {
          const hour = i + 1;
          const angle = (hour * 30) - 90;
          const x = 100 + 55 * Math.cos((angle * Math.PI) / 180); // Aumentado de 40 a 55
          const y = 100 + 55 * Math.sin((angle * Math.PI) / 180); // Aumentado de 40 a 55
          return (
            <SvgText
              key={`number-${hour}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={16} // Aumentado de 12 a 16
              fontWeight="600"
              fill="#374151"
            >
              {hour}
            </SvgText>
          );
        })}
        <defs>
          <linearGradient id="minuteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#e95a0c' }} />
            <stop offset="100%" style={{ stopColor: '#f4a261' }} />
          </linearGradient>
        </defs>
        <Line
          x1={100} // Ajustado a nuevo centro
          y1={100} // Ajustado a nuevo centro
          x2={100 + 50 * Math.cos(minuteAngle * Math.PI / 180)} // Aumentado de 40 a 50
          y2={100 + 50 * Math.sin(minuteAngle * Math.PI / 180)} // Aumentado de 40 a 50
          stroke="#e95a0c"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={[3, 1]}
          onMouseDown={(e) => handleDragStart(e, 'minute')}
          onTouchStart={(e) => handleDragStart(e, 'minute')}
        />
        <defs>
          <linearGradient id="hourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#374151' }} />
            <stop offset="100%" style={{ stopColor: '#6b7280' }} />
          </linearGradient>
        </defs>
        <Line
          x1={100} // Ajustado a nuevo centro
          y1={100} // Ajustado a nuevo centro
          x2={100 + 40 * Math.cos(hourAngle * Math.PI / 180)} // Aumentado de 30 a 40
          y2={100 + 40 * Math.sin(hourAngle * Math.PI / 180)} // Aumentado de 30 a 40
          stroke="#374151"
          strokeWidth={3}
          strokeLinecap="round"
          onMouseDown={(e) => handleDragStart(e, 'hour')}
          onTouchStart={(e) => handleDragStart(e, 'hour')}
        />
        <Circle cx={100} cy={100} r={6} fill="#e95a0c" stroke="#ffffff" strokeWidth={2}>
          <animate attributeName="r" from="6" to="8" dur="1s" repeatCount="indefinite" />
        </Circle>
      </Svg>
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionRow}>
          <View style={[styles.colorIndicator, { backgroundColor: '#374151' }]} />
          <Text style={styles.instructionText}>Arrastra para cambiar horas</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={[styles.colorIndicator, { backgroundColor: '#e95a0c' }]} />
          <Text style={styles.instructionText}>Arrastra para cambiar minutos</Text>
        </View>
      </View>
    </View>
  );
};

// --- Funciones Utilitarias ---
const getTokenAsync = async () => {
  const TOKEN_KEY = 'adminAuthToken';
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error("Error al obtener el token:", e);
    return null;
  }
};

const formatCurrency = (value) => `Bs ${Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

// --- Componente TablaPresupuesto ---
const TablaPresupuesto = ({
  titulo,
  items,
  setItems,
  totalGeneral,
  handlePresupuestoChange,
  eliminarFilaPresupuesto,
  agregarFilaPresupuesto
}) => (
  <View style={styles.tablaContainer}>
    <Text style={styles.tablaTitulo}>{titulo}</Text>
    <View style={styles.tablaHeader}>
      <Text style={[styles.headerText, { flex: 0.5 }]}>N°</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Descripción</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Precio</Text>
      <Text style={[styles.headerText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
      <Text style={[styles.headerText, { flex: 0.5 }]}></Text>
    </View>
    {items.map((item, index) => {
      const totalItem = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0);
      return (
        <View key={item.key} style={styles.tablaRow}>
          <Text style={[styles.rowText, { flex: 0.5, textAlign: 'center' }]}>{index + 1}</Text>
          <TextInput
            style={[styles.rowInput, { flex: 2 }]}
            value={item.descripcion}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'descripcion', text)}
            placeholder="Descripción"
          />
          <TextInput
            style={[styles.rowInput, { flex: 1, textAlign: 'center' }]}
            value={item.cantidad}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'cantidad', text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
          />
          <TextInput
            style={[styles.rowInput, { flex: 1, textAlign: 'center' }]}
            value={item.precio}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'precio', text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="0.00"
          />
          <Text style={[styles.rowText, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(totalItem)}</Text>
          <TouchableOpacity onPress={() => eliminarFilaPresupuesto(items, setItems, index)} style={[styles.deleteButtonSmall, { flex: 0.5 }]}>
            <Ionicons name="close-circle" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      );
    })}
    <TouchableOpacity onPress={() => agregarFilaPresupuesto(setItems)} style={styles.addButtonSmall}>
      <Text style={styles.addButtonTextSmall}>+ Añadir Fila</Text>
    </TouchableOpacity>
    <View style={styles.totalRow}>
      <Text style={styles.totalText}>TOTAL</Text>
      <Text style={styles.totalAmount}>{formatCurrency(totalGeneral)}</Text>
    </View>
  </View>
);

// --- Componente Principal del Formulario ---
const ProyectoEvento = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // --- ESTADOS DEL FORMULARIO ---
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [errors, setErrors] = useState({});

  // I. DATOS GENERALES
  const [nombreevento, setNombreevento] = useState('');
  const [lugarevento, setLugarevento] = useState('');
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [tiposSeleccionados, setTiposSeleccionados] = useState({});
  const [textoOtroTipo, setTextoOtroTipo] = useState('');
  const [textoTiposSeleccionados, setTextoTiposSeleccionados] = useState('');
  const [recursosDisponibles, setRecursosDisponibles] = useState([]);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);
  const [recursos, setRecursos] = useState(['']); // Initialize with one empty resource input
  const [segmentosTextoPersonalizado, setSegmentosTextoPersonalizado] = useState({});

  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState(() => {
    if (params.selectedDate) {
      let initialDate = dayjs(params.selectedDate);
      if (params.selectedHour) {
        initialDate = initialDate.hour(parseInt(params.selectedHour, 10)).minute(0).second(0);
      }
      return initialDate.toDate();
    }
    return new Date();
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  // II. OBJETIVOS
  const [objetivos, setObjetivos] = useState({
    modeloPedagogico: false,
    posicionamiento: false,
    internacionalizacion: false,
    rsu: false,
    fidelizacion: false,
    otro: false,
    otroTexto: ''
  });
  const [argumentacion, setArgumentacion] = useState('');
  const [objetivosPDI, setObjetivosPDI] = useState(['', '', '']);
  const [segmentoObjetivo, setSegmentoObjetivo] = useState({
    estudiantes: false,
    docentes: false,
    publicoExterno: false,
    influencers: false,
    otro: false,
    otroTexto: ''
  });

  // III. RESULTADOS ESPERADOS
  const [resultadosEsperados, setResultadosEsperados] = useState({
    participacion: '',
    satisfaccion: '',
    otro: ''
  });

  // VI. PRESUPUESTO
  const [egresos, setEgresos] = useState([{ key: 'egreso-1', descripcion: '', cantidad: '', precio: '' }]);
  const [ingresos, setIngresos] = useState([{ key: 'ingreso-1', descripcion: '', cantidad: '', precio: '' }]);

  // Cálculos optimizados con useMemo
  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0), 0),
    [egresos]
  );
  const totalIngresos = useMemo(
    () => ingresos.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0), 0),
    [ingresos]
  );
  const balance = useMemo(() => totalIngresos - totalEgresos, [totalIngresos, totalEgresos]);

  // Carga inicial de recursos
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const token = await getTokenAsync();
      setAuthToken(token);
      if (!token) {
        Alert.alert("Error", "No se encontró un token de autenticación. Por favor, inicia sesión.");
        router.push("/login");
        return;
      }
      try {
        console.log("Cargando recursos desde la API...");
        const response = await axios.get(`${API_BASE_URL}/recursos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filtrar recursos inválidos
        const validResources = response.data.filter(recurso => recurso && recurso.id != null);
        setRecursosDisponibles(validResources);
        console.log(`${validResources.length} recursos válidos cargados.`);
      } catch (error) {
        console.error("Error al cargar los recursos:", error);
        Alert.alert("Error", "No se pudieron cargar los recursos disponibles.");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const selectedIds = Object.keys(tiposSeleccionados);
    const selectedLabels = selectedIds.map(id => {
      const tipoEncontrado = TIPOS_DE_EVENTO.find(tipo => tipo.id === id);
      return tipoEncontrado ? tipoEncontrado.label : '';
    });
    setTextoTiposSeleccionados(selectedLabels.join(', '));
  }, [tiposSeleccionados]);

  // --- New functions for additional resources ---
  const addResource = () => {
    setRecursos(prev => [...prev, '']);
  };

  const removeResource = (indexToRemove) => {
    setRecursos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateResource = (text, indexToUpdate) => {
    setRecursos(prev => prev.map((resource, index) =>
      index === indexToUpdate ? text : resource
    ));
  };

  // --- Funciones de Manejo de Eventos ---
  const handleInputChange = (field, value) => {
    if (field === 'nombreevento') setNombreevento(value);
    if (field === 'nombreResponsable') setNombreResponsable(value);
    if (field === 'lugarevento') setLugarevento(value);
    if (errors[field]) {
      setErrors(prevErrors => ({ ...prevErrors, [field]: null }));
    }
  };

  const onDayPressEventoPrincipal = (day) => {
    const newDate = dayjs(day.dateString).hour(fechaHoraSeleccionada.getHours()).minute(fechaHoraSeleccionada.getMinutes()).toDate();
    setFechaHoraSeleccionada(newDate);
    setMarkedDates({ [day.dateString]: { selected: true, marked: true, selectedColor: '#e95a0c' } });
  };

  const onChangeTimeEventoPrincipal = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFechaHoraSeleccionada(selectedDate);
    }
  };

  const handleCheckboxChange = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOtroTextChange = (setter, text) => {
    setter(prev => ({ ...prev, otroTexto: text }));
  };

  const handleResultadoChange = (key, value) => {
    setResultadosEsperados(prev => ({ ...prev, [key]: value }));
  };

  const handlePresupuestoChange = (items, setItems, index, field, value) => {
    const nuevosItems = [...items];
    nuevosItems[index][field] = value;
    setItems(nuevosItems);
  };

  const agregarFilaPresupuesto = (setItems) => {
    setItems(prev => [...prev, { key: `item-${Date.now()}`, descripcion: '', cantidad: '', precio: '' }]);
  };

  const eliminarFilaPresupuesto = (items, setItems, index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleRecursoChange = (id) => {
    if (id == null) {
      console.warn("ID de recurso inválido:", id);
      return;
    }
    setRecursosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleTipoEventoChange = (id) => {
    setTiposSeleccionados(prev => {
      const newState = { ...prev };
      if (newState[id]) {
        delete newState[id];
      } else {
        newState[id] = true;
      }
      return newState;
    });
  };

  const handleObjetivoPDIChange = (index, value) => {
    const newObjetivos = [...objetivosPDI];
    newObjetivos[index] = value;
    setObjetivosPDI(newObjetivos);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nombreevento.trim()) newErrors.nombreevento = 'El nombre del evento es obligatorio.';
    if (!lugarevento.trim()) newErrors.lugarevento = 'El lugar del evento es obligatorio.';
    if (!nombreResponsable.trim()) newErrors.nombreResponsable = 'El nombre del responsable es obligatorio.';
    if (Object.values(tiposSeleccionados).every(v => !v)) newErrors.tipos = 'Selecciona al menos un tipo de evento.';
    if (Object.values(objetivos).every(v => !v)) newErrors.objetivos = 'Selecciona al menos un objetivo.';
    if (!argumentacion.trim()) newErrors.argumentacion = 'La argumentación es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Formulario Incompleto', 'Por favor, corrige los campos marcados en rojo.');
      return;
    }
    if (!authToken) {
      Alert.alert("Error de Autenticación", "No se puede enviar el formulario. Intenta iniciar sesión de nuevo.");
      return;
    }

    setIsLoading(true);

    try {
      const tiposParaEnviar = Object.keys(tiposSeleccionados)
        .filter(id => tiposSeleccionados[id])
        .map(id => {
          const tipoObjeto = TIPOS_DE_EVENTO.find(tipo => tipo.id === id);
          return tipoObjeto ? { id: parseInt(id, 10), texto_personalizado: id === '5' && textoOtroTipo.trim() !== '' ? textoOtroTipo.trim() : undefined } : null;
        })
        .filter(item => item !== null);

      const objetivoParaEnviar = Object.keys(objetivos)
        .filter(key => objetivos[key] === true && key !== 'otroTexto')
        .map(key => {
          const obj = { id: OBJETIVOS_EVENTO_MAP[key] };
          if (key === 'otro' && objetivos.otroTexto.trim()) {
            obj.texto_personalizado = objetivos.otroTexto.trim();
          }
          return obj;
        });

      const segmentosParaEnviar = [];
      const validKeys = ['estudiantes', 'docentes', 'publicoExterno', 'influencers'];
      Object.keys(segmentoObjetivo)
        .filter(key => segmentoObjetivo[key] === true && validKeys.includes(key))
        .forEach(key => {
          const label = {
            estudiantes: 'Estudiantes',
            docentes: 'Docentes',
            publicoExterno: 'Público Externo',
            influencers: 'Influencers'
          }[key];
          const segmentoData = SEGMENTO_OBJETIVO.find(s => s.label === label);
          if (segmentoData) {
            segmentosParaEnviar.push({
              id: parseInt(segmentoData.id, 10),
              texto_personalizado: segmentosTextoPersonalizado[key] || null
            });
          }
        });

      // Validar recursosSeleccionados
      const recursosParaEnviar = recursosSeleccionados
        .filter(id => id != null)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));

      const nuevosRecursos = recursos
        .map(texto => texto.trim())
        .filter(texto => texto.length > 0)
        .map(texto => ({
          nombre_recurso: texto,
          recurso_tipo: 'Material/Técnico/Tercero'
        }));

      const eventoPayload = {
        nombreevento,
        lugarevento,
        responsable_evento: nombreResponsable,
        fechaevento: dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD'),
        horaevento: dayjs(fechaHoraSeleccionada).format('HH:mm:ss'),
        argumentacion: argumentacion || null,
        objetivos_pdi: objetivosPDI.filter(o => o.trim() !== '').length > 0 ? JSON.stringify(objetivosPDI.filter(o => o.trim() !== '')) : null,
        resultados_esperados: JSON.stringify(resultadosEsperados),
        tipos_de_evento: tiposParaEnviar,
        objetivos: objetivoParaEnviar,
        segmentos_objetivo: segmentosParaEnviar,
        recursos: recursosParaEnviar,
        recursos_nuevos: nuevosRecursos
      };

      console.log('Payload que se enviará a la API:', JSON.stringify(eventoPayload, null, 2));

      const response = await axios.post(`${API_BASE_URL}/eventos`, eventoPayload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      Alert.alert('Éxito', 'El evento ha sido creado correctamente.');
      router.back();
    } catch (error) {
      let errorMessage = "Ocurrió un error desconocido.";
      if (error.response) {
        console.error("Error del servidor:", error.response.status);
        console.error("Datos del error:", JSON.stringify(error.response.data, null, 2));
        errorMessage = error.response.data.message || error.response.data.error || `Error del servidor: ${error.response.status}.`;
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
        errorMessage = "No se pudo conectar con el servidor. Revisa tu conexión a internet y la URL de la API.";
      } else {
        console.error("Error al configurar la petición:", error.message);
        errorMessage = `Error en la configuración de la petición: ${error.message}`;
      }
      Alert.alert('Error al crear el evento', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} >
        <Stack.Screen options={{ title: 'Proyecto de Evento' }} />

        {/* I. DATOS GENERALES */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>I. DATOS GENERALES</Text>
          <Text style={styles.label}>Nombre del Evento</Text>
          <View style={[styles.inputGroup, errors.nombreevento && styles.inputError]}>
            <Ionicons name="text-outline" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={nombreevento}
              onChangeText={(text) => handleInputChange('nombreevento', text)}
              placeholder="Nombre del evento"
            />
          </View>
          {errors.nombreevento && <Text style={styles.errorText}>{errors.nombreevento}</Text>}

          <Text style={styles.label}>Lugar del Evento</Text>
          <View style={[styles.inputGroup, errors.lugarevento && styles.inputError]}>
            <Ionicons name="location-outline" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={lugarevento}
              onChangeText={(text) => handleInputChange('lugarevento', text)}
              placeholder="Lugar del evento"
            />
          </View>
          {errors.lugarevento && <Text style={styles.errorText}>{errors.lugarevento}</Text>}

          <Text style={styles.label}>Responsable del Evento</Text>
          <View style={[styles.inputGroup, errors.nombreResponsable && styles.inputError]}>
            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={nombreResponsable}
              onChangeText={(text) => handleInputChange('nombreResponsable', text)}
              placeholder="Nombre del responsable"
            />
          </View>
          {errors.nombreResponsable && <Text style={styles.errorText}>{errors.nombreResponsable}</Text>}

          <Text style={styles.label}>Fecha de Realización</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={onDayPressEventoPrincipal}
              markedDates={markedDates}
              theme={{ todayTextColor: '#e95a0c', arrowColor: '#e95a0c', selectedDayTextColor: '#ffffff' }}
            />
          </View>

          <Text style={styles.label}>Hora de Realización</Text>
          {Platform.OS === 'web' ? (
            <InteractiveClockPicker
              value={fechaHoraSeleccionada}
              onChange={setFechaHoraSeleccionada}
            />
          ) : (
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="time-outline" size={20} color="#888" style={{ marginRight: 10 }} />
              <Text style={styles.datePickerText}>
                {dayjs(fechaHoraSeleccionada).format('HH:mm')}
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS !== 'web' && showTimePicker && (
            <DateTimePicker
              value={fechaHoraSeleccionada}
              mode="time"
              is24Hour={true}
              display="clock"
              onChange={onChangeTimeEventoPrincipal}
            />
          )}

          <Text style={styles.label}>Tipo de Evento (puede seleccionar más de un tipo)</Text>
          {TIPOS_DE_EVENTO.map((item) => (
            <TouchableOpacity key={item.id} style={styles.checkboxRow} onPress={() => handleTipoEventoChange(item.id)}>
              <Ionicons name={tiposSeleccionados[item.id] ? "checkbox" : "square-outline"} size={24} color={tiposSeleccionados[item.id] ? "#e95a0c" : "#888"} />
              <Text style={styles.checkboxLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {errors.tipos && <Text style={styles.errorText}>{errors.tipos}</Text>}
          {tiposSeleccionados['5'] && (
            <View style={styles.otroInputContainer}>
              <TextInput style={styles.input} value={textoOtroTipo} onChangeText={setTextoOtroTipo} placeholder="¿Cuál?" />
            </View>
          )}
        </View>

        {/* II. OBJETIVOS */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>II. OBJETIVOS</Text>
          <Text style={styles.label}>Objetivos de Evento (puede seleccionar más de un objetivo):</Text>
          {[
            { key: 'modeloPedagogico', label: 'Modelo Pedagógico' },
            { key: 'posicionamiento', label: 'Posicionamiento' },
            { key: 'internacionalizacion', label: 'Internacionalización' },
            { key: 'rsu', label: 'RSU' },
            { key: 'fidelizacion', label: 'Fidelización' }
          ].map((item) => (
            <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setObjetivos, item.key)}>
              <Ionicons name={objetivos[item.key] ? "checkbox" : "square-outline"} size={24} color={objetivos[item.key] ? "#e95a0c" : "#888"} />
              <Text style={styles.checkboxLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.checkboxRow} onPress={() => handleCheckboxChange(setObjetivos, 'otro')}>
            <Ionicons name={objetivos.otro ? "checkbox" : "square-outline"} size={24} color={objetivos.otro ? "#e95a0c" : "#888"} />
            <Text style={styles.checkboxLabel}>Otro</Text>
          </TouchableOpacity>
          {errors.objetivos && <Text style={styles.errorText}>{errors.objetivos}</Text>}
          {objetivos.otro && (
            <View style={styles.otroInputContainer}>
              <TextInput
                style={styles.input}
                value={objetivos.otroTexto}
                onChangeText={(text) => handleOtroTextChange(setObjetivos, text)}
                placeholder="¿Cuál?"
              />
              {objetivos.otroTexto.trim() && (
                <Text style={styles.selectedText}>Selección: {objetivos.otroTexto}</Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Objetivo(s) del PDI Asociado(s):</Text>
          {objetivosPDI.map((objetivo, index) => (
            <View key={index} style={styles.objetivoPDIRow}>
              <Text style={styles.objetivoPDINumber}>{index + 1}.</Text>
              <TextInput
                style={styles.objetivoPDIInput}
                value={objetivo}
                onChangeText={(text) => handleObjetivoPDIChange(index, text)}
                placeholder={`Objetivo ${index + 1}`}
                multiline
              />
            </View>
          ))}

          <Text style={styles.label}>Definición del Segmento Objetivo (puede seleccionar más de un público):</Text>
          {SEGMENTO_OBJETIVO.map((item) => {
            const stateKey = item.label.charAt(0).toLowerCase() + item.label.slice(1).replace(' ', '');
            return (
              <TouchableOpacity key={item.id} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setSegmentoObjetivo, stateKey)}>
                <Ionicons name={segmentoObjetivo[stateKey] ? "checkbox" : "square-outline"} size={24} color={segmentoObjetivo[stateKey] ? "#e95a0c" : "#888"} />
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
          {segmentoObjetivo.otro && (
            <View style={styles.otroInputContainer}>
              <TextInput
                style={styles.input}
                value={segmentoObjetivo.otroTexto}
                onChangeText={(text) => handleOtroTextChange(setSegmentoObjetivo, text)}
                placeholder="¿Cuál?"
              />
              {segmentoObjetivo.otroTexto.trim() && (
                <Text style={styles.selectedText}>Selección: {segmentoObjetivo.otroTexto}</Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Argumentación:</Text>
          <View style={[styles.inputGroup, { alignItems: 'flex-start' }, errors.argumentacion && styles.inputError]}>
            <Ionicons name="text-outline" size={20} style={[styles.inputIcon, { paddingTop: 14 }]} />
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Breve descripción sustentada de la congruencia del evento con los objetivos especificados"
              value={argumentacion}
              onChangeText={setArgumentacion}
            />
          </View>
          {errors.argumentacion && <Text style={styles.errorText}>{errors.argumentacion}</Text>}
        </View>

        {/* III. RESULTADOS ESPERADOS */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>III. RESULTADOS ESPERADOS</Text>
          <View style={styles.resultadoRow}>
            <Text style={styles.resultadoLabel}>Participación Efectiva</Text>
            <TextInput
              style={styles.resultadoInput}
              placeholder="Ej: 150"
              value={resultadosEsperados.participacion}
              onChangeText={(text) => handleResultadoChange('participacion', text)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.resultadoRow}>
            <Text style={styles.resultadoLabel}>Índice de Satisfacción</Text>
            <TextInput
              style={styles.resultadoInput}
              placeholder="Ej: 90% de satisfacción"
              value={resultadosEsperados.satisfaccion}
              onChangeText={(text) => handleResultadoChange('satisfaccion', text)}
            />
          </View>
          <View style={styles.resultadoRow}>
            <Text style={styles.resultadoLabel}>Otro</Text>
            <TextInput
              style={styles.resultadoInput}
              placeholder="Otro resultado medible"
              value={resultadosEsperados.otro}
              onChangeText={(text) => handleResultadoChange('otro', text)}
            />
          </View>
        </View>

        {/* IV. COMITÉ DEL EVENTO */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>IV. COMITÉ DEL EVENTO</Text>
          <Text style={styles.comiteDescription}>
            Grupo de personas conformado por responsables de diferentes áreas de la Universidad cuya participación es fundamental para el éxito del evento, conformado básicamente por el Director Administrativo Financiero, el Director de Marketing y Admisiones y el Organizador.
          </Text>
        </View>

        {/* V. RECURSOS NECESARIOS */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>V. RECURSOS NECESARIOS</Text>
        </View>
         

         <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>Recursos Adicionales Requeridos</Text>
        <Text style={styles.subsectionDescription}>
          Describe recursos que no están disponibles en la universidad y necesitas solicitar, comprar o contratar:
        </Text>

        {recursos.map((resource, index) => (
          <View key={index} style={styles.resourceInputGroup}>
            <Ionicons name="cube-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.resourceInput}
              placeholder={`Recurso ${index + 1}`}
              placeholderTextColor="#999"
              value={resource}
              onChangeText={(text) => updateResource(text, index)}
            />
            {recursos.length > 1 && ( // Permite eliminar si hay más de un recurso
              <TouchableOpacity onPress={() => removeResource(index)} style={styles.removeButton}>
                <Ionicons name="remove-circle-outline" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={addResource} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007bff" />
          <Text style={styles.addButtonText}>Agregar otro recurso</Text>
        </TouchableOpacity>
      </View>
    
         
        {/* VI. PRESUPUESTO */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>VI. PRESUPUESTO</Text>
          <TablaPresupuesto
            titulo="EGRESOS"
            items={egresos}
            setItems={setEgresos}
            totalGeneral={totalEgresos}
            handlePresupuestoChange={handlePresupuestoChange}
            eliminarFilaPresupuesto={eliminarFilaPresupuesto}
            agregarFilaPresupuesto={agregarFilaPresupuesto}
          />
          <TablaPresupuesto
            titulo="INGRESOS"
            items={ingresos}
            setItems={setIngresos}
            totalGeneral={totalIngresos}
            handlePresupuestoChange={handlePresupuestoChange}
            eliminarFilaPresupuesto={eliminarFilaPresupuesto}
            agregarFilaPresupuesto={agregarFilaPresupuesto}
          />
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>BALANCE ECONÓMICO</Text>
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#27ae60' : '#c0392b' }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        </View>
</ScrollView>
        {/* BOTÓN DE ENVÍO */}
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={[styles.submitButton, isLoading && styles.buttonDisabled]}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Crear Proyecto de Evento</Text>}
        </TouchableOpacity>
    </KeyboardAvoidingView>
    );

};

// --- Estilos ---
const styles = StyleSheet.create({
     helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: 'italic'
  },
  loadingIndicator: {
    marginVertical: 20
  },
  recursosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15
  },
   container: {
    flex: 1,
    padding: 20,
    width:'100%',
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
   flex: 1,
   width: '100%',
   overflow:'hidden'
},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  additionalResourcesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  additionalResourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  additionalResourcesDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinea el icono con la parte superior del texto
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fdfdfd',
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 2, // Ajusta si es necesario para la alineación vertical
  },
  input: {
    flex: 1, // Permite que el TextInput ocupe el espacio restante
    fontSize: 14,
    color: '#333',
    minHeight: 100, // Altura mínima para el área de texto
    paddingVertical: 0, // Elimina padding vertical predeterminado si lo hay
    paddingHorizontal: 0, // Elimina padding horizontal predeterminado si lo hay
  },
  recursoCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    minHeight: 80
  },
  recursoCardSelected: {
    backgroundColor: '#fff5f0',
    borderColor: '#e95a0c',
    borderWidth: 2
  },
  recursoCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5
  },
  recursoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  recursoNombreSelected: {
    color: '#e95a0c'
  },
  recursoTipo: {
    fontSize: 11,
    color: '#888',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  recursoDescripcion: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
    marginBottom: 4
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  disponibilidadText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4
  },
  recursosSeleccionadosContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e95a0c'
  },
  recursosSeleccionadosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e95a0c',
    marginBottom: 8
  },
  recursosSeleccionadosList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  recursoSeleccionadoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e95a0c',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 2
  },
  recursoSeleccionadoText: {
    color: 'white',
    fontSize: 12,
    marginRight: 5
  },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  clockContainer: {
  alignItems: 'center',
  marginBottom: 15,
  paddingVertical: 10,
},
digitalDisplay: {
  backgroundColor: '#e95a0c',
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 10,
  marginBottom: 15,
  borderWidth: 2,
  borderColor: '#d35400',
  shadowColor: '#d35400',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},
digitalTime: {
  fontSize: 20,
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  fontWeight: 'bold',
  color: '#ffffff',
  textAlign: 'center',
  textShadowColor: '#efebe8ff',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 1,
},
instructionsContainer: {
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 10,
  backgroundColor: '#ffffff',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e0e0e0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
instructionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 4,
},
colorIndicator: {
  width: 12,
  height: 3,
  borderRadius: 2,
  marginRight: 6,
},
instructionText: {
  fontSize: 12,
  color: '#374151',
  fontWeight: '500',
},
periodContainer: {
  flexDirection: 'row',
  backgroundColor: '#ffffff',
  borderRadius: 8,
  marginLeft: 10,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
periodButton: {
  paddingHorizontal: 10,
  paddingVertical: 6,
},
periodButtonActive: {
  backgroundColor: '#e95a0c',
},
periodText: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#374151',
},
periodTextActive: {
  color: '#ffffff',
},
  separadorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd'
  },
  separadorTexto: {
    marginHorizontal: 15,
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold'
  },
  textAreaLarge: {
    height: 120,
    textAlignVertical: 'top'
  },
  caracterCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 10
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F4F7F9'
  },
  scrollView: {
    flex: 1
  },
  selectedText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    marginLeft: 36,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 60,
    flexGrow: 1 // This is crucial! Allows content to grow and push the scrollbar if needed.
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 15,
    paddingHorizontal: 20
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500'
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15
  },
  inputError: {
    borderColor: 'red'
  },
  errorText: {
    color: 'red',
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 12
  },
  inputIcon: {
    paddingHorizontal: 12,
    color: '#888'
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingRight: 15,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 15
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15
  },
  datePickerText: {
    fontSize: 16,
    color: '#333'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333'
  },
  otroInputContainer: {
    marginLeft: 36,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  objetivoPDIRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  objetivoPDINumber: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    marginTop: 12,
    fontWeight: '500'
  },
  objetivoPDIInput: {
    flex: 1,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 50
  },
  resultadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  resultadoLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  resultadoInput: {
    flex: 2,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333'
  },
  comiteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify'
  },
  tablaContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 25,
    padding: 5
  },
  tablaTitulo: {
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7
  },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 5,
    paddingVertical: 8
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2
  },
  rowText: {
    paddingHorizontal: 5,
    fontSize: 12
  },
  rowInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    margin: 2,
    fontSize: 12,
    backgroundColor: '#fff'
  },
  deleteButtonSmall: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonSmall: {
    padding: 8
  },
  addButtonTextSmall: {
    color: '#007BFF',
    textAlign: 'center'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7
  },
  totalText: {
    fontWeight: 'bold',
    marginRight: 20
  },
  totalAmount: {
    fontWeight: 'bold'
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  balanceText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  balanceAmount: {
    fontWeight: 'bold',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#e95a0c',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#f9bda3'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
  },
  digitalDisplay: {
    backgroundColor: '#e95a0c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e95a0c',
    shadowColor: '#e95a0c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  digitalTime: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  instructionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  colorIndicator: {
    width: 16,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginLeft: 12,
    overflow: 'hidden',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodButtonActive: {
    backgroundColor: '#e95a0c',
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  periodTextActive: {
    color: 'white',
  },
  // New styles for additional resources section
  subsection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subsectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    lineHeight: 18,
  },
  resourceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 10,
},
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: 'italic'
  },
  loadingIndicator: {
    marginVertical: 20
  },
  recursosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15
  },
   container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    marginHorizontal:0,
    marginTop:0
  },
  additionalResourcesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  additionalResourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  additionalResourcesDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinea el icono con la parte superior del texto
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fdfdfd',
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 2, // Ajusta si es necesario para la alineación vertical
  },
  input: {
    flex: 1, // Permite que el TextInput ocupe el espacio restante
    fontSize: 14,
    color: '#333',
    minHeight: 100, // Altura mínima para el área de texto
    paddingVertical: 0, // Elimina padding vertical predeterminado si lo hay
    paddingHorizontal: 0, // Elimina padding horizontal predeterminado si lo hay
  },
  recursoCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    minHeight: 80
  },
  recursoCardSelected: {
    backgroundColor: '#fff5f0',
    borderColor: '#e95a0c',
    borderWidth: 2
  },
  recursoCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5
  },
  recursoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  recursoNombreSelected: {
    color: '#e95a0c'
  },
  recursoTipo: {
    fontSize: 11,
    color: '#888',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  recursoDescripcion: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
    marginBottom: 4
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  disponibilidadText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4
  },
  recursosSeleccionadosContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e95a0c'
  },
  recursosSeleccionadosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e95a0c',
    marginBottom: 8
  },
  recursosSeleccionadosList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  recursoSeleccionadoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e95a0c',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 2
  },
  recursoSeleccionadoText: {
    color: 'white',
    fontSize: 12,
    marginRight: 5
  },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  separadorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd'
  },
  separadorTexto: {
    marginHorizontal: 15,
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold'
  },
  textAreaLarge: {
    height: 120,
    textAlignVertical: 'top'
  },
  caracterCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 10
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F4F7F9'
  },
  scrollView: {
    flex: 1
  },
  selectedText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    marginLeft: 36,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 60
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 15,
    paddingHorizontal: 20
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500'
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15
  },
  inputError: {
    borderColor: 'red'
  },
  errorText: {
    color: 'red',
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 12
  },
  inputIcon: {
    paddingHorizontal: 12,
    color: '#888'
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingRight: 15,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 15
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15
  },
  datePickerText: {
    fontSize: 16,
    color: '#333'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333'
  },
  otroInputContainer: {
    marginLeft: 36,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  objetivoPDIRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  objetivoPDINumber: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    marginTop: 12,
    fontWeight: '500'
  },
  objetivoPDIInput: {
    flex: 1,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 50
  },
  resultadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  resultadoLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  resultadoInput: {
    flex: 2,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333'
  },
  comiteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify'
  },
  tablaContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 25,
    padding: 5
  },
  tablaTitulo: {
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7
  },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 5,
    paddingVertical: 8
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2
  },
  rowText: {
    paddingHorizontal: 5,
    fontSize: 12
  },
  rowInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    margin: 2,
    fontSize: 12,
    backgroundColor: '#fff'
  },
  deleteButtonSmall: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonSmall: {
    padding: 8
  },
  addButtonTextSmall: {
    color: '#007BFF',
    textAlign: 'center'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7
  },
  totalText: {
    fontWeight: 'bold',
    marginRight: 20
  },
  totalAmount: {
    fontWeight: 'bold'
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  balanceText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  balanceAmount: {
    fontWeight: 'bold',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#e95a0c',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#f9bda3'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
  },
  digitalDisplay: {
    backgroundColor: '#e95a0c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e95a0c',
    shadowColor: '#e95a0c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  digitalTime: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  instructionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  colorIndicator: {
    width: 16,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginLeft: 12,
    overflow: 'hidden',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodButtonActive: {
    backgroundColor: '#e95a0c',
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  periodTextActive: {
    color: 'white',
  },
});

export default ProyectoEvento;