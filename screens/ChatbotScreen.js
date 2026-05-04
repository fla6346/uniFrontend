// screens/ChatScreen.js
/*import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet, SafeAreaView
} from 'react-native';
import { BotService } from '../services/botService';

export default function ChatScreen({ route }) {
  const sender = route?.params?.email || 'invitado';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef(null);

  // Cargar historial al abrir
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const data = await BotService.getHistory(sender);
        
        // ✅ CORRECCIÓN: Acceder a data.messages si existe
        const listaMensajes = data.messages || (Array.isArray(data) ? data : []);

        if (listaMensajes.length > 0) {
          setMessages(listaMensajes.map(m => ({
            id: m.id?.toString() || Math.random().toString(),
            text: m.text,
            sender: m.sender
          })));
        } else {
          // Mensaje de bienvenida si no hay historial
          setMessages([{
            id: '0',
            text: '¡Hola! Soy el asistente de la UFPS. ¿En qué puedo ayudarte?',
            sender: 'bot'
          }]);
        }
      }catch (_) {
        setMessages([{
          id: '0',
          text: '¡Hola! Soy el asistente de la UFPS. ¿En qué puedo ayudarte?',
          sender: 'bot'
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    cargarHistorial();
  }, [sender]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

const handleSend = async () => {
    const texto = input.trim();
    if (!texto || loading) return;

    // 1. Crear y mostrar mensaje del usuario inmediatamente
    const userMsg = { id: Date.now().toString(), text: texto, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      console.log('🔌 [ChatScreen] Llamando a BotService.sendMessage...');
      
      // ✅ SE AGREGÓ LA LLAMADA: Guardamos el resultado en 'respuesta'
      const respuesta = await BotService.sendMessage(texto, sender);
      
      console.log('✅ [ChatScreen] Respuesta recibida:', respuesta);
      
      // ✅ CORRECCIÓN DE ESTRUCTURA: Accedemos a .reply (como se ve en tu Postman)
      const botText = respuesta.reply || 'No pude procesar tu mensaje.';
      
      const botMsg = { 
        id: (Date.now() + 1).toString(), 
        text: botText, 
        sender: 'bot' 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('❌ [ChatScreen] Error en handleSend:', error);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un problema de conexión. Inténtalo de nuevo.',
        sender: 'bot'
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // ✅ CORREGIDO: Sintaxis JSX correcta
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.bubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textBot]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (loadingHistory) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando conversación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.typingText}>El asistente está escribiendo...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || !input.trim()}
            style={[styles.sendBtn, (loading || !input.trim()) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperBot: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
  },
  textBot: {
    color: '#1A1A1A',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    backgroundColor: '#B0C4DE',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
*/