import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Link } from 'expo-router'; // Importar de expo-router
import axios from 'axios';

import {
  StyleSheet, 
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList
} from 'react-native';
const windowWidth=Dimensions.get('window').width;
const CAROUSEL_ITEM_WIDTH = windowWidth * 0.4; 
const CAROUSEL_SPACING = (windowWidth - CAROUSEL_ITEM_WIDTH) / 2; 


const placeholderImages = {
  banner: require('../assets/images/ind.jpg'), 
  category1: require('../assets/images/der.jpg'),
  category2: require('../assets/images/econ.jpg'),
  category3: require('../assets/images/der.jpg'),
  category4: require('../assets/images/sal.jpg'),
  category5: require('../assets/images/tec.jpg'),
};

 const mockCategories = [
          { id: 1, name: 'Ciencias Juridicas y Sociales',image:require('../assets/images/der.jpg')},
          { id: 2, name: 'Ciencias Economicas y Empresariales', image: require('../assets/images/econ.jpg') },
          { id: 3, name: 'Diseno y Tecnologia Crossmedia', image: require('../assets/images/arqui.jpg') },
          { id: 4, name: 'Ciencias de la Salud', image: require('../assets/images/sal.jpg')},
          { id: 5, name: 'Ingenieria', image: require('../assets/images/tec.jpg')},
        ];
        
        const mockFeatured = [
          { id: 1, title: 'Destacado 1', description: 'Descripción breve del elemento destacado 1', image: placeholderImages.featured1 },
          { id: 2, title: 'Destacado 2', description: 'Descripción breve del elemento destacado 2', image: placeholderImages.featured2 },
          { id: 3, title: 'Destacado 3', description: 'Descripción breve del elemento destacado 3', image: placeholderImages.featured3 },
        ];

const Home = () => {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0); // Nuevo estado para eventos destacados
  const flatListRef = useRef(null);
  const featuredFlatListRef = useRef(null); // Ref para el FlatList de eventos destacados

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCategories(mockCategories);
        setFeaturedItems(mockFeatured);
        setLoading(false);
      } catch (e) {
        console.error("Error data", e);
        setError("no se pudo cargar");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onScrollCategory = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CAROUSEL_ITEM_WIDTH + 20));
    setActiveCategoryIndex(index);
  };

  const onScrollFeatured = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CAROUSEL_ITEM_WIDTH + 20)); // Usamos el mismo ancho de ítem
    setActiveFeaturedIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e95a0c" />
        <Text style={styles.loadingText}>Cargando contenido...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); setError(null); }}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          <Image
            source={require('../assets/images/ind.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Conviértete en un profesional con propósito, aprende haciendo</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Facultades</Text>
          <FlatList
            ref={flatListRef}
            data={categories}
            renderItem={({ item }) => (
              <Link key={item.id} href={`/CategoryDetail/${item.id}`} asChild>
                <TouchableOpacity style={styles.categoryCarouselItem}>
                  <Image
                    source={item.image}
                    style={styles.categoryCarouselImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.categoryCarouselName}>{item.name}</Text>
                </TouchableOpacity>
              </Link>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CAROUSEL_ITEM_WIDTH + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContentContainer}
            onScroll={onScrollCategory}
            scrollEventThrottle={16}
          />
          <View style={styles.paginationContainer}>
            {categories.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeCategoryIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Elementos Destacados - Modificado a carrusel */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Eventos Destacados</Text>
          <FlatList
            ref={featuredFlatListRef}
            data={featuredItems}
            renderItem={({ item }) => (
              <Link key={item.id} href={`/ItemDetail/${item.id}`} asChild>
                <TouchableOpacity style={styles.featuredCarouselItem}>
                  <Image
                    source={item.image}
                    style={styles.featuredCarouselImage}
                    resizeMode="cover"
                  />
                  <View style={styles.featuredCarouselContent}>
                    <Text style={styles.featuredCarouselTitle}>{item.title}</Text>
                    <Text style={styles.featuredCarouselDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CAROUSEL_ITEM_WIDTH + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContentContainer} // Reutilizamos el estilo del contenedor
            onScroll={onScrollFeatured}
            scrollEventThrottle={16}
          />
          {/* Paginación para Eventos Destacados */}
          <View style={styles.paginationContainer}>
            {featuredItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeFeaturedIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      {/* Botones flotantes (si los necesitas) */}
      {/* <TouchableOpacity style={styles.chatbotButton} onPress={() => router.push('/chatbot')}>
        <Text style={styles.chatbotButtonText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.LoginButton} onPress={() => router.push('/login')}>
        <Text style={styles.chatbotButtonText}>Login</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    justifyContent: 'center',
    alignContent: 'center',
    height: '100%'

  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    marginLeft: 15,
  },

  // Estilos para el Carrusel de Facultades
  carouselContentContainer: {
    paddingHorizontal: CAROUSEL_SPACING,
    paddingBottom: 10,
  },
  categoryCarouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 20,
  },
  categoryCarouselImage: {
    width: '80%', // Ajustado para ocupar todo el ancho de la tarjeta
    height: 120, // Altura fija para las imágenes del carrusel
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  categoryCarouselName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 10,
    color: '#333',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#e95a0c',
  },

  // NUEVOS ESTILOS para el Carrusel de Eventos Destacados
  featuredCarouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 10,
  },
  featuredCarouselImage: {
    width: '100%',
    height: 120, // Altura de la imagen de la tarjeta
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  featuredCarouselContent: {
    padding: 10,
  },
  featuredCarouselTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  featuredCarouselDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },

  // Estilos de botones flotantes (si los usas)
  chatbotButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#e95a0c',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  chatbotButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  LoginButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#333',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default Home;