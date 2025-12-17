import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
    } catch (e) {}
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {}
  }
};

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFEDD5',
  secondary: '#4B5563',
  accent: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  shadow: 'rgba(0, 0, 0, 0.05)',
  white: '#FFFFFF',
  black: '#000000',
};

const DashboardCard = ({ title, value, icon, color, trend, description }) => {
  const trendColor = trend > 0 ? COLORS.success : COLORS.warning;
  const trendIcon = trend > 0 ? 'arrow-up' : 'arrow-down';

  return (
    <View style={styles.dashboardCardMinimal}>
      <View style={styles.dashboardCardHeaderMinimal}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.dashboardCardValueMinimal}>{value}</Text>
      </View>
      <Text style={styles.dashboardCardTitleMinimal}>{title}</Text>
      {trend && (
        <View style={styles.dashboardCardTrendMinimal}>
          <Ionicons name={trendIcon} size={14} color={trendColor} />
          <Text style={[styles.dashboardCardTrendTextMinimal, { color: trendColor }]}>
            {Math.abs(trend)}% {trend > 0 ? 'más' : 'menos'}
          </Text>
        </View>
      )}
      {description && (
        <Text style={styles.dashboardCardDescriptionMinimal}>{description}</Text>
      )}
    </View>
  );
};

const ActionCardLarge = ({ action, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 100,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Acción: ${action.title}`}
      style={{ marginBottom: 16, width: '100%' }}
    >
      <Animated.View
        style={[
          styles.actionCardLarge,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={[styles.actionCardLargeIcon, { backgroundColor: action.color + '15' }]}>
          <Ionicons name={action.iconName} size={32} color={action.color} />
        </View>
        <View style={styles.actionCardLargeContent}>
          <View style={styles.actionCardLargeTitleContainer}>
            <Text style={styles.actionCardLargeTitle}>{action.title}</Text>
            {action.badge && (
              <View style={[styles.actionCardLargeBadge, { backgroundColor: action.badgeColor || COLORS.primary }]}>
                <Text style={styles.actionCardLargeBadgeText}>{action.badge}</Text>
              </View>
            )}
          </View>
          {action.description && (
            <Text style={styles.actionCardLargeDescription}>{action.description}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward-outline" size={24} color={COLORS.textTertiary} />
      </Animated.View>
    </Pressable>
  );
};

const MinimalBottomDock = ({ onLogout, onActionPress, isExpanded, onToggleExpanded }) => {
  const dockHeight = useRef(new Animated.Value(60)).current;
  const expandedHeight = 200;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dockHeight, {
        toValue: isExpanded ? expandedHeight : 60,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const quickActions = [
    {
      id: 'add-user',
      title: 'Nuevo Usuario',
      icon: 'person-add-outline',
      color: COLORS.primary,
      action: '/admin/UsuariosA'
    },
    {
      id: 'aprobados',
      title: 'Aprobados',
      icon: 'checkmark-circle-outline',
      color: COLORS.success,
      action: '/admin/EventosAprobados'
    },
    {
      id: 'settings',
      title: 'Ajustes',
      icon: 'settings-outline',
      color: COLORS.secondary,
      action: '/admin/Settings'
    }
  ];

  return (
    <Animated.View style={[styles.minimalDockContainer, { height: dockHeight }]}>
      <Pressable onPress={onToggleExpanded} style={styles.minimalDockToggle}>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-up-outline" size={20} color={COLORS.white} />
        </Animated.View>
        <Text style={styles.minimalDockToggleText}>Menú</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.minimalDockExpandedContent}>
          <View style={styles.minimalDockQuickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.minimalDockQuickActionButton}
                onPress={() => onActionPress(action.action)}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                <Text style={[styles.minimalDockQuickActionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.minimalDockLogoutButton}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.minimalDockLogoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const MinimalHeader = ({ nombreUsuario, unreadCount, onNotificationPress }) => {
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={styles.minimalHeaderContainer}>
      <View style={styles.minimalHeaderTop}>
        <Text style={styles.minimalHeaderAdminText}>admin</Text>
        <TouchableOpacity
          style={styles.minimalNotificationButton}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.minimalNotificationBadge}>
              <Text style={styles.minimalNotificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.minimalHeaderGreeting}>
        <Text style={styles.minimalGreetingText}>{getCurrentGreeting()},</Text>
        <Text style={styles.minimalUserNameText}>{nombreUsuario}</Text>
      </View>
      <Text style={styles.minimalHeaderTitle}>Panel de Administración del Area de DAF</Text>
    </View>
  );
};

const DataTable = ({ data, columns, onPrint }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.tableEmptyContainer}>
        <Text style={styles.tableEmptyText}>No hay eventos disponibles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.dataTableContainer}>
      <View style={styles.dataTableHeaderRow}>
        {columns.map((col, index) => (
          <Text key={index} style={[styles.dataTableHeader, { flex: col.flex }]}>
            {col.title}
          </Text>
        ))}
      </View>

      {data.map((row, rowIndex) => (
        <View
          key={row.id}
          style={[
            styles.dataTableRow,
            rowIndex % 2 === 0 ? styles.dataTableRowEven : null,
          ]}
        >
          {columns.map((col, colIndex) => {
            if (col.key === 'actions') {
              return (
                <View key={colIndex} style={[styles.dataTableCell, { flex: col.flex, justifyContent: 'center' }]}>
                  {row.state === 'Aprobado' && (
                    <TouchableOpacity
                      style={styles.printButton}
                      onPress={() => onPrint(row.id)}
                    >
                      <Ionicons name="print-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.printButtonText}>Imprimir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            let cellContent = row[col.key] || '—';
            let cellStyle = styles.dataTableCell;

            if (col.key === 'state') {
              const isApproved = cellContent.toLowerCase().includes('aprobado');
              cellStyle = [
                styles.dataTableCell,
                isApproved ? styles.stateApproved : styles.statePending,
              ];
              cellContent = isApproved ? 'Aprobado' : 'Pendiente';
            }

            if (col.key === 'creator' && cellContent === 'Desconocido') {
              cellStyle = [styles.dataTableCell, styles.creatorUnknown];
            }

            return (
              <Text key={colIndex} style={[cellStyle, { flex: col.flex }]}>
                {cellContent}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const daf = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [urlImagenSubida, setUrlImagenSubida] = useState(null);
  const [dashboardStats, setDashboardStats] = useState([
    { title: 'Usuarios Activos', value: '...', icon: 'people-outline', color: COLORS.primary, trend: 12.5, description: 'Último mes' },
    { title: 'Eventos Totales', value: '...', icon: 'calendar-outline', color: COLORS.info, trend: -3.2, description: 'Último mes' },
    { title: 'Contenidos Pendientes', value: '...', icon: 'document-text-outline', color: COLORS.warning, trend: 18.7, description: 'Última semana' },
    { title: 'Estabilidad Sistema', value: '...', icon: 'pulse-outline', color: COLORS.success, trend: 2.1, description: 'Rendimiento óptimo' },
  ]);

  // ✅ Estado para controlar el evento seleccionado para imprimir

  const unreadCount = notifications.filter(notif => !notif.read).length;
  const tableColumns = [
    { title: 'ID', key: 'id', flex: 1 },
    { title: 'Título', key: 'title', flex: 3 },
    { title: 'Fecha', key: 'date', flex: 2 },
    { title: 'Hora', key: 'time', flex: 1 },
    { title: 'Estado', key: 'state', flex: 1.5 },
    { title: 'Creador', key: 'creator', flex: 3 },
    { title: 'Acciones', key: 'actions', flex: 1.5 }
  ];

  // ✅ Solo abre la pantalla de confirmación
  const handlePrintEvent = (eventoId) => {
   router.push({
    pathname: '/admin/EventoDetalleImp',
    params: { id: eventoId.toString() }
  });
  };

  const generarHtmlReporte = (evento) => {
  const fecha = evento.fechaevento
    ? new Date(evento.fechaevento).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Fecha no disponible';

  const clasificacion = evento.clasificacion
    ? `${evento.clasificacion.label || ''} - ${evento.subcategoria?.label || 'Sin subcategoría'}`
    : 'No especificada';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Evento</title>
  <style>
    body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #E95A0C; padding-bottom: 10px; margin-bottom: 20px; }
    h1 { color: #E95A0C; margin: 0; font-size: 22px; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; display: inline-block; width: 140px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte del Evento</h1>
  </div>
  <div class="field"><span class="label">Título:</span> ${evento.nombreevento || 'Sin título'}</div>
  <div class="field"><span class="label">Fecha:</span> ${fecha}</div>
  <div class="field"><span class="label">Clasificación:</span> ${clasificacion}</div>
</body>
</html>
  `.trim();
};

const generarYCompartirPDF = async (eventoId) => {
  try {
    console.log("🚀 Iniciando impresión del evento ID:", eventoId);

    const token = await getTokenAsync();
    if (!token) {
      Alert.alert('Error', 'No se puede imprimir sin estar autenticado.');
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/eventos/${eventoId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });

    const eventoCompleto = response.data;

    if (!eventoCompleto || !eventoCompleto.nombreevento) {
      throw new Error('Datos del evento incompletos');
    }

    // ✅ Fecha segura
    const fechaEvento = eventoCompleto.fechaevento 
      ? new Date(eventoCompleto.fechaevento).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Fecha no disponible';

    // ✅ Clasificación segura
    const clasificacion = eventoCompleto.clasificacion
      ? `${eventoCompleto.clasificacion.label || ''} - ${eventoCompleto.subcategoria?.label || 'Sin subcategoría'}`
      : 'No especificada';

    // ✅ HTML limpio y seguro (sin riesgo de caracteres rotos)
    const htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #E95A0C; padding-bottom: 10px; }
          h1 { color: #E95A0C; margin: 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; display: inline-block; min-width: 120px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Reporte del Evento</h1></div>
        <div class="field"><span class="label">Título:</span> ${eventoCompleto.nombreevento}</div>
        <div class="field"><span class="label">Fecha:</span> ${fechaEvento}</div>
        <div class="field"><span class="label">Clasificación:</span> ${clasificacion}</div>
      </body>
      </html>
    `;

    console.log("📝 Generando PDF...");

    // ✅ Generar archivo PDF
    const pdf = await Print.printToFileAsync({ html: htmlContent });
    
    if (!pdf?.uri) {
      throw new Error('No se generó el PDF');
    }

    console.log("📄 PDF listo en:", pdf.uri);

    // ✅ Compartir el PDF
    await Sharing.shareAsync(pdf.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
    });

    Alert.alert('Éxito', 'PDF generado y compartido.');

  } catch (error) {
    console.error("❌ Error en PDF:", error);
    Alert.alert('Error', `No se pudo generar el PDF: ${error.message}`);
  } finally {
    // ✅ Cerrar modal SIEMPRE
    setEventoParaImprimir(null);
    setLoadingPrint(false);
  }
};
const seleccionarImagen = async () => {
  // Pedir permisos
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la galería.');
    return;
  }

  // Abrir galería
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    setImagenSeleccionada(result.assets[0].uri);
    setUrlImagenSubida(null); // Resetear si ya había una imagen subida
  }
};
const subirImagen = async () => {
  if (!imagenSeleccionada || !authToken) return;

  setSubiendoImagen(true);
  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('imagen', {
      uri: imagenSeleccionada,
      type: 'image/jpeg',
      name: `croquis_${Date.now()}.jpg`,
    });

    // Subir al servidor
    const response = await axios.post(
      `${API_BASE_URL}/eventos/${idevento}/subir-croquis`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.imageUrl) {
      setUrlImagenSubida(response.data.imageUrl);
      Alert.alert('Éxito', 'Imagen subida correctamente.');
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    Alert.alert('Error', 'No se pudo subir la imagen.');
  } finally {
    setSubiendoImagen(false);
  }
};
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingDashboard(true);
      setLoadingEvents(true);
      try {
        const token = await getTokenAsync();
        if (!token) {
          Alert.alert('Error de Autenticación', 'Por favor, inicia sesión nuevamente');
          return;
        }
          console.log("🔑 Token obtenido:", token);
        const [dashboardRes, eventsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 10000,
          }),
          axios.get(`${API_BASE_URL}/eventos`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 10000,
          })
        ]);
        console.log("📊 Dashboard data:", dashboardRes.data); // ✅ Verifica datos del dashboard
      console.log("📅 Eventos recibidos:", eventsRes.data);
        const data = dashboardRes.data;
        const events = eventsRes.data.map(event => {
          const estadoNormalizado = event.estado?.toLowerCase().includes('aprobado')
            ? 'Aprobado'
            : 'Pendiente';

          return {
            id: event.idevento,
            title: event.nombreevento || 'Sin título',
            date: event.fechaevento ? new Date(event.fechaevento).toLocaleDateString('es-ES') : 'N/A',
            time: event.horaevento || 'N/A',
            state: estadoNormalizado,
            creator: event.academicoCreador
              ? `${event.academicoCreador.nombre || ''} ${event.academicoCreador.apellidopat || ''}`.trim()
              : 'Desconocido'
          };
        });

        setDashboardStats([
          { title: 'Usuarios Activos', value: data.activeUsers?.toLocaleString() || '0', icon: 'people-outline', color: COLORS.primary, trend: 12.5, description: 'Último mes' },
          { title: 'Eventos Totales', value: data.totalEvents?.toString() || '0', icon: 'calendar-outline', color: COLORS.info, trend: -3.2, description: 'Último mes' },
          { title: 'Contenidos Pendientes', value: data.pendingContent?.toString() || '0', icon: 'document-text-outline', color: COLORS.warning, trend: 18.7, description: 'Última semana' },
          { title: 'Estabilidad Sistema', value: `${data.systemStability || 0}%`, icon: 'pulse-outline', color: COLORS.success, trend: 2.1, description: 'Rendimiento óptimo' },
        ]);

        setAllEvents(events);
       } catch (error) {
      console.error("❌ Error en fetchDashboardData:", error); // ✅ Captura el error real
      if (error.response?.status === 401) {
        deleteTokenAsync();
        router.replace('/');
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos.');
      }
    } finally {
      setLoadingDashboard(false);
      setLoadingEvents(false);
    }
  };

  fetchDashboardData();
}, []);

  const adminActions = [
    { id: '1', title: 'Gestión de Usuarios', iconName: 'people-outline', route: '/admin/UsuariosDaf', color: COLORS.secondary, description: 'Administración de cuentas de usuario' },
    { id: '3', title: 'Eventos Aprobados', iconName: 'checkmark-circle-outline', route: '/admin/EventosAprobados', color: COLORS.success, description: 'Gestión de eventos ya aprobados' },
    { id: '4', title: 'Análisis de Datos', iconName: 'analytics-outline', route: '/admin/Estadistica', color: COLORS.info, description: 'Informes y métricas del sistema' },
    { id: '5', title: 'Reportes Avanzados', iconName: 'document-text-outline', route: '/admin/reportes', color: COLORS.secondary, description: 'Generación de reportes detallados', badge: 'Nuevo', badgeColor: COLORS.accent },
    { id: '6', title: 'Creación de Recursos', iconName: 'construct-outline', route: '/admin/Recursos', color: COLORS.warning, description: 'Generación de recursos detallados', badge: 'Nuevo', badgeColor: COLORS.accent },
    { id: '7', title: 'Subida de Loyouts', iconName: 'image-ouline', route: '/admin/Layouts', color: COLORS.warning, description: 'Generación de layouts detallados', badge: 'Nuevo', badgeColor: COLORS.accent },
  ];

  const handleActionPress = (route) => {
    if (route) router.push(route);
    else Alert.alert('Funcionalidad en Desarrollo', 'Esta característica estará disponible próximamente.');
  };

  const handleLogout = async () => {
    Alert.alert('Confirmar Cierre de Sesión', '¿Está seguro que desea cerrar la sesión actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => { await deleteTokenAsync(); router.replace('/'); } },
    ], { cancelable: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isBannerExpanded ? 220 : 80 }]}
      >
        <MinimalHeader
          nombreUsuario={nombreUsuario}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
        />

        <View style={styles.dashboardSectionMinimal}>
          <View style={styles.sectionHeaderMinimal}>
            <Text style={styles.sectionTitleMinimal}>Resumen de Actividad</Text>
            <Text style={styles.sectionSubtitleMinimal}>Métricas clave del sistema</Text>
          </View>
          {loadingDashboard ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.sectionSubtitleMinimal, { marginTop: 10 }]}>Cargando estadísticas...</Text>
            </View>
          ) : (
            <View style={styles.dashboardGridMinimal}>
              {dashboardStats.map((stat, index) => (
                <DashboardCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  trend={stat.trend}
                  description={stat.description}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionTitleMinimal}>Todos los Eventos</Text>
            <Text style={styles.sectionSubtitleMinimal}>Eventos aprobados y pendientes</Text>
          </View>
          {loadingEvents ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.sectionSubtitleMinimal, { marginTop: 8 }]}>Cargando eventos...</Text>
            </View>
          ) : (
            <DataTable
              data={allEvents}
              columns={tableColumns}
              onPrint={handlePrintEvent}
            />
          )}
        </View>

        <View style={styles.actionsSectionMinimal}>
          <View style={styles.sectionHeaderMinimal}>
            <Text style={styles.sectionTitleMinimal}>Herramientas de Gestión</Text>
            <Text style={styles.sectionSubtitleMinimal}>Acceda a las funcionalidades principales</Text>
          </View>
          <View style={{ width: '100%' }}>
            {adminActions.map((action, index) => (
              <ActionCardLarge
                key={action.id}
                action={action}
                onPress={() => handleActionPress(action.route)}
                index={index}
              />
            ))}
          </View>
        </View>

      
      </ScrollView>

      <MinimalBottomDock
        onLogout={handleLogout}
        onActionPress={handleActionPress}
        isExpanded={isBannerExpanded}
        onToggleExpanded={() => setIsBannerExpanded(!isBannerExpanded)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 80 },
  minimalHeaderContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  minimalHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  minimalHeaderAdminText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  minimalNotificationButton: { position: 'relative', padding: 4 },
  minimalNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  minimalNotificationBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  minimalHeaderGreeting: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  minimalGreetingText: { fontSize: 22, fontWeight: '500', color: COLORS.textSecondary },
  minimalUserNameText: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  minimalHeaderTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  sectionHeaderMinimal: { marginBottom: 24, paddingHorizontal: 4 },
  sectionTitleMinimal: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  sectionSubtitleMinimal: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '400' },
  dashboardSectionMinimal: { width: '100%', paddingHorizontal: 20, marginTop: 30 },
  dashboardGridMinimal: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  dashboardCardMinimal: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '48%',
    minHeight: 130,
    justifyContent: 'space-between',
  },
  dashboardCardHeaderMinimal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dashboardCardValueMinimal: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  dashboardCardTitleMinimal: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  dashboardCardTrendMinimal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  dashboardCardTrendTextMinimal: { fontSize: 12, fontWeight: '600' },
  dashboardCardDescriptionMinimal: { fontSize: 11, color: COLORS.textTertiary },
  actionsSectionMinimal: { width: '100%', paddingHorizontal: 20, marginTop: 40, marginBottom: 40 },
  actionCardLarge: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionCardLargeIcon: { width: 60, height: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionCardLargeContent: { flex: 1 },
  actionCardLargeTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  actionCardLargeTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  actionCardLargeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  actionCardLargeBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  actionCardLargeDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  minimalDockToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  minimalDockToggleText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  minimalDockExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  minimalDockQuickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 15, gap: 10 },
  minimalDockQuickActionButton: { alignItems: 'center', paddingVertical: 8, width: '22%' },
  minimalDockQuickActionText: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  minimalDockLogoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    width: '100%',
  },
  minimalDockLogoutButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '600', marginLeft: 8 },
  eventsSection: { width: '100%', paddingHorizontal: 20, marginTop: 30, marginBottom: 40 },
  eventsSectionHeader: { marginBottom: 20 },
  dataTableContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dataTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
  },
  dataTableHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
  },
  dataTableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  dataTableCell: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  stateApproved: {
    color: COLORS.success,
    fontWeight: '600',
  },
  statePending: {
    color: COLORS.warning,
    fontWeight: '600',
  },
  creatorUnknown: {
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  tableEmptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  tableEmptyText: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  printButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  // ✅ Estilos del modal de confirmación
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  printModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  printModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  printModalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  printModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  printModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default daf;