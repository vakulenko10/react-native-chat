import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Login: undefined;
  Home: undefined; // Add Home screen type
  Chat: { recipientId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to Home after successful login
      navigation.replace("Home");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Save the username and email in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
      });

      alert("User registered successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    try {
      const usersRef = collection(db, "users");

      // Query by username
      const usernameQuery = query(usersRef, where("username", "==", searchQuery));
      const usernameSnapshot = await getDocs(usernameQuery);

      // Query by email
      const emailQuery = query(usersRef, where("email", "==", searchQuery));
      const emailSnapshot = await getDocs(emailQuery);

      // Combine results
      const results = [
        ...usernameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ...emailSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ];

      // Remove duplicates if the same user matches both queries
      const uniqueResults = Array.from(
        new Map(results.map((item) => [item.id, item])).values()
      );

      setSearchResults(uniqueResults);
    } catch (error: any) {
      console.error("Error searching users: ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Username (only for signup) */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleSignUp} />

      {/* Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat", { recipientId: item.id })}
          >
            <Text style={styles.result}>
              {item.username || item.email}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  result: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default LoginScreen;
