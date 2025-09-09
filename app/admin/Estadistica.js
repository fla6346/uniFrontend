// frontend/app/admin/statistics.js

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Linking, Alert, Platform } from 'react-native';

// --- LÓGICA API --- (Es importante definirla aquí también)
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  // Si usas un dispositivo físico, reemplaza '10.0.2.2' con la IP de tu computadora
  determinedApiBaseUrl = 'http://10.0.2.2:3001/api'; 
} else {
  determinedApiBaseUrl = 'http://localhost:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;
// --------------------

const Estadistica = () => {

  const handleDescargarReporteGeneral = async () => {
    // Esta es la URL de la nueva ruta que creamos en el backend
    const url = `${API_BASE_URL}/eventos/reporte/estadisticas`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        // Esto abrirá el navegador del teléfono para descargar el PDF
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `No se puede abrir esta URL: ${url}`);
      }
    } catch (error) {
      console.error("Error al intentar descargar el reporte:", error);
      Alert.alert("Error", "No se pudo iniciar la descarga del reporte.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Estadísticas de Eventos</Text>
        <Text style={styles.description}>
          Aquí se mostrarán las estadísticas de la aplicación.
        </Text>
        <Text style={styles.description}>
          Presiona el botón para generar y descargar un reporte general en formato PDF.
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Generar Reporte General en PDF" 
            onPress={handleDescargarReporteGeneral}
            color="#e95a0c"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 30,
    width: '80%',
  }
});

export default Estadistica;