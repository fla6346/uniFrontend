import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { PieChart } from 'react-native-chart-kit';
import Svg, { Line,Circle, Text as SvgText, Path, G,React } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Chatbot from '../chatbot';

let determinedApiBaseUrl;
/*if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else {
  determinedApiBaseUrl = 'http://localhost:3001/api';
}*/
const API_BASE_URL = 'https://unibackend-1-izpi.onrender.com/api';
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

const CARD_MARGIN = 12;
const MIN_CARD_WIDTH_DASHBOARD = 160;
const MAX_COLUMNS_DASHBOARD = 4;
const MIN_CARD_WIDTH_ACTIONS = 200;
const MAX_COLUMNS_ACTIONS = 3;
const CustomLineChart = ({ data, width, height, color = COLORS.primary }) => {
  if (!data?.labels?.length) return null;
  const labels = data.labels;
  const values = data.datasets[0].data;
  const padding = { top: 24, right: 20, bottom: 36, left: 44 };
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const pts = values.map((v, i) => ({
    x: padding.left + (i / Math.max(values.length - 1, 1)) * cw,
    y: padding.top + ch - ((v - minV) / range) * ch,
    v, label: labels[i],
  }));

  let line = '';
  pts.forEach((p, i) => {
    if (i === 0) { line = `M ${p.x} ${p.y}`; return; }
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    line += ` C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  });

  const area = `${line} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
  const gridPercents = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Svg width={width} height={height}>
      {gridPercents.map((pct, i) => {
        const y = padding.top + ch * (1 - pct);
        return (
          <G key={i}>
            <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke={COLORS.border} strokeWidth="1" strokeDasharray="4,4" />
            <SvgText x={padding.left - 6} y={y + 4} fontSize="10"
              fill={COLORS.textSecondary} textAnchor="end">
              {Math.round(minV + range * pct)}
            </SvgText>
          </G>
        );
      })}
      <Path d={area} fill={color} fillOpacity={0.1} />
      <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={5} fill={COLORS.surface} stroke={color} strokeWidth={2} />
          <Circle cx={p.x} cy={p.y} r={3} fill={color} />
          <SvgText x={p.x} y={height - padding.bottom + 22} fontSize="11"
            fill={COLORS.textSecondary} textAnchor="middle" fontWeight="500">
            {p.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
};
const CustomBarChart = ({ data, width, height, color = COLORS.primary }) => {
  if (!data?.labels?.length) return null;
  const labels = data.labels;
  const values = data.datasets[0].data;
  const padding = { top: 24, right: 16, bottom: 44, left: 44 };
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;
  const maxV = Math.max(...values, 1);
  const barW = Math.max((cw / labels.length) * 0.55, 8);
  const gap = cw / labels.length;

  return (
    <Svg width={width} height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = padding.top + ch * (1 - pct);
        return (
          <G key={i}>
            <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke={COLORS.border} strokeWidth="1" strokeDasharray="4,4" />
            <SvgText x={padding.left - 6} y={y + 4} fontSize="10"
              fill={COLORS.textSecondary} textAnchor="end">
              {Math.round(maxV * pct)}
            </SvgText>
          </G>
        );
      })}
      {values.map((v, i) => {
        const barH = (v / maxV) * ch;
        const x = padding.left + gap * i + (gap - barW) / 2;
        const y = padding.top + ch - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH}
              fill={color} rx={4} ry={4} fillOpacity={0.85} />
            {v > 0 && (
              <SvgText x={x + barW / 2} y={y - 5} fontSize="10"
                fill={color} textAnchor="middle" fontWeight="700">
                {v}
              </SvgText>
            )}
            <SvgText x={x + barW / 2} y={height - padding.bottom + 16} fontSize="10"
              fill={COLORS.textSecondary} textAnchor="middle" fontWeight="500"
              numberOfLines={1}>
              {labels[i].length > 5 ? labels[i].slice(0, 5) + '…' : labels[i]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};
const DashboardCard = ({ title, value, icon, color, trend, description }) => {
  const trendColor = trend > 0 ? COLORS.success : COLORS.warning;
  const trendIcon = trend > 0 ? 'arrow-up' : 'arrow-down';

  const safeColor = color || COLORS.primary;
  const safeIcon = icon || 'information-circle-outline';
  const safeValue = value || '0';
  const safeTitle = title || 'Sin título';

  return (
    <View style={styles.dashboardCardMinimal}>
      <View style={styles.dashboardCardTopRow}>
        <Ionicons name={safeIcon} size={32} color={safeColor} />
        <Text style={styles.dashboardCardValueMinimal}>{safeValue}</Text>
      </View>
      <Text style={styles.dashboardCardTitleMinimal}>{safeTitle}</Text>
      {description && (
        <Text style={styles.dashboardCardDescriptionMinimal}>{description}</Text>
      )}
      {trend !== null && trend !== undefined && (
        <View style={styles.dashboardCardTrendMinimal}>
          <Ionicons name={trendIcon} size={14} color={trendColor} />
          <Text style={[styles.dashboardCardTrendTextMinimal, { color: trendColor }]}>
            {Math.abs(trend)}% {trend > 0 ? 'más' : 'menos'}
          </Text>
        </View>
      )}
    </View>
  );
};

const ManagementToolCard = ({ title, description, icon, color, badge, onPress, cardWidth }) => {
  const safeColor = color || COLORS.secondary;
  const safeIcon = icon || 'information-circle-outline';
  const safeTitle = title || 'Sin título';
  const safeDescription = description || '';
  
  return (
    <TouchableOpacity
      style={[styles.managementToolCardMinimal, {
        borderColor: safeColor + '20',
        width: cardWidth,
      }]}
      onPress={onPress}
    >
      <View style={styles.managementToolCardHeaderMinimal}>
        <View style={[styles.managementToolCardIconMinimal, { backgroundColor: safeColor + '10' }]}>
          <Ionicons name={safeIcon} size={24} color={safeColor} />
        </View>
        <View style={styles.managementToolCardTextContainerMinimal}>
          <Text style={styles.managementToolCardTitleMinimal} numberOfLines={2} ellipsizeMode='tail'>
            {safeTitle}
          </Text>
          {safeDescription && (
            <Text style={styles.managementToolCardDescriptionMinimal} numberOfLines={2} ellipsizeMode='tail'>
              {safeDescription}
            </Text>
          )}
        </View>
        {badge && (
          <View style={[styles.managementToolCardBadgeMinimal, { backgroundColor: safeColor }]}>
            <Text style={styles.managementToolCardBadgeTextMinimal}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
const Section = ({ title, subtitle, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {children}
  </View>
);

// ─────────────────────────────────────────────
// CHART CARD WRAPPER
// ─────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, empty, emptyIcon }) => (
  <View style={styles.chartCard}>
    <View style={styles.chartCardHeader}>
      <Text style={styles.chartCardTitle}>{title}</Text>
      {subtitle && <Text style={styles.chartCardSubtitle}>{subtitle}</Text>}
    </View>
    {empty ? (
      <View style={styles.chartEmpty}>
        <Ionicons name={emptyIcon || 'bar-chart-outline'} size={44} color={COLORS.textTertiary} />
        <Text style={styles.chartEmptyText}>Sin datos disponibles</Text>
      </View>
    ) : children}
  </View>
);
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
      id: 'pendientes',
      title: 'Pendientes',
      icon: 'document-text-outline',
      color: COLORS.warning,
      action: '/admin/EventosPendientes'
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
    <Animated.View style={[styles.dock, { height: dockHeight }]}>
      <Pressable onPress={onToggleExpanded} style={styles.dockToggle}>
        <Animated.View style={{ transform: [{ rotateInterpolate }] }}>
          <Ionicons name="chevron-up-outline" size={20} color={COLORS.white} />
        </Animated.View>
        <Text style={styles.dockToggleText}>Menú rápido</Text>
      </Pressable>
      {isExpanded && (
        <View style={styles.dockExpanded}>
          <View style={styles.dockActions}>
            {quickActions.map(a => (
              <TouchableOpacity key={a.id} style={styles.dockActionBtn} onPress={() => onActionPress(a.action)}>
                <Ionicons name={a.icon} size={24} color={a.color} />
                <Text style={[styles.dockActionText, { color: a.color }]}>{a.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.dockLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.dockLogoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const MinimalHeader = ({ nombreUsuario, unreadCount, onNotificationPress }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerGreeting}>{greeting},</Text>
          <Text style={styles.headerName}>{nombreUsuario}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle}>Panel de Administración</Text>
    </View>
  );
};

const HomeAdministradorScreen = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingContentCount, setPendingContentCount] = useState('0');
  const [approvedEventsCount, setApprovedEventsCount] = useState('0');
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [eventosPorEstado, setEventosPorEstado] = useState(null);
  const [eventosPorDia, setEventosPorDia] = useState(null);
  const [tiempoPromedioAprobacion, setTiempoPromedioAprobacion] = useState('0');
  const [usuariosNuevosEsteMes, setUsuariosNuevosEsteMes] = useState('0');
  const [eventosPorFacultad,setEventosPorFacultad] = useState(null);
  const unreadCount = notifications.filter(notif => !notif.read).length;
  const [eventosPorMes, setEventosPorMes] = useState(null);
  
  const [dashboardStats, setDashboardStats] = useState([
    { title: 'Usuarios Activos', value: 'cargando...', icon: 'people-outline', color: COLORS.primary, trend: null, description: 'Cuentas habilitadas' },
    { title: 'Eventos Totales', value: 'cargando...', icon: 'calendar-outline', color: COLORS.info, trend: null, description: 'Todos los eventos' },
    { title: 'Pendientes', value: 'cargando...', icon: 'document-text-outline', color: COLORS.warning, trend: null, description: 'Esperando aprobación' },
    { title: 'Aprobados ', value: 'cargando...', icon: 'checkmark-done-outline', color: COLORS.success, trend: null, description: 'Este mes' },
    { title: 'Tasa Aprobación', value: 'cargando...', icon: 'analytics-outline', color: COLORS.info, trend: null, description: 'Eventos aprobados / totales' },
    { title: 'Estabilidad', value: 'cargando...', icon: 'pulse-outline', color: COLORS.success, trend: null, description: 'Rendimiento del sistema' },
  ]);


 const fetchDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const token = await getTokenAsync();
      if (!token) { setLoadingDashboard(false); return; }

      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const data = response.data;
    let eventosPorMesData = null;
    try {
      const mensualResponse = await axios.get(`${API_BASE_URL}/dashboard/mensual`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      // Transformar los datos de getMensualStats al formato que espera el gráfico
      if (Array.isArray(mensualResponse.data) && mensualResponse.data.length > 0) {
        eventosPorMesData = {
          labels: mensualResponse.data.map(i => i.mes),
          datasets: [{  data: mensualResponse.data.map(i => i.totalEvents) }],
        };
      }
    } catch (mensualError) {
      console.warn('⚠️ No se pudieron cargar datos mensuales:', mensualError.message);
    }
      // Estado counts → pie chart
      if (data.estadoCounts && typeof data.estadoCounts === 'object') {
        setPendingContentCount((data.estadoCounts.pendiente || 0).toString());
        setApprovedEventsCount((data.estadoCounts.aprobado || 0).toString());
        const stateColors = { aprobado: COLORS.success, pendiente: COLORS.warning, rechazado: COLORS.accent };
        const pieData = Object.entries(data.estadoCounts)
          .filter(([, v]) => typeof v === 'number' && v > 0)
          .map(([k, v]) => ({
            name: k.charAt(0).toUpperCase() + k.slice(1),
            population: v,
            color: stateColors[k.toLowerCase()] || COLORS.info,
            legendFontColor: COLORS.textPrimary,
            legendFontSize: 12,
          }));
        setEventosPorEstado(pieData.length > 0 ? pieData : null);
      }

      // Eventos por día → line chart
      if (Array.isArray(data.eventosPorDia) && data.eventosPorDia.length > 0) {
        setEventosPorDia({
          labels: data.eventosPorDia.map(item => {
            const d = new Date(item.fecha);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }),
          datasets: [{ data: data.eventosPorDia.map(i => i.total || 0) }],
        });
      } else { setEventosPorDia(null); }

      // Eventos por mes → bar chart
      if (Array.isArray(data.eventosPorMes) && data.eventosPorMes.length > 0) {
        setEventosPorMes({
          labels: data.eventosPorMes.map(i => i.mes),
          datasets: [{ data: data.eventosPorMes.map(i => i.total) }],
        });
      } else { setEventosPorMes(null); }

      // Eventos por facultad → bar chart
      if (Array.isArray(data.eventosPorFacultad) && data.eventosPorFacultad.length > 0) {
        setEventosPorFacultad({
          labels: data.eventosPorFacultad.map(i => i.facultad || 'N/A'),
          datasets: [{ data: data.eventosPorFacultad.map(i => i.total) }],
        });
      } 

      const tiempoPromedio = data.tiempoPromedioAprobacion || 0;
      const usuariosNuevos = data.usuariosNuevosEsteMes || 0;
      setTiempoPromedioAprobacion(tiempoPromedio.toString());
      setUsuariosNuevosEsteMes(usuariosNuevos.toString());

      setDashboardStats([
        { title: 'Usuarios Activos', value: (data.activeUsers || 0).toLocaleString(), icon: 'people-outline', color: COLORS.primary, trend: null, description: 'Cuentas habilitadas' },
        { title: 'Usuarios Nuevos', value: usuariosNuevos.toLocaleString(), icon: 'person-add-outline', color: COLORS.info, trend: null, description: 'Este mes' },
        { title: 'Eventos Totales', value: (data.totalEvents || 0).toString(), icon: 'calendar-outline', color: COLORS.secondary, trend: null, description: 'Todos los eventos' },
        { title: 'Pendientes', value: (data.estadoCounts?.pendiente || 0).toString(), icon: 'document-text-outline', color: COLORS.warning, trend: null, description: 'Esperando aprobación' },
        { title: 'Aprobados', value: (data.estadoCounts?.aprobado || 0).toString(), icon: 'checkmark-done-outline', color: COLORS.success, trend: null, description: 'Eventos aprobados' },
        { title: 'Tasa Aprobación', value: `${data.tasaAprobacion || 0}%`, icon: 'analytics-outline', color: COLORS.info, trend: null, description: 'Aprobados / totales' },
        { title: 'Tiempo Prom. Aprob.', value: `${tiempoPromedio}h`, icon: 'time-outline', color: COLORS.warning, trend: null, description: 'Horas promedio' },
        { title: 'Estabilidad', value: `${data.systemStability || 0}%`, icon: 'pulse-outline', color: COLORS.success, trend: null, description: 'Rendimiento del sistema' },
      ]);

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      setPendingContentCount('0');
      setApprovedEventsCount('0');
      setEventosPorEstado(null);
      setEventosPorDia(null);
      setEventosPorMes(null);
      setEventosPorFacultad(null);
      setDashboardStats(prev => prev.map(s => ({ ...s, value: 'Error' })));
      Alert.alert('Error de Conexión', `No se pudieron cargar los datos.\n\n${error.message}`, [
        { text: 'Reintentar', onPress: fetchDashboardData },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

const fetchNotifications = useCallback(async () => {
  try {
    const token = await getTokenAsync();
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifications(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    // Opcional: Alert.alert('Error', 'No se pudieron cargar las notificaciones.');
  }
}, []);
useEffect(() => {
  const validateSession = async () => {
    const token = await getTokenAsync();
    if (!token) {
      console.log(' No hay sesión activa. Redirigiendo a login...');
      router.replace('/');
      return;
    }
    fetchDashboardData();
    fetchNotifications();
  };

  validateSession();
}, [router,fetchDashboardData,fetchNotifications]);
  const { cardWidth: actionsCardWidth } = useMemo(() => {
    const availableWidth = windowWidth - 40;
    let numColumns = Math.floor(availableWidth / (MIN_CARD_WIDTH_ACTIONS + CARD_MARGIN));
    numColumns = Math.max(1, Math.min(numColumns, MAX_COLUMNS_ACTIONS));
    const totalGaps = CARD_MARGIN * (numColumns - 1);
    const width = (availableWidth - totalGaps) / numColumns;
    return { cardWidth: width };
  }, [windowWidth]);

  const adminActions = [
    {
      id: '1',
      title: 'Gestión de Usuarios',
      iconName: 'people-outline',
      route: '/admin/UsuariosA',
      color: COLORS.secondary,
      description: 'Administración de cuentas de usuario',
    },
    {
      id: '2',
      title: 'Eventos Pendientes',
      iconName: 'timer-outline',
      route: '/admin/EventosPendientes',
      color: COLORS.warning,
      description: 'Revisión y aprobación de eventos',
      badge: `${pendingContentCount} pendientes`,
      badgeColor: COLORS.warning,
    },
    {
      id: '3',
      title: 'Eventos Aprobados',
      iconName: 'checkmark-circle-outline',
      route: '/admin/EventosAprobados',
      color: COLORS.success,
      description: 'Gestión de eventos ya aprobados',
       badge: `${approvedEventsCount} aprobados`,
    },
    {
      id: '4',
      title: 'Análisis de Datos',
      iconName: 'analytics-outline',
      route: '/admin/Estadistica',
      color: COLORS.info,
      description: 'Informes y métricas del sistema',
    },
    {
      id: '5',
      title: 'Reportes Avanzados',
      iconName: 'document-text-outline',
      route: '/admin/reportes',
      color: COLORS.secondary,
      description: 'Generación de reportes detallados',
      badge: 'Nuevo',
      badgeColor: COLORS.accent,
    },
    
  ];

  const handleActionPress = (route) => {
    if (route) {
      router.push(route);
    } else {
      Alert.alert('Funcionalidad en Desarrollo', 'Esta característica estará disponible próximamente.', [{ text: 'Entendido' }]);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Cierre de Sesión',
      '¿Está seguro que desea cerrar la sesión actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await deleteTokenAsync();
            router.replace('/');
          },
        },
      ],
      { cancelable: true }
    );
  };

const chartWidth = windowWidth - 60;

 return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isBannerExpanded ? 220 : 100 }}
      >
        {/* HEADER */}
        <MinimalHeader
          nombreUsuario={nombreUsuario}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
        />

        {/* ── STATS CARDS ── */}
        <Section title="Resumen de Actividad" subtitle="Métricas clave del sistema">
          {loadingDashboard ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando estadísticas…</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {dashboardStats.map((stat, i) => (
                <DashboardCard key={i} {...stat} />
              ))}
            </View>
          )}
        </Section>

        {/* ── CHARTS ── */}
        <Section title="Análisis Visual" subtitle="Distribución y tendencias">

          {/* Pie chart – estado */}
          <ChartCard
            title="Distribución por Estado"
            subtitle="Aprobados · Pendientes · Rechazados"
            empty={!eventosPorEstado}
            emptyIcon="pie-chart-outline"
          >
            <PieChart
              data={eventosPorEstado || []}
              width={chartWidth + 20}
              height={210}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
              chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
            />
          </ChartCard>

          {/* Line chart – tendencia 7 días */}
          <ChartCard
            title="Tendencia de Eventos"
            subtitle="Últimos 7 días"
            empty={!eventosPorDia}
            emptyIcon="trending-up-outline"
          >
            <CustomLineChart
              data={eventosPorDia}
              width={chartWidth}
              height={220}
              color={COLORS.primary}
            />
          </ChartCard>

          {/* Bar chart – por mes */}
          <ChartCard
            title="Eventos por Mes"
            subtitle="Histórico mensual"
            empty={!eventosPorMes}
            emptyIcon="bar-chart-outline"
          >
            <CustomBarChart
              data={eventosPorMes}
              width={chartWidth}
              height={220}
              color={COLORS.info}
            />
          </ChartCard>

          {/* Bar chart – por facultad */}
          <ChartCard
            title="Eventos por Facultad"
            subtitle="Distribución por unidad académica"
            empty={!eventosPorFacultad}
            emptyIcon="school-outline"
          >
            <CustomBarChart
              data={eventosPorFacultad}
              width={chartWidth}
              height={220}
              color={COLORS.success}
            />
          </ChartCard>
        </Section>

        {/* ── ALERTAS ── */}
        <Section title="Alertas del Sistema" subtitle="Estado operativo actual">
          <View style={styles.alertsContainer}>
            {parseInt(pendingContentCount) > 10 && (
              <View style={[styles.alertCard, { borderLeftColor: COLORS.warning }]}>
                <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>Alta carga de trabajo</Text>
                  <Text style={styles.alertDesc}>{pendingContentCount} eventos pendientes de revisión</Text>
                </View>
              </View>
            )}
            {parseInt(tiempoPromedioAprobacion) > 48 && (
              <View style={[styles.alertCard, { borderLeftColor: COLORS.accent }]}>
                <Ionicons name="time-outline" size={24} color={COLORS.accent} />
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>Tiempo de respuesta elevado</Text>
                  <Text style={styles.alertDesc}>Promedio de aprobación: {tiempoPromedioAprobacion}h</Text>
                </View>
              </View>
            )}
            {parseInt(pendingContentCount) === 0 && (
              <View style={[styles.alertCard, { borderLeftColor: COLORS.success }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>Todo al día</Text>
                  <Text style={styles.alertDesc}>No hay eventos pendientes por revisar</Text>
                </View>
              </View>
            )}
          </View>
        </Section>

        {/* ── HERRAMIENTAS ── */}
        <Section title="Herramientas de Gestión" subtitle="Acceda a las funcionalidades principales">
          {loadingDashboard ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.toolsGrid}>
              {adminActions.map((tool, i) => (
                <ManagementToolCard
                  key={i}
                  title={tool.title}
                  description={tool.description}
                  icon={tool.iconName}
                  color={tool.color}
                  badge={tool.badge}
                  onPress={() => handleActionPress(tool.route)}
                  cardWidth={actionsCardWidth}
                />
              ))}
            </View>
          )}
        </Section>
      </ScrollView>

      {/* ── NOTIFICACIONES MODAL ── */}
      {showNotifications && (
        <View style={styles.overlay}>
          <View style={styles.notifModal}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close-outline" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.textTertiary} />
                <Text style={styles.notifEmptyText}>No tienes notificaciones nuevas</Text>
              </View>
            ) : (
              <ScrollView>
                {notifications.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifItem, { backgroundColor: notif.read ? COLORS.surface : COLORS.primaryLight }]}
                    onPress={() => { if (notif.idEvento) router.push(`/admin/evento/${notif.idEvento}`); setShowNotifications(false); }}
                  >
                    <View style={[styles.notifDot, { backgroundColor: notif.read ? COLORS.border : COLORS.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifMsg, { fontWeight: notif.read ? '400' : '600' }]}>{notif.mensaje}</Text>
                      <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* ── DOCK ── */}
      <MinimalBottomDock
        onLogout={handleLogout}
        onActionPress={handleActionPress}
        isExpanded={isBannerExpanded}
        onToggleExpanded={() => setIsBannerExpanded(!isBannerExpanded)}
      />

      {/* ── CHAT FAB ── */}
      {!isBannerExpanded && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsChatOpen(true)} activeOpacity={0.85}>
          <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* ── CHAT MODAL ── */}
      {isChatOpen && (
        <View style={styles.chatOverlay}>
          <View style={styles.chatModal}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Asistente UFT</Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Chatbot />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
   header: {
    width: '100%', paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 40) + 16, paddingBottom: 20,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerGreeting: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '400' },
  headerName: { fontSize: 22, color: COLORS.textPrimary, fontWeight: '700' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  notifBtn: { position: 'relative', padding: 6 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.accent,
    borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  section: { 
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 28 
  },
  sectionHeader: {
     marginBottom: 16 
    },
  sectionTitle: {
     fontSize: 20,
     fontWeight: '700',
     color: COLORS.textPrimary, 
     marginBottom: 2 
    },
  sectionSubtitle: { 
    fontSize: 13, 
    color: COLORS.textSecondary 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: CARD_MARGIN, 
    justifyContent: 'space-between' 
  },
  dashboardCard: {
    backgroundColor: COLORS.surface, 
    borderRadius: 14, 
    padding: 16,
    width: '47%', 
    minHeight: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  dashboardCardIconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  dashboardCardValue: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    marginBottom: 2 
  },
  dashboardCardTitle: { 
    fontSize: 13,
     fontWeight: '600', 
     color: COLORS.textSecondary, 
     marginBottom: 2 
    },
  dashboardCardDescription: { 
    fontSize: 11, 
    color: COLORS.textTertiary 
  },
  dashboardCardTrend: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, marginTop: 6 
  },
  dashboardCardTrendText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textSecondary 
  },
chartCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  chartCardHeader: { marginBottom: 12 },
  chartCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  chartCardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chartEmpty: { alignItems: 'center', paddingVertical: 32 },
  chartEmptyText: { marginTop: 10, fontSize: 14, color: COLORS.textTertiary },

  // Alerts
  alertsContainer: { gap: 10 },
  alertCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  alertBody: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  alertDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  // Tools
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_MARGIN, justifyContent: 'space-between' },
  toolCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, minHeight: 130,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  toolCardIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, lineHeight: 22 },
  toolCardDescription: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  toolCardBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  toolCardBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  toolCardArrow: { position: 'absolute', top: 18, right: 16 },

  // Dock
  dock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primary, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10, overflow: 'hidden',
  },
  dockToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  dockToggleText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  dockExpanded: {
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 62,
  },
  dockActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14, gap: 8 },
  dockActionBtn: { alignItems: 'center', paddingVertical: 8, width: '22%' },
  dockActionText: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  dockLogout: {
    flexDirection: 'row', backgroundColor: COLORS.accent, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', borderRadius: 10,
  },
  dockLogoutText: { color: COLORS.white, fontSize: 15, fontWeight: '600', marginLeft: 8 },

  // Notifications modal
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-start',
    paddingTop: (StatusBar.currentHeight || 0) + 10, zIndex: 1000,
  },
  notifModal: {
    backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16,
    maxHeight: '72%', elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  notifTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  notifEmpty: { alignItems: 'center', paddingVertical: 40 },
  notifEmptyText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  notifDot: { width: 10, height: 10, borderRadius: 5 },
  notifMsg: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 3 },
  notifTime: { fontSize: 12, color: COLORS.textTertiary },

  // Chat
  fab: {
    position: 'absolute', bottom: 78, left: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6,
  },
  chatOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start',
    paddingTop: StatusBar.currentHeight || 0, zIndex: 2000,
  },
  chatModal: {
    width: '88%', maxWidth: 400, height: '85%', backgroundColor: '#F4F7F9',
    borderTopRightRadius: 20, borderBottomRightRadius: 20,
    marginLeft: 'auto', elevation: 10,
    shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.border, borderTopRightRadius: 20,
  },
  chatTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  // Loading
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 80,
  },
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
  minimalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  minimalHeaderAdminText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  minimalNotificationButton: {
    position: 'relative',
    padding: 4,
  },
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
  minimalNotificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  minimalHeaderGreeting: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  minimalGreetingText: {
    fontSize: 22,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  minimalUserNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  minimalHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dashboardSectionMinimal: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeaderMinimal: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitleMinimal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitleMinimal: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  dashboardGridMinimal: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
    justifyContent: 'space-between',
  },
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
  dashboardCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dashboardCardValueMinimal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dashboardCardTitleMinimal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dashboardCardTrendMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dashboardCardTrendTextMinimal: {
    fontSize: 12,
    fontWeight: '600',
  },
  dashboardCardDescriptionMinimal: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  managementToolsSectionMinimal: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 40,
  },
  managementToolCardMinimal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 130,
    borderWidth: 1,
    maxWidth: '100%',
  },
  managementToolCardHeaderMinimal: {
    flexDirection: 'column',
    gap: 12,
  },
  managementToolCardIconMinimal: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  managementToolCardTextContainerMinimal: {
    flex: 1,
  },
  managementToolCardTitleMinimal: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  managementToolCardDescriptionMinimal: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  managementToolCardBadgeMinimal: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  managementToolCardBadgeTextMinimal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  alertsContainer: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  minimalDockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  minimalDockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  minimalDockToggleText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
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
  minimalDockQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 10,
  },
  minimalDockQuickActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '22%',
  },
  minimalDockQuickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
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
  minimalDockLogoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-start',
  paddingTop: StatusBar.currentHeight || 0,
  zIndex: 1000,
},
notificationModal: {
  backgroundColor: COLORS.white,
  marginHorizontal: 16,
  borderRadius: 16,
  maxHeight: '70%',
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 10,
},
notificationHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderColor: COLORS.border,
},
notificationTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: COLORS.textPrimary,
},
notificationsList: {
  flex: 1,
},
notificationItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderColor: COLORS.border,
},
notificationContent: {
  flex: 1,
},
notificationMessage: {
  fontSize: 14,
  color: COLORS.textPrimary,
  marginBottom: 4,
},
notificationTime: {
  fontSize: 12,
  color: COLORS.textTertiary,
},
unreadIndicator: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: COLORS.accent,
  marginLeft: 12,
},
noNotificationsText: {
  textAlign: 'center',
  padding: 24,
  color: COLORS.textSecondary,
  fontSize: 14,
},
chatFab: {
  position: 'absolute',
  bottom: 80, // por encima del dock
  left: 20,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: COLORS.primary,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
},
chatOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  justifyContent: 'flex-start',
  paddingTop: StatusBar.currentHeight || 0,
  zIndex: 2000,
},
chatModal: {
  width: '90%',
  maxWidth: 400,
  height: '85%',
  backgroundColor: '#F4F7F9',
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
  marginLeft: 'auto', // Para que quede a la derecha
  // Si quieres que salga desde la IZQUIERDA, usa marginRight: 'auto' y marginLeft: 0
  shadowColor: '#000',
  shadowOffset: { width: -4, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 10,
},
chatHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: COLORS.surface,
  borderBottomWidth: 1,
  borderColor: COLORS.border,
  borderTopRightRadius: 20,
},
chatTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: COLORS.textPrimary,
},
chatContainer: {
  flex: 1,
},
});

export default HomeAdministradorScreen;