import React, { useEffect, useState } from "react";
import { View, FlatList, Text, TouchableOpacity, StyleSheet, TextInput, Button } from "react-native";
import { collection, query, where, onSnapshot, doc, getDocs, getDoc, addDoc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  otherParticipantUsername?: string;
}

const HomeScreen: React.FC<any> = ({ navigation }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchBarOpen, setIsSearchBarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchChats = async () => {
      const currentUserUid = auth.currentUser?.uid;

      if (!currentUserUid) {
        console.error("User not authenticated");
        return;
      }

      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUserUid)
      );

      unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
        const fetchedChats: Chat[] = await Promise.all(
          snapshot.docs.map(async (docum) => {
            const chatData = docum.data();
            const otherParticipantId = chatData.participants.find((id: string) => id !== currentUserUid);

            // Fetch the other participant's username
            const otherUserDoc = otherParticipantId ? await getDoc(doc(db, "users", otherParticipantId)) : null;
            const otherParticipantUsername = otherUserDoc?.data()?.username || "Unknown User";

            // Fetch the last message
            const messagesQuery = query(
              collection(doc(db, "chats", docum.id), "messages"),
              where("timestamp", ">", 0),
              orderBy("timestamp", "desc"),
              limit(1)
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            const lastMessage = messagesSnapshot.docs[0]?.data()?.text || "No messages yet";

            return {
              id: docum.id,
              participants: chatData.participants,
              lastMessage: lastMessage.substring(0, 15),
              otherParticipantUsername,
            };
          })
        );

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

  const handleSearch = async (queryparam: string) => {
    try {
      if (!queryparam) {
        setSearchResults([]);
        return;
      }

      const usersRef = collection(db, "users");

      // Query for usernames starting with the search query
      const usernameQuery = query(
        usersRef,
        where("username", ">=", queryparam),
        where("username", "<", queryparam + "\uf8ff")
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      // Query for emails starting with the search query
      const emailQuery = query(
        usersRef,
        where("email", ">=", queryparam),
        where("email", "<", queryparam + "\uf8ff")
      );
      const emailSnapshot = await getDocs(emailQuery);

      const results = [
        ...usernameSnapshot.docs.map((docum) => ({ id: docum.id, ...(docum.data() || {}) })),
        ...emailSnapshot.docs.map((docum) => ({ id: docum.id, ...(docum.data() || {}) })),
      ];
      

      const uniqueResults = Array.from(
        new Map(results.map((item) => [item.id, item])).values()
      );

      setSearchResults(uniqueResults);
    } catch (error: any) {
      console.error("Error searching users:", error.message);
    }
  };

  const openChat = async (recipientId: string) => {
    const currentUserUid = auth.currentUser?.uid;
  
    if (!currentUserUid) {
      console.error("User not authenticated");
      return;
    }
  
    // Check for existing chat
    const existingChat = chats.find((chat) =>
      chat.participants.includes(recipientId)
    );
  
    if (existingChat) {
      navigation.navigate("Chat", { chatId: existingChat.id, userName: existingChat.otherParticipantUsername });
    } else {
      const newChatRef = await addDoc(collection(db, "chats"), {
        participants: [currentUserUid, recipientId],
        lastMessage: "",
      });
  
      navigation.navigate("Chat", { chatId: newChatRef.id, userName: "New User" });
    }
  };
  

  return (
    <View style={styles.container}>
      {isSearchBarOpen ? (
        <View style={styles.searchContainer}>
          <Button title="Back" onPress={() => setIsSearchBarOpen(false)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username or email"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  openChat(item.id);
                  setIsSearchBarOpen(false);
                }}
              >
                <Text style={styles.result}>{item.username || item.email}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.searchButton} onPress={() => setIsSearchBarOpen(true)}>
            <Text style={styles.searchButtonText}>Open Search</Text>
          </TouchableOpacity>
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => openChat(item.participants.find((id) => id !== auth.currentUser?.uid)!)}
              >
                <Text style={styles.chatTitle}>{item.otherParticipantUsername}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage || "No messages yet"}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No chats found</Text>}
          />
        </>
      )}
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
  searchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  searchButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  searchContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  result: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    fontSize: 16,
  },
});

export default HomeScreen;
