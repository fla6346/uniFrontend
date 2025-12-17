// app/admin/CrearRecurso.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const COLORS = {
  primary: '#E95A0C',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

// Determinar la IP según el entorno
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://192.168.0.167:3001/api'
    : 'http://localhost:3001/api';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('adminAuthToken');
  return await SecureStore.getItemAsync('adminAuthToken');
};

export default function CrearRecurso() {
  const router = useRouter();
  const [nombre_recurso, setNombreRecurso] = useState('');
  const [recurso_tipo, setRecursoTipo] = useState('tecnologico');
  const [descripcion, setDescripcion] = useState('');
  const [habilitado, setHabilitado] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombre_recurso.trim()) {
      Alert.alert('Error', 'El nombre del recurso es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        Alert.alert('Error', 'Sesión expirada. Por favor, inicia sesión de nuevo.');
        router.replace('/');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/recursos`,
        {
          nombre_recurso,
          recurso_tipo,
          descripcion: descripcion.trim() || null,
          habilitado: parseInt(habilitado),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Éxito', 'Recurso creado correctamente', [
        {
          text: 'Aceptar',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error al crear recurso:', error);
      const message =
        error.response?.data?.message ||
        'No se pudo crear el recurso. Inténtalo de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Registrar Nuevo Recurso</Text>

        <Text style={styles.label}>Nombre del recurso *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Proyector Epson"
          value={nombre_recurso}
          onChangeText={setNombreRecurso}
          maxLength={100}
        />

        <Text style={styles.label}>Tipo de recurso *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={recurso_tipo}
            style={styles.picker}
            onValueChange={(itemValue) => setRecursoTipo(itemValue)}
            dropdownIconColor={COLORS.textSecondary}
          >
            <Picker.Item label="Tecnológico" value="tecnologico" />
            <Picker.Item label="Mobiliario" value="mobiliario" />
            <Picker.Item label="Vajilla" value="vajilla" />
          </Picker>
        </View>

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detalles del recurso..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Estado</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.radio, habilitado === '1' && styles.radioSelected]}
            onPress={() => setHabilitado('1')}
          >
            <Text>Habilitado</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radio, habilitado === '0' && styles.radioSelected]}
            onPress={() => setHabilitado('0')}
          >
            <Text>Deshabilitado</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Guardando...</Text>
          ) : (
            <Text style={styles.buttonText}>Crear Recurso</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  textArea: {
    textAlignVertical: 'top',
    height: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  radio: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5ED',
  },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});