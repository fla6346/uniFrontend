// screens/EventoChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, SafeAreaView, ActivityIndicator
} from 'react-native';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://unibackend1-production.up.railway.app';

// Color e ícono por rol
const ROL_CONFIG = {
  admin:     { color: '#FF6B35', label: 'Admin',     icono: 'A' },
  creador:   { color: '#007AFF', label: 'Creador',   icono: 'C' },
  logistica: { color: '#34C759', label: 'Logística', icono: 'L' },
};

export default function EventoChatScreen({ route }) {
  // Estos params vienen de navigation.navigate('EventoChat', { ... })
  const {
    eventoId,
    userId,
    userRole,
    userName,
    eventoNombre
  } = route.params;

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [connected, setConnected]     = useState(false);
  const [connecting, setConnecting]   = useState(true);

  const socketRef   = useRef(null);
  const flatListRef = useRef(null);

  // ─── Conexión Socket.io ───────────────────────────────────────────
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],  // Necesario en Expo/React Native
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      // Unirse a la sala del evento
      socket.emit('join_event', {
        eventoId,
        userId,
        role: userRole,
        userName
      });
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setConnecting(false);
    });

    socket.on('disconnect', () => setConnected(false));

    // Historial al entrar a la sala
    socket.on('history', (historial) => {
      setMessages(
        historial.map((m, i) => ({ ...m, id: `h_${i}` }))
      );
      scrollToBottom(false);
    });

    // Mensaje nuevo en tiempo real
    socket.on('receive_message', (msg) => {
      setMessages(prev => [
        ...prev,
        { ...msg, id: `m_${Date.now()}_${Math.random()}` }
      ]);
      scrollToBottom(true);
    });

    // Notificación: alguien entró
    socket.on('user_joined', ({ userName: nombre, role }) => {
      const rolLabel = ROL_CONFIG[role]?.label || role;
      setMessages(prev => [...prev, {
        id:     `sys_${Date.now()}`,
        system: true,
        text:   `${nombre || 'Un usuario'} (${rolLabel}) se unió al chat`
      }]);
    });

    return () => {
      socket.emit('leave_event', { eventoId });
      socket.disconnect();
    };
  }, [eventoId]);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 120);
  };

  // ─── Enviar mensaje ───────────────────────────────────────────────
  const handleSend = () => {
    const texto = input.trim();
    if (!texto || !socketRef.current?.connected) return;

    socketRef.current.emit('send_message', {
      eventoId,
      userId,
      role:     userRole,
      userName,
      message:  texto
    });
    setInput('');
  };

  // ─── Render de cada burbuja ───────────────────────────────────────
  const renderMessage = ({ item }) => {
    // Mensaje del sistema
    if (item.system) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const isMe     = String(item.userId) === String(userId);
    const rolCfg   = ROL_CONFIG[item.role] || { color: '#888', label: item.role, icono: '?' };
    const hora     = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>

        {/* Avatar solo para mensajes ajenos */}
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: rolCfg.color + '22' }]}>
            <Text style={[styles.avatarText, { color: rolCfg.color }]}>
              {rolCfg.icono}
            </Text>
          </View>
        )}

        <View style={styles.bubbleCol}>
          {/* Nombre + rol (solo mensajes ajenos) */}
          {!isMe && (
            <Text style={[styles.senderName, { color: rolCfg.color }]}>
              {item.userName || `Usuario ${item.userId}`}
              <Text style={styles.roleBadge}> · {rolCfg.label}</Text>
            </Text>
          )}

          {/* Burbuja */}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.message}
            </Text>
            <Text style={[styles.hora, isMe && styles.horaMe]}>{hora}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── Pantalla de carga inicial ────────────────────────────────────
  if (connecting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.connectingText}>Conectando al chat...</Text>
      </View>
    );
  }

  // ─── UI principal ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {eventoNombre || `Evento #${eventoId}`}
          </Text>
          <View style={styles.headerStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: connected ? '#34C759' : '#FF3B30' }
            ]} />
            <Text style={styles.statusText}>
              {connected ? 'En línea' : 'Sin conexión'}
            </Text>
          </View>
        </View>
        {/* Badge de tu rol */}
        <View style={[
          styles.rolChip,
          { backgroundColor: (ROL_CONFIG[userRole]?.color || '#888') + '22' }
        ]}>
          <Text style={[
            styles.rolChipText,
            { color: ROL_CONFIG[userRole]?.color || '#888' }
          ]}>
            {ROL_CONFIG[userRole]?.label || userRole}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Aún no hay mensajes.{'\n'}¡Sé el primero en escribir!
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={connected ? 'Escribe un mensaje...' : 'Sin conexión...'}
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            editable={connected}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || !connected}
            style={[
              styles.sendBtn,
              (!input.trim() || !connected) && styles.sendBtnDisabled
            ]}
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  connectingText: { fontSize: 14, color: '#666' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8E8E8'
  },
  headerLeft:   { flex: 1, marginRight: 12 },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { fontSize: 12, color: '#888' },
  rolChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12
  },
  rolChipText:  { fontSize: 12, fontWeight: '600' },

  // Lista
  listContent:  { padding: 16, paddingBottom: 8 },
  emptyBox:     { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText:    { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 22 },

  // Mensaje sistema
  systemRow:    { alignItems: 'center', marginVertical: 10 },
  systemText:   { fontSize: 12, color: '#BBB', fontStyle: 'italic' },

  // Burbujas
  row:          { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowMe:        { justifyContent: 'flex-end' },
  rowOther:     { justifyContent: 'flex-start' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8
  },
  avatarText:   { fontSize: 13, fontWeight: '700' },
  bubbleCol:    { maxWidth: '75%' },
  senderName:   { fontSize: 12, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
  roleBadge:    { fontWeight: '400', color: '#AAA' },

  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18
  },
  bubbleMe: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4
  },
  bubbleOther: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 2, elevation: 1
  },
  bubbleText:   { fontSize: 15, lineHeight: 21, color: '#1A1A1A' },
  bubbleTextMe: { color: '#FFF' },
  hora:         { fontSize: 11, color: '#AAA', marginTop: 4, textAlign: 'right' },
  horaMe:       { color: 'rgba(255,255,255,0.65)' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, gap: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#E8E8E8'
  },
  input: {
    flex: 1,
    borderWidth: 1, borderColor: '#DDD', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#1A1A1A',
    maxHeight: 100, backgroundColor: '#F9F9F9'
  },
  sendBtn:         { backgroundColor: '#007AFF', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnDisabled: { backgroundColor: '#B0C4DE' },
  sendBtnText:     { color: '#FFF', fontWeight: '600', fontSize: 15 },
});