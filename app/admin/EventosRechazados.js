import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://unibackend-1-izpi.onrender.com/api';
const COLORS = {
  primary: '#E95A0C',
  accent: '#0052A0',
  background: '#f8fafc',
  surface: '#ffffff',
  success: '#27ae60',
  danger: '#e74c3c',
  darkText: '#1e293b',
  grayText: '#64748b',
};

const EventosRechazados = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [razonRechazo, setRazonRechazo] = useState('');
  const [saving, setSaving] = useState(false);

  const getTokenAsync = async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('adminAuthToken');
    } else {
      return await SecureStore.getItemAsync('adminAuthToken');
    }
  };

  const saveRejectionData = async () => {
    if (!razonRechazo.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la razón del rechazo');
      return;
    }

    setSaving(true);
    try {
      const token = await getTokenAsync();
      
      // Guardar en base de datos (actualizar el evento con la razón de rechazo)
      await axios.put(
        `${API_BASE_URL}/eventos/${params.eventId}/reject-reason`,
        { 
          razon_rechazo: razonRechazo,
          fecha_rechazo: params.rejectionDate,
          admin_responsable: params.adminEmail || 'admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Guardado',
        'Los datos del rechazo han sido guardados correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/admin/ListaEvento')
          }
        ]
      );
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar la razón del rechazo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evento Rechazado</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Icono de rechazo */}
        <View style={styles.rejectionIconContainer}>
          <Ionicons name="close-circle" size={80} color={COLORS.danger} />
          <Text style={styles.rejectionTitle}>Evento Rechazado</Text>
        </View>

        {/* Datos del evento */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información del Evento</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Nombre:</Text>
            <Text style={styles.detailValue}>{params.eventName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>{params.eventDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Lugar:</Text>
            <Text style={styles.detailValue}>{params.location}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Organizador:</Text>
            <Text style={styles.detailValue}>{params.organizer}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Fecha de rechazo:</Text>
            <Text style={styles.detailValue}>
              {new Date(params.rejectionDate).toLocaleString('es-ES')}
            </Text>
          </View>
        </View>

        {/* Razón del rechazo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Razón del Rechazo *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe la razón por la cual se rechaza este evento..."
            placeholderTextColor={COLORS.grayText}
            value={razonRechazo}
            onChangeText={setRazonRechazo}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveRejectionData}
            disabled={saving}
          >
            {saving ? (
              <Text style={styles.buttonText}>Guardando...</Text>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Guardar y Continuar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.listButton]}
            onPress={() => router.replace('/admin/ListaEvento')}
          >
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Ver Lista de Eventos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rejectionIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  rejectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grayText,
    marginLeft: 10,
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkText,
    flex: 1,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.darkText,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  listButton: {
    backgroundColor: COLORS.accent,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

EventosRechazados.options = {
  headerShown: false,
};

export default EventosRechazados;