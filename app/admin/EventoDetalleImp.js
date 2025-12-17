// /frontend/app/admin/EventoDetalle.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS } from './Daf'; // Reutilizamos tus colores

const API_BASE_URL = Platform.OS === 'android' || Platform.OS === 'ios'
  ? 'http://192.168.0.167:3001/api'
  : 'http://localhost:3001/api';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('adminAuthToken');
  return await SecureStore.getItemAsync('adminAuthToken');
};

export default function EventoDetalle() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrint, setLoadingPrint] = useState(false);

  useEffect(() => {
    const cargarEvento = async () => {
      if (!id) {
        Alert.alert('Error', 'ID de evento no válido');
        router.back();
        return;
      }

      try {
        const token = await getTokenAsync();
        if (!token) {
          Alert.alert('Error', 'Sesión expirada');
          router.replace('/');
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/eventos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setEvento(res.data);
      } catch (error) {
        console.error('Error al cargar evento:', error);
        Alert.alert('Error', 'No se pudo cargar el evento.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    cargarEvento();
  }, [id]);

  const handleImprimir = async () => {
    if (!evento) return;

    setLoadingPrint(true);
    try {
      // ✅ Fecha segura
      const fechaEvento = evento.fechaevento 
        ? new Date(evento.fechaevento).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'Fecha no disponible';

      // ✅ Clasificación segura
      const clasificacion = evento.clasificacion
        ? `${evento.clasificacion.label || ''} - ${evento.subcategoria?.label || 'Sin subcategoría'}`
        : 'No especificada';

      const htmlContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #E95A0C; padding-bottom: 10px; }
            h1 { color: #E95A0C; margin: 0; }
            .field { margin: 12px 0; }
            .label { font-weight: bold; display: inline-block; min-width: 140px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Reporte del Evento</h1></div>
          <div class="field"><span class="label">Título:</span> ${evento.nombreevento || 'Sin título'}</div>
          <div class="field"><span class="label">Fecha:</span> ${fechaEvento}</div>
          <div class="field"><span class="label">Clasificación:</span> ${clasificacion}</div>
          <div class="field"><span class="label">Ubicación:</span> ${evento.lugarevento || 'No especificada'}</div>
          <div class="field"><span class="label">Hora:</span> ${evento.horaevento || 'No especificada'}</div>
        </body>
        </html>
      `;

      const pdf = await Print.printToFileAsync({ html: htmlContent });
      if (!pdf?.uri) throw new Error('No se generó el PDF');

      await Sharing.shareAsync(pdf.uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      Alert.alert('Éxito', 'PDF generado y compartido.');
    } catch (error) {
      console.error('Error al imprimir:', error);
      Alert.alert('Error', `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setLoadingPrint(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E95A0C" />
        <Text style={styles.text}>Cargando evento...</Text>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Evento no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Evento</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{evento.nombreevento}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{evento.idevento}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>
            {evento.fechaevento ? new Date(evento.fechaevento).toLocaleDateString('es-ES') : 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Hora:</Text>
          <Text style={styles.value}>{evento.horaevento || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Ubicación:</Text>
          <Text style={styles.value}>{evento.lugarevento || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Clasificación:</Text>
          <Text style={styles.value}>
            {evento.clasificacion ? `${evento.clasificacion.label} - ${evento.subcategoria?.label || 'Sin subcategoría'}` : 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Estado:</Text>
          <Text style={[
            styles.value,
            evento.estado?.toLowerCase().includes('aprobado') ? styles.stateAprobado : styles.statePendiente
          ]}>
            {evento.estado || 'N/A'}
          </Text>
        </View>

        {/* ✅ Solo muestra "Imprimir" si está aprobado */}
        {evento.estado?.toLowerCase().includes('aprobado') && (
          <TouchableOpacity
            style={[styles.printButton, loadingPrint && styles.printButtonDisabled]}
            onPress={handleImprimir}
            disabled={loadingPrint}
          >
            {loadingPrint ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="print-outline" size={20} color="white" />
                <Text style={styles.printButtonText}>Imprimir Reporte</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  error: { fontSize: 18, color: '#EF4444', fontWeight: '600' },
  backButton: { marginTop: 12, color: '#10B981' },
  backText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  header: { 
    backgroundColor: '#E95A0C', 
    paddingTop: 12, 
    paddingBottom: 16, 
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: '700', 
    marginLeft: 12 
  },
  content: { 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 24,
    textAlign: 'center'
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 14,
    flexWrap: 'wrap'
  },
  label: { 
    fontWeight: '700', 
    color: '#4B5563', 
    minWidth: 120,
    flexShrink: 0
  },
  value: { 
    flex: 1, 
    color: '#1F2937' 
  },
  stateAprobado: { color: '#10B981', fontWeight: '600' },
  statePendiente: { color: '#F59E0B', fontWeight: '600' },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E95A0C',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 30,
    gap: 8
  },
  printButtonDisabled: {
    opacity: 0.7
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});