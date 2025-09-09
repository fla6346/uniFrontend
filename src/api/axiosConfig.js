// src/api/axiosConfig.js (Recordatorio de cómo debería ser)

import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 1. Lógica de URL centralizada
let determinedApiBaseUrl;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  // IP de tu PC en la red local para dispositivos físicos y emuladores
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api'; 
} else { // web
  determinedApiBaseUrl = 'http://localhost:3001/api';
}

const apiClient = axios.create({
  baseURL: determinedApiBaseUrl,
});

// 2. Lógica de Token centralizada (Interceptor)
const TOKEN_KEY = 'adminAuthToken'; // O la clave que uses

apiClient.interceptors.request.use(
  async (config) => {
    let token;
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;