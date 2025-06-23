
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { database as db, auth } from './src/firebase';
import { ref, push, onValue } from 'firebase/database';


import LoginScreen from './src/components/Login';
import RegisterScreen from './src/components/Register';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Entry: undefined;
  PublicChat: undefined;
  PrivateChat: { receiverId: string };
};

type NavigationProps = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();


function EntryScreen({ navigation }: { navigation: NavigationProps }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido ✨</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PublicChat')}>
        <Text style={styles.buttonText}>Chat Público</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('PrivateChat', { receiverId: 'USER_B_ID' })}
      >
        <Text style={styles.buttonText}>Chat Privado</Text>
      </TouchableOpacity>
    </View>
  );
}


function PublicChat() {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    const messagesRef = ref(db, 'publicChat/');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([key, value]: any) => ({ id: key, ...value }));
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;
    const messagesRef = ref(db, 'publicChat/');
    push(messagesRef, {
      text,
      user: auth.currentUser?.email || 'Anon',
      timestamp: Date.now(),
    });
    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages.sort((a, b) => a.timestamp - b.timestamp)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            <Text style={{ fontWeight: 'bold' }}>{item.user}:</Text> {item.text}
          </Text>
        )}
      />
      <TextInput
        style={styles.input}
        placeholder="Escribe tu mensaje..."
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity style={styles.button} onPress={sendMessage}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}


function PrivateChat({ route }: { route: any }) {
  const { receiverId } = route.params;
  const [text, setText] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const senderId = auth.currentUser?.uid;
  const chatId = [senderId, receiverId].sort().join('_');

  React.useEffect(() => {
    const chatRef = ref(db, `privateChats/${chatId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([key, value]: any) => ({ id: key, ...value }));
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const chatRef = ref(db, `privateChats/${chatId}`);
    push(chatRef, {
      text,
      from: senderId,
      to: receiverId,
      timestamp: Date.now(),
    });
    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages.sort((a, b) => a.timestamp - b.timestamp)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={{ fontWeight: item.from === senderId ? 'bold' : 'normal' }}>{item.text}</Text>
        )}
      />
      <TextInput
        style={styles.input}
        placeholder="Mensaje privado"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity style={styles.button} onPress={sendMessage}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#1abc9c' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Inicio de Sesión' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear Cuenta' }} />
        <Stack.Screen name="Entry" component={EntryScreen} options={{ title: 'Página Principal' }} />
        <Stack.Screen name="PublicChat" component={PublicChat} options={{ title: 'Chat Público' }} />
        <Stack.Screen name="PrivateChat" component={PrivateChat} options={{ title: 'Chat Privado' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a2ded0', // celeste turquesa
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  button: {
    backgroundColor: '#16a085',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 10,
  },
});