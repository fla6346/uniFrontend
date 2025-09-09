// frontend/app/admin/_layout.js
import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        // Estilos de header por defecto para las pantallas de admin
        headerStyle: { backgroundColor: '#e95a0c' }, // Elige un color
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="UsuariosA" options={{ title: 'Gestionar Usuarios' }} />
      <Stack.Screen name="CrearUsuarioA" options={{ title: 'Crear Nuevo Usuario' }} />
      <Stack.Screen name="Contenido" options={{ title: 'Gestionar Contenido' }} />
      <Stack.Screen name="Estadistica" options={{ title: 'Estadísticas de App' }} />
      <Stack.Screen name="settings" options={{ title: 'Configuración Admin' }} />
      <Stack.Screen name='HomeAdministrador' options={{title:'admin'}}/>
      <Stack.Screen name="SeleccionarServicioScreen" options={{ title: 'Seleccionar Servicio' }} />
      <Stack.Screen name="SeleccionarActividad" options={{ title: 'Seleccionar Actividad' }} />
      <Stack.Screen naame="ProyectoEvento" options={{title:'Proyecto Evento '}}></Stack.Screen>
    </Stack>
  );
}