// frontend/app/CategoryDetail/[categoryId].js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'; // Hooks de Expo Router
// import axios from 'axios'; // Descomenta cuando uses API real

// --- DATOS SIMULADOS ---
// Estos datos deberían venir de tu API o de un store/context en una app real.
// Las rutas de las imágenes deben ser correctas desde ESTE archivo.
// Si este archivo está en app/CategoryDetail/[categoryId].js y assets en frontend/assets/images:
// la ruta es '../../../assets/images/nombre.jpg'
const ALL_FACULTIES_DATA = [
  { 
    id: 1, 
    name: 'Ciencias Juridicas y Sociales', 
    image: require('../../assets/images/der.jpg'), // Ajusta esta ruta
    description: 'Bienvenido a la Facultad de Ciencias Jurídicas y Sociales. Aquí encontrarás información sobre nuestras carreras de Derecho, Sociología y más.',
    colorTheme: '#004085' // Ejemplo de un color temático
  },
  { 
    id: 2, 
    name: 'Ciencias Economicas y Empresariales', 
    image: require('../../assets/images/econ.jpg'), // Ajusta esta ruta
    description: 'Explora nuestras carreras en Economía, Administración de Empresas y Contabilidad. ¡Prepárate para liderar el mundo empresarial!',
    colorTheme: '#155724'
  },
  { 
    id: 3, 
    name: 'Diseno y Tecnologia Crossmedia', 
    image: require('../../assets/images/arqui.jpg'), // Ajusta esta ruta
    description: 'Sumérgete en el mundo del diseño y la tecnología con nuestras carreras en Diseño Gráfico, Animación y Tecnología Crossmedia.',
    colorTheme: '#721c24'
  },
  { 
    id: 4, 
    name: 'Ciencias de la Salud', 
    image: require('../../assets/images/sal.jpg'), // Ajusta esta ruta
    description: 'Forma parte de la Facultad de Ciencias de la Salud y estudia carreras como Medicina, Enfermería y Nutrición.',
    colorTheme: '#856404'
  },
  { 
    id: 5, 
    name: 'Ingenieria', 
    image: require('../../assets/images/tec.jpg'), // Ajusta esta ruta
    description: 'Únete a la Facultad de Ingeniería y explora carreras como Ingeniería Civil, Mecánica y de Sistemas.',
    colorTheme: '#383d41'
  },
];

// Eventos simulados, organizados por el ID de la facultad a la que pertenecen
const MOCK_EVENTS_DATA = {
  1: [ // Eventos para Ciencias Juridicas y Sociales (categoryId = 1)
    { id: 'evt101', title: 'Seminario de Derecho Penal Moderno', date: '2024-09-15', description: 'Análisis profundo de las nuevas tendencias en el derecho penal.', image: require('../../assets/images/der.jpg') },
    { id: 'evt102', title: 'Charla Magistral: Derechos Humanos en el Siglo XXI', date: '2024-09-22', description: 'Un espacio de reflexión sobre los desafíos actuales.', image: require('../../assets/images/der.jpg') },
  ],
  2: [ // Eventos para Ciencias Economicas y Empresariales (categoryId = 2)
    { id: 'evt201', title: 'Foro Internacional de Emprendimiento Innovador', date: '2024-10-05', description: 'Conecta con líderes y descubre oportunidades.', image: require('../../assets/images/econ.jpg') },
  ],
  3: [ // Eventos para Diseno y Tecnologia Crossmedia (categoryId = 3)
    { id: 'evt301', title: 'Expo Anual de Diseño Gráfico y Multimedia', date: '2024-11-01', description: 'Presentación de los mejores proyectos estudiantiles.', image: require('../../assets/images/arqui.jpg') },
  ],
  // Añade más eventos para otras facultades si es necesario
};
// --- FIN DATOS SIMULADOS ---


const CategoryDetailScreen = () => {
  const router = useRouter();
  const { categoryId: categoryIdParam } = useLocalSearchParams(); // Obtiene el 'categoryId' de la URL

  const [facultyDetails, setFacultyDetails] = useState(null);
  const [facultyEvents, setFacultyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convertir categoryIdParam a número para la comparación y uso
  const categoryId = parseInt(categoryIdParam, 10);

  useEffect(() => {
    if (isNaN(categoryId)) {
      setError('ID de facultad inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Simular carga de datos (reemplazar con llamada a API en el futuro)
    const loadData = async () => {
      try {
        // --- Lógica para API Real (ejemplo conceptual) ---
        // const facultyResponse = await axios.get(`http://TU_API/faculties/${categoryId}`);
        // const eventsResponse = await axios.get(`http://TU_API/events?facultyId=${categoryId}`);
        // setFacultyDetails(facultyResponse.data);
        // setFacultyEvents(eventsResponse.data);
        // -----------------------------------------------

        // --- Usando Datos Simulados ---
        await new Promise(resolve => setTimeout(resolve, 700)); // Simular delay de red

        const foundFaculty = ALL_FACULTIES_DATA.find(fac => fac.id === categoryId);
        
        if (foundFaculty) {
          setFacultyDetails(foundFaculty);
          setFacultyEvents(MOCK_EVENTS_DATA[categoryId] || []); // Obtener eventos para esta facultad
        } else {
          setError('Facultad no encontrada.');
        }
        // -----------------------------
      } catch (err) {
        console.error(`Error fetching data for faculty ${categoryId}:`, err);
        setError('Error al cargar los datos de la facultad.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]); // Re-ejecutar si categoryId cambia

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FF5733" />
        <Text style={styles.loadingText}>Cargando información de la facultad...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!facultyDetails) {
    // Este caso podría ya estar cubierto por el 'error' si setError se llamó
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Información de la facultad no disponible.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizado dinámico basado en facultyDetails y facultyEvents
  return (
    <ScrollView style={styles.container}>
      {/* Configura el título de la cabecera dinámicamente usando el nombre de la facultad */}
      <Stack.Screen options={{ title: facultyDetails.name }} />

      {/* Cabecera de la Facultad */}
      <View style={styles.headerContainer}>
        <Image
          source={facultyDetails.image} // Usa la imagen de la facultad actual
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={[styles.headerOverlay, {backgroundColor: facultyDetails.colorTheme ? `${facultyDetails.colorTheme}aa` : 'rgba(0,0,0,0.6)'}]}>
            <Text style={styles.headerTitle}>{facultyDetails.name}</Text>
        </View>
      </View>

      {/* Descripción de la Facultad */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Sobre la Facultad</Text>
        <Text style={styles.sectionDescription}>
          {facultyDetails.description}
        </Text>
      </View>
      
      {/* Eventos de la Facultad */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        {facultyEvents.length > 0 ? (
          facultyEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.eventItem}
              onPress={() => router.push(`/ItemDetail/${event.id}`)} // Navegar al detalle del evento
            >
              <Image source={event.image} style={styles.eventItemImage} resizeMode="cover" />
              <View style={styles.eventItemContent}>
                <Text style={styles.eventItemTitle}>{event.title}</Text>
                <Text style={styles.eventItemDate}>{event.date}</Text>
                <Text style={styles.eventItemDescription} numberOfLines={2}>{event.description}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noItemsText}>No hay eventos programados para esta facultad en este momento.</Text>
        )}
      </View>
    </ScrollView>
  );
};

// Estilos mejorados y más genéricos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Un gris más claro para el fondo
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 17,
    color: '#c0392b', // Un rojo más oscuro
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF5733',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContainer: {
    width: '100%',
    height: 220, // Un poco más alto
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: { // Overlay para mejorar legibilidad del título
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Sombra para el texto
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  contentSection: {
    padding: 20,
    backgroundColor: '#fff', // Fondo blanco para las secciones de contenido
    marginBottom: 10, // Espacio entre secciones
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600', // Semibold
    marginBottom: 12,
    color: '#2c3e50', // Un azul oscuro/gris
  },
  sectionDescription: {
    fontSize: 16,
    color: '#34495e', // Un gris azulado
    lineHeight: 24,
    marginBottom: 15,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Borde sutil
    // elevation: 2, // Quitado para un look más plano, o ajusta si prefieres sombras
  },
  eventItemImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
  },
  eventItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventItemDate: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
    marginBottom: 5,
  },
  eventItemDescription: {
    fontSize: 14,
    color: '#555',
  },
  noItemsText: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  }
});

export default CategoryDetailScreen;