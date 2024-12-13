import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
  Button,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, userName } = route.params as {
    chatId: string;
    userName?: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Ensure chatId exists
  useEffect(() => {
    if (!chatId) {
      console.error("Chat ID is missing");
      return;
    }

    const q = query(
      collection(db, `chats/${chatId}/messages`),
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{userName || "Chat"}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentUser = item.sender === auth.currentUser?.email;
          return (
            <View
              style={[
                styles.messageContainer,
                isCurrentUser ? styles.myMessageContainer : styles.otherMessageContainer,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isCurrentUser ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          );
        }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
    maxWidth: "75%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7dd", // Light green for current user's messages
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#f8d7da", // Light red for other user's messages
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: "#155724", // Dark green for current user's text
  },
  otherMessageText: {
    color: "#721c24", // Dark red for other user's text
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
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
