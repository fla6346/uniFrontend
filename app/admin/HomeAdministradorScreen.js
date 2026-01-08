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
import Svg, { Line,Circle, Text as SvgText, Path, G } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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

const CARD_MARGIN = 12;
const MIN_CARD_WIDTH_DASHBOARD = 160;
const MAX_COLUMNS_DASHBOARD = 4;
const MIN_CARD_WIDTH_ACTIONS = 200;
const MAX_COLUMNS_ACTIONS = 3;
const CustomLineChart = ({ data, width, height, color = COLORS.primary, lineWidth = 3 }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return null;
  }

  const labels = data.labels;
  const values = data.datasets[0].data;
  
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;
  
  // Calcular puntos para la línea
  const points = values.map((value, index) => {
    const x = padding.left + (index / (values.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value, label: labels[index] };
  });
  
  // Crear path para la línea con curvas Bézier
  let linePath = '';
  points.forEach((point, index) => {
    if (index === 0) {
      linePath = `M ${point.x} ${point.y}`;
    } else {
      const prevPoint = points[index - 1];
      const cpx = (prevPoint.x + point.x) / 2;
      linePath += ` Q ${cpx} ${prevPoint.y}, ${cpx} ${(prevPoint.y + point.y) / 2} Q ${cpx} ${point.y}, ${point.x} ${point.y}`;
    }
  });
  
  // Crear path para el área bajo la línea
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
  
  return (
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16 }}>
      <Svg width={width} height={height}>
        {/* Líneas de fondo horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
          const y = padding.top + chartHeight * (1 - percent);
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={COLORS.border}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText
                x={padding.left - 8}
                y={y + 4}
                fontSize="10"
                fill={COLORS.textSecondary}
                textAnchor="end"
              >
                {Math.round(minValue + valueRange * percent)}
              </SvgText>
            </G>
          );
        })}
        
        {/* Área bajo la línea */}
        <Path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
        />
        
        {/* Línea principal */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={lineWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Puntos en la línea */}
        {points.map((point, index) => (
          <G key={`point-${index}`}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={lineWidth + 2}
              fill={COLORS.surface}
              stroke={color}
              strokeWidth={2}
            />
            <Circle
              cx={point.x}
              cy={point.y}
              r={lineWidth}
              fill={color}
            />
          </G>
        ))}
        
        {/* Etiquetas del eje X */}
        {points.map((point, index) => (
          <SvgText
            key={`label-${index}`}
            x={point.x}
            y={height - padding.bottom + 20}
            fontSize="11"
            fill={COLORS.textSecondary}
            textAnchor="middle"
            fontWeight="500"
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
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
        <TouchableOpacity style={styles.minimalNotificationButton} onPress={onNotificationPress}>
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
      <Text style={styles.minimalHeaderTitle}>Panel de Administración</Text>
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
  const [eventosPorEstado, setEventosPorEstado] = useState(null);

  const [eventosPorDia, setEventosPorDia] = useState(null);
  const [tiempoPromedioAprobacion, setTiempoPromedioAprobacion] = useState('0');
  const [usuariosNuevosEsteMes, setUsuariosNuevosEsteMes] = useState('0');
  
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
    if (!token) {
      console.warn('No hay token disponible');
      setLoadingDashboard(false);
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000,
    });

    const data = response.data;
    
    console.log('Datos  del servidor:', data);

    // Validación robusta de estadoCounts
    if (!data.estadoCounts || typeof data.estadoCounts !== 'object') {
      console.warn(' estadoCounts no válido:', data.estadoCounts);
      setPendingContentCount('0');
      setApprovedEventsCount('0');
      setEventosPorEstado(null);
    } else {
      setPendingContentCount((data.estadoCounts.pendiente || 0).toString());
      setApprovedEventsCount((data.estadoCounts.aprobado || 0).toString());

      const pieData = [];
      for (const [estado, count] of Object.entries(data.estadoCounts)) {
        if (typeof count === 'number' && count > 0) {
          let color = COLORS.info;
          switch(estado.toLowerCase()) {
            case 'aprobado':
              color = COLORS.success;
              break;
            case 'pendiente':
              color = COLORS.warning;
              break;
            case 'rechazado':
              color = COLORS.accent;
              break;
          }
          
          pieData.push({
            name: estado.charAt(0).toUpperCase() + estado.slice(1),
            population: count,
            color: color,
            legendFontColor: COLORS.textPrimary,
            legendFontSize: 12,
          });
        }
      }
      
      console.log('Datos del gráfico de pastel:', pieData);
      setEventosPorEstado(pieData.length > 0 ? pieData : null);
    }
     if (data.eventosPorDia && Array.isArray(data.eventosPorDia) && data.eventosPorDia.length > 0) {
        const lineChartData = {
          labels: data.eventosPorDia.map(item => {
            const fecha = new Date(item.fecha);
            return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
          }),
          datasets: [{
            data: data.eventosPorDia.map(item => item.total || 0),
            color: (opacity = 1) => `rgba(233, 90, 12, ${opacity})`,
            strokeWidth: 2
          }]
        };
        setEventosPorDia(lineChartData);
        console.log('📈 Datos del gráfico de líneas:', lineChartData);
      } else {
        setEventosPorDia(null);
      }
          setTiempoPromedioAprobacion((data.tiempoPromedioAprobacion || 0).toString());
      setUsuariosNuevosEsteMes((data.usuariosNuevosEsteMes || 0).toString());

// Dentro de fetchDashboardData, después de recibir `data`
if (data.eventosPorMes && Array.isArray(data.eventosPorMes)) {
  const labels = data.eventosPorMes.map(item => item.mes);
  const values = data.eventosPorMes.map(item => item.total);

  setEventosPorMes({
    labels,
    datasets: [
      {
        data: values,
        color: (opacity = 1) => COLORS.primary, // color de la línea
        strokeWidth: 2,
      },
    ],
  });
} else {
  setEventosPorMes(null);
}
    const newStats = [
      { 
        title: 'Usuarios Activos', 
        value: (data.activeUsers || 0).toLocaleString(), 
        icon: 'people-outline', 
        color: COLORS.primary, 
        trend: null, 
        description: 'Cuentas habilitadas' 
      },
      { 
        title: 'Eventos Totales', 
        value: (data.totalEvents || 0).toString(), 
        icon: 'calendar-outline', 
        color: COLORS.info, 
        trend: null, 
        description: 'Todos los eventos' 
      },
      { 
        title: 'Pendientes', 
        value: (data.estadoCounts?.pendiente || 0).toString(), 
        icon: 'document-text-outline', 
        color: COLORS.warning, 
        trend: null, 
        description: 'Esperando aprobación' 
      },
      { 
        title: 'Aprobados', 
        value: (data.estadoCounts?.aprobado || 0).toString(), 
        icon: 'checkmark-done-outline', 
        color: COLORS.success, 
        trend: null, 
        description: 'Eventos aprobados' 
      },
      { 
        title: 'Tasa Aprobación', 
        value: `${data.tasaAprobacion || 0}%`, 
        icon: 'analytics-outline', 
        color: COLORS.info, 
        trend: null, 
        description: 'Eventos aprobados / totales' 
      },
      { 
        title: 'Estabilidad', 
        value: `${data.systemStability || 0}%`, 
        icon: 'pulse-outline', 
        color: COLORS.success, 
        trend: null, 
        description: 'Rendimiento del sistema' 
      },
    ];
    
    setDashboardStats(newStats);
    
  } catch (error) {
    console.error('❌ Error al cargar dashboard:', error);
    
    setPendingContentCount('0');
    setApprovedEventsCount('0');
    setEventosPorEstado(null);
    setEventosPorDia(null);
    
    const errorStats = [
      { title: 'Usuarios Activos', value: '0', icon: 'people-outline', color: COLORS.primary, trend: null, description: 'Cuentas habilitadas' },
      { title: 'Eventos Totales', value: '0', icon: 'calendar-outline', color: COLORS.info, trend: null, description: 'Todos los eventos' },
      { title: 'Pendientes', value: '0', icon: 'document-text-outline', color: COLORS.warning, trend: null, description: 'Esperando aprobación' },
      { title: 'Aprobados (Mes)', value: '0', icon: 'checkmark-done-outline', color: COLORS.success, trend: null, description: 'Este mes' },
      { title: 'Tasa Aprobación', value: '0%', icon: 'analytics-outline', color: COLORS.info, trend: null, description: 'Eventos aprobados / totales' },
      { title: 'Estabilidad', value: '0%', icon: 'pulse-outline', color: COLORS.success, trend: null, description: 'Rendimiento del sistema' },
    ];
    setDashboardStats(errorStats);
    
    Alert.alert(
      'Error de Conexión',
      `No se pudieron cargar los datos del dashboard.\n\nDetalle: ${error.message}`,
      [
        { text: 'Reintentar', onPress: () => fetchDashboardData() }, 
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  } finally {
    setLoadingDashboard(false);
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
    // Si hay token, cargar datos
    fetchDashboardData();
  };

  validateSession();
}, [router]);
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


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isBannerExpanded ? 220 : 80 }
        ]}
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
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

    
{eventosPorEstado && Array.isArray(eventosPorEstado) && eventosPorEstado.length > 0 ? (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 20, paddingHorizontal: 10 }}>
    <Text style={[styles.sectionTitleMinimal, { marginBottom: 15 }]}>Distribución de Eventos</Text>
    <PieChart
      data={eventosPorEstado}
      width={windowWidth - 40}
      height={220}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="15"
      absolute
      chartConfig={{
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
    />
  </View>
) : (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 20, padding: 20 }}>
    <Ionicons name="pie-chart-outline" size={48} color={COLORS.textTertiary} />
    <Text style={[styles.sectionSubtitleMinimal, { marginTop: 10, textAlign: 'center' }]}>
      No hay datos disponibles para mostrar la distribución
    </Text>
  </View>
)}
{eventosPorDia && eventosPorDia.labels && eventosPorDia.labels.length > 0 ? (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 30, paddingHorizontal: 10,backgroundColor: COLORS.surface, borderRadius: 16,paddingVertical: 20 }}>
    <Text style={[styles.sectionTitleMinimal, { marginBottom: 15 }]}>Tendencia de Eventos (Últimos 7 días)</Text>
    <CustomLineChart
      data={eventosPorDia}
      width={windowWidth - 40}
      height={220}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(233, 90, 12, ${opacity})`, // Línea naranja brillante
        labelColor: (opacity = 1) => COLORS.textSecondary, // Texto de ejes en gris oscuro
        style: {
          borderRadius: 16,
          backgroundColor: COLORS.surface, // Asegura fondo claro
        },
        propsForDots: {
          r: "6",
          strokeWidth: "2",
          stroke: COLORS.primary, // Borde de puntos naranja
          fill: COLORS.primaryLight, // Relleno de puntos más claro
        },
        propsForBackgroundLines: {
          stroke: COLORS.border, // Líneas de fondo más claras
          strokeDasharray: "5, 5", // Estilo punteado suave
        },
      }}
      bezier
      style={{
        marginVertical: 8,
        borderRadius: 16,
        paddingRight: 20,
      }}
      
    />
  </View>
) : (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 30, padding: 20 }}>
    <Ionicons name="trending-up-outline" size={48} color={COLORS.textTertiary} />
    <Text style={[styles.sectionSubtitleMinimal, { marginTop: 10, textAlign: 'center' }]}>
      No hay datos de tendencia disponibles
    </Text>
  </View>
)}

{eventosPorMes && (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 30, paddingHorizontal: 10 }}>
    <Text style={[styles.sectionTitleMinimal, { marginBottom: 15 }]}>Eventos por Mes</Text>
    <LineChart
      data={eventosPorMes}
      width={windowWidth - 40}
      height={220}
      chartConfig={{
        backgroundGradientFrom: COLORS.surface,
        backgroundGradientTo: COLORS.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => COLORS.primary,
        labelColor: (opacity = 1) => COLORS.textSecondary,
        style: { borderRadius: 16 },
        propsForDots: {
          r: "4",
          strokeWidth: "2",
          stroke: COLORS.primary,
        },
      }}
      bezier
      style={{ marginVertical: 8, borderRadius: 16 }}
    />
  </View>
)}
{/* Alertas */}
          <View style={{ width: '100%', marginTop: 30 }}>
            
            <View style={styles.alertsContainer}>
              {parseInt(pendingContentCount) > 10 && (
                <View style={[styles.alertCard, { borderLeftColor: COLORS.warning }]}>
                  <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>Alta carga de trabajo</Text>
                    <Text style={styles.alertDescription}>
                      Tienes {pendingContentCount} eventos pendientes de revisión
                    </Text>
                  </View>
                </View>
              )}
              
              {parseInt(tiempoPromedioAprobacion) > 48 && (
                <View style={[styles.alertCard, { borderLeftColor: COLORS.accent }]}>
                  <Ionicons name="time-outline" size={24} color={COLORS.accent} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>Tiempo de respuesta elevado</Text>
                    <Text style={styles.alertDescription}>
                      El tiempo promedio de aprobación es de {tiempoPromedioAprobacion}h
                    </Text>
                  </View>
                </View>
              )}
              
              {parseInt(pendingContentCount) === 0 && (
                <View style={[styles.alertCard, { borderLeftColor: COLORS.success }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>Todo al día</Text>
                    <Text style={styles.alertDescription}>
                      No hay eventos pendientes por revisar
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.managementToolsSectionMinimal}>
          <View style={styles.sectionHeaderMinimal}>
            <Text style={styles.sectionTitleMinimal}>Herramientas de Gestión</Text>
            <Text style={styles.sectionSubtitleMinimal}>Acceda a las funcionalidades principales</Text>
          </View>
          {loadingDashboard ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.sectionSubtitleMinimal, { marginTop: 10 }]}>Cargando herramientas...</Text>
            </View>
          ) : (
            <View style={styles.dashboardGridMinimal}>
              {adminActions.map((tool, index) => (
                <ManagementToolCard
                  key={index}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
});

export default HomeAdministradorScreen;