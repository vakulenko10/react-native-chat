import React, { useState, useEffect } from "react";
import { View, FlatList, TextInput, Button, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const { chatId, userName } = route.params as { chatId: string; userName?: string };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, `chats/${chatId}/messages`), // Query messages in the specific chat
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messageData);
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: newMessage,
        sender: auth.currentUser?.email,
        timestamp: new Date(),
      });
      setNewMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.message}>
            <Text style={styles.sender}>{item.sender}: </Text>
            {item.text}
          </Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${userName || "Chat"}`}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  message: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  sender: {
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});

export default ChatScreen;
