// app/admin/reportes/index.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import MinimalHeader from '../../components/MinimalHeader';
import { PieChart } from 'react-native-chart-kit';
import { LineChart } from 'react-native-chart-kit';

// ✅ IMPORTACIÓN FUNDAMENTAL
import DateTimePicker from '@react-native-community/datetimepicker';

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

const ReportesAvanzadosScreen = () => {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  
  const [loading, setLoading] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(true);

  // Estados para las gráficas
  const [eventosPorEstado, setEventosPorEstado] = useState(null);
  const [eventosPorMes, setEventosPorMes] = useState(null);
  const [reportesMensuales, setReportesMensuales] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  // Función genérica para mostrar errores
  const showError = (message) => {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  };

  const cargarReportesMensuales = async () => {
    try {
      const token = await getTokenAsync();
      if (!token) {
        router.replace('/');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/dashboard/mensual`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reportesOrdenados = Array.isArray(res.data)
        ? res.data.sort((a, b) => new Date(b.mes) - new Date(a.mes))
        : [];

      setReportesMensuales(reportesOrdenados);
      
      if (reportesOrdenados.length > 0) {
        setMesSeleccionado(reportesOrdenados[0].mes);
      }
      console.log('🔍 Datos recibidos:', res.data);
      console.log('🔍 Primer elemento:', res.data[0]);
    } catch (error) {
      console.error('Error al cargar reportes mensuales:', error);
      showError('No se pudieron cargar los reportes mensuales.');
    }
  };

  // Cargar datos para gráficas
  const cargarDatosGraficas = async () => {
    setLoadingCharts(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        router.replace('/');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      // 1. Gráfico de pastel: eventos por estado
      if (data.estadoCounts && typeof data.estadoCounts === 'object') {
        const pieData = [];
        for (const [estado, count] of Object.entries(data.estadoCounts)) {
          if (typeof count === 'number' && count > 0) {
            let color = COLORS.info;
            switch (estado.toLowerCase()) {
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
              color,
              legendFontColor: COLORS.textPrimary,
              legendFontSize: 12,
            });
          }
        }
        setEventosPorEstado(pieData.length > 0 ? pieData : null);
      } else {
        setEventosPorEstado(null);
      }

      // 2. Gráfico de líneas: eventos por mes
      if (data.eventosPorMes && Array.isArray(data.eventosPorMes)) {
        const labels = data.eventosPorMes.map(item => {
          const [year, month] = item.mes.split('-');
          const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ];
          return `${monthNames[parseInt(month) - 1]}`;
        });
        const values = data.eventosPorMes.map(item => item.total || 0);

        setEventosPorMes({
          labels,
          datasets: [
            {
              data: values,
              color: (opacity = 1) => COLORS.primary,
              strokeWidth: 2,
            },
          ],
        });
      } else {
        setEventosPorMes(null);
      }

    } catch (error) {
      console.error('Error al cargar gráficas:', error);
      showError('No se pudieron cargar los datos para las gráficas.');
      setEventosPorEstado(null);
      setEventosPorMes(null);
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    cargarDatosGraficas();
    cargarReportesMensuales();
  }, []);

  // === Función para generar reporte ===
  const generarReporteMensual = async (mesFormato) => {
    setLoading(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        router.replace('/');
        return;
      }

      const reporte = reportesMensuales.find(r => r.mes === mesFormato);
      if (!reporte) {
        throw new Error(`No se encontró reporte para el mes ${mesFormato}.`);
      }

      // Extraer datos del mes
      const [year, monthNum] = mesFormato.split('-');
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const mesNombre = monthNames[parseInt(monthNum) - 1];

      // Generar HTML del reporte
      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte Mensual - ${mesNombre} ${year}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                padding: 24px; 
                background: #f9fafb; 
                margin: 0;
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px; 
                padding: 30px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
              }
              h1 { 
                color: #E95A0C; 
                text-align: center; 
                margin-bottom: 30px; 
                font-size: 24px; 
              }
              .metric { 
                display: flex; 
                justify-content: space-between; 
                padding: 10px 0; 
                border-bottom: 1px solid #eee; 
              }
              .label { 
                color: #6B7280; 
                font-size: 14px; 
              }
              .value { 
                font-weight: bold; 
                color: #1F2937; 
                font-size: 16px; 
              }
              .footer { 
                margin-top: 30px; 
                text-align: center; 
                color: #9CA3AF; 
                font-size: 12px; 
              }
              @media print {
                body { padding: 0; background: white; }
                .container { border-radius: 0; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Reporte Mensual de Actividad</h1>
              <div class="metric">
                <span class="label">Período</span>
                <span class="value">${mesNombre} ${year}</span>
              </div>
              <div class="metric">
                <span class="label">Usuarios Activos</span>
                <span class="value">${reporte.activeUsers || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Eventos Totales</span>
                <span class="value">${reporte.totalEvents || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Eventos Aprobados</span>
                <span class="value">${reporte.aprobado || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Eventos Pendientes</span>
                <span class="value">${reporte.pendiente || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Eventos Rechazados</span>
                <span class="value">${reporte.rechazado || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Tasa de Aprobación</span>
                <span class="value">${reporte.tasaAprobacion || 0}%</span>
              </div>
              <div class="metric">
                <span class="label">Nuevos Usuarios (Mes)</span>
                <span class="value">${reporte.usuariosNuevosEsteMes || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Tiempo Prom. Aprobación</span>
                <span class="value">${reporte.tiempoPromedioAprobacion || 0} horas</span>
              </div>
              <div class="footer">
                Generado desde Panel de Administración - ${new Date().toLocaleDateString('es-ES')}
              </div>
            </div>
          </body>
        </html>
      `;

      // ✅ Manejo diferente para Web vs Móvil
      if (Platform.OS === 'web') {
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
          pdfWindow.document.write(html);
          pdfWindow.document.close();
          pdfWindow.onload = () => {
            setTimeout(() => {
              pdfWindow.print();
            }, 1000);
          };
        } else {
          showError('Por favor, permite ventanas emergentes para ver el reporte.');
        }
      } else {
        try {
          const printResult = await Print.printToFileAsync({ html });
          if (printResult?.uri) {
            await Sharing.shareAsync(printResult.uri, {
              UTI: '.pdf',
              mimeType: 'application/pdf',
              dialogTitle: 'Compartir Reporte Mensual'
            });
          } else {
            throw new Error('No se generó la URI del PDF');
          }
        } catch (printError) {
          console.error('❌ Error al generar PDF en móvil:', printError);
          showError('No se pudo generar el PDF. Verifica los permisos de almacenamiento.');
        }
      }

    } catch (error) {
      console.error('❌ Error al generar reporte mensual:', error);
      showError(`No se pudo generar el reporte: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportarEventos = async () => {
    Alert.alert(
      'Próximamente',
      'Esta funcionalidad permitirá filtrar y exportar eventos por fecha, estado y tipo.',
      [{ text: 'OK' }]
    );
  };

  const reportePorUsuario = async () => {
    Alert.alert(
      'Próximamente',
      'Se mostrará el rendimiento de los usuarios académicos: eventos creados, % de aprobación, etc.',
      [{ text: 'OK' }]
    );
  };
// Generar lista de años (últimos 5 años)
const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const months = [
  { value: 1, name: 'Enero' },
  { value: 2, name: 'Febrero' },
  { value: 3, name: 'Marzo' },
  { value: 4, name: 'Abril' },
  { value: 5, name: 'Mayo' },
  { value: 6, name: 'Junio' },
  { value: 7, name: 'Julio' },
  { value: 8, name: 'Agosto' },
  { value: 9, name: 'Septiembre' },
  { value: 10, name: 'Octubre' },
  { value: 11, name: 'Noviembre' },
  { value: 12, name: 'Diciembre' }
];
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MinimalHeader
          nombreUsuario="Administrador"
          unreadCount={0}
          onNotificationPress={() => {}}
        />

        {/* Sección: Botones de reportes */}
        <View style={styles.section}>
          <Text style={styles.title}>Reportes Avanzados</Text>
          <Text style={styles.subtitle}>Genera y comparte informes detallados del sistema</Text>

          {/* Botón principal - abre selector de mes */}
          <TouchableOpacity
            onPress={() => setShowMonthSelector(true)}
            style={[styles.reportButton, { backgroundColor: COLORS.primaryLight }]}
          >
            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            <Text style={styles.reportButtonText}>📊 Reporte Mensual (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={exportarEventos}
            style={[styles.reportButton, { backgroundColor: '#EFF6FF' }]}
          >
            <Ionicons name="calendar-outline" size={24} color={COLORS.info} />
            <Text style={styles.reportButtonText}>📅 Exportar Eventos Filtrados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reportePorUsuario}
            style={[styles.reportButton, { backgroundColor: '#ECFDF5' }]}
          >
            <Ionicons name="people-outline" size={24} color={COLORS.success} />
            <Text style={styles.reportButtonText}>👥 Rendimiento por Usuario</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Gráficas */}
        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionHeader}>Resumen Visual</Text>
          <Text style={styles.subtitle}>Tendencias y distribución de eventos</Text>

          {loadingCharts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando gráficas...</Text>
            </View>
          ) : (
            <>
              {/* Gráfico de Pastel: Eventos por Estado */}
              {eventosPorEstado && eventosPorEstado.length > 0 ? (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Distribución por Estado</Text>
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
                <View style={styles.emptyChart}>
                  <Ionicons name="pie-chart-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No hay datos para el gráfico de pastel</Text>
                </View>
              )}

              {/* Gráfico de Líneas: Eventos por Mes */}
              {eventosPorMes ? (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Eventos por Mes (Último Año)</Text>
                  <LineChart
                    data={eventosPorMes}
                    width={windowWidth - 40}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.surface,
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
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="trending-up-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No hay datos para el gráfico de líneas</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ✅ SELECTOR DE MES MODAL - MOVIDO FUERA DEL SCROLLVIEW */}
      {showMonthSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Mes y Año</Text>
            
          {Platform.OS === 'web' && (
<View style={styles.selectorContainer}>
  {/* Selector de año */}
  <View style={styles.selectorRow}>
    <Text style={styles.selectorLabel}>Año:</Text>
    <TouchableOpacity 
      style={[styles.selectorButton, styles.yearButton]}
      onPress={() => setShowYearPicker(!showYearPicker)}
    >
      <Text style={styles.selectorButtonText}>{selectedYear}</Text>
      <Ionicons 
        name={showYearPicker ? "chevron-up" : "chevron-down"} 
        size={16} 
        color={COLORS.textPrimary} 
      />
    </TouchableOpacity>
  </View>

  {/* Lista de años */}
  {showYearPicker && (
    <View style={styles.dropdownList}>
      {years.map(year => (
        <TouchableOpacity
          key={year}
          onPress={() => {
            setSelectedYear(year);
            setShowYearPicker(false);
          }}
          style={[
            styles.dropdownItem,
            selectedYear === year && styles.dropdownItemSelected
          ]}
        >
          <Text style={[
            styles.dropdownItemText,
            selectedYear === year && styles.dropdownItemSelectedText
          ]}>
            {year}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}

  {/* Selector de mes */}
  <View style={styles.selectorRow}>
    <Text style={styles.selectorLabel}>Mes:</Text>
    <TouchableOpacity 
      style={[styles.selectorButton, styles.monthButton]}
      onPress={() => setShowMonthPicker(!showMonthPicker)}
    >
      <Text style={styles.selectorButtonText}>
        {months.find(m => m.value === selectedMonth)?.name || 'Seleccionar'}
      </Text>
      <Ionicons 
        name={showMonthPicker ? "chevron-up" : "chevron-down"} 
        size={16} 
        color={COLORS.textPrimary} 
      />
    </TouchableOpacity>
  </View>

  {/* Lista de meses */}
  {showMonthPicker && (
    <View style={styles.dropdownList}>
      {months.map(month => (
        <TouchableOpacity
          key={month.value}
          onPress={() => {
            setSelectedMonth(month.value);
            setShowMonthPicker(false);
          }}
          style={[
            styles.dropdownItem,
            selectedMonth === month.value && styles.dropdownItemSelected
          ]}
        >
          <Text style={[
            styles.dropdownItemText,
            selectedMonth === month.value && styles.dropdownItemSelectedText
          ]}>
            {month.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}
</View>
)}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowMonthSelector(false)}
                style={[styles.modalButton, { backgroundColor: COLORS.secondary }]}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
              const year = selectedYear;
              const month = String(selectedMonth).padStart(2, '0');
              const mesFormato = `${year}-${month}`;
                  
                  const reporte = reportesMensuales.find(r => r.mes === mesFormato);
                  if (!reporte) {
                    showError(`No hay datos disponibles para ${mesFormato}`);
                    return;
                  }
                  
                  setMesSeleccionado(mesFormato);
                  generarReporteMensual(mesFormato);
                  setShowMonthSelector(false);
                }}
                style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.white }]}>Generar Reporte</Text>
              </TouchableOpacity>
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
  selectorContainer: {
  width: '100%',
  marginBottom: 20,
},
selectorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
selectorLabel: {
  fontSize: 14,
  color: COLORS.textSecondary,
  marginRight: 10,
  width: 60,
},
selectorButton: {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 8,
  backgroundColor: COLORS.surface,
},
yearButton: {
  marginRight: 5,
},
monthButton: {
  marginLeft: 5,
},
selectorButtonText: {
  fontSize: 14,
  color: COLORS.textPrimary,
  fontWeight: '500',
},
dropdownList: {
  width: '100%',
  maxHeight: 150,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 8,
  backgroundColor: COLORS.surface,
  marginTop: 5,
},
dropdownItem: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.divider,
},
dropdownItemSelected: {
  backgroundColor: COLORS.primaryLight,
},
dropdownItemText: {
  fontSize: 14,
  color: COLORS.textPrimary,
},
dropdownItemSelectedText: {
  fontWeight: '600',
  color: COLORS.primary,
},
  scrollContent: {
    paddingBottom: 80,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  customSelectorContainer: {
  width: '100%',
  marginBottom: 20,
},
selectorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
selectorLabel: {
  fontSize: 14,
  color: COLORS.textSecondary,
  marginRight: 10,
  width: 60,
},
selectorDropdown: {
  flex: 1,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 8,
  maxHeight: 150,
  overflow: 'scroll',
},
selectorOption: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.divider,
},
selectorOptionSelected: {
  backgroundColor: COLORS.primaryLight,
},
selectorOptionText: {
  fontSize: 14,
  color: COLORS.textPrimary,
},
selectorOptionTextSelected: {
  fontWeight: '600',
  color: COLORS.primary,
},
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  loader: {
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingLeft: 10,
  },
  emptyChart: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  // ✅ ESTILOS DEL MODAL AGREGADOS
  modalOverlay: {
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
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  webMonthInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ReportesAvanzadosScreen;