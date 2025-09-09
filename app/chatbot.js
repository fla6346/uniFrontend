// app/(tabs)/ChatScreen.js (o la ruta que elijas)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard
} from 'react-native';
import { Stack, useRouter } from 'expo-router'; // CORRECCIÓN: Importar useRouter correctamente
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// URL de tu servidor Rasa
const RASA_SERVER_URL = Platform.select({
  android: 'http://10.0.2.2:5005',
  ios: 'http://localhost:5005',
  web: 'http://localhost:5005',
});

const SENDER_ID = "default_user";

const Chatbot = () => {
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const router = useRouter(); // CORRECCIÓN: Inicializar el router dentro del componente

  useEffect(() => {
    setMessages([
      { id: 'welcome-' + Date.now(), text: '¡Hola! Soy tu asistente virtual de la UFT. ¿En qué puedo ayudarte hoy?', sender: 'bot' }
    ]);
  }, []);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Función para manejar la navegación basada en el payload
  const handleNavigation = (payload) => {
    if (payload && payload.type === 'navigate' && payload.payload?.route) {
      const route = payload.payload.route;
      console.log(`Comando de navegación recibido: Ir a la ruta ${route}`);
      router.push(route);
    }
  };

  const handleSend = async () => {
    if (inputText.trim().length === 0) {
      return;
    }

    const userMessage = {
      id: 'user-' + Date.now(),
      text: inputText.trim(),
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      console.log(`Enviando a Rasa: ${RASA_SERVER_URL}/webhooks/rest/webhook`);
      const response = await axios.post(`${RASA_SERVER_URL}/webhooks/rest/webhook`, {
        sender: SENDER_ID,
        message: userMessage.text,
      });

      console.log("Respuesta de Rasa:", response.data);

      if (response.data && response.data.length > 0) {
        // CORRECCIÓN: Lógica simplificada y correcta para procesar respuestas
        const botResponses = response.data.map((msg, index) => ({
          id: `bot-${Date.now()}-${index}`,
          text: msg.text || "No entendí eso.",
          sender: 'bot',
          payload: msg.custom || null, // Extraemos el payload
        }));

        // Añadimos todos los nuevos mensajes del bot a la vez
        setMessages(prevMessages => [...prevMessages, ...botResponses]);

        // Verificamos cada respuesta para ver si tiene un comando de navegación
        botResponses.forEach(botMsg => {
          handleNavigation(botMsg.payload);
        });

      } else {
        const fallbackResponse = {
            id: `bot-${Date.now()}-fallback`,
            text: "Lo siento, no pude procesar tu solicitud en este momento.",
            sender: 'bot',
        };
        setMessages(prevMessages => [...prevMessages, fallbackResponse]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje a Rasa:", error.response ? error.response.data : error.message);
      const errorResponse = {
        id: `bot-error-${Date.now()}`,
        text: "Hubo un problema conectando con el asistente. Intenta más tarde.",
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <Stack.Screen options={{ title: "Asistente UFT" }} />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={isLoading ? <ActivityIndicator style={styles.loadingIndicator} size="small" color="#e95a0c" /> : null}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ... (tus estilos sin cambios)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F9',
  },
  messagesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#e95a0c',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderBottomLeftRadius: 4,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  botMessageText: {
    color: '#333',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#e95a0c',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  loadingIndicator: {
    marginVertical: 10,
  }
});

export default Chatbot;