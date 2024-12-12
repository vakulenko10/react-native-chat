import React, { useEffect, useState } from "react";
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export type RootStackParamList = {
  Home: undefined;
  Chat: { chatId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Chat {
  id: string;
  participants: string[]; // References to user documents
  lastMessage?: string; // Optional last message field
}

const HomeScreen: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchChats = async () => {
      const currentUserUid = auth.currentUser?.uid;

      if (!currentUserUid) {
        console.error("User not authenticated");
        return;
      }

      // Create a reference to the current user in the "users" collection
      const currentUserRef = doc(db, "users", currentUserUid);

      // Query all chats where the current user is a participant
      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUserRef)
      );

      // Listen for real-time updates
      unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        setChats(fetchedChats);
      });
    };

    fetchChats();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const openChat = (chatId: string, userName?: string) => {
    navigation.navigate("Chat", { chatId });
  };
  
  // useEffect(()=>{
  //   console.log()
  // })
  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => openChat(item.id)}
          >
            <Text style={styles.chatTitle}>Chat ID: {item.id}</Text>
            
            <Text style={styles.lastMessage}>
              {item.lastMessage || "No messages yet"}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No chats found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  chatTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    color: "#666",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

export default HomeScreen;
